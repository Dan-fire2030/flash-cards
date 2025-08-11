# 生体認証機能ガイド

## 📱 概要
フラッシュカードアプリに実装されたFace ID/Touch ID生体認証機能の詳細ガイドです。WebAuthn API を使用して、安全で快適な認証体験を提供します。

---

## 🔐 サポートする生体認証

### 対応プラットフォーム
- **iOS Safari**: Face ID、Touch ID
- **macOS Safari**: Touch ID
- **Android Chrome**: 指紋認証、顔認証
- **Windows Edge**: Windows Hello（顔認証、指紋認証、虹彩認証）
- **その他のプラットフォーム**: WebAuthn対応ブラウザで利用可能

### 技術仕様
- **プロトコル**: WebAuthn (Web Authentication API)
- **認証器タイプ**: プラットフォーム認証器のみ（セキュリティキー等は非対応）
- **ユーザー検証**: 必須
- **暗号化方式**: ES256 (ECDSA-SHA256)、RS256 (RSA-SHA256)

---

## 🛠 実装機能

### 1. 生体認証設定
- **自動検出**: 端末の生体認証サポートを自動判定
- **有効化**: ワンクリックで生体認証を有効化
- **無効化**: いつでも簡単に無効化可能
- **テスト機能**: 設定後の動作テストが可能

### 2. 認証フロー
- **高速ログイン**: 生体認証でワンタッチログイン
- **フォールバック**: 生体認証失敗時は通常ログインに自動遷移
- **セッション管理**: 既存のSupabase認証と連携
- **エラーハンドリング**: わかりやすいエラーメッセージ

### 3. セキュリティ
- **ローカル保存**: 認証情報は端末内にのみ保存
- **暗号化**: 生体認証データは暗号化されて保護
- **プライバシー保護**: サーバーに生体情報は送信されない
- **有効期限**: セキュリティのため定期的な再認証を推奨

---

## 🚀 使用方法

### 初期設定
1. **アプリにログイン**
   - 通常のメール・パスワードでログイン
   
2. **設定画面へ移動**
   - メニュー → 設定 → セキュリティ設定
   
3. **生体認証を有効化**
   - 「生体認証」セクションのトグルをON
   - 端末の生体認証プロンプトに従って認証
   - 認証成功で設定完了

### 日常利用
1. **ログイン画面でワンタッチ**
   - 生体認証ボタンをタップ
   - Face ID/Touch ID等で認証
   - 即座にアプリ内にログイン

2. **エラー時の対応**
   - 生体認証に失敗した場合
   - 通常のメール・パスワード入力でログイン

### 設定変更・無効化
1. **セキュリティ設定画面**
   - 設定 → セキュリティ設定
   
2. **無効化**
   - トグルをOFFにして即座に無効化
   
3. **再設定**
   - いつでも再度有効化可能

---

## 💻 技術詳細

### アーキテクチャ
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  React Frontend │───▶│  WebAuthn API    │───▶│ OS Biometric    │
│                 │    │                  │    │ (Face ID/Touch) │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │
         ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Local Storage   │    │  Supabase Auth   │    │ User Session    │
│ (Credentials)   │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### ファイル構成
```
src/
├── lib/
│   └── biometric-auth.ts       # 生体認証ライブラリ
├── hooks/
│   └── useBiometricAuth.ts     # React Hook
├── app/
│   ├── login/
│   │   └── LoginForm.tsx       # ログイン画面（生体認証ボタン）
│   └── settings/
│       ├── page.tsx            # 設定メイン画面
│       └── security/
│           └── page.tsx        # セキュリティ設定画面
```

### 主要関数
```typescript
// サポート確認
isBiometricSupported(): Promise<boolean>

// 認証情報作成
createBiometricCredential(options): Promise<BiometricAuthResult>

// 生体認証実行
authenticateWithBiometric(credentialId): Promise<BiometricAuthResult>

// 生体認証ログイン
loginWithBiometric(): Promise<boolean>
```

---

## 🔧 開発者向け設定

### 必要な環境
- **HTTPS必須**: WebAuthn APIはHTTPS環境でのみ動作
- **モダンブラウザ**: WebAuthn対応ブラウザが必要
- **対応OS**: iOS 14+、Android 7+、Windows 10+、macOS Big Sur+

### デバッグ方法

