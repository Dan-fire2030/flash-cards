'use client'

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import PWAInstaller from "@/components/PWAInstaller";
import MainNavBar from "@/components/MainNavBar";
import HeatMap from "@/components/HeatMap";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const { user, signOut, loading } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [stats, setStats] = useState({
    totalCards: 0,
    todayCards: 0,
    weekCards: 0,
    monthCards: 0
  });

  useEffect(() => {
    loadStats();
    
    // ページがフォーカスされた時に統計を再読み込み
    const handleFocus = () => {
      loadStats();
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // ページが表示される度に統計を更新
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadStats();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const loadStats = async () => {
    try {
      if (typeof window === 'undefined') return;
      
      const today = new Date();
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const [cardsResult, todayResult, weekResult, monthResult] = await Promise.all([
        supabase.from('flashcards').select('*', { count: 'exact', head: true }),
        supabase.from('study_sessions')
          .select('cards_studied')
          .eq('date', today.toISOString().split('T')[0]),
        supabase.from('study_sessions')
          .select('cards_studied')
          .gte('date', weekAgo.toISOString().split('T')[0]),
        supabase.from('study_sessions')
          .select('cards_studied')
          .gte('date', monthAgo.toISOString().split('T')[0])
      ]);

      const todayTotal = todayResult.data?.reduce((sum, s) => sum + s.cards_studied, 0) || 0;
      const weekTotal = weekResult.data?.reduce((sum, s) => sum + s.cards_studied, 0) || 0;
      const monthTotal = monthResult.data?.reduce((sum, s) => sum + s.cards_studied, 0) || 0;

      setStats({
        totalCards: cardsResult.count || 0,
        todayCards: todayTotal,
        weekCards: weekTotal,
        monthCards: monthTotal
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  // ローディング中の表示
  if (loading) {
    return (
      <div className="min-h-screen gradient-mesh bg-gradient-to-br from-slate-50 via-purple-50 to-cyan-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-mesh bg-gradient-to-br from-slate-50 via-purple-50 to-cyan-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-800">
      <MainNavBar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="glass-card rounded-3xl shadow-2xl overflow-hidden border border-white/20 p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">学習アクティビティ</h1>
            <p className="text-gray-600 dark:text-gray-300">毎日の学習記録を可視化</p>
          </div>

          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                {currentDate.getFullYear()}年{currentDate.getMonth() + 1}月の学習記録
              </h2>
              <div className="flex flex-col sm:flex-row gap-2">
                {/* 今月ボタン - モバイルでは上に配置 */}
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 active:bg-blue-500 active:text-white transition-colors text-sm font-medium order-1 sm:order-2"
                >
                  今月
                </button>
                {/* 前月・次月ボタン */}
                <div className="flex gap-2 order-2 sm:order-1">
                  <button
                    onClick={() => {
                      const newDate = new Date(currentDate);
                      newDate.setMonth(newDate.getMonth() - 1);
                      setCurrentDate(newDate);
                    }}
                    className="px-3 py-2 sm:px-4 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center gap-1 flex-1 sm:flex-none justify-center"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="text-sm">前月</span>
                  </button>
                  <button
                    onClick={() => {
                      const newDate = new Date(currentDate);
                      newDate.setMonth(newDate.getMonth() + 1);
                      setCurrentDate(newDate);
                    }}
                    disabled={
                      currentDate.getFullYear() > new Date().getFullYear() ||
                      (currentDate.getFullYear() === new Date().getFullYear() && 
                       currentDate.getMonth() >= new Date().getMonth())
                    }
                    className="px-3 py-2 sm:px-4 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 flex-1 sm:flex-none justify-center"
                  >
                    <span className="text-sm">次月</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            
            <HeatMap year={currentDate.getFullYear()} month={currentDate.getMonth() + 1} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="glass rounded-2xl p-6 border border-white/10">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">総カード数</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalCards}</p>
                </div>
              </div>
            </div>

            <div className="glass rounded-2xl p-6 border border-white/10">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">今日の学習</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.todayCards}</p>
                </div>
              </div>
            </div>

            <div className="glass rounded-2xl p-6 border border-white/10">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">今週の学習</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.weekCards}</p>
                </div>
              </div>
            </div>

            <div className="glass rounded-2xl p-6 border border-white/10">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">今月の学習</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.monthCards}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <PWAInstaller />
    </div>
  );
}