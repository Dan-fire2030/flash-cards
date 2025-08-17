// Firebase Cloud Messaging Service Worker

importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Firebase設定
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

// メッセージングインスタンス
const messaging = firebase.messaging();

// バックグラウンドメッセージ処理
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || 'フラッシュカード';
  const notificationOptions = {
    body: payload.notification?.body || 'フラッシュカードで学習しましょう！',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    vibrate: [200, 100, 200],
    requireInteraction: false,
    silent: false,
    tag: payload.data?.type || 'flashcard-notification',
    data: {
      url: payload.data?.url || '/',
      type: payload.data?.type || 'reminder',
      timestamp: Date.now(),
      ...payload.data
    },
    actions: [
      {
        action: 'study',
        title: '学習開始',
        icon: '/icons/icon-96x96.png'
      },
      {
        action: 'dismiss',
        title: '後で',
        icon: '/icons/icon-96x96.png'
      }
    ]
  };

  // 通知タイプに応じてカスタマイズ
  if (payload.data?.type === 'goal_achievement') {
    notificationOptions.requireInteraction = true;
    notificationOptions.actions = [
      {
        action: 'view_stats',
        title: '統計を見る',
        icon: '/icons/icon-96x96.png'
      },
      {
        action: 'continue_study',
        title: '学習継続',
        icon: '/icons/icon-96x96.png'
      }
    ];
  } else if (payload.data?.type === 'weekly_summary') {
    notificationOptions.requireInteraction = true;
    notificationOptions.actions = [
      {
        action: 'view_summary',
        title: '詳細を見る',
        icon: '/icons/icon-96x96.png'
      },
      {
        action: 'study',
        title: '学習開始',
        icon: '/icons/icon-96x96.png'
      }
    ];
  }

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// 通知クリック処理
self.addEventListener('notificationclick', function(event) {
  console.log('[firebase-messaging-sw.js] Notification click received.');
  console.log('Action:', event.action);
  console.log('Notification data:', event.notification.data);
  
  event.notification.close();
  
  let url = '/';
  if (event.notification.data && event.notification.data.url) {
    url = event.notification.data.url;
  }
  
  // アクションに応じた処理
  switch (event.action) {
    case 'study':
      url = '/study';
      break;
    case 'view_stats':
      url = '/stats';
      break;
    case 'view_summary':
      url = '/stats';
      break;
    case 'continue_study':
      url = '/study';
      break;
    case 'dismiss':
      // 分析用にクリックイベントを記録
      logNotificationAction('dismiss', event.notification.data);
      return;
    default:
      // デフォルトは本文クリック
      if (event.notification.data?.type === 'goal_achievement') {
        url = '/stats';
      } else if (event.notification.data?.type === 'weekly_summary') {
        url = '/stats';
      } else {
        url = event.notification.data?.url || '/study';
      }
  }
  
  // 分析用にクリックイベントを記録
  logNotificationAction(event.action || 'click', event.notification.data);
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // 既にアプリが開いている場合
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            action: event.action,
            url: url,
            data: event.notification.data
          });
          return client.focus();
        }
      }
      
      // 新しいタブ/ウィンドウを開く
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// 通知アクションのログ記録
function logNotificationAction(action, notificationData) {
  console.log('[firebase-messaging-sw.js] Notification action:', action, notificationData);
  
  // IndexedDBまたはローカルストレージに保存することで、
  // 後でアプリ側で分析データとして活用可能
  try {
    const actionData = {
      action: action,
      type: notificationData?.type,
      timestamp: Date.now(),
      url: notificationData?.url
    };
    
    // ServiceWorkerからは直接fetch APIでサーバーに送信することも可能
    // ここでは簡単な例として console.log のみ
    console.log('Notification action logged:', actionData);
  } catch (error) {
    console.error('Error logging notification action:', error);
  }
}