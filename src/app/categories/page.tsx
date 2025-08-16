'use client'

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Category } from '@/types';
import MainNavBar from '@/components/MainNavBar';
import { useOfflineCards } from '@/hooks/useOfflineCards';
import { useOffline } from '@/contexts/OfflineContext';

export default function CategoriesPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [draggedCategory, setDraggedCategory] = useState<Category | null>(null);
  const [dragOverCategory, setDragOverCategory] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [movingCategory, setMovingCategory] = useState<Category | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  
  // オフライン対応
  const { isOnline } = useOffline();
  const { cards, categories, loading, error, refetch } = useOfflineCards();
  
  // カード数の集計
  const [cardCounts, setCardCounts] = useState<{ [key: string]: number }>({});

  // カテゴリーの階層構造処理
  const [hierarchicalCategories, setHierarchicalCategories] = useState<Category[]>([]);

  // モバイル検出
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // カード数を集計
    const counts: { [key: string]: number } = {};
    cards.forEach((card) => {
      if (card.category_id) {
        counts[card.category_id] = (counts[card.category_id] || 0) + 1;
      }
    });
    setCardCounts(counts);

    // カテゴリーの階層構造を構築
    if (categories.length > 0) {
      const categoriesMap = new Map<string, Category>();
      const rootCategories: Category[] = [];

      // まず全カテゴリをマップに追加
      categories.forEach(cat => {
        categoriesMap.set(cat.id, { ...cat, children: [] });
      });

      // 親子関係を構築
      categories.forEach(cat => {
        const category = categoriesMap.get(cat.id)!;
        if (cat.parent_id) {
          const parent = categoriesMap.get(cat.parent_id);
          if (parent) {
            parent.children = parent.children || [];
            parent.children.push(category);
          }
        } else {
          rootCategories.push(category);
        }
      });

      setHierarchicalCategories(rootCategories);
    }
  }, [cards, categories]);

  const deleteCategory = async (id: string) => {
    if (!confirm('このカテゴリを削除しますか？子カテゴリも削除されます。')) return;

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setSelectedCategory(null);
      refetch();
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('カテゴリの削除に失敗しました');
    }
  };

  const handleCategoryClick = (category: Category) => {
    setSelectedCategory(category);
  };

  const handleEditCategory = (category: Category) => {
    router.push(`/categories/${category.id}/edit`);
  };

  const getTotalCardCount = (category: Category): number => {
    let total = cardCounts[category.id] || 0;
    
    if (category.children) {
      category.children.forEach(child => {
        total += getTotalCardCount(child);
      });
    }
    
    return total;
  };

  const getCategoryDepth = (category: Category): number => {
    if (!category.children || category.children.length === 0) {
      return 0;
    }
    return 1 + Math.max(...category.children.map(child => getCategoryDepth(child)));
  };

  const getCategoryStats = () => {
    const flattenCategories = (cats: Category[]): Category[] => {
      let result: Category[] = [];
      cats.forEach(cat => {
        result.push(cat);
        if (cat.children) {
          result = result.concat(flattenCategories(cat.children));
        }
      });
      return result;
    };

    const allCategories = flattenCategories(hierarchicalCategories);
    const totalCategories = allCategories.length;
    const maxDepth = hierarchicalCategories.length > 0 ? Math.max(...hierarchicalCategories.map(cat => getCategoryDepth(cat) + 1)) : 0;
    const totalCards = Object.values(cardCounts).reduce((sum, count) => sum + count, 0);

    return { totalCategories, maxDepth, totalCards };
  };

  const stats = getCategoryStats();

  const handleDragStart = (e: React.DragEvent, category: Category) => {
    setDraggedCategory(category);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, categoryId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCategory(categoryId);
  };

  const handleDragLeave = () => {
    setDragOverCategory(null);
  };

  // モバイル用の移動処理
  const handleMobileMove = async (targetCategoryId: string | null) => {
    if (!movingCategory || movingCategory.id === targetCategoryId) return;

    // 循環参照チェック
    if (targetCategoryId) {
      const isDescendant = (catId: string, parentId: string): boolean => {
        const findChildren = (id: string): string[] => {
          const children: string[] = [];
          const addChildren = (parentId: string) => {
            categories.forEach(cat => {
              if (cat.parent_id === parentId) {
                children.push(cat.id);
                if (cat.children) {
                  cat.children.forEach(child => addChildren(child.id));
                }
              }
            });
          };
          addChildren(id);
          return children;
        };
        
        const descendants = findChildren(catId);
        return descendants.includes(parentId);
      };

      if (isDescendant(movingCategory.id, targetCategoryId)) {
        alert('子カテゴリを親カテゴリに移動することはできません');
        return;
      }
    }

    try {
      const { error } = await supabase
        .from('categories')
        .update({ parent_id: targetCategoryId })
        .eq('id', movingCategory.id);

      if (error) throw error;
      
      setMovingCategory(null);
      refetch();
    } catch (error) {
      console.error('Error updating category:', error);
      alert('カテゴリの移動に失敗しました');
    }
  };

  const handleDrop = async (e: React.DragEvent, targetCategoryId: string | null) => {
    e.preventDefault();
    setDragOverCategory(null);

    if (!draggedCategory || draggedCategory.id === targetCategoryId) return;

    // 循環参照チェック
    if (targetCategoryId) {
      const isDescendant = (catId: string, parentId: string): boolean => {
        const findChildren = (id: string): string[] => {
          const children: string[] = [];
          const addChildren = (parentId: string) => {
            categories.forEach(cat => {
              if (cat.parent_id === parentId) {
                children.push(cat.id);
                if (cat.children) {
                  cat.children.forEach(child => addChildren(child.id));
                }
              }
            });
          };
          addChildren(id);
          return children;
        };
        
        const descendants = findChildren(catId);
        return descendants.includes(parentId);
      };

      if (isDescendant(draggedCategory.id, targetCategoryId)) {
        alert('子カテゴリを親カテゴリに移動することはできません');
        return;
      }
    }

    try {
      const { error } = await supabase
        .from('categories')
        .update({ parent_id: targetCategoryId })
        .eq('id', draggedCategory.id);

      if (error) throw error;
      
      refetch();
    } catch (error) {
      console.error('Error updating category:', error);
      alert('カテゴリの移動に失敗しました');
    }
  };

  const renderCategoryTree = (categories: Category[], level = 0) => {
    return categories.map(category => (
      <div key={category.id} className="animate-fadeIn">
        {/* カテゴリカード */}
        <div 
          className={`group bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden ${
            dragOverCategory === category.id ? 'ring-2 ring-purple-500' : ''
          } ${movingCategory?.id === category.id ? 'ring-2 ring-indigo-500 scale-[1.02]' : ''} ${
            editMode && !isMobile ? 'cursor-move' : ''
          }`}
          style={{ marginLeft: `${level * (isMobile ? 16 : 24)}px` }}
          draggable={editMode && !isMobile}
          onDragStart={editMode && !isMobile ? (e) => handleDragStart(e, category) : undefined}
          onDragOver={editMode && !isMobile ? (e) => handleDragOver(e, category.id) : undefined}
          onDragLeave={editMode && !isMobile ? handleDragLeave : undefined}
          onDrop={editMode && !isMobile ? (e) => handleDrop(e, category.id) : undefined}
        >
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3 flex-1">
                {editMode && isMobile && (
                  <button
                    onClick={() => {
                      if (movingCategory?.id === category.id) {
                        setMovingCategory(null);
                      } else {
                        setMovingCategory(category);
                      }
                    }}
                    className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                      movingCategory?.id === category.id
                        ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                  </button>
                )}
                {editMode && !isMobile && (
                  <div className="flex items-center text-gray-400 dark:text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                    </svg>
                  </div>
                )}
                {level > 0 && !editMode && (
                  <div className="flex items-center text-gray-400 dark:text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                </div>
                <div 
                  className={`flex-1 ${!editMode ? 'cursor-pointer' : ''}`}
                  onClick={!editMode ? () => handleCategoryClick(category) : undefined}
                >
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    {category.name}
                  </h3>
                  <div className="flex items-center gap-4 mt-1">
                    {category.children && category.children.length > 0 && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {category.children.length} 個のサブカテゴリ
                      </p>
                    )}
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {getTotalCardCount(category)} 枚のカード
                    </p>
                  </div>
                </div>
              </div>
              
              {/* モバイル時の移動先ボタン */}
              {editMode && isMobile && movingCategory && movingCategory.id !== category.id && (
                <button
                  onClick={() => handleMobileMove(category.id)}
                  className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg mr-2"
                  title="ここに移動"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  </svg>
                </button>
              )}
              
              <div className="flex items-center gap-2">
                <Link
                  href={`/categories/${category.id}/edit`}
                  className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  title="編集"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </Link>
                <button
                  onClick={() => deleteCategory(category.id)}
                  className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                  title="削除"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* 子カテゴリ */}
        {category.children && category.children.length > 0 && (
          <div className="mt-4 space-y-4">
            {renderCategoryTree(category.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <MainNavBar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ページヘッダー */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">カテゴリ管理</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm sm:text-base">カードを整理してより効率的に学習しましょう</p>
          </div>
          <Link
            href="/categories/new"
            className="px-3 py-2 sm:px-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all flex items-center gap-2 text-sm sm:text-base"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">新規カテゴリ</span>
            <span className="sm:hidden">新規作成</span>
          </Link>
        </div>

        {/* 統計情報 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 sm:p-6">
            <div className="flex items-center justify-between sm:block">
              <div className="flex items-center gap-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                </div>
                <div className="sm:hidden">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">カテゴリ数</h3>
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.totalCategories}</p>
            </div>
            <div className="hidden sm:block">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">総カテゴリ数</h3>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 sm:p-6">
            <div className="flex items-center justify-between sm:block">
              <div className="flex items-center gap-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </div>
                <div className="sm:hidden">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">階層深度</h3>
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-indigo-600 dark:text-indigo-400">{stats.maxDepth}</p>
            </div>
            <div className="hidden sm:block">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">最大階層深度</h3>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 sm:p-6">
            <div className="flex items-center justify-between sm:block">
              <div className="flex items-center gap-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div className="sm:hidden">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">カード数</h3>
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-pink-600 dark:text-pink-400">{stats.totalCards}</p>
            </div>
            <div className="hidden sm:block">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">総カード数</h3>
            </div>
          </div>
        </div>

        {/* 編集モード切替 */}
        <div className="mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                </div>
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">カテゴリ管理</h2>
              </div>
              <button
                onClick={() => setEditMode(!editMode)}
                className={`px-3 py-2 sm:px-4 rounded-lg font-medium text-xs sm:text-sm transition-all ${
                  editMode
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {editMode ? '完了' : '編集'}
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm mt-3">
              {editMode 
                ? isMobile 
                  ? '移動ボタンをタップして移動元を選択し、移動先をタップしてください。'
                  : 'カテゴリをドラッグ&ドロップして階層を変更できます。'
                : 'カテゴリをクリックすると詳細が表示されます。'
              }
            </p>
            {editMode && isMobile && movingCategory && (
              <div className="mt-3 p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                <p className="text-xs text-indigo-600 dark:text-indigo-400">
                  移動中: <span className="font-medium">{movingCategory.name}</span>
                </p>
              </div>
            )}
          </div>
        </div>

        {error ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-red-200 to-red-300 dark:from-red-800 dark:to-red-700 rounded-2xl flex items-center justify-center">
              <svg className="w-12 h-12 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-xl font-semibold text-gray-900 dark:text-white mb-2">データの読み込みに失敗しました</p>
            <p className="text-gray-500 dark:text-gray-400 mb-6">{error}</p>
            {!isOnline && (
              <p className="text-sm text-orange-600 dark:text-orange-400 mb-4">
                📱 オフラインモード - インターネット接続を確認してください
              </p>
            )}
          </div>
        ) : loading ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full animate-pulse mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500 dark:text-gray-400">読み込み中...</p>
          </div>
        ) : hierarchicalCategories.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-2xl flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <p className="text-xl font-semibold text-gray-900 dark:text-white mb-2">カテゴリがまだありません</p>
            <p className="text-gray-500 dark:text-gray-400 mb-6">最初のカテゴリを作成してカードを整理しましょう</p>
            <Link
              href="/categories/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              最初のカテゴリを作成
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 統合カテゴリビュー */}
            <div className="lg:col-span-2">
              {/* ルートレベルドロップゾーン（編集モード時のみ表示） */}
              {editMode && (
                <div>
                  {isMobile && movingCategory && (
                    <button
                      onClick={() => handleMobileMove(null)}
                      className="w-full border-2 border-dashed border-purple-500 bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 mb-4 transition-colors"
                    >
                      <p className="text-center text-sm text-purple-600 dark:text-purple-400 font-medium">
                        タップしてルートカテゴリに移動
                      </p>
                    </button>
                  )}
                  {!isMobile && (
                    <div 
                      className={`border-2 border-dashed rounded-xl p-4 mb-4 transition-colors ${
                        dragOverCategory === 'root' ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOverCategory('root');
                      }}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, null)}
                    >
                      <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                        ここにドロップしてルートカテゴリにする
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              <div className="space-y-4">
                {renderCategoryTree(hierarchicalCategories)}
              </div>
            </div>

            {/* カテゴリ詳細サイドバー */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                {selectedCategory ? (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">カテゴリ詳細</h3>
                      <button
                        onClick={() => setSelectedCategory(null)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                          </svg>
                        </div>
                        <h4 className="text-xl font-bold text-gray-900 dark:text-white">{selectedCategory.name}</h4>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                          <p className="text-sm text-gray-600 dark:text-gray-400">直接のカード数</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {cardCounts[selectedCategory.id] || 0}
                          </p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                          <p className="text-sm text-gray-600 dark:text-gray-400">総カード数</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {getTotalCardCount(selectedCategory)}
                          </p>
                        </div>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                        <p className="text-sm text-gray-600 dark:text-gray-400">子カテゴリ数</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {selectedCategory.children?.length || 0}
                        </p>
                      </div>

                      <div className="pt-4 space-y-2">
                        <Link
                          href={`/cards?category=${selectedCategory.id}`}
                          className="w-full block px-4 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors text-center text-sm font-medium"
                        >
                          カードを表示
                        </Link>
                        <button
                          onClick={() => handleEditCategory(selectedCategory)}
                          className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                        >
                          編集
                        </button>
                        <button
                          onClick={() => deleteCategory(selectedCategory.id)}
                          className="w-full px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-sm font-medium"
                        >
                          削除
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-2xl flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                      </svg>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400">
                      カテゴリを選択すると<br />詳細が表示されます
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}