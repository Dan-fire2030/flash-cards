'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainNavBar from '@/components/MainNavBar';

export default function StudySettingsPage() {
  const router = useRouter();
  
  const [dailyGoal, setDailyGoal] = useState(10);
  const [weeklyGoal, setWeeklyGoal] = useState(5);
  const [accuracyGoal, setAccuracyGoal] = useState(80);
  const [autoNext, setAutoNext] = useState(false);
  const [showAnswer, setShowAnswer] = useState(true);
  const [cardOrder, setCardOrder] = useState('random');
  const [studyMode, setStudyMode] = useState('normal');
  const [difficultyAdjustment, setDifficultyAdjustment] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // ローカルストレージに保存
      const settings = {
        dailyGoal,
        weeklyGoal,
        accuracyGoal,
        autoNext,
        showAnswer,
        cardOrder,
        studyMode,
        difficultyAdjustment,
      };
      
      localStorage.setItem('study_settings', JSON.stringify(settings));
      alert('学習設定を保存しました');
    } catch (error) {
      console.error('Error saving study settings:', error);
      alert('学習設定の保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  // 設定を読み込み
  useEffect(() => {
    const saved = localStorage.getItem('study_settings');
    if (saved) {
      try {
        const settings = JSON.parse(saved);
        setDailyGoal(settings.dailyGoal || 10);
        setWeeklyGoal(settings.weeklyGoal || 5);
        setAccuracyGoal(settings.accuracyGoal || 80);
        setAutoNext(settings.autoNext || false);
        setShowAnswer(settings.showAnswer !== undefined ? settings.showAnswer : true);
        setCardOrder(settings.cardOrder || 'random');
        setStudyMode(settings.studyMode || 'normal');
        setDifficultyAdjustment(settings.difficultyAdjustment !== undefined ? settings.difficultyAdjustment : true);
      } catch (error) {
        console.error('Error loading study settings:', error);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <MainNavBar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ページヘッダー */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            設定に戻る
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">学習設定</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">学習目標とカスタマイズ設定を管理できます</p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* 学習目標設定 */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">学習目標</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  1日の目標カード数
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={dailyGoal}
                  onChange={(e) => setDailyGoal(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  毎日学習したいカード数を設定
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  週の目標日数
                </label>
                <input
                  type="number"
                  min="1"
                  max="7"
                  value={weeklyGoal}
                  onChange={(e) => setWeeklyGoal(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  週に何日学習するかの目標
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  目標正解率 (%)
                </label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={accuracyGoal}
                  onChange={(e) => setAccuracyGoal(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  目指したい正解率
                </p>
              </div>
            </div>
          </div>

          {/* 学習方法設定 */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">学習方法</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  学習モード
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className="flex items-center p-4 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                    <input
                      type="radio"
                      name="studyMode"
                      value="normal"
                      checked={studyMode === 'normal'}
                      onChange={(e) => setStudyMode(e.target.value)}
                      className="mr-3"
                    />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">通常モード</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">標準的な学習</div>
                    </div>
                  </label>
                  
                  <label className="flex items-center p-4 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                    <input
                      type="radio"
                      name="studyMode"
                      value="quick"
                      checked={studyMode === 'quick'}
                      onChange={(e) => setStudyMode(e.target.value)}
                      className="mr-3"
                    />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">クイックモード</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">短時間集中</div>
                    </div>
                  </label>
                  
                  <label className="flex items-center p-4 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                    <input
                      type="radio"
                      name="studyMode"
                      value="review"
                      checked={studyMode === 'review'}
                      onChange={(e) => setStudyMode(e.target.value)}
                      className="mr-3"
                    />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">復習モード</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">間違えたカードを重点的に</div>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  カードの出題順序
                </label>
                <select
                  value={cardOrder}
                  onChange={(e) => setCardOrder(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="random">ランダム</option>
                  <option value="newest">新しい順</option>
                  <option value="oldest">古い順</option>
                  <option value="difficulty">難易度順</option>
                </select>
              </div>
            </div>
          </div>

          {/* 表示設定 */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">表示設定</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">自動で次のカードへ</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">正解時に自動的に次のカードに進む</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={autoNext}
                    onChange={(e) => setAutoNext(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">答えを即座に表示</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">間違えた時に正解を即座に表示</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={showAnswer}
                    onChange={(e) => setShowAnswer(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">難易度自動調整</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">学習履歴に基づいてカードの出題頻度を調整</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={difficultyAdjustment}
                    onChange={(e) => setDifficultyAdjustment(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* 保存ボタン */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? '保存中...' : '設定を保存'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}