#### 1. サポート状況確認
```javascript
// ブラウザコンソールで実行
if (window.PublicKeyCredential) {
  PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
    .then(available => {
      console.log('Biometric support:', available);
    });
} else {
  console.log('WebAuthn not supported');
}
```

#### 2. エラーログ確認
```javascript
// React DevTools または ブラウザコンソール
// useBiometricAuth フックの error プロパティ
// biometric-auth.ts の console.error ログ
```

#### 3. 認証情報確認
```javascript
// ローカルストレージ確認
console.log('Biometric enabled:', localStorage.getItem('biometric_enabled'));
console.log('Credential:', localStorage.getItem('biometric_credential_[USER_ID]'));
```

### トラブルシューティング

#### よくある問題

**1. 「生体認証がサポートされていません」**
- **原因**: HTTP環境、非対応ブラウザ、OS設定
- **解決**: HTTPS環境で実行、対応ブラウザ使用、OS設定確認

**2. 「生体認証に失敗しました」**
- **原因**: ユーザーキャンセル、認証失敗、センサー問題
- **解決**: 再試行、通常ログイン使用

**3. 「認証情報の作成に失敗しました」**
- **原因**: 既存認証情報、セキュリティ制約、端末制限
- **解決**: 既存設定リセット、生体認証再設定

**4. 「セッションの有効期限が切れています」**
- **原因**: Supabaseセッション期限切れ
- **解決**: 通常ログインで新しいセッション作成

#### デバッグコマンド
```bash
# 開発環境でのテスト
npm run dev
# ブラウザで https://localhost:3001/settings/security にアクセス

# 本番ビルドテスト
npm run build
npm run start
```

---

## 🔒 セキュリティ考慮事項

### データ保護
1. **認証情報の保存場所**
   - ブラウザのLocalStorageに暗号化されて保存
   - サーバーには生体情報を送信しない
   - ユーザーのプライバシーを完全保護

2. **認証フロー**
   - WebAuthn標準プロトコルを使用
   - 公開鍵暗号方式で安全な認証
   - リプレイアタック耐性あり

### セキュリティベストプラクティス
1. **定期的な再認証**
   - セキュリティ向上のため定期的にパスワードログインを促す
   - 長期間未使用時はセッション自動切断

2. **フォールバック認証**
   - 生体認証失敗時は必ず通常認証へフォールバック
   - 複数の認証手段を提供

3. **設定の可逆性**
   - ユーザーがいつでも設定を変更・無効化可能
   - 明確な設定UI提供

---

## 🌟 ユーザーエクスペリエンス

### 設計思想
- **セキュリティと利便性のバランス**
- **直感的なUI/UX**
- **適切なフィードバック**
- **アクセシビリティ対応**

### UI特徴
1. **視覚的フィードバック**
   - 生体認証タイプごとのアイコン表示
   - 読み込み状態の明確な表示
   - 成功/失敗状態の分かりやすい表現

2. **エラーメッセージ**
   - 技術的でない、分かりやすい表現
   - 解決方法の提示
   - 適切なタイミングでの表示

3. **設定フロー**
   - ワンステップでの有効化
   - テスト機能でのすぐ確認
   - 簡単な無効化プロセス

---

## 🔮 将来の拡張

### 予定機能
- **複数認証器サポート**: 複数の生体認証器での認証
- **認証ログ**: 生体認証の使用履歴表示
- **高度な設定**: 認証タイムアウト、再認証間隔の調整
- **企業向け機能**: MDM連携、ポリシー管理

### 技術向上
- **WebAuthn Level 2**: より高度な認証機能
- **Passkeys統合**: Apple/Google Passkeysとの連携
- **クロスデバイス**: 複数デバイス間での認証情報同期

---

## 📞 サポート

### 問題報告
生体認証に関する問題や改善提案は、以下の情報を含めてご報告ください：

1. **環境情報**
   - OS・バージョン
   - ブラウザ・バージョン
   - 端末情報

2. **問題詳細**
   - 発生した問題
   - 再現手順
   - エラーメッセージ

3. **ログ情報**
   - ブラウザコンソールログ
   - 設定状況

### リソース
- **WebAuthn仕様**: [W3C Web Authentication](https://www.w3.org/TR/webauthn/)
- **MDN ドキュメント**: [Web Authentication API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API)
- **Can I Use**: [WebAuthn Browser Support](https://caniuse.com/webauthn)

---

🔐 **安全で快適なフラッシュカード学習をお楽しみください！**