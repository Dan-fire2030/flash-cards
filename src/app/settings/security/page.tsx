'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import MainNavBar from '@/components/MainNavBar';
import SubHeader from '@/components/Header';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';

export default function SecuritySettingsPage() {
  const router = useRouter();
  const {
    isSupported,
    isEnabled,
    biometricType,
    loading,
    error,
    enableBiometric,
    disableBiometric,
    authenticate,
    clearError,
  } = useBiometricAuth();

  const [testingAuth, setTestingAuth] = useState(false);

  const handleEnableBiometric = async () => {
    const success = await enableBiometric();
    if (success) {
      alert(`${biometricType}認証が有効になりました！`);
    }
  };

  const handleDisableBiometric = async () => {
    if (confirm(`${biometricType}認証を無効にしますか？`)) {
      const success = await disableBiometric();
      if (success) {
        alert(`${biometricType}認証が無効になりました。`);
      }
    }
  };

  const handleTestAuth = async () => {
    setTestingAuth(true);
    const success = await authenticate();
    setTestingAuth(false);
    
    if (success) {
      alert('生体認証テストが成功しました！');
    }
  };

  const handleClearError = () => {
    clearError();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <MainNavBar />
        <SubHeader title="セキュリティ設定" showBackButton={true} />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <MainNavBar />
      <SubHeader title="セキュリティ設定" showBackButton={true} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          
          {/* 生体認証設定 */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              生体認証
            </h2>
            
            {error && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex justify-between items-center">
                  <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                  <button
                    onClick={handleClearError}
                    className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}
            
            <div className="space-y-6">
              {!isSupported ? (
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">生体認証は利用できません</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        この端末またはブラウザでは生体認証がサポートされていません
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                        {biometricType.includes('Face') ? (
                          <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        ) : (
                          <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{biometricType}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {isEnabled ? '有効' : '無効'} • 
                          アプリへの素早いアクセスが可能
                        </p>
                      </div>
                    </div>
                    
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={isEnabled}
                        onChange={isEnabled ? handleDisableBiometric : handleEnableBiometric}
                        disabled={loading}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  {isEnabled && (
                    <div className="pl-15">
                      <button
                        onClick={handleTestAuth}
                        disabled={testingAuth}
                        className="px-4 py-2 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors disabled:opacity-50"
                      >
                        {testingAuth ? '認証中...' : '認証テスト'}
                      </button>
                    </div>
                  )}

                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h3 className="font-medium text-blue-900 dark:text-blue-200 mb-2">生体認証について</h3>
                    <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                      <li>• 生体認証を有効にすると、アプリへの素早いアクセスが可能になります</li>
                      <li>• 認証情報は端末にのみ保存され、サーバーには送信されません</li>
                      <li>• セキュリティを向上させるため、定期的にパスワードでのログインが必要です</li>
                      <li>• 生体認証に失敗した場合は、通常のログイン方法を使用してください</li>
                    </ul>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* その他のセキュリティ設定 */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              アカウントセキュリティ
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">自動ログアウト</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    一定時間非活動状態が続いた場合に自動でログアウト
                  </p>
                </div>
                <button className="px-4 py-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors">
                  設定
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">パスワード変更</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    アカウントのパスワードを変更
                  </p>
                </div>
                <button className="px-4 py-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors">
                  変更
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">アクティビティログ</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    最近のログイン履歴を確認
                  </p>
                </div>
                <button className="px-4 py-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors">
                  表示
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}