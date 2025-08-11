'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
  isBiometricSupported,
  getBiometricType,
  createBiometricCredential,
  authenticateWithBiometric,
  saveBiometricCredential,
  getBiometricCredential,
  isBiometricEnabled,
  disableBiometric,
} from '@/lib/biometric-auth';

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
    biometricType: '',
    loading: true,
    error: null,
  });

  // 初期化：サポート状況と設定状態をチェック
  const initialize = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const supported = await isBiometricSupported();
      const enabled = isBiometricEnabled();
      const biometricType = getBiometricType();

      setState({
        isSupported: supported,
        isEnabled: enabled,
        biometricType,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error initializing biometric auth:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: '生体認証の初期化に失敗しました',
      }));
    }
  }, []);

  // 生体認証を有効化
  const enableBiometric = useCallback(async (): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // ユーザー情報を取得
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'ユーザーが認証されていません',
        }));
        return false;
      }

      // 既に生体認証が設定済みかチェック
      const existingCredential = getBiometricCredential(user.id);
      if (existingCredential) {
        setState(prev => ({
          ...prev,
          isEnabled: true,
          loading: false,
        }));
        return true;
      }

      // 新しい認証情報を作成
      const result = await createBiometricCredential({
        userId: user.id,
        userDisplayName: user.email || 'ユーザー',
        timeout: 60000,
      });

      if (!result.success || !result.credential) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: result.error || '生体認証の設定に失敗しました',
        }));
        return false;
      }

      // 認証情報を保存
      saveBiometricCredential(result.credential, user.id);

      setState(prev => ({
        ...prev,
        isEnabled: true,
        loading: false,
        error: null,
      }));

      return true;
    } catch (error) {
      console.error('Error enabling biometric:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: '生体認証の有効化に失敗しました',
      }));
      return false;
    }
  }, []);

  // 生体認証を無効化
  const disableBiometricAuth = useCallback(async (): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        disableBiometric(user.id);
      } else {
        disableBiometric();
      }

      setState(prev => ({
        ...prev,
        isEnabled: false,
        loading: false,
        error: null,
      }));

      return true;
    } catch (error) {
      console.error('Error disabling biometric:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: '生体認証の無効化に失敗しました',
      }));
      return false;
    }
  }, []);

  // 生体認証で認証を実行
  const authenticate = useCallback(async (): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'ユーザーが認証されていません',
        }));
        return false;
      }

      const credential = getBiometricCredential(user.id);
      if (!credential) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: '生体認証が設定されていません',
        }));
        return false;
      }

      const result = await authenticateWithBiometric(credential.id, {
        timeout: 60000,
      });

      if (!result.success) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: result.error || '生体認証に失敗しました',
        }));
        return false;
      }

      setState(prev => ({
        ...prev,
        loading: false,
        error: null,
      }));

      return true;
    } catch (error) {
      console.error('Error during biometric authentication:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: '生体認証中にエラーが発生しました',
      }));
      return false;
    }
  }, []);

  // 生体認証を使ったログイン（セッション復元）
  const loginWithBiometric = useCallback(async (): Promise<boolean> => {
    try {
      // まず生体認証を実行
      const authSuccess = await authenticate();
      if (!authSuccess) {
        return false;
      }

      // 既存のセッションが有効かチェック
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // 既に認証済みなので成功
        return true;
      }

      // セッションが無効な場合は、ローカルストレージから最後のユーザー情報を取得
      const lastUserEmail = localStorage.getItem('last_user_email');
      if (!lastUserEmail) {
        setState(prev => ({
          ...prev,
          error: 'セッション情報が見つかりません。通常のログインを行ってください。',
        }));
        return false;
      }

      // 生体認証成功をサインとして、セッション復元の代替手段を提供
      // 注意: 実際の実装では、より安全な方法を使用してください
      setState(prev => ({
        ...prev,
        error: 'セッションの有効期限が切れています。メールアドレスとパスワードでログインしてください。',
      }));
      
      return false;
    } catch (error) {
      console.error('Error during biometric login:', error);
      setState(prev => ({
        ...prev,
        error: '生体認証ログインに失敗しました',
      }));
      return false;
    }
  }, [authenticate]);

  // エラーをクリア
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
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