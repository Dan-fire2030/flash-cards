'use client';

import { useState, useEffect } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { supabase } from '@/lib/supabase';

export default function TestNotificationsPage() {
  const {
    permissionStatus,
    fcmToken,
    requestPermission,
    sendTestNotification,
    sendStudyReminder,
    sendGoalNotification,
  } = useNotifications();

  const [testType, setTestType] = useState('basic');
  const [customTitle, setCustomTitle] = useState('テスト通知');
  const [customBody, setCustomBody] = useState('これはテスト通知です');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const handleRequestPermission = async () => {
    const success = await requestPermission();
    setResult(success ? '通知許可が有効になりました' : '通知許可が拒否されました');
  };

  const handleSendNotification = async () => {
    setLoading(true);
    setResult('');
    
    try {
      let success = false;
      
      switch (testType) {
        case 'basic':
          const testResult = await sendTestNotification();
          success = testResult.success;
          break;
        case 'study':
          const studyResult = await sendStudyReminder();
          success = studyResult.success;
          break;
        case 'goal':
          const goalResult = await sendGoalNotification('daily_cards', '今日の目標を達成しました！');
          success = goalResult.success;
          break;
        case 'custom':
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            setResult('ログインが必要です');
            setLoading(false);
            return;
          }
          
          const response = await fetch('/api/notifications/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
              title: customTitle,
              body: customBody,
              data: { type: 'custom_test' }
            })
          });
          
          const data = await response.json();
          success = data.success;
          break;
      }
      
      setResult(success ? '✅ 通知を送信しました' : '❌ 通知の送信に失敗しました');
    } catch (error) {
      console.error('Error:', error);
      setResult('❌ エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          通知テストページ
        </h1>
        
        {/* 通知許可状態 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4">
          <h2 className="font-semibold mb-2">通知許可状態</h2>
          <div className="flex items-center justify-between mb-2">
            <span>状態: {permissionStatus === 'granted' ? '✅ 許可済み' : 
                         permissionStatus === 'denied' ? '❌ 拒否' : '⏳ 未設定'}</span>
            {permissionStatus !== 'granted' && (
              <button
                onClick={handleRequestPermission}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                通知を許可
              </button>
            )}
          </div>
          {fcmToken && (
            <details className="text-xs">
              <summary className="cursor-pointer text-gray-600 dark:text-gray-400">
                FCMトークン（デバッグ用）
              </summary>
              <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded overflow-x-auto">
                {fcmToken}
              </pre>
            </details>
          )}
        </div>
        
        {/* 通知テスト */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
          <h2 className="font-semibold mb-4">通知テスト</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                通知タイプ
              </label>
              <select
                value={testType}
                onChange={(e) => setTestType(e.target.value)}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="basic">基本テスト通知</option>
                <option value="study">学習リマインダー</option>
                <option value="goal">目標達成通知</option>
                <option value="custom">カスタム通知</option>
              </select>
            </div>
            
            {testType === 'custom' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    タイトル
                  </label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    本文
                  </label>
                  <textarea
                    value={customBody}
                    onChange={(e) => setCustomBody(e.target.value)}
                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                    rows={3}
                  />
                </div>
              </>
            )}
            
            <button
              onClick={handleSendNotification}
              disabled={loading || permissionStatus !== 'granted'}
              className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '送信中...' : '通知を送信'}
            </button>
            
            {result && (
              <div className={`p-3 rounded ${result.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {result}
              </div>
            )}
          </div>
        </div>
        
        {/* デバッグ情報 */}
        <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded text-xs">
          <h3 className="font-semibold mb-2">デバッグ情報</h3>
          <ul className="space-y-1 text-gray-600 dark:text-gray-400">
            <li>ブラウザ: {typeof window !== 'undefined' && navigator.userAgent.substring(0, 50)}...</li>
            <li>Service Worker: {typeof window !== 'undefined' && 'serviceWorker' in navigator ? '✅' : '❌'}</li>
            <li>通知API: {typeof window !== 'undefined' && 'Notification' in window ? '✅' : '❌'}</li>
            <li>PushManager: {typeof window !== 'undefined' && 'PushManager' in window ? '✅' : '❌'}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}