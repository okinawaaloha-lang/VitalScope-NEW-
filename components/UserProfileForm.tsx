import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { Save, User, Info, ShieldCheck, CheckSquare, Square } from 'lucide-react';
import clsx from 'clsx';

interface UserProfileFormProps {
  initialProfile: UserProfile;
  onSave: (profile: UserProfile) => void;
  isEditing?: boolean;
}

const UserProfileForm: React.FC<UserProfileFormProps> = ({ initialProfile, onSave, isEditing = false }) => {
  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const [hasConsented, setHasConsented] = useState(false);

  // Sync state if initialProfile changes
  useEffect(() => {
    setProfile(initialProfile);
    // If editing an existing profile, we can assume they consented previously, or force re-consent.
    // The prompt emphasizes strict initial setup. Let's require check if it's strictly onboarding (not editing).
    if (isEditing) {
        setHasConsented(true);
    }
  }, [initialProfile, isEditing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasConsented) return;
    onSave(profile);
  };

  const isFormValid = profile.age && profile.gender && profile.healthContext && hasConsented;

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-fade-in">
      
      {/* Header / Intro */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-3 text-teal-600">
          <User size={32} />
        </div>
        <h2 className="text-xl font-bold text-gray-800">
          {isEditing ? 'プロフィールの設定' : 'VitalScopeへようこそ'}
        </h2>
      </div>

      {/* IMPORTANT: Explanation Card (Strict Requirement) */}
      {!isEditing && (
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 mb-6 text-sm text-teal-900 space-y-3">
          <div className="flex items-start gap-2 font-bold text-teal-700">
            <Info size={20} className="shrink-0 mt-0.5" />
            <h3>はじめにお読みください</h3>
          </div>
          <ul className="list-disc list-outside pl-5 space-y-1 text-teal-800 leading-relaxed opacity-90">
            <li>VitalScopeは、あなたの<strong>健康状態に合わせて市販の商品をAIが解析</strong>する、パーソナライズ診断アプリです。</li>
            <li>あなたの悩みや目標に応じてメリット・デメリットを評価するため、<strong>プロフィールの入力が必要</strong>です。</li>
            <li>入力された情報は<strong>すべてあなたの端末にのみ保存</strong>され、外部には送信されません。</li>
          </ul>
        </div>
      )}

      <div className="space-y-5">
        {/* Age Input */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">年齢 <span className="text-red-500">*</span></label>
          <input
            type="number"
            required
            placeholder="例: 35"
            value={profile.age}
            onChange={(e) => setProfile({ ...profile, age: e.target.value })}
            className="w-full p-4 rounded-xl border border-gray-300 bg-slate-800 text-white placeholder-gray-400 focus:ring-4 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all font-bold text-lg"
          />
        </div>

        {/* Gender Input */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">性別 <span className="text-red-500">*</span></label>
          <div className="flex gap-3">
            {[
              { val: 'male', label: '男性' },
              { val: 'female', label: '女性' },
              { val: 'other', label: 'その他' }
            ].map((opt) => (
              <button
                key={opt.val}
                type="button"
                onClick={() => setProfile({ ...profile, gender: opt.val as any })}
                className={clsx(
                  "flex-1 py-3 rounded-xl border text-sm font-bold transition-all",
                  profile.gender === opt.val
                    ? "bg-teal-600 text-white border-teal-600 shadow-md transform scale-105"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Health Context Input */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">
            現在の健康状態・悩み・目標 <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <textarea
              required
              rows={6}
              value={profile.healthContext}
              onChange={(e) => setProfile({ ...profile, healthContext: e.target.value })}
              placeholder="例：最近、健康診断で血圧が高めと言われたので塩分を控えたいです。甲殻類のアレルギーがあります。また、デスクワーク中心で運動不足のため、むくみやすいのが悩みです。"
              className="w-full p-4 rounded-xl border border-gray-300 bg-slate-800 text-white placeholder-gray-500 focus:ring-4 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-sm leading-relaxed resize-none"
            />
          </div>
          <p className="text-xs text-gray-500 mt-2 text-right">
            具体的であればあるほど、AIの精度が向上します。
          </p>
        </div>

        {/* Consent Checkbox (Strict Requirement) */}
        <div 
            onClick={() => setHasConsented(!hasConsented)}
            className="mt-4 p-3 rounded-lg border border-gray-200 bg-gray-50 flex gap-3 cursor-pointer hover:bg-gray-100 transition-colors select-none"
        >
            <div className={clsx("mt-0.5 transition-colors", hasConsented ? "text-teal-600" : "text-gray-400")}>
                {hasConsented ? <CheckSquare size={20} /> : <Square size={20} />}
            </div>
            <div className="text-xs text-gray-600 leading-snug">
                <p className="font-bold mb-1">以下を確認し、同意します</p>
                <ul className="list-disc pl-4 space-y-0.5">
                    <li>このアプリの診断は、私のプロフィール情報に基づいてパーソナライズされます。</li>
                    <li>プロフィールは後からでも変更できます。</li>
                </ul>
            </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!isFormValid}
          className={clsx(
            "w-full font-bold py-4 rounded-xl shadow-lg transform transition-all flex items-center justify-center gap-2",
            isFormValid 
                ? "bg-teal-600 hover:bg-teal-700 text-white active:scale-95 hover:shadow-xl" 
                : "bg-gray-300 text-gray-500 cursor-not-allowed opacity-70"
          )}
        >
          <Save size={20} />
          {isEditing ? '設定を保存する' : '初期設定を完了して始める'}
        </button>
      </div>
    </form>
  );
};

export default UserProfileForm;