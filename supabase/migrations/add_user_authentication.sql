-- ============================================
-- 認証済みユーザー向けのテーブル設定
-- ============================================

-- 1. categoriesテーブルにuser_idカラムを追加
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. flashcardsテーブルにuser_idカラムを追加
ALTER TABLE flashcards 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. 既存データのマイグレーション（オプション）
-- 既存のデータがある場合、特定のユーザーに割り当てるか、削除するか選択してください
-- UPDATE categories SET user_id = 'YOUR-USER-ID' WHERE user_id IS NULL;
-- UPDATE flashcards SET user_id = 'YOUR-USER-ID' WHERE user_id IS NULL;

-- 4. RLS (Row Level Security) を有効化
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;

-- 5. categoriesテーブルのRLSポリシー
-- 読み取りポリシー：自分のカテゴリのみ表示
CREATE POLICY "Users can view own categories" ON categories
    FOR SELECT USING (auth.uid() = user_id);

-- 挿入ポリシー：認証済みユーザーは自分のカテゴリを作成可能
CREATE POLICY "Users can insert own categories" ON categories
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 更新ポリシー：自分のカテゴリのみ更新可能
CREATE POLICY "Users can update own categories" ON categories
    FOR UPDATE USING (auth.uid() = user_id);

-- 削除ポリシー：自分のカテゴリのみ削除可能
CREATE POLICY "Users can delete own categories" ON categories
    FOR DELETE USING (auth.uid() = user_id);

-- 6. flashcardsテーブルのRLSポリシー
-- 読み取りポリシー：自分のカードのみ表示
CREATE POLICY "Users can view own flashcards" ON flashcards
    FOR SELECT USING (auth.uid() = user_id);

-- 挿入ポリシー：認証済みユーザーは自分のカードを作成可能
CREATE POLICY "Users can insert own flashcards" ON flashcards
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 更新ポリシー：自分のカードのみ更新可能
CREATE POLICY "Users can update own flashcards" ON flashcards
    FOR UPDATE USING (auth.uid() = user_id);

-- 削除ポリシー：自分のカードのみ削除可能
CREATE POLICY "Users can delete own flashcards" ON flashcards
    FOR DELETE USING (auth.uid() = user_id);

-- 7. インデックスの作成（パフォーマンス改善）
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_user_id ON flashcards(user_id);

-- ============================================
-- 実行後の確認事項：
-- 1. Supabase DashboardでRLSが有効になっていることを確認
-- 2. 各ポリシーが正しく設定されていることを確認
-- 3. アプリケーションコードでuser_idを設定するように更新
-- ============================================