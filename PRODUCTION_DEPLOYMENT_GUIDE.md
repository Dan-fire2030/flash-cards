# 本番環境デプロイメントガイド

## 📋 概要
フラッシュカードアプリを本番環境にデプロイするための完全ガイドです。プッシュ通知機能を含む全ての機能が正常に動作するようにセットアップします。

---

## 🛠 1. 前提条件

### 必要なアカウント・サービス
- [ ] **Vercel アカウント** (デプロイ先)
- [ ] **Supabase アカウント** (データベース・認証)
- [ ] **Firebase アカウント** (プッシュ通知)
- [ ] **GitHub アカウント** (コード管理)

---

## 🔥 2. Firebase セットアップ

### 2.1 プロジェクト作成
1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. 「プロジェクトを追加」をクリック
3. プロジェクト名: `flash-cards-prod` (任意)
4. Google Analytics設定（オプション）

### 2.2 Web アプリ追加
1. プロジェクトダッシュボードで「</> Web」アイコンをクリック
2. アプリ名: `flash-cards-web-prod`
3. 「Firebase Hosting も設定する」はチェックしない
4. 「アプリを登録」をクリック

### 2.3 Firebase 設定情報の取得
以下の情報をメモ：
```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "flash-cards-prod.firebaseapp.com",
  projectId: "flash-cards-prod",
  storageBucket: "flash-cards-prod.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef..."
};
```

### 2.4 Cloud Messaging 設定
1. 左メニューから「Messaging」選択
2. 「使用を開始」をクリック
3. 「設定」タブ → 「Web 設定」
4. 「Web プッシュ証明書」を生成
5. **VAPID キー**をコピーして保存

### 2.5 サービスアカウントキー生成
1. プロジェクト設定 → 「サービス アカウント」タブ
2. 「新しい秘密鍵の生成」をクリック
3. JSONファイルをダウンロード
4. **重要**: このJSONファイルは機密情報です

### 2.6 本番ドメインの承認
1. プロジェクト設定 → 「一般」タブ
2. 「承認済みドメイン」に本番ドメインを追加
   - 例: `flash-cards-app.vercel.app`

---

## 🗄 3. Supabase セットアップ

