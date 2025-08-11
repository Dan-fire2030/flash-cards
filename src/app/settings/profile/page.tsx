'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainNavBar from '@/components/MainNavBar';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfileSettingsPage() {
  const router = useRouter();
  const { user, updateProfile } = useAuth();
  
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.user_metadata?.full_name || user.email?.split('@')[0] || '');
      setBio(user.user_metadata?.bio || '');
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await updateProfile({
        data: {
          full_name: displayName,
          bio: bio,
        }
      });
      alert('プロフィールを更新しました');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('プロフィールの更新に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <MainNavBar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ページヘッダー */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            設定に戻る
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">プロフィール設定</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">アカウント情報とプロフィールを管理できます</p>
        </div>

        <div className="space-y-6">
          {/* アカウント情報 */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">アカウント情報</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  メールアドレス
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  メールアドレスは変更できません
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ユーザーID
                </label>
                <input
                  type="text"
                  value={user?.id || ''}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  アカウント作成日
                </label>
                <input
                  type="text"
                  value={user?.created_at ? new Date(user.created_at).toLocaleDateString('ja-JP') : ''}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                />
              </div>
            </div>
          </div>

          {/* プロフィール設定 */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">プロフィール設定</h2>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  表示名
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="表示名を入力してください"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  自己紹介
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="自己紹介を入力してください（任意）"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  最大300文字まで入力できます
                </p>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? '保存中...' : 'プロフィールを保存'}
                </button>
              </div>
            </form>
          </div>

          {/* 統計情報 */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">学習統計</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">-</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">総学習日数</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">-</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">学習したカード</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">-</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">作成したカード</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">-</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">平均正解率</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}