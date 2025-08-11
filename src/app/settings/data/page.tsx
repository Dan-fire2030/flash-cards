'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import MainNavBar from '@/components/MainNavBar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export default function DataManagementPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [clearing, setClearing] = useState(false);

  // データをエクスポート
  const handleExport = async () => {
    setExporting(true);
    try {
      if (!user) {
        alert('ログインが必要です');
        return;
      }

      // カードとカテゴリのデータを取得
      const [cardsResult, categoriesResult] = await Promise.all([
        supabase
          .from('flashcards')
          .select('*')
          .eq('user_id', user.id),
        supabase
          .from('categories')
          .select('*')
          .eq('user_id', user.id)
      ]);

      if (cardsResult.error || categoriesResult.error) {
        throw new Error('データの取得に失敗しました');
      }

      const exportData = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        userId: user.id,
        cards: cardsResult.data || [],
        categories: categoriesResult.data || [],
      };

      // JSONファイルとしてダウンロード
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `flashcards-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      alert('データをエクスポートしました');
    } catch (error) {
      console.error('Export error:', error);
      alert('エクスポートに失敗しました');
    } finally {
      setExporting(false);
    }
  };

  // データをインポート
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      if (!user) {
        alert('ログインが必要です');
        return;
      }

      const text = await file.text();
      const data = JSON.parse(text);

      // データ形式の確認
      if (!data.cards || !data.categories) {
        throw new Error('無効なデータ形式です');
      }

      const confirmation = confirm(
        `${data.cards.length}枚のカードと${data.categories.length}個のカテゴリをインポートします。既存のデータは保持されます。続行しますか？`
      );

      if (!confirmation) return;

      // カテゴリをインポート
      if (data.categories.length > 0) {
        const categoriesWithUserId = data.categories.map((cat: any) => ({
          ...cat,
          user_id: user.id,
          id: undefined, // 新しいIDを生成
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));

        const { error: categoriesError } = await supabase
          .from('categories')
          .insert(categoriesWithUserId);

        if (categoriesError) {
          console.error('Categories import error:', categoriesError);
        }
      }

      // カードをインポート
      if (data.cards.length > 0) {
        const cardsWithUserId = data.cards.map((card: any) => ({
          ...card,
          user_id: user.id,
          id: undefined, // 新しいIDを生成
          category_id: null, // カテゴリIDはリセット
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));

        const { error: cardsError } = await supabase
          .from('flashcards')
          .insert(cardsWithUserId);

        if (cardsError) {
          console.error('Cards import error:', cardsError);
        }
      }

      alert('データをインポートしました');
    } catch (error) {
      console.error('Import error:', error);
      alert('インポートに失敗しました。ファイル形式を確認してください。');
    } finally {
      setImporting(false);
      // ファイル入力をリセット
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  // 全データを削除
  const handleClearData = async () => {
    const confirmation = confirm(
      '全てのカードとカテゴリを削除します。この操作は元に戻せません。本当に削除しますか？'
    );

    if (!confirmation) return;

    const doubleConfirmation = confirm(
      '最終確認: 全てのデータが完全に削除されます。続行しますか？'
    );

    if (!doubleConfirmation) return;

    setClearing(true);
    try {
      if (!user) {
        alert('ログインが必要です');
        return;
      }

      // カードとカテゴリを削除
      const [cardsResult, categoriesResult] = await Promise.all([
        supabase
          .from('flashcards')
          .delete()
          .eq('user_id', user.id),
        supabase
          .from('categories')
          .delete()
          .eq('user_id', user.id)
      ]);

      if (cardsResult.error || categoriesResult.error) {
        throw new Error('データの削除に失敗しました');
      }

      alert('全てのデータを削除しました');
    } catch (error) {
      console.error('Clear data error:', error);
      alert('データの削除に失敗しました');
    } finally {
      setClearing(false);
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">データ管理</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">バックアップとデータの管理ができます</p>
        </div>

        <div className="space-y-6">
          {/* データエクスポート */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">データエクスポート</h2>
            
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                現在のカードとカテゴリのデータをJSONファイルとしてダウンロードできます。
                バックアップや他のデバイスへの移行に使用できます。
              </p>
              
              <button
                onClick={handleExport}
                disabled={exporting || !user}
                className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-medium rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exporting ? 'エクスポート中...' : (
                  <>
                    <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    データをエクスポート
                  </>
                )}
              </button>
            </div>
          </div>

          {/* データインポート */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">データインポート</h2>
            
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                以前にエクスポートしたJSONファイルからデータを復元できます。
                既存のデータは保持され、新しいデータが追加されます。
              </p>
              
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  disabled={importing || !user}
                  className="hidden"
                  id="import-file"
                />
                <label
                  htmlFor="import-file"
                  className={`block w-full text-center cursor-pointer ${
                    importing || !user ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <div className="space-y-2">
                    <svg className="w-8 h-8 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <div className="text-gray-600 dark:text-gray-400">
                      {importing ? 'インポート中...' : 'JSONファイルを選択またはドロップ'}
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* ローカルストレージ管理 */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">ローカルデータ</h2>
            
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                ブラウザに保存されたオフラインデータの管理
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    localStorage.clear();
                    alert('ローカルストレージをクリアしました');
                  }}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  ローカルストレージをクリア
                </button>
                
                <button
                  onClick={() => {
                    if ('caches' in window) {
                      caches.keys().then(names => {
                        names.forEach(name => {
                          caches.delete(name);
                        });
                        alert('キャッシュをクリアしました');
                      });
                    }
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  アプリキャッシュをクリア
                </button>
              </div>
            </div>
          </div>

          {/* 危険な操作 */}
          <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl shadow-lg p-6 border border-red-200 dark:border-red-800">
            <h2 className="text-xl font-semibold text-red-900 dark:text-red-400 mb-4">危険な操作</h2>
            
            <div className="space-y-4">
              <p className="text-red-700 dark:text-red-300">
                以下の操作は元に戻すことができません。十分注意してください。
              </p>
              
              <button
                onClick={handleClearData}
                disabled={clearing || !user}
                className="px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {clearing ? '削除中...' : (
                  <>
                    <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    全データを削除
                  </>
                )}
              </button>
            </div>
          </div>

          {!user && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl shadow-lg p-6 border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <div className="text-yellow-800 dark:text-yellow-200 font-medium">
                    ログインが必要です
                  </div>
                  <div className="text-yellow-700 dark:text-yellow-300 text-sm mt-1">
                    データ管理機能を使用するにはログインしてください
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}