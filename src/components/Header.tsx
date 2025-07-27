'use client'

import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface SubHeaderProps {
  title?: string;
  showBackButton?: boolean;
  actionButton?: {
    href: string;
    text: string;
    className?: string;
  };
}

export default function SubHeader({ title, showBackButton = false, actionButton }: SubHeaderProps) {
  const router = useRouter();

  // タイトルもアクションボタンもない場合は何も表示しない
  if (!title && !showBackButton && !actionButton) {
    return null;
  }

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          <div className="flex items-center">
            {showBackButton && (
              <button 
                onClick={() => router.back()} 
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors mr-4"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>戻る</span>
              </button>
            )}
            {title && <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h1>}
          </div>
          
          {actionButton && (
            <Link
              href={actionButton.href}
              className={actionButton.className || "px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all"}
            >
              {actionButton.text}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}