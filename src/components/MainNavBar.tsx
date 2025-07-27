'use client'

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import MobileNav from './MobileNav';

export default function MainNavBar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/categories', label: 'カテゴリ' },
    { href: '/cards', label: 'カード一覧' },
    { href: '/stats', label: '統計' },
  ];

  return (
    <nav className="glass-card sticky top-0 z-50 border-b border-white/20 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-18">
          <Link 
            href="/" 
            className="group flex items-center gap-3 text-2xl font-bold text-gradient-purple hover:scale-105 transition-all duration-300"
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
              FlashCards
            </span>
          </Link>
          
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