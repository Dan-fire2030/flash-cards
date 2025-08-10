'use client'

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Category, Flashcard } from "@/types";
import PWAInstaller from "@/components/PWAInstaller";
import MainNavBar from "@/components/MainNavBar";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const { user, signOut } = useAuth();
  const [stats, setStats] = useState({
    totalCards: 0,
    totalCategories: 0,
    recentCards: [] as Flashcard[]
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Only run on client side
      if (typeof window === 'undefined') return;
      
      const [cardsResult, categoriesResult, recentResult] = await Promise.all([
        supabase.from('flashcards').select('*', { count: 'exact', head: true }),
        supabase.from('categories').select('*', { count: 'exact', head: true }),
        supabase.from('flashcards').select('*').order('created_at', { ascending: false }).limit(5)
      ]);

      setStats({
        totalCards: cardsResult.count || 0,
        totalCategories: categoriesResult.count || 0,
        recentCards: recentResult.data || []
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  return (
    <div className="min-h-screen gradient-mesh bg-gradient-to-br from-slate-50 via-purple-50 to-cyan-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-800">
      <MainNavBar />

      {/* ヒーローセクション */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
          <div className="absolute top-20 right-10 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{animationDelay: '2s'}}></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{animationDelay: '4s'}}></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* ユーザー情報セクション */}
          {user && (
            <div className="mb-8 glass-card rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 animate-slideDown">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">ログイン中</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{user.email}</p>
                </div>
              </div>
              <button
                onClick={signOut}
                className="px-4 py-2 bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-500/20 transition-colors duration-200 font-medium"
              >
                ログアウト
              </button>
            </div>
          )}
          
          <div className="text-center animate-slideUp">
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link 
                href="/cards/new" 
                className="group button-primary px-10 py-4 rounded-2xl text-white font-bold text-lg flex items-center gap-3 shadow-2xl"
              >
                カードを作成
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link 
                href="/study" 
                className="group px-10 py-4 rounded-2xl bg-white/80 backdrop-blur-sm border-2 border-purple-200 text-purple-700 dark:bg-gray-800/80 dark:border-purple-700 dark:text-purple-300 font-bold text-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-300 flex items-center gap-3 card-hover"
              >
                学習を開始
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* 統計情報 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500 via-purple-500 to-purple-600 p-8 text-white shadow-2xl card-hover neon-border">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-3 h-3 bg-blue-300 rounded-full animate-pulse"></div>
                <h3 className="text-lg font-semibold opacity-90">総カード数</h3>
              </div>
              <p className="text-5xl font-bold mb-2">{stats.totalCards}</p>
              <p className="text-sm opacity-75">学習可能なカード</p>
            </div>
          </div>
          <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 p-8 text-white shadow-2xl card-hover neon-border">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-3 h-3 bg-pink-300 rounded-full animate-pulse"></div>
                <h3 className="text-lg font-semibold opacity-90">カテゴリ数</h3>
              </div>
              <p className="text-5xl font-bold mb-2">{stats.totalCategories}</p>
              <p className="text-sm opacity-75">整理されたグループ</p>
            </div>
          </div>
          <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-8 text-white shadow-2xl card-hover neon-border">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-3 h-3 bg-emerald-300 rounded-full animate-pulse"></div>
                <h3 className="text-lg font-semibold opacity-90">今日の学習</h3>
              </div>
              <p className="text-5xl font-bold mb-2">0</p>
              <p className="text-sm opacity-75">学習セッション</p>
            </div>
          </div>
        </div>

        {/* クイックアクション */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <Link href="/cards/new" className="group glass-card rounded-3xl p-10 card-hover border-2 border-white/20 relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-indigo-500/30 to-purple-500/30 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-xl">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                新しいカードを作成
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-lg">
                学習したい単語と説明を追加して、知識を蓄積しましょう
              </p>
              <div className="mt-4 flex items-center text-indigo-600 dark:text-indigo-400 font-medium">
                <span>今すぐ作成</span>
                <svg className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
          <Link href="/categories/new" className="group glass-card rounded-3xl p-10 card-hover border-2 border-white/20 relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-xl">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                カテゴリを作成
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-lg">
                カードを整理するためのカテゴリを作成して、効率的に管理
              </p>
              <div className="mt-4 flex items-center text-purple-600 dark:text-purple-400 font-medium">
                <span>カテゴリ作成</span>
                <svg className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        </div>

        {/* 最近のカード */}
        <div className="glass-card rounded-3xl shadow-2xl overflow-hidden border border-white/20">
          <div className="px-8 py-6 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-cyan-500/10 border-b border-white/10">
            <div className="flex items-center gap-3">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">最近追加したカード</h3>
            </div>
          </div>
          <div className="p-8">
            {stats.recentCards.length > 0 ? (
              <ul className="space-y-4">
                {stats.recentCards.map((card, index) => (
                  <li key={card.id} className="group glass rounded-2xl p-6 card-hover border border-white/10 animate-slideIn" style={{animationDelay: `${index * 100}ms`}}>
                    <div className="flex flex-col md:flex-row md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                          <p className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                            {card.front_text}
                          </p>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                          {card.back_text.substring(0, 80)}...
                        </p>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 bg-green-100 dark:bg-green-900/20 px-3 py-1.5 rounded-full">
                          <span className="text-green-600 dark:text-green-400 text-lg">✓</span>
                          <span className="text-green-700 dark:text-green-300 font-semibold">{card.correct_count}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-red-100 dark:bg-red-900/20 px-3 py-1.5 rounded-full">
                          <span className="text-red-600 dark:text-red-400 text-lg">✗</span>
                          <span className="text-red-700 dark:text-red-300 font-semibold">{card.incorrect_count}</span>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-16">
                <p className="text-xl text-gray-500 dark:text-gray-400 mb-6">まだカードがありません</p>
                <Link 
                  href="/cards/new" 
                  className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold rounded-2xl hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                >
                  最初のカードを作成
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
      
      {/* PWA インストール促進 */}
      <PWAInstaller />
    </div>
  );
}