# フラッシュカードアプリ プッシュ通知セットアップガイド

このガイドでは、フラッシュカードアプリでプッシュ通知機能を完全にセットアップする方法を説明します。

## 🚀 概要

このアプリでは以下の通知機能が利用できます：

- **学習リマインダー**: ユーザーが設定した時間に学習を促す通知
- **目標達成通知**: 日次/週次の学習目標達成時の通知
- **連続学習記録通知**: 学習継続日数の記録更新通知
- **週間サマリー通知**: 毎週の学習成果まとめ通知
- **達成バッジ通知**: 新しいバッジ獲得時の通知

## 📋 必要なサービス

1. **Firebase** - FCM (Firebase Cloud Messaging) による通知配信
2. **Supabase** - ユーザー管理、通知設定保存、Edge Functions

## 🔧 セットアップ手順

### 1. Firebase プロジェクト設定

#### 1.1 Firebase プロジェクト作成
1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. 「プロジェクトを追加」をクリック
3. プロジェクト名を入力（例: flash-cards-app）
4. Google Analytics は任意で有効化

#### 1.2 FCM 設定
1. Firebase Console で「プロジェクトの設定」→「クラウド メッセージング」タブ
2. 「ウェブプッシュ証明書」セクションで「証明書を生成」
3. 生成された VAPID キーをコピー

#### 1.3 サービス アカウント キー生成
1. Firebase Console で「プロジェクトの設定」→「サービス アカウント」タブ
2. 「新しい秘密鍵の生成」をクリック
3. JSON ファイルをダウンロード
4. このJSONの内容を後でSupabase Edge Functionsで使用

#### 1.4 ウェブアプリを追加
1. Firebase Console で「プロジェクトの設定」→「全般」タブ
2. 「アプリを追加」→「ウェブ」を選択
3. アプリニックネームを入力
4. 「Firebase Hosting も設定する」はチェックしない
5. 設定オブジェクトが表示されるので、値をコピー

### 2. 環境変数設定

#### 2.1 Next.js 環境変数
`.env.local` ファイルを作成し、以下を設定：

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key
```

#### 2.2 Supabase Edge Functions 環境変数
Supabase Dashboard で以下の環境変数を設定：

```bash
FCM_PROJECT_ID=your_firebase_project_id
FCM_SERVICE_ACCOUNT_KEY={"type":"service_account",...} # JSON全体
```

### 3. データベース マイグレーション

Supabase で以下のマイグレーションを実行：

```sql
-- 通知関連テーブルを作成
-- ファイル: supabase/migrations/create_notification_tables.sql の内容を実行
```

### 4. Supabase Edge Functions デプロイ

```bash
# Supabase CLI がインストールされていない場合
npm install -g supabase

# プロジェクトにログイン
supabase login

# Edge Functions をデプロイ
supabase functions deploy send-notifications
supabase functions deploy notification-scheduler

# 環境変数を設定
supabase secrets set FCM_PROJECT_ID=your_project_id
supabase secrets set FCM_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
```

### 5. 通知スケジューラー設定

#### 5.1 GitHub Actions を使用した定期実行
`.github/workflows/notification-scheduler.yml` を作成：

```yaml
name: Notification Scheduler

on:
  schedule:
    # 毎時間実行（UTC時間）
    - cron: '0 * * * *'
  workflow_dispatch: # 手動実行可能

jobs:
  send-notifications:
    runs-on: ubuntu-latest
    steps:
      - name: Send scheduled notifications
        run: |
          curl -X POST "https://your-supabase-project.supabase.co/functions/v1/notification-scheduler" \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
            -H "Content-Type: application/json"
