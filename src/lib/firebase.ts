import { initializeApp, getApps } from "firebase/app";
import {
  getMessaging,
  getToken,
  onMessage,
  isSupported,
} from "firebase/messaging";

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
  const configured = !!(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.storageBucket &&
    firebaseConfig.messagingSenderId &&
    firebaseConfig.appId
  );

  console.log("Firebase configuration check:", {
    apiKey: !!firebaseConfig.apiKey,
    authDomain: !!firebaseConfig.authDomain,
    projectId: !!firebaseConfig.projectId,
    storageBucket: !!firebaseConfig.storageBucket,
    messagingSenderId: !!firebaseConfig.messagingSenderId,
    appId: !!firebaseConfig.appId,
    configured,
  });

  return configured;
};

// Firebase初期化
let app: ReturnType<typeof initializeApp> | null = null;
if (isFirebaseConfigured()) {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
} else {
  console.warn(
    "Firebase configuration is incomplete. Push notifications will not work.",
  );
}

// メッセージング関連の関数
export const requestNotificationPermission = async (): Promise<
  string | null
> => {
  console.log("Starting notification permission request...");

  if (typeof window === "undefined") {
    console.log("Not in browser environment");
    return null;
  }

  if (!app) {
    console.error("Firebase is not configured");
    return null;
  }

  try {
    // Push通知がサポートされているかチェック
    console.log("Checking FCM support...");
    const supported = await isSupported();
    console.log("FCM supported:", supported);

    if (!supported) {
      console.log("This browser does not support FCM");
      return null;
    }

    // 現在の通知許可状態を確認
    console.log("Current notification permission:", Notification.permission);

    // 通知許可をリクエスト
    console.log("Requesting notification permission...");
    const permission = await Notification.requestPermission();
    console.log("Permission result:", permission);

    if (permission === "granted") {
      // Service Workerを登録
      await registerServiceWorker();

      const messaging = getMessaging(app);
      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

      console.log("VAPID key available:", !!vapidKey);
      if (!vapidKey) {
        console.error("VAPID key not found in environment variables");
        return null;
      }

      // FCMトークンを取得
      console.log("Getting FCM token...");
      const token = await getToken(messaging, {
        vapidKey: vapidKey,
      });

      console.log("FCM Token obtained:", !!token);
      console.log("FCM Token:", token);
      return token;
    } else {
      console.log("Notification permission denied. Status:", permission);
      return null;
    }
  } catch (error) {
    console.error("Error getting FCM token:", error);
    console.error("Error details:", {
      name: error instanceof Error ? error.name : "Unknown name",
      message: error instanceof Error ? error.message : "Unknown message",
      code: (error as { code?: string })?.code || "Unknown code",
    });
    return null;
  }
};

// フォアグラウンドメッセージ処理
export const onMessageListener = () => {
  if (typeof window === "undefined") return Promise.resolve();
  if (!app) return Promise.resolve();

  return new Promise((resolve) => {
    isSupported().then((supported) => {
      if (supported) {
        const messaging = getMessaging(app);
        onMessage(messaging, (payload) => {
          console.log("Foreground message received:", payload);
          resolve(payload);
        });
      }
    });
  });
};

// FCMトークンの取得（既に許可されている場合）
export const getCurrentToken = async (): Promise<string | null> => {
  if (typeof window === "undefined") return null;
  if (!app) return null;

  try {
    const supported = await isSupported();
    if (!supported) return null;

    // Service Workerを登録（既に登録されている場合はスキップ）
    await registerServiceWorker();

    const messaging = getMessaging(app);
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

    if (!vapidKey) return null;

    const token = await getToken(messaging, { vapidKey });
    return token;
  } catch (error) {
    console.error("Error getting current token:", error);
    return null;
  }
};

// Service Worker登録関数
const registerServiceWorker = async (): Promise<void> => {
  if (typeof window === "undefined") return;

  try {
    console.log("Registering Firebase Messaging Service Worker...");
    const registration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js",
    );
    console.log("Service Worker registered successfully:", registration);

    // Service Workerの更新をチェック
    registration.addEventListener("updatefound", () => {
      console.log("Service Worker update found");
    });

    return registration;
  } catch (error) {
    console.error("Service Worker registration failed:", error);
    throw error;
  }
};

export default app;
