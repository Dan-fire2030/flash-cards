'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Category } from '@/types';
import MainNavBar from '@/components/MainNavBar';
import SubHeader from '@/components/Header';

export default function NewCardPage() {
  const router = useRouter();
  const [frontText, setFrontText] = useState('');
  const [backText, setBackText] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      // Only run on client side
      if (typeof window === 'undefined') return;
      
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
    if (!frontText.trim() || !backText.trim() || !categoryId) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('flashcards')
        .insert({
          front_text: frontText.trim(),
          back_text: backText.trim(),
          category_id: categoryId
        });

      if (error) throw error;
      router.push('/');
    } catch (error) {
      console.error('Error creating card:', error);
      alert('カードの作成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <MainNavBar />
      <SubHeader title="新規カード作成" showBackButton={true} />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-fadeIn">
          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="px-6 py-5 bg-gradient-to-r from-indigo-500 to-purple-500">
              <h2 className="text-xl font-semibold text-white">カード情報を入力</h2>
            </div>
            
            <div className="p-8 space-y-8">
              {/* 表面 */}
              <div>
                <label htmlFor="front" className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  表面（学習単語）
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="front"
                    value={frontText}
                    onChange={(e) => setFrontText(e.target.value)}
                    className="w-full px-4 py-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-indigo-500 focus:ring-0 dark:bg-gray-700 dark:text-white transition-colors"
                    placeholder="例: apple"
                    required
                  />
                  <div className="absolute inset-0 rounded-xl ring-2 ring-transparent focus-within:ring-indigo-500/20 transition-all pointer-events-none"></div>
                </div>
              </div>

              {/* 裏面 */}
              <div>
                <label htmlFor="back" className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  裏面（説明）
                </label>
                <div className="relative">
                  <textarea
                    id="back"
                    value={backText}
                    onChange={(e) => setBackText(e.target.value)}
                    className="w-full px-4 py-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-indigo-500 focus:ring-0 dark:bg-gray-700 dark:text-white transition-colors resize-none"
                    placeholder="例: りんご、果物の一種"
                    rows={4}
                    required
                  />
                  <div className="absolute inset-0 rounded-xl ring-2 ring-transparent focus-within:ring-indigo-500/20 transition-all pointer-events-none"></div>
                </div>
              </div>

              {/* カテゴリ */}
              <div>
                <label htmlFor="category" className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  カテゴリ
                </label>
                <div className="relative">
                  <select
                    id="category"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-4 py-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-indigo-500 focus:ring-0 dark:bg-gray-700 dark:text-white transition-colors appearance-none"
                    required
                  >
                    <option value="">カテゴリを選択してください</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  <svg className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  <div className="absolute inset-0 rounded-xl ring-2 ring-transparent focus-within:ring-indigo-500/20 transition-all pointer-events-none"></div>
                </div>
                {categories.length === 0 && (
                  <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                    まず
                    <Link href="/categories/new" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium mx-1">
                      カテゴリを作成
                    </Link>
                    してください
                  </p>
                )}
              </div>
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
                  disabled={loading || !frontText.trim() || !backText.trim() || !categoryId}
                  className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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