### 3.1 データベースマイグレーション実行
1. [Supabase Dashboard](https://supabase.com/dashboard) にアクセス
2. プロジェクト `rzuglalkjqhliepipeyx` を選択
3. 「SQL Editor」をクリック
4. 新しいクエリを作成
5. `supabase/migrations/create_notification_tables.sql` の内容全体をコピペ
6. 「RUN」をクリックして実行

### 3.2 Edge Functions デプロイ

#### 方法A: Supabase Dashboard（推奨）
1. 「Edge Functions」メニューを選択
2. 「Create a new function」をクリック

**send-notification 関数**:
- 関数名: `send-notification`
- `supabase/functions/send-notification/index.ts` の内容をコピペ

**schedule-notifications 関数**:
- 関数名: `schedule-notifications`  
- `supabase/functions/schedule-notifications/index.ts` の内容をコピペ

#### 方法B: CLI使用
```bash
# Supabase CLI インストール
npm install -g supabase

# ログイン
supabase login

# プロジェクトにリンク
supabase link --project-ref rzuglalkjqhliepipeyx

# 関数デプロイ
supabase functions deploy send-notification
supabase functions deploy schedule-notifications
```

### 3.3 環境変数設定
Supabase Dashboard → Edge Functions → Environment Variables で以下を設定:

```
FCM_PROJECT_ID=flash-cards-prod
FCM_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"flash-cards-prod",...}
```

**注意**: `FCM_SERVICE_ACCOUNT_KEY` は手順2.5でダウンロードしたJSONファイルの内容を1行にまとめて設定

### 3.4 定期実行設定（Cron Jobs）
1. 「Database」→ 「Extensions」
2. `pg_cron` 拡張機能を有効化
3. 「SQL Editor」で以下を実行:

```sql
SELECT cron.schedule(
  'send-study-reminders-prod',
  '*/30 * * * *',
  $$SELECT net.http_post(
    url := 'https://rzuglalkjqhliepipeyx.supabase.co/functions/v1/schedule-notifications',
    headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  );$$
);
```

**重要**: `YOUR_SERVICE_ROLE_KEY` を実際のService Role Keyに置き換え
- Supabase Dashboard → Settings → API → service_role key をコピー

---

## 🚀 4. Vercel デプロイメント

### 4.1 GitHub リポジトリ準備
1. コードをGitHubにプッシュ
2. `.env.local` は `.gitignore` に含まれていることを確認

### 4.2 Vercel プロジェクト作成
1. [Vercel Dashboard](https://vercel.com/dashboard) にアクセス
2. 「New Project」をクリック
3. GitHubリポジトリを選択
4. プロジェクト設定:
   - **Framework Preset**: Next.js
   - **Root Directory**: `.` (デフォルト)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next` (デフォルト)

### 4.3 環境変数設定
Vercel Dashboard → Project Settings → Environment Variables で以下を設定:

```env
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=https://rzuglalkjqhliepipeyx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Firebase設定（手順2.3で取得）
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=flash-cards-prod.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=flash-cards-prod
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=flash-cards-prod.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef...
NEXT_PUBLIC_FIREBASE_VAPID_KEY=BMu8cRd4_gPBgFPEt... (手順2.4で取得)

# 本番環境設定
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### 4.4 カスタムドメイン設定（オプション）
1. Vercel Dashboard → Project → Domains
2. カスタムドメインを追加
3. DNS設定を行う
4. SSL証明書が自動で発行されることを確認

---

## 📱 5. PWA 設定

### 5.1 manifest.json 確認
`public/manifest.json` で以下を本番用に更新:
```json
{
  "start_url": "https://your-app.vercel.app",
  "scope": "https://your-app.vercel.app/"
}
```

### 5.2 Service Worker 確認
`public/firebase-messaging-sw.js` でFirebase設定が正しいことを確認

---

## ⚙️ 6. セキュリティ設定

### 6.1 Supabase Row Level Security (RLS)
すべての通知関連テーブルでRLSが有効になっていることを確認:
- `user_fcm_tokens`
- `user_notification_settings`  
- `notification_logs`
- `scheduled_notifications`

### 6.2 Firebase セキュリティルール
Firebase Console → プロジェクト設定 → 「全般」タブ → 「制限」で:
- **承認済みドメイン**に本番ドメインのみを設定
- 不要なドメインを削除

### 6.3 環境変数セキュリティ
- [ ] `.env.local` がGitにコミットされていないことを確認
- [ ] Firebase Service Account Key が適切に保護されていることを確認
- [ ] Supabase Service Role Key が適切に設定されていることを確認

---

## 🧪 7. 本番環境テスト

### 7.1 基本機能テスト
- [ ] ユーザー登録・ログイン
- [ ] フラッシュカード作成・編集・削除
- [ ] カテゴリ管理
- [ ] 学習機能
- [ ] 統計表示
- [ ] オフライン機能

### 7.2 プッシュ通知テスト
1. `/settings/notifications` にアクセス
2. 「通知を許可」をクリック
3. 各種設定を変更
4. 「テスト送信」で通知が届くことを確認
5. 学習リマインダーが指定時間に届くことを確認

### 7.3 PWA テスト
- [ ] 「ホーム画面に追加」が表示される
- [ ] オフラインで基本機能が動作する
- [ ] Service Worker が正常に動作する

---

## 🔍 8. モニタリング・ログ

### 8.1 Vercel Analytics
1. Vercel Dashboard → Project → Analytics
2. パフォーマンスとエラーを監視

### 8.2 Supabase Logs
1. Supabase Dashboard → Logs
2. Edge Functions のログを確認:
```bash
# 通知送信ログ
supabase functions logs send-notification

# スケジュール実行ログ  
supabase functions logs schedule-notifications
```

### 8.3 Firebase Analytics
Firebase Console → Analytics でユーザー行動を分析

---

## 🚨 9. トラブルシューティング

### よくある問題と解決方法

#### プッシュ通知が送信されない
1. **チェック項目**:
   - Firebase VAPID キーが正しく設定されているか
   - Service Account Key が正しく設定されているか
   - ユーザーが通知許可をしているか
   - Edge Functions が正常にデプロイされているか

2. **デバッグ方法**:
   - ブラウザのコンソールでエラーを確認
   - Supabase Edge Functions のログを確認
   - Firebase Console でメッセージ送信履歴を確認

#### データベースエラー
1. **チェック項目**:
   - マイグレーションが正常に実行されているか
   - RLS ポリシーが正しく設定されているか
   - 環境変数が正しく設定されているか

2. **デバッグ方法**:
   - Supabase SQL Editor でテーブル存在を確認
   - ブラウザのNetwork タブでAPI レスポンスを確認

#### PWA が動作しない
1. **チェック項目**:
   - HTTPS で配信されているか
   - Service Worker が正しく登録されているか
   - manifest.json が正しく配置されているか

2. **デバッグ方法**:
   - Chrome DevTools → Application → Service Workers
   - Chrome DevTools → Application → Manifest

---

## 📝 10. デプロイチェックリスト

### 🔥 Firebase
- [ ] プロジェクト作成完了
- [ ] Web アプリ登録完了
- [ ] Cloud Messaging 有効化
- [ ] VAPID キー取得
- [ ] サービスアカウントキー取得
- [ ] 本番ドメイン承認済み

### 🗄 Supabase  
- [ ] データベースマイグレーション実行
- [ ] Edge Functions デプロイ (`send-notification`, `schedule-notifications`)
- [ ] 環境変数設定 (`FCM_PROJECT_ID`, `FCM_SERVICE_ACCOUNT_KEY`)
- [ ] Cron Job 設定

### 🚀 Vercel
- [ ] プロジェクト作成完了
- [ ] 全環境変数設定完了
- [ ] カスタムドメイン設定（必要な場合）
- [ ] HTTPS 証明書確認

### 🧪 テスト
- [ ] 基本機能テスト完了
- [ ] プッシュ通知テスト完了
- [ ] PWA 機能テスト完了
- [ ] セキュリティチェック完了

### 📊 監視
- [ ] Vercel Analytics 設定
- [ ] Supabase ログ監視設定
- [ ] Firebase Analytics 設定

---

## 🎯 完了

全ての手順を完了すると、以下の機能が本番環境で利用可能になります:

✅ **フラッシュカード学習アプリ**
- ユーザー認証・管理
- カード・カテゴリ管理
- 学習セッション・統計
- オフライン機能

✅ **プッシュ通知システム**
- 学習リマインダー通知
- 目標達成通知
- カスタマイズ可能な通知設定

✅ **PWA 機能**
- ホーム画面への追加
- オフライン動作
- ネイティブアプリ風のUX

---

## 📞 サポート

問題が発生した場合は以下を確認:
1. 各サービスのログとエラーメッセージ
2. ブラウザのデベロッパーツール
3. 環境変数の設定
4. ネットワーク接続とHTTPS設定

**重要**: 機密情報（API キー、サービスアカウントキーなど）は適切に保護し、決して公開リポジトリにコミットしないでください。