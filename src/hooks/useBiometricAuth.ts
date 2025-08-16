"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
  isBiometricSupported,
  getBiometricType,
  createBiometricCredential,
  authenticateWithBiometric,
  saveBiometricCredential,
  getBiometricCredential,
  isBiometricEnabled,
  disableBiometric,
} from "@/lib/biometric-auth";

interface BiometricAuthState {
  isSupported: boolean;
  isEnabled: boolean;
  biometricType: string;
  loading: boolean;
  error: string | null;
}

export function useBiometricAuth() {
  const [state, setState] = useState<BiometricAuthState>({
    isSupported: false,
    isEnabled: false,
    biometricType: "",
    loading: true,
    error: null,
  });

  // 初期化：サポート状況と設定状態をチェック
  const initialize = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const supported = await isBiometricSupported();
      const biometricType = getBiometricType();

      // 保存された生体認証情報があるかチェック
      let hasCredential = false;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("biometric_credential_")) {
          hasCredential = true;
          break;
        }
      }

      setState({
        isSupported: supported,
        isEnabled: hasCredential && isBiometricEnabled(),
        biometricType,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error("Error initializing biometric auth:", error);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "生体認証の初期化に失敗しました",
      }));
    }
  }, []);

  // 生体認証を有効化
  const enableBiometric = useCallback(async (): Promise<boolean> => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      // ユーザー情報を取得
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: "ユーザーが認証されていません",
        }));
        return false;
      }

      // 既に生体認証が設定済みかチェック
      const existingCredential = getBiometricCredential(user.id);
      if (existingCredential) {
        setState((prev) => ({
          ...prev,
          isEnabled: true,
          loading: false,
        }));
        return true;
      }

      // 新しい認証情報を作成
      const result = await createBiometricCredential({
        userId: user.id,
        userDisplayName: user.email || "ユーザー",
        timeout: 60000,
      });

      if (!result.success || !result.credential) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: result.error || "生体認証の設定に失敗しました",
        }));
        return false;
      }

      // 認証情報を保存
      saveBiometricCredential(result.credential, user.id);

      setState((prev) => ({
        ...prev,
        isEnabled: true,
        loading: false,
        error: null,
      }));

      return true;
    } catch (error) {
      console.error("Error enabling biometric:", error);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "生体認証の有効化に失敗しました",
      }));
      return false;
    }
  }, []);

  // 生体認証を無効化
  const disableBiometricAuth = useCallback(async (): Promise<boolean> => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        disableBiometric(user.id);
      } else {
        disableBiometric();
      }

      setState((prev) => ({
        ...prev,
        isEnabled: false,
        loading: false,
        error: null,
      }));

      return true;
    } catch (error) {
      console.error("Error disabling biometric:", error);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "生体認証の無効化に失敗しました",
      }));
      return false;
    }
  }, []);

  // 生体認証で認証を実行（ログイン済みユーザー用）
  const authenticate = useCallback(async (): Promise<boolean> => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: "ユーザーが認証されていません",
        }));
        return false;
      }

      const credential = getBiometricCredential(user.id);
      if (!credential) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: "生体認証が設定されていません",
        }));
        return false;
      }

      const result = await authenticateWithBiometric(credential.id, {
        timeout: 60000,
      });

      if (!result.success) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: result.error || "生体認証に失敗しました",
        }));
        return false;
      }

      setState((prev) => ({
        ...prev,
        loading: false,
        error: null,
      }));

      return true;
    } catch (error) {
      console.error("Error during biometric authentication:", error);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "生体認証中にエラーが発生しました",
      }));
      return false;
    }
  }, []);

  // 生体認証を使ったログイン（セッション復元）
  const loginWithBiometric = useCallback(async (): Promise<boolean> => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      // まず保存された認証情報を探す
      // localStorageから全ての生体認証キーを探す
      let credential = null;
      let foundUserId = null;

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("biometric_credential_")) {
          const userId = key.replace("biometric_credential_", "");
          credential = getBiometricCredential(userId);
          if (credential) {
            foundUserId = userId;
            break;
          }
        }
      }

      if (!credential || !foundUserId) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error:
            "生体認証が登録されていません。先にメールアドレスとパスワードでログインしてから、設定画面で生体認証を有効化してください。",
        }));
        return false;
      }

      // 生体認証を実行
      const result = await authenticateWithBiometric(credential.id, {
        timeout: 60000,
      });

      if (!result.success) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: result.error || "生体認証に失敗しました",
        }));
        return false;
      }

      // 既存のセッションが有効かチェック
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        // 既に認証済みなので成功
        setState((prev) => ({
          ...prev,
          loading: false,
          error: null,
        }));
        return true;
      }

      // セッションが無効な場合
      setState((prev) => ({
        ...prev,
        loading: false,
        error:
          "セッションの有効期限が切れています。メールアドレスとパスワードでログインしてください。",
      }));

      return false;
    } catch (error) {
      console.error("Error during biometric login:", error);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "生体認証ログインに失敗しました",
      }));
      return false;
    }
  }, []);

  // エラーをクリア
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  // 初期化
  useEffect(() => {
    initialize();
  }, [initialize]);

  return {
    // 状態
    isSupported: state.isSupported,
    isEnabled: state.isEnabled,
    biometricType: state.biometricType,
    loading: state.loading,
    error: state.error,

    // 操作
    enableBiometric,
    disableBiometric: disableBiometricAuth,
    authenticate,
    loginWithBiometric,
    clearError,
    initialize,
  };
}
