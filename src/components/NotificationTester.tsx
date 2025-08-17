'use client';

import { useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';

export default function NotificationTester() {
  const {
    permissionStatus,
    fcmToken,
    requestPermission,
    sendTestNotification,
    sendStudyReminder,
    sendGoalNotification,
    sendCustomNotification,
    getNotificationHistory,
  } = useNotifications();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState<any[]>([]);

  const handleTest = async (testType: string) => {
    setLoading(true);
    setMessage('');
    
    try {
      let result;
      switch (testType) {
        case 'test':
          result = await sendTestNotification();
          break;
        case 'reminder':
          result = await sendStudyReminder();
          break;
        case 'daily_goal':
          result = await sendGoalNotification('daily_cards');
          break;
        case 'accuracy_goal':
          result = await sendGoalNotification('accuracy_goal');
          break;
        case 'custom':
          result = await sendCustomNotification(
            'カスタム通知テスト',
            'これはカスタム通知のテストです。',
            'test',
            { url: '/test' }
          );
          break;
        default:
          result = { success: false, message: '不明なテストタイプです' };
      }
      
      setMessage(result.message);
    } catch (error) {
      setMessage('エラーが発生しました: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleLoadHistory = async () => {
    setLoading(true);
    try {
      const data = await getNotificationHistory();
      setHistory(data);
    } catch (error) {
      setMessage('履歴の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPermission = async () => {
    setLoading(true);
    try {
      const success = await requestPermission();
      setMessage(success ? '通知許可を取得しました' : '通知許可が拒否されました');
    } catch (error) {
      setMessage('許可の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        プッシュ通知テスター
      </h2>

      {/* ステータス表示 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">通知許可状態</h3>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              permissionStatus === 'granted' ? 'bg-green-500' : 
              permissionStatus === 'denied' ? 'bg-red-500' : 'bg-yellow-500'
            }`}></div>
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {permissionStatus === 'granted' ? '許可済み' : 
               permissionStatus === 'denied' ? '拒否' : '未設定'}
            </span>
          </div>
          {permissionStatus !== 'granted' && (
            <button
              onClick={handleRequestPermission}
              disabled={loading}
              className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              許可を要求
            </button>
          )}
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">FCMトークン</h3>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${fcmToken ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {fcmToken ? '取得済み' : '未取得'}
            </span>
          </div>
          {fcmToken && (
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 break-all">
              {fcmToken.substring(0, 20)}...
            </div>
          )}
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Service Worker</h3>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              typeof navigator !== 'undefined' && 'serviceWorker' in navigator ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {typeof navigator !== 'undefined' && 'serviceWorker' in navigator ? 'サポート済み' : '未サポート'}
            </span>
          </div>
        </div>
      </div>

      {/* テストボタン */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={() => handleTest('test')}
          disabled={loading || permissionStatus !== 'granted'}
          className="p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          基本テスト通知
        </button>
        
        <button
          onClick={() => handleTest('reminder')}
          disabled={loading || permissionStatus !== 'granted'}
          className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          学習リマインダー
        </button>
        
        <button
          onClick={() => handleTest('daily_goal')}
          disabled={loading || permissionStatus !== 'granted'}
          className="p-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          日次目標達成
        </button>
        
        <button
          onClick={() => handleTest('accuracy_goal')}
          disabled={loading || permissionStatus !== 'granted'}
          className="p-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          正答率目標達成
        </button>
        
        <button
          onClick={() => handleTest('custom')}
          disabled={loading || permissionStatus !== 'granted'}
          className="p-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          カスタム通知
        </button>

        <button
          onClick={handleLoadHistory}
          disabled={loading}
          className="p-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          通知履歴を表示
        </button>
      </div>

      {/* メッセージ表示 */}
      {message && (
        <div className={`p-4 rounded-lg mb-6 ${
          message.includes('エラー') || message.includes('失敗') 
            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
            : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
        }`}>
          {message}
        </div>
      )}

      {/* 通知履歴 */}
      {history.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            通知履歴
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {history.map((log) => (
              <div key={log.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {log.title}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      {log.body}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      タイプ: {log.notification_type || log.type}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(log.sent_at).toLocaleString('ja-JP')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 使用説明 */}
      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
        <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
          使用方法
        </h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>1. まず「許可を要求」ボタンで通知許可を取得してください</li>
          <li>2. FCMトークンが取得されていることを確認してください</li>
          <li>3. 各テストボタンをクリックして通知をテストしてください</li>
          <li>4. 通知履歴で送信された通知を確認できます</li>
        </ul>
      </div>
    </div>
  );
}