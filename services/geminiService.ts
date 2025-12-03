import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, AnalysisResult } from "../types";

const parseBase64 = (base64String: string) => {
  if (base64String.startsWith('data:')) {
    const base64Data = base64String.split(',')[1];
    const mimeType = base64String.substring(base64String.indexOf(':') + 1, base64String.indexOf(';'));
    return { data: base64Data, mimeType };
  }
  // Fallback assuming jpeg if raw string
  return { data: base64String, mimeType: 'image/jpeg' };
};

// APIキーを安全に取得するヘルパー関数
const getApiKey = (): string => {
  // 1. Vite環境 (Vercelデプロイ時など)
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_KEY) {
    // @ts-ignore
    return import.meta.env.VITE_API_KEY;
  }

  // 2. 標準的なprocess.env (AI Studioプレビューや一部のビルド環境)
  try {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env?.API_KEY) {
      // @ts-ignore
      return process.env.API_KEY;
    }
  } catch (e) {
    // ブラウザでprocessが未定義の場合の参照エラーを無視
  }

  return '';
};

export const analyzeHealthImpact = async (
  profile: UserProfile,
  images: string[]
): Promise<AnalysisResult> => {
  const apiKey = getApiKey();

  if (!apiKey) {
    throw new Error("APIキーが見つかりません。VercelのEnvironment Variablesに 'VITE_API_KEY' を設定してください。");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Extended Schema definition
  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      imageQualityCheck: {
        type: Type.OBJECT,
        properties: {
          isUnclear: { type: Type.BOOLEAN, description: "True if the image is too blurry, dark, or the product cannot be identified." },
          reason: { type: Type.STRING, description: "Reason why the image is unclear (if applicable)." }
        },
        required: ["isUnclear", "reason"]
      },
      calorieAnalysis: {
        type: Type.OBJECT,
        properties: {
          productCalories: { type: Type.INTEGER, description: "Estimated calories of the product in kcal. If unknown, estimate based on product type." },
          userDailyNeed: { type: Type.INTEGER, description: "Estimated Total Daily Energy Expenditure (TDEE) for this specific user based on age, gender, and context." },
          percentage: { type: Type.INTEGER, description: "What percentage of the daily need does this product represent?" },
          note: { type: Type.STRING, description: "Brief explanation of the calorie estimation (e.g. 'Standard value for 100g of chocolate')." }
        },
        required: ["productCalories", "userDailyNeed", "percentage", "note"]
      },
      summary: {
        type: Type.STRING,
        description: "A concise summary of the product analysis (approx 200 characters).",
      },
      pros: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "List of health benefits/pros for this specific user.",
      },
      cons: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "List of health risks/cons for this specific user.",
      },
      recommendations: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Name of a recommended product on Amazon." },
            reason: { type: Type.STRING, description: "Short reason why this is good for the user." },
          },
          required: ["name", "reason"],
        },
        description: "3 recommended products available on Amazon relevant to the user's needs.",
      },
    },
    required: ["imageQualityCheck", "calorieAnalysis", "summary", "pros", "cons", "recommendations"],
  };

  const systemInstruction = `
    あなたは熟練したヘルスケアアドバイザーです。
    ユーザーから提供された商品画像（成分表示やパッケージ）とプロフィールを分析し、健康への影響を評価してください。

    ユーザープロフィール:
    - 年齢: ${profile.age}
    - 性別: ${profile.gender}
    - 健康状態/悩み/文脈: ${profile.healthContext}

    ### 画像分析ルール:
    1. **画像の品質チェック**: 画像が不鮮明、暗すぎる、または商品が全く識別できない場合は、JSONの \`imageQualityCheck.isUnclear\` を true にしてください。その場合、他のフィールドは空またはダミーデータで構いません。
    
    2. **成分表示がない場合**:
       - 成分表示ラベルが見当たらない場合は、商品のパッケージや外見から**商品を特定**してください。
       - 特定した商品の**一般的・平均的な栄養情報**（Web上の一般的なデータ）を内部知識から引用して分析を行ってください。
       - 推測に基づく場合は、\`calorieAnalysis.note\` や \`summary\` に「成分表示がないため、同種の一般的な商品の数値を参照しました」と明記してください。

    ### カロリー分析ルール:
    1. ユーザーのプロフィールと「健康状態/悩み」のテキスト（運動習慣の有無など）から、**1日の推定消費カロリー（TDEE）**を計算してください。
    2. 商品のカロリー（ラベルから取得、または一般的数値から推測）が、そのTDEEの何%に当たるかを算出してください。

    ### 出力要件:
    - 回答はすべて日本語で行ってください。
    - メリット・デメリットはユーザーの「健康状態/悩み」に寄り添った内容にしてください。
  `;

  const imageParts = images.map((img) => {
    const { data, mimeType } = parseBase64(img);
    return {
      inlineData: {
        data,
        mimeType,
      },
    };
  });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          ...imageParts,
          { text: "この商品の画像を分析してください。成分表示がない場合は、商品名から一般的な数値を推測してください。" }
        ]
      },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from AI");
    }

    return JSON.parse(text) as AnalysisResult;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw new Error("解析中にエラーが発生しました。しばらく待ってからもう一度お試しください。");
  }
};