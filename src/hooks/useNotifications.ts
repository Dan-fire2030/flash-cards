"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { requestNotificationPermission, getCurrentToken } from "@/lib/firebase";

interface NotificationSettings {
  id?: string;
  user_id?: string;
  study_reminders_enabled: boolean;
  study_reminder_times: string[];
  study_reminder_days: string[];
  goal_notifications_enabled: boolean;
  daily_goal_cards: number;
  weekly_goal_days: number;
  accuracy_goal_percentage: number;
  achievement_notifications_enabled: boolean;
  streak_notifications_enabled: boolean;
  weekly_summary_enabled: boolean;
}

const defaultSettings: NotificationSettings = {
  study_reminders_enabled: true,
  study_reminder_times: ["09:00", "18:00"],
  study_reminder_days: [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ],
  goal_notifications_enabled: true,
  daily_goal_cards: 10,
  weekly_goal_days: 5,
  accuracy_goal_percentage: 80,
  achievement_notifications_enabled: true,
  streak_notifications_enabled: true,
  weekly_summary_enabled: true,
};

// ローカルストレージのヘルパー関数
const saveToLocalStorage = (settings: NotificationSettings) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("notification_settings", JSON.stringify(settings));
  }
};

const loadFromLocalStorage = (): NotificationSettings | null => {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("notification_settings");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.error("Error parsing stored notification settings:", error);
      }
    }
  }
  return null;
};

