// Firebase Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Firebase 設定
const firebaseConfig = {
  apiKey: "AIzaSyAfTRyRzKF6y062eqyIWuzZij6SZRKHIlg",
  authDomain: "flash-cards-app-7eff2.firebaseapp.com",
  projectId: "flash-cards-app-7eff2",
  storageBucket: "flash-cards-app-7eff2.firebasestorage.app",
  messagingSenderId: "690552633179",
  appId: "1:690552633179:web:efb9c19023ed4cf399cc7e"
};

// Firebase初期化
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// バックグラウンド通知の処理
messaging.onBackgroundMessage((payload) => {
  console.log('Background message received:', payload);
  
  const { notification, data } = payload;
  
  if (!notification) {
    console.log('No notification data found');
    return;
  }
  
  // 通知タイプに応じたカスタマイズ
  const notificationType = data?.type || 'default';
  let notificationOptions = {
    body: notification.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    tag: notificationType,
    data: data || {},
    requireInteraction: false,
    silent: false,
  };
  
  // 通知タイプ別のカスタマイズ
  switch (notificationType) {
    case 'study_reminder':
      notificationOptions = {
        ...notificationOptions,
        actions: [
          {
            action: 'study_now',
            title: '今すぐ学習',
            icon: '/icons/study.png'
          },
          {
            action: 'remind_later',
            title: '後で通知',
            icon: '/icons/clock.png'
          }
        ],
        requireInteraction: true,
        vibrate: [200, 100, 200]
      };
      break;
      
    case 'goal_achievement':
      notificationOptions = {
        ...notificationOptions,
        actions: [
          {
            action: 'view_stats',
            title: '統計を見る',
            icon: '/icons/stats.png'
          },
          {
            action: 'continue_study',
            title: '学習を続ける',
            icon: '/icons/continue.png'
          }
        ],
        vibrate: [300, 200, 300, 200, 300]
      };
      break;
      
    case 'streak':
      notificationOptions = {
        ...notificationOptions,
        actions: [
          {
            action: 'view_progress',
            title: '進捗を見る',
            icon: '/icons/progress.png'
          }
        ],
        vibrate: [100, 50, 100, 50, 100]
      };
      break;
      
    case 'weekly_summary':
      notificationOptions = {
        ...notificationOptions,
        actions: [
          {
            action: 'view_summary',
            title: '詳細を見る',
            icon: '/icons/summary.png'
          }
        ]
      };
      break;
  }
  
  // 通知を表示
  return self.registration.showNotification(
    notification.title,
    notificationOptions
  );
});

// 通知クリック時の処理
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  const { action, data } = event;
  const notificationType = event.notification.tag;
  
  let url = '/';
  
  // アクション別の処理
  switch (action) {
    case 'study_now':
      url = '/study';
      break;
    case 'remind_later':
      // 30分後に再通知（実装例）
      scheduleReminder(30);
      return;
    case 'view_stats':
      url = '/stats';
      break;
    case 'continue_study':
      url = '/study';
      break;
    case 'view_progress':
      url = '/stats';
      break;
    case 'view_summary':
      url = '/stats';
      break;
    default:
      // 通知タイプ別のデフォルトURL
      switch (notificationType) {
        case 'study_reminder':
          url = '/study';
          break;
        case 'goal_achievement':
        case 'streak':
        case 'weekly_summary':
          url = '/stats';
          break;
        default:
          url = '/';
      }
  }
  
  // アプリを開く
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // 既に開いているタブがある場合はそこにフォーカス
        for (let client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        
        // 新しいタブを開く
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// 通知を閉じた時の処理
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event.notification.tag);
  
  // 分析データを送信（オプション）
  const data = {
    type: 'notification_closed',
    notificationType: event.notification.tag,
    timestamp: new Date().toISOString()
  };
  
  // IndexedDBまたはサーバーに分析データを保存
  saveAnalyticsData(data);
});

// リマインダーのスケジューリング
function scheduleReminder(minutes) {
  const delay = minutes * 60 * 1000;
  
  setTimeout(() => {
    self.registration.showNotification('学習リマインダー', {
      body: '学習の時間です！',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
      tag: 'study_reminder_delayed',
      actions: [
        {
          action: 'study_now',
          title: '今すぐ学習'
        }
      ]
    });
  }, delay);
}

// 分析データの保存
function saveAnalyticsData(data) {
  try {
    // IndexedDBに保存
    const request = indexedDB.open('NotificationAnalytics', 1);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('events')) {
        db.createObjectStore('events', { keyPath: 'id', autoIncrement: true });
      }
    };
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['events'], 'readwrite');
      const store = transaction.objectStore('events');
      store.add({
        ...data,
        id: Date.now() + Math.random()
      });
    };
  } catch (error) {
    console.error('Error saving analytics data:', error);
  }
}

// Push イベントの処理（FCM以外の通知用）
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);
  
  if (!event.data) {
    console.log('No push data');
    return;
  }
  
  try {
    const data = event.data.json();
    console.log('Push data:', data);
    
    const { title, body, icon, badge, tag, actions, ...options } = data;
    
    const notificationOptions = {
      body,
      icon: icon || '/icons/icon-192x192.png',
      badge: badge || '/icons/icon-96x96.png',
      tag: tag || 'push_notification',
      actions: actions || [],
      data: options.data || {},
      ...options
    };
    
    event.waitUntil(
      self.registration.showNotification(title, notificationOptions)
    );
  } catch (error) {
    console.error('Error processing push event:', error);
  }
});

// Service Workerの更新処理
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('Firebase Messaging Service Worker loaded');