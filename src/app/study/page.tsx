'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Flashcard, Category } from '@/types';
import MainNavBar from '@/components/MainNavBar';

export default function StudyPage() {
  const router = useRouter();
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [includeChildren, setIncludeChildren] = useState(false);
  const [studyStats, setStudyStats] = useState({
    correct: 0,
    incorrect: 0,
    remaining: 0
  });
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      loadCards();
    }
  }, [selectedCategory, includeChildren]);

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
    } finally {
      setLoading(false);
    }
  };

  const startStudySession = async () => {
    const today = new Date().toISOString().split('T')[0];
    
    try {
      // 今日の学習セッションを取得または作成
      const { data: existingSession, error: fetchError } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('date', today)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      let session;
      if (existingSession) {
        session = existingSession;
      } else {
        const { data: newSession, error: createError } = await supabase
          .from('study_sessions')
          .insert({
            date: today,
            cards_studied: 0,
            correct_answers: 0,
            incorrect_answers: 0,
            study_time_minutes: 0
          })
          .select()
          .single();

        if (createError) throw createError;
        session = newSession;
      }

      setSessionId(session.id);
      setSessionStartTime(new Date());
    } catch (error) {
      console.error('Error starting study session:', error);
    }
  };

  const getAllCategoryIds = (categoryId: string): string[] => {
    const ids = [categoryId];
    const findChildren = (parentId: string) => {
      const children = categories.filter(cat => cat.parent_id === parentId);
      children.forEach(child => {
        ids.push(child.id);
        findChildren(child.id);
      });
    };
    findChildren(categoryId);
    return ids;
  };

  const loadCards = async () => {
    setLoading(true);
    try {
      let query = supabase.from('flashcards').select('*');
      
      // 「all」が選択されていない場合は特定のカテゴリでフィルター
      if (selectedCategory !== 'all') {
        if (includeChildren) {
          const categoryIds = getAllCategoryIds(selectedCategory);
          query = query.in('category_id', categoryIds);
        } else {
          query = query.eq('category_id', selectedCategory);
        }
      }
      
      const { data, error } = await query;

      if (error) throw error;
      
      // カードをシャッフル
      const shuffled = (data || []).sort(() => Math.random() - 0.5);
      setCards(shuffled);
      setCurrentCardIndex(0);
      setShowAnswer(false);
      setStudyStats({
        correct: 0,
        incorrect: 0,
        remaining: shuffled.length
      });

      // 学習セッションを開始
      await startStudySession();
    } catch (error) {
      console.error('Error loading cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async (isCorrect: boolean) => {
    const currentCard = cards[currentCardIndex];
    
    try {
      // カードのカウントを更新
      const { error: cardError } = await supabase
        .from('flashcards')
        .update({
          correct_count: currentCard.correct_count + (isCorrect ? 1 : 0),
          incorrect_count: currentCard.incorrect_count + (isCorrect ? 0 : 1)
        })
        .eq('id', currentCard.id);

      if (cardError) throw cardError;

      // 学習記録を保存
      if (sessionId) {
        const { error: recordError } = await supabase
          .from('study_records')
          .insert({
            session_id: sessionId,
            flashcard_id: currentCard.id,
            is_correct: isCorrect
          });

        if (recordError) throw recordError;
      }

      // 統計を更新
      const newStats = {
        correct: studyStats.correct + (isCorrect ? 1 : 0),
        incorrect: studyStats.incorrect + (isCorrect ? 0 : 1),
        remaining: studyStats.remaining - 1
      };
      setStudyStats(newStats);

      // 次のカードへ
      if (currentCardIndex < cards.length - 1) {
        setCurrentCardIndex(currentCardIndex + 1);
        setShowAnswer(false);
      } else {
        // 学習完了 - セッションを更新
        await finishStudySession(newStats);
        alert(`学習完了！\n正解: ${newStats.correct}\n不正解: ${newStats.incorrect}`);
        router.push('/');
      }
    } catch (error) {
      console.error('Error updating card:', error);
    }
  };

  const finishStudySession = async (finalStats: { correct: number; incorrect: number }) => {
    if (!sessionId || !sessionStartTime) return;

    try {
      const endTime = new Date();
      const studyTimeMinutes = Math.round((endTime.getTime() - sessionStartTime.getTime()) / 60000);

      // 今日のセッションを取得して現在の値に加算
      const { data: currentSession, error: fetchError } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (fetchError) throw fetchError;

      const { error: updateError } = await supabase
        .from('study_sessions')
        .update({
          cards_studied: currentSession.cards_studied + cards.length,
          correct_answers: currentSession.correct_answers + finalStats.correct,
          incorrect_answers: currentSession.incorrect_answers + finalStats.incorrect,
          study_time_minutes: currentSession.study_time_minutes + studyTimeMinutes
        })
        .eq('id', sessionId);

      if (updateError) throw updateError;
    } catch (error) {
      console.error('Error finishing study session:', error);
    }
  };

  const currentCard = cards[currentCardIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <MainNavBar />
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center">
              <button 
                onClick={() => router.back()} 
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors mr-4"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>戻る</span>
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">学習モード</h1>
                {selectedCategory && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {selectedCategory === 'all' 
                      ? '🎲 全カテゴリからランダム' 
                      : `${categories.find(c => c.id === selectedCategory)?.name}${includeChildren && selectedCategory !== 'all' ? ' (子カテゴリ含む)' : ''}`}
                  </p>
                )}
              </div>
            </div>
            {cards.length > 0 && (
              <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-full">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {currentCardIndex + 1} / {cards.length}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!selectedCategory ? (
          // カテゴリ選択
          <div className="animate-fadeIn">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
              <div className="px-6 py-5 bg-gradient-to-r from-indigo-500 to-purple-500">
                <h2 className="text-2xl font-bold text-white">学習するカテゴリを選択</h2>
              </div>
              {categories.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-500 dark:text-gray-400">カテゴリがありません</p>
                </div>
              ) : (
                <div className="p-6 space-y-4">
                  {/* 全カテゴリからランダム選択 */}
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className="w-full group p-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 hover:from-emerald-100 hover:to-teal-100 dark:hover:from-emerald-900/30 dark:hover:to-teal-900/30 border-2 border-emerald-200 dark:border-emerald-800 rounded-xl transition-all duration-300 text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-emerald-800 dark:text-emerald-200 group-hover:text-emerald-900 dark:group-hover:text-emerald-100 transition-colors">
                            🎲 全てのカテゴリからランダム
                          </h3>
                          <p className="text-sm text-emerald-600 dark:text-emerald-400">
                            すべてのカードから出題します
                          </p>
                        </div>
                      </div>
                      <svg className="w-6 h-6 text-emerald-500 group-hover:text-emerald-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                  
                  {/* セパレーター */}
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">または</span>
                    <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
                  </div>
                  
                  {/* 出題範囲オプション */}
                  <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4 mb-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeChildren}
                        onChange={(e) => setIncludeChildren(e.target.checked)}
                        className="w-5 h-5 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          子カテゴリを含める
                        </span>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          選択したカテゴリの下位カテゴリも含めて出題します
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* 個別カテゴリ */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {categories.map(cat => {
                      const childCount = includeChildren ? getAllCategoryIds(cat.id).length - 1 : 0;
                      return (
                        <button
                          key={cat.id}
                          onClick={() => setSelectedCategory(cat.id)}
                          className="group p-6 bg-gray-50 dark:bg-gray-700/50 hover:bg-gradient-to-br hover:from-indigo-50 hover:to-purple-50 dark:hover:from-indigo-900/20 dark:hover:to-purple-900/20 rounded-xl transition-all duration-300 text-left"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                {cat.name}
                              </h3>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {includeChildren && childCount > 0 
                                  ? `${childCount}個の子カテゴリを含む` 
                                  : 'このカテゴリのみ'}
                              </p>
                            </div>
                            <svg className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : loading ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full animate-pulse">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <p className="mt-4 text-gray-500 dark:text-gray-400">読み込み中...</p>
          </div>
        ) : cards.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 dark:text-gray-400">
              {selectedCategory === 'all' ? 'カードがありません' : 'このカテゴリにカードがありません'}
            </p>
            <button
              onClick={() => setSelectedCategory('')}
              className="mt-4 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
            >
              カテゴリ選択に戻る
            </button>
          </div>
        ) : currentCard ? (
          <div className="animate-fadeIn">
            {/* 統計情報 */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 text-center transform hover:scale-105 transition-transform">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">正解</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{studyStats.correct}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 text-center transform hover:scale-105 transition-transform">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">不正解</p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">{studyStats.incorrect}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 text-center transform hover:scale-105 transition-transform">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">残り</p>
                <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{studyStats.remaining}</p>
              </div>
            </div>

            {/* フラッシュカード */}
            <div className="relative">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden min-h-[400px]">
                <div className="absolute top-0 left-0 right-0 h-2 bg-gray-200 dark:bg-gray-700">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                    style={{ width: `${((currentCardIndex + 1) / cards.length) * 100}%` }}
                  />
                </div>
                <div className="p-8 pt-12 text-center">
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                    {currentCard.front_text}
                  </h3>
                  
                  {showAnswer && (
                    <div className="animate-fadeIn">
                      <div className="w-16 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 mx-auto mb-8"></div>
                      <p className="text-xl text-gray-700 dark:text-gray-300 leading-relaxed mb-6 whitespace-pre-wrap">
                        {currentCard.back_text}
                      </p>
                      {currentCard.back_image_url && (
                        <div className="mt-4">
                          <img
                            src={currentCard.back_image_url}
                            alt="カードの画像"
                            className="max-w-full mx-auto rounded-lg shadow-md object-contain"
                            style={{ maxHeight: '300px' }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* アクションボタン */}
            <div className="flex justify-center gap-4 mt-8">
              {!showAnswer ? (
                <button
                  onClick={() => setShowAnswer(true)}
                  className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
                >
                  答えを見る
                </button>
              ) : (
                <>
                  <button
                    onClick={() => handleAnswer(false)}
                    className="px-8 py-4 bg-gradient-to-r from-red-500 to-pink-500 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
                  >
                    不正解
                  </button>
                  <button
                    onClick={() => handleAnswer(true)}
                    className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
                  >
                    正解
                  </button>
                </>
              )}
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}