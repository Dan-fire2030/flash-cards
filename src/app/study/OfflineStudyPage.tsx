'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Flashcard, Category } from '@/types';
import MainNavBar from '@/components/MainNavBar';
import { useOffline } from '@/contexts/OfflineContext';
import { useOfflineCards } from '@/hooks/useOfflineCards';
import { useStudyProgress } from '@/hooks/useStudyProgress';

export default function OfflineStudyPage() {
  const router = useRouter();
  const { isOnline } = useOffline();
  const { cards: offlineCards, categories: offlineCategories, loading: offlineLoading, isOffline } = useOfflineCards();
  const { hasProgress, saveProgress, loadProgress, clearProgress } = useStudyProgress();
  
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
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
  const [answeredCards, setAnsweredCards] = useState<Set<number>>(new Set());
  const [showProgressModal, setShowProgressModal] = useState(false);

  // オフラインデータを使用
  useEffect(() => {
    if (!offlineLoading) {
      setCategories(offlineCategories);
      setLoading(false);
      
      // 進行状況があるかチェック
      if (hasProgress && !selectedCategory) {
        setShowProgressModal(true);
      }
    }
  }, [offlineCategories, offlineLoading, hasProgress, selectedCategory]);

  useEffect(() => {
    if (selectedCategory && !offlineLoading) {
      loadCards();
    }
  }, [selectedCategory, includeChildren, offlineCards, offlineLoading]);

  // 進行状況を復元する関数
  const continueFromProgress = () => {
    const progress = loadProgress();
    if (!progress) {
      setShowProgressModal(false);
      return;
    }

    setCards(progress.cards);
    setCurrentCardIndex(progress.currentCardIndex);
    setSelectedCategory(progress.selectedCategory);
    setIncludeChildren(progress.includeChildren);
    setStudyStats(progress.studyStats);
    setAnsweredCards(new Set(progress.answeredCards));
    setSessionStartTime(new Date(progress.sessionStartTime));
    setShowProgressModal(false);

    console.log('Continuing from saved progress:', progress);
  };

  // 新しく始める関数
  const startFresh = () => {
    clearProgress();
    setShowProgressModal(false);
  };

  const startStudySession = async () => {
    // オフライン時はセッション記録をスキップ
    if (isOffline) {
      setSessionStartTime(new Date());
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    
    try {
      // ユーザー情報を取得
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('User not authenticated');
        return;
      }

      const { data: existingSession, error: fetchError } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('date', today)
        .eq('user_id', user.id)
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
            user_id: user.id,
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
    try {
      setLoading(true);
      
      let filteredCards: Flashcard[];
      
      if (isOffline) {
        // オフライン時はローカルデータを使用
        const categoryIds = includeChildren ? getAllCategoryIds(selectedCategory) : [selectedCategory];
        filteredCards = offlineCards.filter(card => 
          categoryIds.includes(card.category_id || '')
        );
      } else {
        // オンライン時は従来通りSupabaseから取得
        const categoryIds = includeChildren ? getAllCategoryIds(selectedCategory) : [selectedCategory];
        
        const { data, error } = await supabase
          .from('cards')
          .select('*')
          .in('category_id', categoryIds)
          .order('created_at', { ascending: false });

        if (error) throw error;
        filteredCards = data || [];
      }

      const shuffled = [...filteredCards].sort(() => Math.random() - 0.5);
      setCards(shuffled);
      setCurrentCardIndex(0);
      setShowAnswer(false);
      setSelectedOption(null);
      setHasAnswered(false);
      setStudyStats({
        correct: 0,
        incorrect: 0,
        remaining: shuffled.length
      });
      
      if (!sessionId && shuffled.length > 0) {
        await startStudySession();
      }
    } catch (error) {
      console.error('Error loading cards:', error);
      setCards([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async (isCorrect: boolean) => {
    setStudyStats(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      incorrect: prev.incorrect + (isCorrect ? 0 : 1),
      remaining: prev.remaining - 1
    }));

    // オフライン時は学習記録の保存をスキップ
    if (!isOffline && sessionId) {
      try {
        const studyTimeMinutes = sessionStartTime 
          ? Math.floor((new Date().getTime() - sessionStartTime.getTime()) / 60000)
          : 0;

        await supabase
          .from('study_sessions')
          .update({
            cards_studied: studyStats.correct + studyStats.incorrect + 1,
            correct_answers: studyStats.correct + (isCorrect ? 1 : 0),
            incorrect_answers: studyStats.incorrect + (isCorrect ? 0 : 1),
            study_time_minutes: studyTimeMinutes
          })
          .eq('id', sessionId);
      } catch (error) {
        console.error('Error updating study session:', error);
      }
    }
  };

  const handleMultipleChoiceAnswer = (optionIndex: number) => {
    if (hasAnswered || currentCard?.card_type !== 'multiple_choice') return;
    
    setSelectedOption(optionIndex);
    setHasAnswered(true);
    
    const isCorrect = optionIndex === currentCard.correct_option_index;
    handleAnswer(isCorrect);
  };

  // 進行状況を自動保存する関数
  const saveCurrentProgress = () => {
    if (cards.length > 0 && selectedCategory && sessionStartTime) {
      const progress = {
        cards,
        currentCardIndex,
        selectedCategory,
        includeChildren,
        studyStats,
        sessionStartTime: sessionStartTime.toISOString(),
        answeredCards: Array.from(answeredCards)
      };
      saveProgress(progress);
    }
  };

  const nextCard = () => {
    if (currentCardIndex < cards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setShowAnswer(false);
      setSelectedOption(null);
      setHasAnswered(false);
      
      // 進行状況を保存
      setTimeout(saveCurrentProgress, 100); // 状態更新後に保存
    } else {
      // 学習完了 - 進行状況をクリア
      clearProgress();
      router.push('/');
    }
  };

  const previousCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setShowAnswer(false);
      setSelectedOption(null);
      setHasAnswered(false);
    }
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (cards.length === 0) return;
    
    const currentCard = cards[currentCardIndex];
    
    if (currentCard?.card_type === 'multiple_choice') {
      if (!hasAnswered && ['1', '2', '3', '4'].includes(e.key)) {
        const optionIndex = parseInt(e.key) - 1;
        if (optionIndex < 4) {
          handleMultipleChoiceAnswer(optionIndex);
        }
      } else if (hasAnswered && e.key === 'Enter') {
        nextCard();
      }
    } else {
      if (e.key === ' ') {
        e.preventDefault();
        if (!showAnswer) {
          setShowAnswer(true);
        }
      } else if (showAnswer) {
        if (e.key === 'o' || e.key === 'O' || e.key === '○') {
          handleAnswer(true);
          nextCard();
        } else if (e.key === 'x' || e.key === 'X' || e.key === '×') {
          handleAnswer(false);
          nextCard();
        }
      }
    }
  };

  useEffect(() => {
    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [currentCardIndex, showAnswer, cards, hasAnswered]);

  // ページ離脱時に進行状況を保存
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (cards.length > 0 && currentCardIndex < cards.length) {
        saveCurrentProgress();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [cards, currentCardIndex, selectedCategory, sessionStartTime, studyStats, answeredCards]);

  // 定期的な進行状況保存（10秒間隔）
  useEffect(() => {
    if (cards.length > 0 && selectedCategory) {
      const interval = setInterval(() => {
        saveCurrentProgress();
      }, 10000); // 10秒ごと

      return () => clearInterval(interval);
    }
  }, [cards, selectedCategory, currentCardIndex, studyStats, answeredCards]);

  const currentCard = cards[currentCardIndex];

  const renderMultipleChoiceCard = () => {
    if (currentCard?.card_type !== 'multiple_choice') return null;

    const options = currentCard.options || [];

    return (
      <div className="space-y-4">
        <div className="bg-gray-100 dark:bg-gray-700 p-6 rounded-lg">
          <h3 className="text-2xl font-bold text-center">{currentCard.front_text}</h3>
        </div>
        
        <div className="space-y-3">
          {options.map((option, index) => {
            const isSelected = selectedOption === index;
            const isCorrect = index === currentCard.correct_option_index;
            
            let bgColor = 'bg-white dark:bg-gray-800';
            if (hasAnswered) {
              if (isCorrect) {
                bgColor = 'bg-green-100 dark:bg-green-900 border-green-500';
              } else if (isSelected && !isCorrect) {
                bgColor = 'bg-red-100 dark:bg-red-900 border-red-500';
              }
            } else if (isSelected) {
              bgColor = 'bg-blue-100 dark:bg-blue-900 border-blue-500';
            }
            
            return (
              <button
                key={index}
                onClick={() => handleMultipleChoiceAnswer(index)}
                disabled={hasAnswered}
                className={`w-full p-4 text-left rounded-lg border-2 transition-colors ${bgColor} ${
                  !hasAnswered ? 'hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer' : 'cursor-not-allowed'
                }`}
              >
                <span className="font-medium">{index + 1}. </span>
                {option}
                {hasAnswered && isCorrect && ' ✓'}
                {hasAnswered && isSelected && !isCorrect && ' ✗'}
              </button>
            );
          })}
        </div>

        {hasAnswered && (
          <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">正解:</p>
            <p className="text-sm text-blue-800 dark:text-blue-200">{options[currentCard.correct_option_index || 0]}</p>
          </div>
        )}
      </div>
    );
  };

  const renderNormalCard = () => {
    if (currentCard?.card_type === 'multiple_choice') return null;

    return (
      <div className="space-y-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 min-h-[300px] flex items-center justify-center">
          <div className="text-center">
            <h3 className="text-3xl font-bold mb-4">{currentCard?.front_text}</h3>
            {showAnswer && (
              <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-700 rounded">
                <p className="text-xl">{currentCard?.back_text}</p>
              </div>
            )}
          </div>
        </div>

        {!showAnswer && (
          <button
            onClick={() => setShowAnswer(true)}
            className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            答えを見る (スペースキー)
          </button>
        )}

        {showAnswer && (
          <div className="flex gap-4">
            <button
              onClick={() => {
                handleAnswer(true);
                nextCard();
              }}
              className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              ◯ 正解 (O)
            </button>
            <button
              onClick={() => {
                handleAnswer(false);
                nextCard();
              }}
              className="flex-1 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              × 不正解 (X)
            </button>
          </div>
        )}
      </div>
    );
  };

  // 進行状況選択モーダル
  const renderProgressModal = () => {
    if (!showProgressModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md mx-4 shadow-xl">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              学習を再開しますか？
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              前回の学習の続きから始めることができます
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={continueFromProgress}
              className="w-full py-3 px-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-7 0a9 9 0 1114 0H7z" />
                </svg>
                続きから始める
              </div>
            </button>
            
            <button
              onClick={startFresh}
              className="w-full py-3 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                始めから始める
              </div>
            </button>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
            「始めから始める」を選ぶと、保存された進行状況は削除されます
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <MainNavBar />
      {renderProgressModal()}
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {isOffline && (
          <div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              オフラインモードで学習中です。学習記録は保存されません。
            </p>
          </div>
        )}
        
        {!selectedCategory ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-6">カテゴリーを選択</h2>
            
            {loading || offlineLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              </div>
            ) : categories.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                カテゴリーがありません。
                {isOffline && 'オンライン時にカテゴリーを作成してください。'}
              </p>
            ) : (
              <div className="space-y-4">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                >
                  <option value="">カテゴリーを選択してください</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>

                {selectedCategory && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="includeChildren"
                      checked={includeChildren}
                      onChange={(e) => setIncludeChildren(e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor="includeChildren" className="text-sm">
                      サブカテゴリーも含める
                    </label>
                  </div>
                )}

                {selectedCategory && (
                  <button
                    onClick={loadCards}
                    className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    学習を開始
                  </button>
                )}
              </div>
            )}
          </div>
        ) : cards.length === 0 && !loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
            <p className="text-gray-500">このカテゴリーにはカードがありません</p>
            <button
              onClick={() => {
                setSelectedCategory('');
                setCards([]);
              }}
              className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              カテゴリー選択に戻る
            </button>
          </div>
        ) : loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        ) : (
          <>
            <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  カード {currentCardIndex + 1} / {cards.length}
                </span>
                <button
                  onClick={() => {
                    // 進行状況をクリアして終了
                    clearProgress();
                    setSelectedCategory('');
                    setCards([]);
                  }}
                  className="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  終了
                </button>
              </div>
              <div className="flex gap-2 text-sm">
                <span className="text-green-600">正解: {studyStats.correct}</span>
                <span className="text-red-600">不正解: {studyStats.incorrect}</span>
                <span className="text-gray-600">残り: {studyStats.remaining}</span>
              </div>
            </div>

            {currentCard?.card_type === 'multiple_choice' ? renderMultipleChoiceCard() : renderNormalCard()}

            <div className="mt-6 flex justify-between">
              <button
                onClick={previousCard}
                disabled={currentCardIndex === 0}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                前のカード
              </button>
              
              {currentCard?.card_type === 'multiple_choice' && hasAnswered && (
                <button
                  onClick={nextCard}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  {currentCardIndex === cards.length - 1 ? '終了' : '次のカード (Enter)'}
                </button>
              )}
              
              {currentCard?.card_type !== 'multiple_choice' && (
                <button
                  onClick={nextCard}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  {currentCardIndex === cards.length - 1 ? '終了' : '次のカード'}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}