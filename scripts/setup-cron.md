# 通知スケジューラーのセットアップ

## 手動セットアップ手順

### 1. マイグレーションを実行
```bash
supabase db push
```

### 2. Edge Functionsをデプロイ
```bash
# 通知送信機能
supabase functions deploy send-notifications

# スケジューラー
supabase functions deploy notification-scheduler
```

### 3. 環境変数を設定
Supabaseダッシュボードで以下の環境変数を設定：

- `FCM_PROJECT_ID`: flash-cards-app-7eff2
- `FCM_SERVICE_ACCOUNT_KEY`: (JSONファイルの内容)

### 4. Cronジョブを設定
pg_cronを使用してスケジューラーを定期実行：

```sql
-- 毎時0分にスケジューラーを実行
SELECT cron.schedule(
  'notification-scheduler',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://your-project-ref.supabase.co/functions/v1/notification-scheduler',
    headers := '{"Authorization": "Bearer ' || 'your-service-role-key' || '"}'::jsonb
  );
  $$
);
```

### 5. 代替案：外部Cronサービス
GitHub Actions、Vercel Cron Jobs、またはcron-job.orgなどを使用：

```yaml
# .github/workflows/notification-scheduler.yml
name: Notification Scheduler
on:
  schedule:
    - cron: '0 * * * *'  # 毎時実行
jobs:
  notify:
    runs-on: ubuntu-latest
    steps:
      - name: Call scheduler
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
            https://your-project-ref.supabase.co/functions/v1/notification-scheduler
```

## テスト方法

### 手動テスト
```bash
# 直接Edge Functionを呼び出し
curl -X POST \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  https://your-project-ref.supabase.co/functions/v1/notification-scheduler
```

### ログ確認
```sql
-- 実行ログを確認
SELECT * FROM notification_logs 
WHERE type = 'scheduler_run' 
ORDER BY sent_at DESC 
LIMIT 10;
```