-- 通知設定テーブル
CREATE TABLE IF NOT EXISTS user_notification_settings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    study_reminders_enabled boolean DEFAULT true,
    study_reminder_times text[] DEFAULT '{09:00,18:00}',
    study_reminder_days text[] DEFAULT '{monday,tuesday,wednesday,thursday,friday,saturday,sunday}',
    goal_notifications_enabled boolean DEFAULT true,
    daily_goal_cards integer DEFAULT 10,
    weekly_goal_days integer DEFAULT 5,
    accuracy_goal_percentage integer DEFAULT 80,
    achievement_notifications_enabled boolean DEFAULT true,
    streak_notifications_enabled boolean DEFAULT true,
    weekly_summary_enabled boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id)
);

-- FCMトークン管理テーブル
CREATE TABLE IF NOT EXISTS user_fcm_tokens (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    fcm_token text NOT NULL,
    device_info jsonb DEFAULT '{}',
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, fcm_token)
);

-- 通知履歴テーブル
CREATE TABLE IF NOT EXISTS notification_history (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    body text NOT NULL,
    type text NOT NULL,
    data jsonb DEFAULT '{}',
    sent_at timestamptz DEFAULT now(),
    fcm_response jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now()
);

-- RLS（Row Level Security）を有効化
ALTER TABLE user_notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_fcm_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;

-- RLSポリシー：ユーザーは自分のデータのみアクセス可能
CREATE POLICY "Users can access their own notification settings" ON user_notification_settings
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can access their own FCM tokens" ON user_fcm_tokens
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own notification history" ON notification_history
    FOR SELECT USING (auth.uid() = user_id);

-- サービスロールは全データにアクセス可能（Edge Functions用）
CREATE POLICY "Service role can access all notification settings" ON user_notification_settings
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can access all FCM tokens" ON user_fcm_tokens
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can access all notification history" ON notification_history
    FOR ALL USING (auth.role() = 'service_role');

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_user_notification_settings_user_id ON user_notification_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_fcm_tokens_user_id ON user_fcm_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_fcm_tokens_active ON user_fcm_tokens(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_notification_history_user_id ON notification_history(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_history_sent_at ON notification_history(sent_at);
CREATE INDEX IF NOT EXISTS idx_notification_history_type ON notification_history(type);

-- 更新日時の自動更新用関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 更新日時の自動更新トリガー
CREATE TRIGGER update_user_notification_settings_updated_at 
    BEFORE UPDATE ON user_notification_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_fcm_tokens_updated_at 
    BEFORE UPDATE ON user_fcm_tokens 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();