```

#### 5.2 代替: Cron ジョブサービス
- [Cron-job.org](https://cron-job.org/)
- [EasyCron](https://www.easycron.com/)
- [Uptime Robot](https://uptimerobot.com/) (ヘルスチェック機能)

などを使用して、以下のURLに定期的にPOSTリクエストを送信：
```
https://your-supabase-project.supabase.co/functions/v1/notification-scheduler
```

### 6. Service Worker 設定確認

`public/firebase-messaging-sw.js` が正しく配置されていることを確認。このファイルはすでに設定済みです。

## 🧪 テスト手順

### 1. 基本テスト
1. アプリにログイン
2. 設定 → 通知設定 ページを開く
3. 「通知を許可」ボタンをクリック
4. ブラウザの通知許可ダイアログで「許可」を選択
5. 「テスト送信」ボタンをクリック
6. 通知が表示されることを確認

### 2. 学習リマインダーテスト
1. 通知設定で学習リマインダーを有効化
2. 現在時刻から1〜2分後の時間を設定
3. 「学習リマインダー」ボタンをクリック
4. 設定した時間に通知が届くことを確認

### 3. 目標達成通知テスト
1. 学習セッションを完了
2. API または管理画面から目標達成通知を送信
3. 通知が正しく表示されることを確認

## 🔍 トラブルシューティング

### よくある問題と解決方法

#### 1. 通知が届かない
- ブラウザの通知許可状態を確認
- FCM トークンが正しく保存されているかチェック
- ブラウザの開発者ツールでエラーログを確認
- Service Worker が正しく登録されているか確認

#### 2. Firebase 接続エラー
- 環境変数が正しく設定されているか確認
- Firebase プロジェクトの設定を再確認
- VAPID キーが正しく設定されているか確認

#### 3. Supabase Edge Function エラー
- Edge Function のログを確認
- 環境変数 (FCM_SERVICE_ACCOUNT_KEY) が正しく設定されているか確認
- JWT 署名エラーの場合、サービスアカウントキーの形式を確認

#### 4. スケジューラーが動作しない
- Cron ジョブまたは GitHub Actions が正しく設定されているか確認
- Supabase の Edge Function が正しくデプロイされているか確認
- ログでエラーが発生していないか確認

### デバッグ用 URL

#### Edge Functions テスト
```bash
# 通知送信テスト
curl -X POST "https://your-project.supabase.co/functions/v1/send-notifications" \
  -H "Authorization: Bearer your_service_role_key" \
  -H "Content-Type: application/json" \
  -d '{"userId":"user_id","title":"Test","body":"Test notification","type":"test"}'

# スケジューラーテスト
curl -X POST "https://your-project.supabase.co/functions/v1/notification-scheduler" \
  -H "Authorization: Bearer your_service_role_key"
```

## 📱 モバイル PWA 対応

### iOS Safari
- ホーム画面に追加した PWA では通知が制限される場合があります
- 代替案として Web App Manifest の `display: "standalone"` を使用

### Android Chrome
- PWA は通常のウェブ通知と同様に動作します
- バックグラウンドでも通知が正常に受信されます

## 🔒 セキュリティ考慮事項

1. **環境変数の管理**
   - 本番環境では適切な環境変数管理を行う
   - Firebase サービスアカウントキーは慎重に管理

2. **認証とアクセス制御**
   - API エンドポイントに適切な認証を実装
   - ユーザーは自分の通知のみ管理可能

3. **レート制限**
   - 通知の送信頻度制限を実装
   - DoS 攻撃の防止

## 📊 監視とアナリティクス

### 通知配信の監視
- `notification_logs` テーブルで配信状況を追跡
- 失敗した通知の再送信機能
- 配信レートの監視

### ユーザー行動分析
- 通知クリック率の測定
- 効果的な通知時間の分析
- ユーザーエンゲージメントの改善

## 🚀 今後の拡張予定

- iOS ネイティブアプリ対応
- より高度なパーソナライゼーション
- A/B テストによる通知最適化
- リッチ通知コンテンツ対応

---

このガイドに従ってセットアップを行えば、完全な通知システムが構築できます。問題が発生した場合は、各セクションのトラブルシューティングを参照してください。