export function useNotifications() {
  const [settings, setSettings] =
    useState<NotificationSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [permissionStatus, setPermissionStatus] =
    useState<NotificationPermission>("default");
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [useLocalStorage, setUseLocalStorage] = useState(false);

  // 通知許可状態をチェック
  const checkPermission = useCallback(() => {
    if ("Notification" in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  // FCMトークンを保存
  const saveFcmToken = useCallback(async (token: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // デバイス情報を取得
      const deviceInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        timestamp: new Date().toISOString(),
      };

      const { error } = await supabase.from("user_fcm_tokens").upsert(
        {
          user_id: user.id,
          fcm_token: token,
          device_info: deviceInfo,
          is_active: true,
        },
        {
          onConflict: "fcm_token",
        },
      );

      if (error) throw error;
      setFcmToken(token);
    } catch (error) {
      console.error("Error saving FCM token:", error);
    }
  }, []);

  // 通知許可をリクエスト
  const requestPermission = useCallback(async () => {
    try {
      const token = await requestNotificationPermission();
      if (token) {
        await saveFcmToken(token);
        setPermissionStatus("granted");
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  }, [saveFcmToken]);

  // 通知設定を読み込み
  const loadSettings = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        // ユーザーが認証されていない場合はローカルストレージから読み込み
        const localSettings = loadFromLocalStorage();
        if (localSettings) {
          setSettings(localSettings);
        }
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("user_notification_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error loading settings:", error);

        // テーブルが存在しない場合はローカルストレージにフォールバック
        if (error.code === "42P01") {
          console.warn(
            "user_notification_settings table does not exist. Using localStorage fallback.",
          );
          setUseLocalStorage(true);
          const localSettings = loadFromLocalStorage();
          if (localSettings) {
            setSettings(localSettings);
          }
          setLoading(false);
          return;
        }

        throw error;
      }

      if (data) {
        setSettings(data);
      } else {
        // デフォルト設定で初期化
        const settingsToSave = {
          ...defaultSettings,
          user_id: user.id,
        };

        const { error: saveError } = await supabase
          .from("user_notification_settings")
          .upsert(settingsToSave);

        if (!saveError) {
          setSettings(settingsToSave);
        } else {
          // データベース保存に失敗した場合はローカルストレージを使用
          console.warn(
            "Failed to save to database, using localStorage fallback",
          );
          setUseLocalStorage(true);
          setSettings(defaultSettings);
          saveToLocalStorage(defaultSettings);
        }
      }
    } catch (error) {
      console.error("Error loading notification settings:", error);
      // エラーが発生した場合はローカルストレージから読み込み
      const localSettings = loadFromLocalStorage();
      if (localSettings) {
        setSettings(localSettings);
      }
      setUseLocalStorage(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // 通知設定を保存
  const saveSettings = useCallback(
    async (newSettings: Partial<NotificationSettings>) => {
      try {
        const settingsToSave = {
          ...settings,
          ...newSettings,
        };

        // ローカルストレージを使用している場合
        if (useLocalStorage) {
          console.log("Using localStorage to save settings:", settingsToSave);
          saveToLocalStorage(settingsToSave);
          setSettings(settingsToSave);
          return true;
        }

        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          console.warn("User not authenticated, saving to localStorage");
          saveToLocalStorage(settingsToSave);
          setSettings(settingsToSave);
          return true;
        }

        const settingsWithUserId = {
          ...settingsToSave,
          user_id: user.id,
        };

        console.log(
          "Attempting to save settings to database:",
          settingsWithUserId,
        );

        const { data, error } = await supabase
          .from("user_notification_settings")
          .upsert(settingsWithUserId)
          .select();

        if (error) {
          console.error("Database error:", error);

          // テーブルが存在しない場合やその他のDB エラーの場合はローカルストレージにフォールバック
          if (error.code === "42P01") {
            console.warn(
              "user_notification_settings table does not exist. Using localStorage fallback.",
            );
            setUseLocalStorage(true);
          } else {
            console.warn(
              "Database error occurred. Falling back to localStorage.",
            );
          }

          // ローカルストレージに保存
          saveToLocalStorage(settingsToSave);
          setSettings(settingsToSave);
          return true;
        }

        console.log("Settings saved successfully to database:", data);
        setSettings(settingsWithUserId);
        return true;
      } catch (error) {
        console.error("Error saving notification settings:", error);
        console.error("Error details:", error);

        // エラーが発生した場合でもローカルストレージに保存
        const settingsToSave = {
          ...settings,
          ...newSettings,
        };
        saveToLocalStorage(settingsToSave);
        setSettings(settingsToSave);
        return true;
      }
    },
    [settings, useLocalStorage],
  );

  // 既存のFCMトークンを取得
  const loadFcmToken = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // データベースからトークンを取得
      const { data } = await supabase
        .from("user_fcm_tokens")
        .select("fcm_token")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("updated_at", { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        setFcmToken(data[0].fcm_token);
      }

      // 現在のブラウザでも有効なトークンを取得
      const currentToken = await getCurrentToken();
      if (currentToken) {
        setFcmToken(currentToken);
        // トークンをデータベースに保存
        await saveFcmToken(currentToken);
      }
    } catch (error) {
      console.error("Error loading FCM token:", error);
    }
  }, [saveFcmToken]);

  // フォアグラウンド通知の設定
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      fcmToken &&
      permissionStatus === "granted"
    ) {
      // フォアグラウンド通知リスナーを設定
      const setupForegroundMessage = async () => {
        const { onMessageListener } = await import("@/lib/firebase");
        onMessageListener()
          .then((payload: unknown) => {
            console.log("Foreground notification received:", payload);

            // ブラウザ通知として表示
            const typedPayload = payload as {
              notification?: { title: string; body: string };
              data?: Record<string, unknown>;
            };
            if (typedPayload.notification) {
              new Notification(typedPayload.notification.title, {
                body: typedPayload.notification.body,
                icon: "/icons/icon-192x192.png",
                badge: "/icons/icon-96x96.png",
                tag: (typedPayload.data?.type as string) || "notification",
                data: typedPayload.data,
              });
            }
          })
          .catch((error: unknown) => {
            console.error(
              "Error setting up foreground message listener:",
              error,
            );
          });
      };

      setupForegroundMessage();
    }
  }, [fcmToken, permissionStatus]);

  // 初期化
  useEffect(() => {
    checkPermission();
    loadSettings();
    loadFcmToken();
  }, []);

  return {
    settings,
    loading,
    permissionStatus,
    fcmToken,
    requestPermission,
    saveSettings,
    checkPermission,
  };
}
