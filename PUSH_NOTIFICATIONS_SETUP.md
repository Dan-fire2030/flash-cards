# プッシュ通知機能セットアップガイド

## 概要
フラッシュカードアプリにプッシュ通知機能を追加しました。Firebase Cloud Messaging (FCM) を使用して、学習リマインダーと目標達成通知を送信します。

## 実装した機能

### 1. 学習リマインダー通知
- ユーザー設定可能な時間と曜日に通知
- 複数の時間設定が可能
- 今日の学習状況に応じたメッセージ

### 2. 目標達成通知
- 1日の目標カード数達成
- 週間学習日数達成
- 正答率目標達成

### 3. その他の通知
- 達成バッジ通知
- 連続学習記録通知
- 週間サマリー通知

## セットアップ手順

### Step 1: Firebase プロジェクトの設定

1. **Firebase Console でプロジェクト作成**
   - https://console.firebase.google.com/
   - 新しいプロジェクトを作成

2. **Web アプリを追加**
   - プロジェクト設定 > 一般 > アプリを追加
   - Web を選択
   - アプリ名を入力（例: flash-cards-web）

3. **Firebase 設定を取得**
   ```javascript
   const firebaseConfig = {
     apiKey: "your-api-key",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abcdef..."
   };
   ```

4. **Cloud Messaging 設定**
   - プロジェクト設定 > Cloud Messaging
   - Web プッシュ証明書を生成
   - VAPID キーをメモ

5. **サービスアカウントキー生成**
   - プロジェクト設定 > サービス アカウント
   - 新しい秘密鍵を生成
   - JSON ファイルをダウンロード

### Step 2: 環境変数の設定

`.env.local` ファイルに以下を追加：

```env
# Firebase 設定
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef...
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your-vapid-key

# FCM サーバー設定（Supabase Edge Functions用）
FCM_SERVER_KEY=your-fcm-server-key
FCM_PROJECT_ID=your-project-id
FCM_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
FCM_ACCESS_TOKEN=your-access-token
```

### Step 3: Supabase セットアップ

1. **データベース マイグレーション実行**
   ```sql
   -- supabase/migrations/create_notification_tables.sql を実行
   ```

2. **Edge Functions デプロイ**
   ```bash
   supabase functions deploy send-notification
   supabase functions deploy schedule-notifications
   ```

3. **環境変数設定**
   ```bash
   supabase secrets set FCM_SERVER_KEY=your-key
   supabase secrets set FCM_PROJECT_ID=your-project-id
   supabase secrets set FCM_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
   supabase secrets set FCM_ACCESS_TOKEN=your-token
   ```

### Step 4: 定期実行設定

学習リマインダーを自動送信するため、`schedule-notifications` Edge Function を定期実行します。

**方法1: Supabase Cron Jobs (推奨)**
```sql
select cron.schedule(
  'send-study-reminders',
  '*/30 * * * *', -- 30分毎に実行
  'select net.http_post(
    url := ''https://your-project.supabase.co/functions/v1/schedule-notifications'',
    headers := ''{"Authorization": "Bearer your-service-role-key"}''::jsonb
  );'
);
```

**方法2: 外部サービス (GitHub Actions, Vercel Cron など)**

### Step 5: Service Worker 設定

1. **Firebase 設定ファイルを更新**
   - `public/firebase-messaging-sw.js` の Firebase config を実際の値に更新

2. **PWA 設定確認**
   - `next.config.ts` でカスタム Service Worker が設定済み

## 使用方法

1. **通知許可**
   - アプリの「通知設定」ページで通知を許可

2. **設定カスタマイズ**
   - リマインダー時間の追加・削除
   - 通知する曜日の選択
   - 目標値の設定

3. **テスト通知**
   - 設定ページの「テスト送信」ボタンで動作確認

## トラブルシューティング

### よくある問題

1. **通知が表示されない**
   - ブラウザの通知許可を確認
   - Service Worker が正常に登録されているか確認
   - Firebase 設定が正しいか確認

2. **FCM トークンが取得できない**
   - HTTPS環境で実行しているか確認
   - VAPID キーが正しく設定されているか確認

3. **Edge Function でエラー**
   - 環境変数が正しく設定されているか確認
   - FCM サーバーキーの権限を確認

### デバッグ方法

1. **ブラウザコンソール**
   ```javascript
   // FCM トークン確認
   navigator.serviceWorker.ready.then(registration => {
     console.log('SW registered:', registration);
   });
   ```

2. **Supabase ログ**
   ```bash
   supabase functions logs send-notification
   supabase functions logs schedule-notifications
   ```

## セキュリティ注意事項

1. **環境変数の管理**
   - Firebase 設定の秘密情報は適切に管理
   - サービスアカウントキーは絶対に公開しない

2. **RLS ポリシー**
   - 通知関連テーブルのRLSが正しく設定されていることを確認

3. **トークン管理**
   - 無効なFCMトークンは自動的に無効化される仕組みを実装済み

## 今後の拡張案

- 学習ストリーク通知
- 友達との学習競争通知
- カスタム通知メッセージ
- 通知統計ダッシュボード