'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import MainNavBar from '@/components/MainNavBar';
import SubHeader from '@/components/Header';
import { useNotifications } from '@/hooks/useNotifications';

const DAYS_OF_WEEK = [
  { key: 'monday', label: '月' },
  { key: 'tuesday', label: '火' },
  { key: 'wednesday', label: '水' },
  { key: 'thursday', label: '木' },
  { key: 'friday', label: '金' },
  { key: 'saturday', label: '土' },
  { key: 'sunday', label: '日' },
];

export default function NotificationSettingsPage() {
  const router = useRouter();
  const {
    settings,
    loading,
    permissionStatus,
    fcmToken,
    requestPermission,
    saveSettings,
  } = useNotifications();

  const [saving, setSaving] = useState(false);
  const [newReminderTime, setNewReminderTime] = useState('');

  const handlePermissionRequest = async () => {
    const success = await requestPermission();
    if (success) {
      alert('通知許可が有効になりました！');
    } else {
      alert('通知許可が拒否されました。ブラウザの設定から手動で許可してください。');
    }
  };


  const handleToggle = async (key: keyof typeof settings) => {
    setSaving(true);
    const success = await saveSettings({ [key]: !settings[key] });
    if (!success) {
      alert('設定の保存に失敗しました。');
    }
    setSaving(false);
  };

  const handleNumberChange = async (key: keyof typeof settings, value: number) => {
    // バリデーション
    if (isNaN(value) || value < 0) return;
    
    setSaving(true);
    const success = await saveSettings({ [key]: value });
    if (!success) {
      alert('設定の保存に失敗しました。');
    }
    setSaving(false);
  };

  const addReminderTime = async () => {
    if (!newReminderTime) return;
    
    // 重複チェック
    if (settings.study_reminder_times.includes(newReminderTime)) {
      alert('この時間は既に設定されています。');
      return;
    }
    
    const updatedTimes = [...settings.study_reminder_times, newReminderTime].sort();
    setSaving(true);
    const success = await saveSettings({ study_reminder_times: updatedTimes });
    if (success) {
      setNewReminderTime('');
    } else {
      alert('時間の追加に失敗しました。');
    }
    setSaving(false);
  };

  const removeReminderTime = async (timeToRemove: string) => {
    const updatedTimes = settings.study_reminder_times.filter(time => time !== timeToRemove);
    setSaving(true);
    const success = await saveSettings({ study_reminder_times: updatedTimes });
    if (!success) {
      alert('時間の削除に失敗しました。');
    }
    setSaving(false);
  };

  const toggleDay = async (day: string) => {
    const updatedDays = settings.study_reminder_days.includes(day)
      ? settings.study_reminder_days.filter(d => d !== day)
      : [...settings.study_reminder_days, day];
    
    setSaving(true);
    const success = await saveSettings({ study_reminder_days: updatedDays });
    if (!success) {
      alert('曜日の設定に失敗しました。');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <MainNavBar />
        <SubHeader title="通知設定" showBackButton={true} />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <MainNavBar />
      <SubHeader title="通知設定" showBackButton={true} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          
          {/* 通知許可状態 */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4">通知許可設定</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">通知許可状態</p>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    {permissionStatus === 'granted' ? '許可済み' : 
                     permissionStatus === 'denied' ? '拒否' : '未設定'}
                  </p>
                </div>
                {permissionStatus !== 'granted' && (
                  <button
                    onClick={handlePermissionRequest}
                    className="px-3 py-1.5 sm:px-4 sm:py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm sm:text-base"
                  >
                    通知を許可
                  </button>
                )}
              </div>

              {fcmToken && permissionStatus === 'granted' && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">接続状態</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">通知サービスに接続済み</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-600 dark:text-green-400 font-medium">オンライン</span>
                  </div>
                </div>
              )}
            </div>
          </div>


          {/* 学習リマインダー設定 */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4">学習リマインダー</h2>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">学習リマインダーを有効にする</p>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">設定した時間に学習を促す通知を送信</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.study_reminders_enabled}
                    onChange={() => handleToggle('study_reminders_enabled')}
                    disabled={saving}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {settings.study_reminders_enabled && (
                <>
                  {/* 通知時間設定 */}
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white mb-3">通知時間</p>
                    <div className="space-y-3">
                      {settings.study_reminder_times.map((time, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <span className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">{time}</span>
                          <button
                            onClick={() => removeReminderTime(time)}
                            className="text-red-600 hover:text-red-700"
                            disabled={saving}
                          >
                            削除
                          </button>
                        </div>
                      ))}
                      
                      <div className="flex items-center gap-3">
                        <input
                          type="time"
                          value={newReminderTime}
                          onChange={(e) => setNewReminderTime(e.target.value)}
                          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                        />
                        <button
                          onClick={addReminderTime}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                          disabled={!newReminderTime || saving}
                        >
                          追加
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 曜日設定 */}
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white mb-3">通知する曜日</p>
                    <div className="flex flex-wrap gap-2">
                      {DAYS_OF_WEEK.map((day) => (
                        <button
                          key={day.key}
                          onClick={() => toggleDay(day.key)}
                          disabled={saving}
                          className={`px-4 py-2 rounded-lg transition-colors ${
                            settings.study_reminder_days.includes(day.key)
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
                          }`}
                        >
                          {day.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 目標設定通知 */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4">目標達成通知</h2>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">目標達成通知を有効にする</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">学習目標を達成した際に通知を送信</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.goal_notifications_enabled}
                    onChange={() => handleToggle('goal_notifications_enabled')}
                    disabled={saving}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {settings.goal_notifications_enabled && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                      1日の目標カード数
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={settings.daily_goal_cards}
                      onChange={(e) => handleNumberChange('daily_goal_cards', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                      disabled={saving}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                      週間目標学習日数
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="7"
                      value={settings.weekly_goal_days}
                      onChange={(e) => handleNumberChange('weekly_goal_days', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                      disabled={saving}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                      目標正答率 (%)
                    </label>
                    <input
                      type="number"
                      min="50"
                      max="100"
                      value={settings.accuracy_goal_percentage}
                      onChange={(e) => handleNumberChange('accuracy_goal_percentage', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                      disabled={saving}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* その他の通知設定 */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4">その他の通知</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">達成バッジ通知</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">新しいバッジを獲得した際の通知</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.achievement_notifications_enabled}
                    onChange={() => handleToggle('achievement_notifications_enabled')}
                    disabled={saving}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">連続学習記録通知</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">連続学習日数の記録更新通知</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.streak_notifications_enabled}
                    onChange={() => handleToggle('streak_notifications_enabled')}
                    disabled={saving}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">週間サマリー通知</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">毎週の学習成果まとめ通知</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.weekly_summary_enabled}
                    onChange={() => handleToggle('weekly_summary_enabled')}
                    disabled={saving}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}