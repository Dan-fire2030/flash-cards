import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

// Firebase設定（環境変数から取得）
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// 必須の環境変数をチェック
const isFirebaseConfigured = () => {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.storageBucket &&
    firebaseConfig.messagingSenderId &&
    firebaseConfig.appId
  );
};

// Firebase初期化
let app: ReturnType<typeof initializeApp> | null = null;
if (isFirebaseConfigured()) {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
} else {
  console.warn('Firebase configuration is incomplete. Push notifications will not work.');
}

// メッセージング関連の関数
export const requestNotificationPermission = async (): Promise<string | null> => {
  if (typeof window === 'undefined') return null;
  
  if (!app) {
    console.error('Firebase is not configured');
    return null;
  }
  
  try {
    // Push通知がサポートされているかチェック
    const supported = await isSupported();
    if (!supported) {
      console.log('This browser does not support FCM');
      return null;
    }

    // 通知許可をリクエスト
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const messaging = getMessaging(app);
      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
      
      if (!vapidKey) {
        console.error('VAPID key not found');
        return null;
      }

      // FCMトークンを取得
      const token = await getToken(messaging, {
        vapidKey: vapidKey,
      });
      
      console.log('FCM Token:', token);
      return token;
    } else {
      console.log('Notification permission denied');
      return null;
    }
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};

// フォアグラウンドメッセージ処理
export const onMessageListener = () => {
  if (typeof window === 'undefined') return Promise.resolve();
  if (!app) return Promise.resolve();
  
  return new Promise((resolve) => {
    isSupported().then((supported) => {
      if (supported) {
        const messaging = getMessaging(app);
        onMessage(messaging, (payload) => {
          console.log('Foreground message received:', payload);
          resolve(payload);
        });
      }
    });
  });
};

// FCMトークンの取得（既に許可されている場合）
export const getCurrentToken = async (): Promise<string | null> => {
  if (typeof window === 'undefined') return null;
  if (!app) return null;
  
  try {
    const supported = await isSupported();
    if (!supported) return null;

    const messaging = getMessaging(app);
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    
    if (!vapidKey) return null;

    const token = await getToken(messaging, { vapidKey });
    return token;
  } catch (error) {
    console.error('Error getting current token:', error);
    return null;
  }
};

export default app;