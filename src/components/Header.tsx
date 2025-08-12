'use client'

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

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
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOut();
    } catch (error) {
      console.error('ログアウトエラー:', error);
    } finally {
      setLoading(false);
    }
  };

  // タイトルもアクションボタンもない場合は何も表示しない
  if (!title && !showBackButton && !actionButton && !user) {
    return null;
  }

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex justify-between items-center h-12 sm:h-14">
          <div className="flex items-center">
            {showBackButton && (
              <button 
                onClick={() => router.back()} 
                className="flex items-center gap-1 sm:gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors mr-2 sm:mr-4"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="text-sm sm:text-base">戻る</span>
              </button>
            )}
            {title && <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">{title}</h1>}
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            {actionButton && (
              <Link
                href={actionButton.href}
                className={actionButton.className || "px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all text-sm sm:text-base"}
              >
                {actionButton.text}
              </Link>
            )}
            {user && (
              <div className="flex items-center gap-1 sm:gap-3">
                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hidden md:inline">
                  {user.email}
                </span>
                <button
                  onClick={handleSignOut}
                  disabled={loading}
                  className="px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? 'ログアウト中...' : 'ログアウト'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}