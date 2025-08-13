'use client'

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Flashcard, Category } from '@/types';
import MainNavBar from '@/components/MainNavBar';
import { useOffline } from '@/contexts/OfflineContext';
import { useOfflineCards } from '@/hooks/useOfflineCards';

export default function OfflineStudyPage() {
  const router = useRouter();
  const { isOnline } = useOffline();
  const { cards: offlineCards, categories: offlineCategories, loading: offlineLoading } = useOfflineCards();
  
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [includeChildren, setIncludeChildren] = useState(false);
  const [isAllCategoriesSelected, setIsAllCategoriesSelected] = useState(false);
  const [studyStats, setStudyStats] = useState({
    correct: 0,
    incorrect: 0,
    remaining: 0
  });
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const isRestoringState = useRef(false);

  // セッション状態の保存
  const saveSessionState = () => {
    if (cards.length > 0) {
      const state = {
        cards,
        currentCardIndex,
        showAnswer,
        selectedOption,
        hasAnswered,
        selectedCategories,
        includeChildren,
        isAllCategoriesSelected,
        studyStats,
        sessionId,
        sessionStartTime: sessionStartTime?.toISOString()
      };
      sessionStorage.setItem('studySessionState', JSON.stringify(state));
    }
  };

  // セッション状態の復元
  useEffect(() => {
    const savedState = sessionStorage.getItem('studySessionState');
    if (savedState && !isRestoringState.current) {
      isRestoringState.current = true;
      try {
        const state = JSON.parse(savedState);
        setCards(state.cards || []);
        setCurrentCardIndex(state.currentCardIndex || 0);
        setShowAnswer(state.showAnswer || false);
        setSelectedOption(state.selectedOption);
        setHasAnswered(state.hasAnswered || false);
        setSelectedCategories(state.selectedCategories || []);
        setIncludeChildren(state.includeChildren || false);
        setIsAllCategoriesSelected(state.isAllCategoriesSelected || false);
        setStudyStats(state.studyStats || { correct: 0, incorrect: 0, remaining: 0 });
        setSessionId(state.sessionId);
        setSessionStartTime(state.sessionStartTime ? new Date(state.sessionStartTime) : null);
        
        // 復元後にセッション状態をクリア
        sessionStorage.removeItem('studySessionState');
      } catch (error) {
        console.error('Failed to restore session state:', error);
        sessionStorage.removeItem('studySessionState');
      }
    }
  }, []);

  // オフラインデータを使用
  useEffect(() => {
    if (!offlineLoading) {
      setCategories(offlineCategories);
      setLoading(false);
    }
  }, [offlineCategories, offlineLoading]);

  useEffect(() => {
    if ((selectedCategories.length > 0 || isAllCategoriesSelected) && !offlineLoading && !isRestoringState.current) {
      loadCards();
    }
  }, [selectedCategories, isAllCategoriesSelected, includeChildren, offlineCards, offlineLoading]);


  // カテゴリ選択の管理
  const toggleCategorySelection = (categoryId: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
    setIsAllCategoriesSelected(false);
  };

  const toggleAllCategories = () => {
    if (isAllCategoriesSelected) {
      setIsAllCategoriesSelected(false);
      setSelectedCategories([]);
    } else {
      setIsAllCategoriesSelected(true);
      setSelectedCategories([]);
    }
  };

  const clearCategorySelection = () => {
    setSelectedCategories([]);
    setIsAllCategoriesSelected(false);
  };

  // Fisher-Yates (Knuth) シャッフルアルゴリズム
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const startStudySession = async () => {
    // オフライン時はセッション記録をスキップ
    if (!isOnline) {
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
      
      if (!isOnline) {
        // オフライン時はローカルデータを使用
        if (isAllCategoriesSelected) {
          filteredCards = offlineCards;
        } else {
          let categoryIds: string[] = [];
          if (includeChildren) {
            selectedCategories.forEach(catId => {
              categoryIds.push(...getAllCategoryIds(catId));
            });
          } else {
            categoryIds = selectedCategories;
          }
          filteredCards = offlineCards.filter(card => 
            categoryIds.includes(card.category_id || '')
          );
        }
      } else {
        // オンライン時はSupabaseから認証済みユーザーのデータを取得
        // ユーザー認証を確認
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          throw new Error('ユーザー認証が必要です');
        }
        
        if (isAllCategoriesSelected) {
          // 全てのカテゴリから取得
          const { data, error } = await supabase
            .from('flashcards')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (error) throw error;
          filteredCards = data || [];
        } else {
          // 選択されたカテゴリから取得
          let categoryIds: string[] = [];
          if (includeChildren) {
            selectedCategories.forEach(catId => {
              categoryIds.push(...getAllCategoryIds(catId));
            });
          } else {
            categoryIds = selectedCategories;
          }
          
          const { data, error } = await supabase
            .from('flashcards')
            .select('*')
            .eq('user_id', user.id)
            .in('category_id', categoryIds)
            .order('created_at', { ascending: false });

          if (error) throw error;
          filteredCards = data || [];
        }
      }

      const shuffled = shuffleArray(filteredCards);
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
    if (isOnline && sessionId) {
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

  const nextCard = () => {
    if (currentCardIndex < cards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setShowAnswer(false);
      setSelectedOption(null);
      setHasAnswered(false);
    } else {
      // 学習完了時にセッション状態をクリア
      sessionStorage.removeItem('studySessionState');
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

  // ページを離れる時に状態を保存
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveSessionState();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        saveSessionState();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [cards, currentCardIndex, showAnswer, selectedOption, hasAnswered, selectedCategories, includeChildren, isAllCategoriesSelected, studyStats, sessionId, sessionStartTime]);


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
          <div className="text-center w-full">
            <h3 className="text-3xl font-bold mb-4">{currentCard?.front_text}</h3>
            {showAnswer && (
              <div className="mt-8 space-y-4">
                <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded">
                  <p className="text-xl whitespace-pre-wrap">{currentCard?.back_text}</p>
                </div>
                {currentCard?.back_image_url && (
                  <div className="mt-4">
                    <img 
                      src={currentCard.back_image_url} 
                      alt="Card image" 
                      className="max-w-full h-auto rounded-lg shadow-md mx-auto"
                      style={{ maxHeight: '300px' }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {!showAnswer && (
          <button
            onClick={() => setShowAnswer(true)}
            className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <span className="inline sm:hidden">答えを見る</span>
            <span className="hidden sm:inline">答えを見る (スペースキー)</span>
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
              <span className="inline sm:hidden">◯ 正解</span>
              <span className="hidden sm:inline">◯ 正解 (O)</span>
            </button>
            <button
              onClick={() => {
                handleAnswer(false);
                nextCard();
              }}
              className="flex-1 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <span className="inline sm:hidden">× 不正解</span>
              <span className="hidden sm:inline">× 不正解 (X)</span>
            </button>
          </div>
        )}
      </div>
    );
  };


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <MainNavBar />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {!isOnline && (
          <div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              オフラインモードで学習中です。学習記録は保存されません。
            </p>
          </div>
        )}
        
{selectedCategories.length === 0 && !isAllCategoriesSelected ? (
          <div className="space-y-6">
            {/* ヘッダー */}
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">学習を開始</h1>
              <p className="text-gray-600 dark:text-gray-400">学習したいカテゴリを選択してください</p>
            </div>
            
            {loading || offlineLoading ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full animate-pulse">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <p className="mt-4 text-gray-500 dark:text-gray-400">読み込み中...</p>
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                </div>
                <p className="text-gray-500 dark:text-gray-400 mb-2">カテゴリーがありません</p>
                {!isOnline && <p className="text-sm text-orange-600 dark:text-orange-400">オンライン時にカテゴリーを作成してください</p>}
              </div>
            ) : (
              <>
                {/* 全てのカテゴリオプション */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                  <button
                    onClick={toggleAllCategories}
                    className="w-full p-6 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">全てのカテゴリ</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">全範囲からランダムに出題</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded-full font-medium">
                          {offlineCards.length} カード
                        </span>
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          isAllCategoriesSelected 
                            ? 'bg-indigo-500 border-indigo-500 text-white' 
                            : 'border-gray-300 dark:border-gray-600'
                        }`}>
                          {isAllCategoriesSelected && (
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                </div>

                {/* カテゴリ一覧 */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 px-1">個別カテゴリ</h3>
                  <div className="grid gap-3">
                    {categories.map((category) => {
                      const categoryCards = offlineCards.filter(card => card.category_id === category.id);
                      const isSelected = selectedCategories.includes(category.id);
                      
                      return (
                        <div key={category.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                          <button
                            onClick={() => toggleCategorySelection(category.id)}
                            className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                  isSelected 
                                    ? 'bg-indigo-100 dark:bg-indigo-900/30' 
                                    : 'bg-gray-100 dark:bg-gray-700'
                                }`}>
                                  <svg className={`w-5 h-5 ${
                                    isSelected 
                                      ? 'text-indigo-600 dark:text-indigo-400' 
                                      : 'text-gray-400 dark:text-gray-500'
                                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                  </svg>
                                </div>
                                <div>
                                  <h4 className="font-medium text-gray-900 dark:text-white">{category.name}</h4>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">{categoryCards.length} カード</p>
                                </div>
                              </div>
                              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                isSelected 
                                  ? 'bg-indigo-500 border-indigo-500 text-white' 
                                  : 'border-gray-300 dark:border-gray-600'
                              }`}>
                                {isSelected && (
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                            </div>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* オプション設定 */}
                {(selectedCategories.length > 0 || isAllCategoriesSelected) && (
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="includeChildren"
                        checked={includeChildren}
                        onChange={(e) => setIncludeChildren(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2"
                      />
                      <label htmlFor="includeChildren" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        サブカテゴリーも含める
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      チェックすると、選択したカテゴリの子カテゴリからも出題されます
                    </p>
                  </div>
                )}

                {/* 学習開始ボタン */}
                {(selectedCategories.length > 0 || isAllCategoriesSelected) && (
                  <div className="sticky bottom-6 z-10">
                    <button
                      onClick={loadCards}
                      disabled={loading}
                      className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:transform-none"
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-7 0a9 9 0 1114 0H7z" />
                        </svg>
                        <span>学習を開始</span>
                        <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                          {isAllCategoriesSelected 
                            ? `${offlineCards.length} カード` 
                            : `${selectedCategories.reduce((sum, catId) => {
                                return sum + offlineCards.filter(card => card.category_id === catId).length;
                              }, 0)} カード`
                          }
                        </span>
                      </div>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        ) : cards.length === 0 && !loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
            <p className="text-gray-500">このカテゴリーにはカードがありません</p>
            <button
              onClick={() => {
                clearCategorySelection();
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
                    // カテゴリ選択をクリアして終了
                    sessionStorage.removeItem('studySessionState');
                    clearCategorySelection();
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