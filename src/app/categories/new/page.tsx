'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Category } from '@/types';
import MainNavBar from '@/components/MainNavBar';
import SubHeader from '@/components/Header';

export default function NewCategoryPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState<string>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('categories')
        .insert({
          name: name.trim(),
          parent_id: parentId || null
        });

      if (error) throw error;
      router.push('/');
    } catch (error) {
      console.error('Error creating category:', error);
      alert('カテゴリの作成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <MainNavBar />
      <SubHeader title="新規カテゴリ作成" showBackButton={true} />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-fadeIn">
          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="px-6 py-5 bg-gradient-to-r from-purple-500 to-pink-500">
              <h2 className="text-xl font-semibold text-white">カテゴリ情報を入力</h2>
            </div>
            
            <div className="p-8 space-y-8">
              {/* カテゴリ名 */}
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  カテゴリ名
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:ring-0 dark:bg-gray-700 dark:text-white transition-colors"
                    placeholder="例: 英単語"
                    required
                  />
                  <div className="absolute inset-0 rounded-xl ring-2 ring-transparent focus-within:ring-purple-500/20 transition-all pointer-events-none"></div>
                </div>
              </div>

              {/* 親カテゴリ */}
              <div>
                <label htmlFor="parent" className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  親カテゴリ（オプション）
                </label>
                <div className="relative">
                  <select
                    id="parent"
                    value={parentId}
                    onChange={(e) => setParentId(e.target.value)}
                    className="w-full px-4 py-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-purple-500 focus:ring-0 dark:bg-gray-700 dark:text-white transition-colors appearance-none"
                  >
                    <option value="">なし（ルートカテゴリ）</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  <svg className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  <div className="absolute inset-0 rounded-xl ring-2 ring-transparent focus-within:ring-purple-500/20 transition-all pointer-events-none"></div>
                </div>
                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                  親カテゴリを選択すると、階層構造で管理できます
                </p>
              </div>

              {/* プレビュー */}
              {name && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">プレビュー</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{name}</p>
                      {parentId && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          親: {categories.find(c => c.id === parentId)?.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ボタン */}
            <div className="px-8 py-6 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-600">
              <div className="flex flex-col sm:flex-row gap-4 sm:justify-end">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="w-full sm:w-auto px-6 py-3 text-center border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-all"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={loading || !name.trim()}
                  className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>作成中...</span>
                    </div>
                  ) : (
                    '作成'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}