'use client'

import { useState } from 'react';
import { Category } from '@/types';

interface CategoryTreeProps {
  categories: Category[];
  onCategoryClick?: (category: Category) => void;
  showCardCount?: boolean;
}

interface CategoryTreeNodeProps {
  category: Category;
  level: number;
  isLast: boolean;
  parentLines: boolean[];
  onCategoryClick?: (category: Category) => void;
  showCardCount?: boolean;
}

function CategoryTreeNode({ 
  category, 
  level, 
  isLast, 
  parentLines, 
  onCategoryClick,
  showCardCount = false 
}: CategoryTreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = category.children && category.children.length > 0;

  const handleToggle = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleCategoryClick = () => {
    if (onCategoryClick) {
      onCategoryClick(category);
    }
  };

  return (
    <div className="select-none">
      {/* 現在のカテゴリ */}
      <div className="flex items-center py-2">
        {/* インデントライン */}
        <div className="flex">
          {parentLines.map((showLine, index) => (
            <div key={index} className="w-6 flex justify-center">
              {showLine && (
                <div className="w-px bg-gray-300 dark:bg-gray-600 h-full"></div>
              )}
            </div>
          ))}
          
          {level > 0 && (
            <div className="w-6 flex items-center justify-center relative">
              {/* 横線 */}
              <div className="absolute w-3 h-px bg-gray-300 dark:bg-gray-600 left-0 top-1/2"></div>
              {/* 縦線（最後の要素でなければ） */}
              {!isLast && (
                <div className="absolute w-px bg-gray-300 dark:bg-gray-600 h-full left-0"></div>
              )}
            </div>
          )}
        </div>

        {/* 展開/折りたたみボタン */}
        <div className="w-6 flex items-center justify-center">
          {hasChildren && (
            <button
              onClick={handleToggle}
              className="w-4 h-4 flex items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <svg
                className={`w-3 h-3 text-gray-500 dark:text-gray-400 transition-transform ${
                  isExpanded ? 'rotate-90' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>

        {/* カテゴリアイコンと名前 */}
        <div 
          className="flex items-center gap-2 flex-1 px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors group"
          onClick={handleCategoryClick}
        >
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
            level === 0 
              ? 'bg-gradient-to-br from-indigo-500 to-purple-500' 
              : level === 1
              ? 'bg-gradient-to-br from-purple-500 to-pink-500'
              : 'bg-gradient-to-br from-pink-500 to-red-500'
          }`}>
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>
          <span className="font-medium text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {category.name}
          </span>
          {showCardCount && (
            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
              {/* TODO: カード数を表示する場合は、カテゴリデータにカード数を含める必要があります */}
              0 cards
            </span>
          )}
        </div>
      </div>

      {/* 子カテゴリ */}
      {hasChildren && isExpanded && (
        <div>
          {category.children!.map((child, index) => (
            <CategoryTreeNode
              key={child.id}
              category={child}
              level={level + 1}
              isLast={index === category.children!.length - 1}
              parentLines={[...parentLines, !isLast]}
              onCategoryClick={onCategoryClick}
              showCardCount={showCardCount}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CategoryTree({ categories, onCategoryClick, showCardCount = false }: CategoryTreeProps) {
  // ルートカテゴリ（parent_id が null のもの）を取得
  const rootCategories = categories.filter(cat => !cat.parent_id);

  if (rootCategories.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-2xl flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        </div>
        <p className="text-gray-500 dark:text-gray-400">カテゴリがまだありません</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <div className="font-mono text-sm">
        {rootCategories.map((rootCategory, index) => (
          <CategoryTreeNode
            key={rootCategory.id}
            category={rootCategory}
            level={0}
            isLast={index === rootCategories.length - 1}
            parentLines={[]}
            onCategoryClick={onCategoryClick}
            showCardCount={showCardCount}
          />
        ))}
      </div>
    </div>
  );
}