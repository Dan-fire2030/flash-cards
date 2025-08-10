'use client'

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import MobileNav from './MobileNav';
import { useAuth } from '@/contexts/AuthContext';

export default function MainNavBar() {
  const pathname = usePathname();
  const { user, signOut, loading } = useAuth();

  const navItems = [
    { href: '/categories', label: 'カテゴリ' },
    { href: '/cards', label: 'カード一覧' },
    { href: '/stats', label: '統計' },
  ];

  return (
    <nav className="glass-card sticky top-0 z-50 border-b border-white/20 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-18">
          <div className="flex items-center gap-6">
            <Link 
              href="/" 
              className="group flex items-center gap-3 text-2xl font-bold text-gradient-purple hover:scale-105 transition-all duration-300"
            >
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
                FlashCards
              </span>
            </Link>
            
            {/* ユーザー情報（デスクトップのみ） */}
            {!loading && (
              <div className="hidden lg:flex items-center gap-3 pl-6 border-l border-gray-300 dark:border-gray-600">
                {user ? (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {user.email?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">ログイン中</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{user.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={signOut}
                      className="ml-2 px-3 py-1.5 text-xs bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-500/20 transition-colors duration-200 font-medium"
                    >
                      ログアウト
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-sm text-gray-500 dark:text-gray-400">ゲスト</span>
                    <Link
                      href="/login"
                      className="px-3 py-1.5 text-xs bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-500/20 transition-colors duration-200 font-medium"
                    >
                      ログイン
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
          
          <div className="hidden md:flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-2xl p-2 border border-white/20">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-300 ${
                  pathname === item.href
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-white/20 hover:text-purple-600 dark:hover:text-purple-400'
                }`}
              >
                <span className="text-sm">
                  {item.label}
                </span>
              </Link>
            ))}
            <div className="w-px h-8 bg-white/20 mx-2"></div>
            <Link 
              href="/study" 
              className="button-primary px-6 py-2.5 rounded-xl text-white font-semibold text-sm flex items-center gap-2 animate-glow"
            >
              学習開始
            </Link>
          </div>
          
          <MobileNav />
        </div>
      </div>
    </nav>
  );
}