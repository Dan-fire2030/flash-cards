// Firebase Cloud Messaging Service Worker

importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

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
    data: {
      url: payload.data?.url || '/',
      type: payload.data?.type || 'reminder'
    },
    actions: [
      {
        action: 'study',
        title: '学習開始'
      },
      {
        action: 'dismiss',
        title: '後で'
      }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// 通知クリック処理
self.addEventListener('notificationclick', function(event) {
  console.log('[firebase-messaging-sw.js] Notification click received.');
  
  event.notification.close();
  
  let url = '/';
  if (event.notification.data && event.notification.data.url) {
    url = event.notification.data.url;
  }
  
  // アクションに応じた処理
  if (event.action === 'study') {
    url = '/study';
  } else if (event.action === 'dismiss') {
    return; // 何もしない
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // 既にアプリが開いている場合
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            url: url
          });
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