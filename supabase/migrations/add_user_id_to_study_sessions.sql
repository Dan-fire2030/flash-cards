-- study_sessionsテーブルにuser_id列を追加
ALTER TABLE study_sessions 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 既存データがある場合はNULLを許可（後で削除）
-- 新規データはuser_idが必須になるように制約を追加する予定

-- インデックスを追加
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id ON study_sessions(user_id);

-- study_recordsテーブルにもuser_id列を追加（パフォーマンス向上のため）
ALTER TABLE study_records 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- インデックスを追加
CREATE INDEX IF NOT EXISTS idx_study_records_user_id ON study_records(user_id);

-- RLSポリシーを追加
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_records ENABLE ROW LEVEL SECURITY;

-- study_sessionsのRLSポリシー
CREATE POLICY "Users can view own study sessions" ON study_sessions
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own study sessions" ON study_sessions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own study sessions" ON study_sessions
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own study sessions" ON study_sessions
    FOR DELETE
    USING (auth.uid() = user_id);

-- study_recordsのRLSポリシー
CREATE POLICY "Users can view own study records" ON study_records
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own study records" ON study_records
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own study records" ON study_records
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own study records" ON study_records
    FOR DELETE
    USING (auth.uid() = user_id);