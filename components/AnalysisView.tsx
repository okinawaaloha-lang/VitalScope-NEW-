import React from 'react';
import { AnalysisResult } from '../types';
import { ThumbsUp, ThumbsDown, Info, ShoppingBag, ExternalLink, Activity, AlertTriangle, RefreshCcw } from 'lucide-react';
import clsx from 'clsx';

interface AnalysisViewProps {
  result: AnalysisResult;
  onRetry?: () => void;
}

const AMAZON_TAG = 'simplemind0f-22';

const AnalysisView: React.FC<AnalysisViewProps> = ({ result, onRetry }) => {

  const getAmazonSearchUrl = (keyword: string) => {
    const encoded = encodeURIComponent(keyword);
    return `https://www.amazon.co.jp/s?k=${encoded}&tag=${AMAZON_TAG}`;
  };

  // Case: Unclear Image
  if (result.imageQualityCheck && result.imageQualityCheck.isUnclear) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-red-100 text-center animate-fade-in space-y-4">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-400">
          <AlertTriangle size={40} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">画像を解析できませんでした</h3>
          <p className="text-gray-600">
            {result.imageQualityCheck.reason || "画像が不鮮明か、商品が特定できませんでした。"}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            明るい場所で、文字が読めるように撮影し直してください。<br/>
            パッケージ全体や成分表示が写っていると精度が上がります。
          </p>
        </div>
        {onRetry && (
          <button 
            onClick={onRetry}
            className="mt-4 bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-6 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 mx-auto"
          >
            <RefreshCcw size={18} />
            もう一度撮影する
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Calorie Card */}
      {result.calorieAnalysis && (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
           <div className="flex items-center gap-2 mb-4 text-teal-700 font-bold">
            <Activity size={20} />
            <h3>カロリー分析</h3>
          </div>
          <div className="flex items-center gap-6">
            {/* Circular Progress (Simplified with CSS conic-gradient) */}
            <div className="relative w-24 h-24 flex-shrink-0">
               <div 
                 className="w-full h-full rounded-full"
                 style={{
                   background: `conic-gradient(#0d9488 ${result.calorieAnalysis.percentage}%, #e5e7eb ${result.calorieAnalysis.percentage}% 100%)`
                 }}
               >
                 <div className="absolute inset-2 bg-white rounded-full flex flex-col items-center justify-center">
                    <span className="text-xl font-bold text-teal-700">{result.calorieAnalysis.percentage}%</span>
                    <span className="text-[10px] text-gray-400">対1日必要量</span>
                 </div>
               </div>
            </div>
            
            <div className="flex-1">
                <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-2xl font-bold text-gray-800">{result.calorieAnalysis.productCalories}</span>
                    <span className="text-sm text-gray-500">kcal (推定)</span>
                </div>
                <p className="text-xs text-gray-500 leading-snug">
                    あなたの一日の推定必要カロリー: <strong>{result.calorieAnalysis.userDailyNeed}kcal</strong>
                </p>
                <p className="text-xs text-teal-600 mt-2 bg-teal-50 p-2 rounded-lg">
                    {result.calorieAnalysis.note}
                </p>
            </div>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-3 text-teal-700 font-bold">
          <Info size={20} />
          <h3>AIによる概要解析</h3>
        </div>
        <p className="text-gray-700 leading-relaxed text-sm">
          {result.summary}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pros */}
        <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100">
          <div className="flex items-center gap-2 mb-3 text-blue-700 font-bold">
            <ThumbsUp size={20} />
            <h3>メリット</h3>
          </div>
          <ul className="space-y-2">
            {result.pros.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-blue-500 mt-1">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Cons */}
        <div className="bg-red-50 p-5 rounded-2xl border border-red-100">
          <div className="flex items-center gap-2 mb-3 text-red-700 font-bold">
            <ThumbsDown size={20} />
            <h3>デメリット・注意点</h3>
          </div>
          <ul className="space-y-2">
            {result.cons.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-red-500 mt-1">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recommendations */}
      <div className="mt-8">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <ShoppingBag className="text-orange-500" />
          あなたへのおすすめ商品
        </h3>
        <div className="space-y-3">
          {result.recommendations.map((item, idx) => (
            <a
              key={idx}
              href={getAmazonSearchUrl(item.name)}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:border-orange-300 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-800 text-sm truncate group-hover:text-orange-600 transition-colors">
                    {item.name}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {item.reason}
                  </p>
                </div>
                <ExternalLink size={18} className="text-gray-300 group-hover:text-orange-500" />
              </div>
            </a>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2 text-right">
          ※Amazonアソシエイトリンクを含みます
        </p>
      </div>
    </div>
  );
};

export default AnalysisView;