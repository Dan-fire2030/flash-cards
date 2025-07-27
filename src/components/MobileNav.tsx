'use client'

import { useState } from 'react';
import Link from 'next/link';

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden relative">
      {/* ハンバーガーメニューボタン */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg text-gray-600 hover:bg-gray-100/50 dark:text-gray-300 dark:hover:bg-gray-800/50 transition-all"
        aria-label="メニューを開く"
      >
        <svg
          className="h-6 w-6"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {isOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {/* モバイルメニュー */}
      {isOpen && (
        <>
          {/* オーバーレイ */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={() => setIsOpen(false)}
          />
          {/* メニュー */}
          <div className="absolute top-full right-0 mt-3 w-64 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl z-50 overflow-hidden animate-slideIn border border-gray-200 dark:border-gray-700">
            <nav className="py-3">
              <Link
                href="/"
                onClick={() => setIsOpen(false)}
                className="block mx-3 mb-2 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-2xl transition-all duration-300 group"
              >
                <span className="font-semibold text-lg">ホーム</span>
              </Link>
              <Link
                href="/categories"
                onClick={() => setIsOpen(false)}
                className="block mx-3 mb-2 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-2xl transition-all duration-300 group"
              >
                <span className="font-semibold text-lg">カテゴリ</span>
              </Link>
              <Link
                href="/cards"
                onClick={() => setIsOpen(false)}
                className="block mx-3 mb-2 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-2xl transition-all duration-300 group"
              >
                <span className="font-semibold text-lg">カード一覧</span>
              </Link>
              <Link
                href="/stats"
                onClick={() => setIsOpen(false)}
                className="block mx-3 mb-2 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-2xl transition-all duration-300 group"
              >
                <span className="font-semibold text-lg">統計</span>
              </Link>
              <div className="px-6 py-4 mt-2 border-t border-gray-200 dark:border-gray-700">
                <Link
                  href="/study"
                  onClick={() => setIsOpen(false)}
                  className="block px-6 py-4 rounded-2xl button-primary text-white font-bold text-center shadow-xl group"
                >
                  学習開始
                </Link>
              </div>
            </nav>
          </div>
        </>
      )}
    </div>
  );
}