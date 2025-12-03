import React, { useState, useEffect } from 'react';
import { UserProfile, AppState, AnalysisResult, ScanHistoryItem } from './types';
import UserProfileForm from './components/UserProfileForm';
import ImageCapture from './components/ImageCapture';
import AnalysisView from './components/AnalysisView';
import { analyzeHealthImpact } from './services/geminiService';
import { Settings, History, PlusCircle, ChevronLeft, Loader2, Sparkles, Trash2, Lock, AlertCircle } from 'lucide-react';
import clsx from 'clsx';

function App() {
  // State
  const [appState, setAppState] = useState<AppState>(AppState.ONBOARDING);
  const [userProfile, setUserProfile] = useState<UserProfile>({ age: '', gender: '', healthContext: '' });
  const [activeTab, setActiveTab] = useState<'scan' | 'history' | 'settings'>('scan');
  
  // Analysis State
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentResult, setCurrentResult] = useState<AnalysisResult | null>(null);
  
  // History State
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);

  // Initialize
  useEffect(() => {
    const savedProfile = localStorage.getItem('sukoyaka_profile');
    const savedHistory = localStorage.getItem('sukoyaka_history');
    
    if (savedProfile) {
      const parsedProfile = JSON.parse(savedProfile);
      setUserProfile(parsedProfile);
      // Check if profile is actually valid/complete
      if (parsedProfile.age && parsedProfile.healthContext) {
          setAppState(AppState.DASHBOARD);
      } else {
          setAppState(AppState.ONBOARDING);
      }
    }
    
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Save History
  const saveToHistory = (result: AnalysisResult, images: string[]) => {
    // Don't save if the result was an error/unclear image
    if (result.imageQualityCheck && result.imageQualityCheck.isUnclear) return;

    // Compress logic or simplified thumbnail logic could go here.
    // For now, we use the first image. In production, canvas resizing is recommended.
    const newItem: ScanHistoryItem = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      result,
      imagePreviewUrl: images[0] 
    };
    
    setHistory(prev => {
        const updated = [newItem, ...prev];
        // Limit history to avoid storage overflow
        if (updated.length > 20) updated.pop();
        
        try {
             localStorage.setItem('sukoyaka_history', JSON.stringify(updated));
        } catch (e) {
            console.error("Storage full", e);
            // Fallback: save without image if full
            const noImageHistory = updated.map(h => ({...h, imagePreviewUrl: undefined}));
             localStorage.setItem('sukoyaka_history', JSON.stringify(noImageHistory));
        }
        return updated;
    });
  };

  const clearHistory = () => {
      if(window.confirm("履歴をすべて削除しますか？")) {
          setHistory([]);
          localStorage.removeItem('sukoyaka_history');
      }
  }

  // Handlers
  const handleProfileSave = (profile: UserProfile) => {
    setUserProfile(profile);
    localStorage.setItem('sukoyaka_profile', JSON.stringify(profile));
    setAppState(AppState.DASHBOARD);
    setActiveTab('scan'); // Go to scan after setting update
  };

  const handleAnalysis = async () => {
    if (selectedImages.length === 0) return;
    
    setIsAnalyzing(true);
    setCurrentResult(null);
    
    try {
      const result = await analyzeHealthImpact(userProfile, selectedImages);
      setCurrentResult(result);
      saveToHistory(result, selectedImages);
    } catch (error) {
      alert(error instanceof Error ? error.message : "エラーが発生しました");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetScan = () => {
    setSelectedImages([]);
    setCurrentResult(null);
  };

  const loadHistoryItem = (item: ScanHistoryItem) => {
      setCurrentResult(item.result);
      setActiveTab('scan');
  };

  // Check if profile is configured
  const isProfileConfigured = userProfile.age && userProfile.gender && userProfile.healthContext;

  // Render Logic
  if (appState === AppState.ONBOARDING) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <UserProfileForm initialProfile={userProfile} onSave={handleProfileSave} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans text-gray-800">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 px-4 py-3 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
            {currentResult && activeTab === 'scan' && (
                <button onClick={resetScan} className="p-1 -ml-2 text-gray-500 hover:text-gray-800">
                    <ChevronLeft />
                </button>
            )}
          <h1 className="text-lg font-bold text-teal-900 tracking-tight">VitalScope</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-xl mx-auto p-4">
        
        {/* TAB: SCAN */}
        {activeTab === 'scan' && (
          <div className="space-y-6 animate-fade-in">
            {/* LOCKED STATE if profile is missing (Safety Guard) */}
            {!isProfileConfigured ? (
               <div className="bg-white rounded-2xl p-8 shadow-sm border border-red-100 text-center space-y-6">
                  <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-400">
                      <Lock size={40} />
                  </div>
                  <div>
                      <h2 className="text-xl font-bold text-gray-800 mb-2">初期設定が必要です</h2>
                      <p className="text-gray-600 text-sm leading-relaxed mb-4">
                          このアプリはあなたの健康状態に合わせた診断を行うため、最初にプロフィールを入力してください。
                      </p>
                      <p className="text-gray-600 text-sm leading-relaxed">
                          VitalScope はあなたに最適な診断結果を出すために、年齢・性別・現在の健康状態・悩みを必要とします。
                      </p>
                      <span className="text-red-500 text-xs mt-4 block">
                          ※設定が完了するまで診断機能は使用できません。
                      </span>
                  </div>
                  <button 
                      onClick={() => setActiveTab('settings')}
                      className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                  >
                      <Settings size={18} />
                      初期設定を始める
                  </button>
               </div>
            ) : !currentResult ? (
              /* NORMAL SCAN STATE */
              <>
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
                    <h2 className="text-lg font-bold text-gray-700 mb-2">商品をチェックする</h2>
                    <p className="text-sm text-gray-500 mb-6">
                        食品の成分表示や商品のパッケージ写真を撮って、<br/>
                        あなたの健康への影響をチェックしましょう。
                    </p>
                    <ImageCapture onImagesSelected={setSelectedImages} />
                    
                    {selectedImages.length > 0 && (
                        <button
                            onClick={handleAnalysis}
                            disabled={isAnalyzing}
                            className="w-full mt-6 bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isAnalyzing ? (
                                <>
                                    <Loader2 className="animate-spin" />
                                    解析中...
                                </>
                            ) : (
                                <>
                                    <Sparkles size={20} />
                                    診断する
                                </>
                            )}
                        </button>
                    )}
                </div>
              </>
            ) : (
              /* RESULT VIEW */
              <AnalysisView result={currentResult} onRetry={resetScan} />
            )}
          </div>
        )}

        {/* TAB: HISTORY */}
        {activeTab === 'history' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex justify-between items-end mb-2">
                <h2 className="text-xl font-bold text-gray-800">診断履歴</h2>
                {history.length > 0 && (
                    <button onClick={clearHistory} className="text-xs text-red-500 flex items-center gap-1 hover:underline">
                        <Trash2 size={12}/> 履歴を削除
                    </button>
                )}
            </div>
            
            {history.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                    <History size={48} className="mx-auto mb-3 opacity-20" />
                    <p>まだ履歴がありません</p>
                </div>
            ) : (
                history.map((item) => (
                <div 
                    key={item.id} 
                    onClick={() => loadHistoryItem(item)}
                    className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex gap-4 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                    <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {item.imagePreviewUrl ? (
                            <img src={item.imagePreviewUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                                <ImageIcon size={24} />
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-400 mb-1">
                            {new Date(item.timestamp).toLocaleDateString('ja-JP')}
                        </p>
                        <p className="text-sm font-bold text-gray-800 line-clamp-2 mb-2">
                            {item.result.summary}
                        </p>
                        {item.result.calorieAnalysis && (
                             <div className="flex gap-2">
                                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                                    {item.result.calorieAnalysis.productCalories}kcal
                                </span>
                            </div>
                        )}
                    </div>
                </div>
                ))
            )}
          </div>
        )}

        {/* TAB: SETTINGS */}
        {activeTab === 'settings' && (
          <UserProfileForm initialProfile={userProfile} onSave={handleProfileSave} isEditing />
        )}

      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-between items-center z-50 text-xs font-medium text-gray-400 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <button 
          onClick={() => setActiveTab('history')}
          className={clsx("flex flex-col items-center gap-1 transition-colors", activeTab === 'history' ? "text-teal-600" : "hover:text-gray-600")}
        >
          <History size={24} strokeWidth={activeTab === 'history' ? 2.5 : 2} />
          履歴
        </button>

        <button 
          onClick={() => {
              resetScan();
              setActiveTab('scan');
          }}
          className="flex flex-col items-center justify-center -mt-8"
        >
          <div className={clsx("w-16 h-16 rounded-full flex items-center justify-center shadow-lg transform transition-transform active:scale-95", activeTab === 'scan' ? "bg-teal-600 text-white" : "bg-gray-800 text-white")}>
            <PlusCircle size={32} />
          </div>
          <span className={clsx("mt-1", activeTab === 'scan' ? "text-teal-600" : "text-gray-400")}>診断</span>
        </button>

        <button 
          onClick={() => setActiveTab('settings')}
          className={clsx("flex flex-col items-center gap-1 transition-colors", activeTab === 'settings' ? "text-teal-600" : "hover:text-gray-600")}
        >
          <Settings size={24} strokeWidth={activeTab === 'settings' ? 2.5 : 2} />
          <span className="relative">
              設定
              {!isProfileConfigured && <span className="absolute -top-1 -right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
          </span>
        </button>
      </nav>
    </div>
  );
}

// Helper component for Icon inside History tab
function ImageIcon(props: any) {
    return (
        <svg 
            {...props}
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
        >
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
        </svg>
    )
}

export default App;