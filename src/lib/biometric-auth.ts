'use client';

// Web Authentication API (WebAuthn) を使用した生体認証
interface BiometricAuthOptions {
  challenge?: string;
  userDisplayName?: string;
  userId?: string;
  timeout?: number;
}

interface BiometricCredential {
  id: string;
  rawId: ArrayBuffer;
  response: AuthenticatorAttestationResponse;
  type: string;
}

interface BiometricAuthResult {
  success: boolean;
  credential?: BiometricCredential;
  error?: string;
}

// 生体認証がサポートされているかチェック
export const isBiometricSupported = async (): Promise<boolean> => {
  if (typeof window === 'undefined') return false;
  
  // WebAuthn API の基本サポートをチェック
  if (!window.PublicKeyCredential) {
    return false;
  }

  try {
    // プラットフォーム認証器（Face ID、Touch ID、Windows Hello等）の利用可能性をチェック
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return available;
  } catch (error) {
    console.error('Error checking biometric support:', error);
    return false;
  }
};

// 生体認証の種類を取得
export const getBiometricType = (): string => {
  const userAgent = navigator.userAgent;
  
  if (/iPhone|iPad|iPod/.test(userAgent)) {
    return 'Touch ID / Face ID';
  } else if (/Macintosh/.test(userAgent)) {
    return 'Touch ID';
  } else if (/Windows/.test(userAgent)) {
    return 'Windows Hello';
  } else if (/Android/.test(userAgent)) {
    return '指紋認証';
  } else {
    return '生体認証';
  }
};

// チャレンジ生成（ランダムな32バイト）
const generateChallenge = (): Uint8Array => {
  return window.crypto.getRandomValues(new Uint8Array(32));
};

// 文字列をUint8Arrayに変換
const stringToUint8Array = (str: string): Uint8Array => {
  return new TextEncoder().encode(str);
};

// ArrayBufferをBase64URLに変換
const arrayBufferToBase64Url = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
};

// Base64URLをArrayBufferに変換
const base64UrlToArrayBuffer = (base64url: string): ArrayBuffer => {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padding = base64.length % 4;
  const padded = base64 + '='.repeat((4 - padding) % 4);
  const binary = atob(padded);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return buffer;
};

// 生体認証用の認証情報を作成
export const createBiometricCredential = async (
  options: BiometricAuthOptions = {}
): Promise<BiometricAuthResult> => {
  try {
    const supported = await isBiometricSupported();
    if (!supported) {
      return { success: false, error: 'この端末では生体認証がサポートされていません' };
    }

    const challenge = generateChallenge();
    const userId = stringToUint8Array(options.userId || 'user-' + Date.now());

    const credentialCreationOptions: CredentialCreationOptions = {
      publicKey: {
        challenge: challenge,
        rp: {
          name: 'フラッシュカードアプリ',
          id: window.location.hostname,
        },
        user: {
          id: userId,
          name: options.userDisplayName || 'ユーザー',
          displayName: options.userDisplayName || 'ユーザー',
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' }, // ES256
          { alg: -257, type: 'public-key' }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform', // プラットフォーム認証器のみ（Face ID、Touch ID等）
          userVerification: 'required', // ユーザー認証必須
          requireResidentKey: false,
        },
        timeout: options.timeout || 60000, // 60秒
        attestation: 'direct',
      },
    };

    const credential = await navigator.credentials.create(credentialCreationOptions) as PublicKeyCredential;
    
    if (!credential) {
      return { success: false, error: '認証情報の作成に失敗しました' };
    }

    return {
      success: true,
      credential: {
        id: credential.id,
        rawId: credential.rawId,
        response: credential.response as AuthenticatorAttestationResponse,
        type: credential.type,
      },
    };
  } catch (error: unknown) {
    console.error('Biometric credential creation error:', error);
    
    let errorMessage = '生体認証の設定に失敗しました';
    if ((error as Error).name === 'NotSupportedError') {
      errorMessage = 'この端末では生体認証がサポートされていません';
    } else if ((error as Error).name === 'NotAllowedError') {
      errorMessage = '生体認証がキャンセルされました';
    } else if ((error as Error).name === 'InvalidStateError') {
      errorMessage = '生体認証は既に設定済みです';
    } else if ((error as Error).name === 'ConstraintError') {
      errorMessage = '生体認証の制約エラーが発生しました';
    }
    
    return { success: false, error: errorMessage };
  }
};

// 既存の認証情報で生体認証を実行
export const authenticateWithBiometric = async (
  credentialId: string,
  options: BiometricAuthOptions = {}
): Promise<BiometricAuthResult> => {
  try {
    const supported = await isBiometricSupported();
    if (!supported) {
      return { success: false, error: 'この端末では生体認証がサポートされていません' };
    }

    const challenge = generateChallenge();
    const allowCredentials = credentialId ? [{
      id: base64UrlToArrayBuffer(credentialId),
      type: 'public-key' as const,
      transports: ['internal'] as AuthenticatorTransport[],
    }] : [];

    const credentialRequestOptions: CredentialRequestOptions = {
      publicKey: {
        challenge: challenge,
        timeout: options.timeout || 60000,
        rpId: window.location.hostname,
        allowCredentials: allowCredentials,
        userVerification: 'required',
      },
    };

    const assertion = await navigator.credentials.get(credentialRequestOptions) as PublicKeyCredential;
    
    if (!assertion) {
      return { success: false, error: '生体認証に失敗しました' };
    }

    return { success: true };
  } catch (error: unknown) {
    console.error('Biometric authentication error:', error);
    
    let errorMessage = '生体認証に失敗しました';
    if ((error as Error).name === 'NotSupportedError') {
      errorMessage = 'この端末では生体認証がサポートされていません';
    } else if ((error as Error).name === 'NotAllowedError') {
      errorMessage = '生体認証がキャンセルされました';
    } else if ((error as Error).name === 'InvalidStateError') {
      errorMessage = '生体認証が無効な状態です';
    }
    
    return { success: false, error: errorMessage };
  }
};

// 認証情報をBase64URL形式で保存用に変換
export const serializeCredential = (credential: BiometricCredential): string => {
  return JSON.stringify({
    id: credential.id,
    rawId: arrayBufferToBase64Url(credential.rawId),
    type: credential.type,
  });
};

// 保存された認証情報から復元
export const deserializeCredential = (serialized: string): { id: string; rawId: string; type: string } => {
  return JSON.parse(serialized);
};

// ローカルストレージに認証情報を保存
export const saveBiometricCredential = (credential: BiometricCredential, userId: string): void => {
  if (typeof window === 'undefined') return;
  
  const serialized = serializeCredential(credential);
  localStorage.setItem(`biometric_credential_${userId}`, serialized);
  localStorage.setItem('biometric_enabled', 'true');
};

// ローカルストレージから認証情報を取得
export const getBiometricCredential = (userId: string): { id: string; rawId: string; type: string } | null => {
  if (typeof window === 'undefined') return null;
  
  const serialized = localStorage.getItem(`biometric_credential_${userId}`);
  if (!serialized) return null;
  
  try {
    return deserializeCredential(serialized);
  } catch (error) {
    console.error('Error deserializing biometric credential:', error);
    return null;
  }
};

// 生体認証が有効かチェック
export const isBiometricEnabled = (): boolean => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('biometric_enabled') === 'true';
};

// 生体認証を無効化
export const disableBiometric = (userId?: string): void => {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('biometric_enabled');
  if (userId) {
    localStorage.removeItem(`biometric_credential_${userId}`);
  }
};