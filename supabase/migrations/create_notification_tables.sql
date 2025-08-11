-- プッシュ通知関連のテーブル作成

-- 1. ユーザーのFCMトークンを管理するテーブル
CREATE TABLE user_fcm_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  fcm_token TEXT NOT NULL,
  device_info JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, fcm_token)
);

-- 2. ユーザーの通知設定を管理するテーブル
CREATE TABLE user_notification_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  
  -- 学習リマインダー設定
  study_reminders_enabled BOOLEAN DEFAULT true,
  study_reminder_times JSONB DEFAULT '["09:00", "18:00"]', -- 複数時刻対応
  study_reminder_days JSONB DEFAULT '["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]',
  
  -- 目標達成通知設定
  goal_notifications_enabled BOOLEAN DEFAULT true,
  daily_goal_cards INTEGER DEFAULT 10,
  weekly_goal_days INTEGER DEFAULT 5,
  accuracy_goal_percentage INTEGER DEFAULT 80,
  
  -- その他の通知設定
  achievement_notifications_enabled BOOLEAN DEFAULT true,
  streak_notifications_enabled BOOLEAN DEFAULT true,
  weekly_summary_enabled BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 送信した通知のログテーブル
CREATE TABLE notification_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL, -- 'study_reminder', 'goal_achievement', etc.
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fcm_message_id TEXT,
  status VARCHAR(20) DEFAULT 'sent', -- 'sent', 'delivered', 'failed'
  error_message TEXT
);

-- 4. スケジュールされた通知を管理するテーブル
CREATE TABLE scheduled_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  is_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX idx_user_fcm_tokens_user_id ON user_fcm_tokens(user_id);
CREATE INDEX idx_user_fcm_tokens_active ON user_fcm_tokens(is_active) WHERE is_active = true;
CREATE INDEX idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX idx_notification_logs_type ON notification_logs(notification_type);
CREATE INDEX idx_notification_logs_sent_at ON notification_logs(sent_at);
CREATE INDEX idx_scheduled_notifications_user_id ON scheduled_notifications(user_id);
CREATE INDEX idx_scheduled_notifications_scheduled_for ON scheduled_notifications(scheduled_for);
CREATE INDEX idx_scheduled_notifications_pending ON scheduled_notifications(is_sent, scheduled_for) WHERE is_sent = false;

-- 更新日時の自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_fcm_tokens_updated_at 
    BEFORE UPDATE ON user_fcm_tokens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_notification_settings_updated_at 
    BEFORE UPDATE ON user_notification_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) の有効化
ALTER TABLE user_fcm_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_notifications ENABLE ROW LEVEL SECURITY;

-- user_fcm_tokensのRLSポリシー
CREATE POLICY "Users can manage own FCM tokens" ON user_fcm_tokens
    FOR ALL USING (auth.uid() = user_id);

-- user_notification_settingsのRLSポリシー
CREATE POLICY "Users can manage own notification settings" ON user_notification_settings
    FOR ALL USING (auth.uid() = user_id);

-- notification_logsのRLSポリシー（読み取りのみ）
CREATE POLICY "Users can view own notification logs" ON notification_logs
    FOR SELECT USING (auth.uid() = user_id);

-- scheduled_notificationsのRLSポリシー（サーバーからの操作用）
CREATE POLICY "Service role can manage scheduled notifications" ON scheduled_notifications
    FOR ALL USING (true); -- サービスロールからのみアクセス

-- デフォルト設定を自動作成するトリガー
CREATE OR REPLACE FUNCTION create_default_notification_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_notification_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ユーザー作成時に自動で通知設定を作成
-- 注意: auth.usersテーブルは読み取り専用なので、アプリケーション側で処理