# Supabaseテーブル認証設定ガイド

## 概要
このガイドでは、Supabaseのテーブルを認証済みユーザーのみがアクセスできるように設定する手順を説明します。

## 手順

### 1. Supabase Dashboardでの作業

#### Step 1: SQLエディタを開く
1. [Supabase Dashboard](https://supabase.com/dashboard)にログイン
2. プロジェクトを選択
3. 左メニューから「SQL Editor」を選択

#### Step 2: マイグレーションSQLを実行
以下のSQLを順番に実行してください：

```sql
-- 1. categoriesテーブルにuser_idカラムを追加
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. flashcardsテーブルにuser_idカラムを追加
ALTER TABLE flashcards 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. インデックスの作成
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_user_id ON flashcards(user_id);
```

#### Step 3: RLS（Row Level Security）を有効化
1. 左メニューから「Authentication」→「Policies」を選択
2. 各テーブルでRLSを有効化：
   - `categories`テーブルのRLSをON
   - `flashcards`テーブルのRLSをON

#### Step 4: RLSポリシーを作成
SQL Editorで以下を実行：

```sql
-- categoriesテーブルのポリシー
CREATE POLICY "Users can view own categories" ON categories
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own categories" ON categories
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories" ON categories
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories" ON categories
    FOR DELETE USING (auth.uid() = user_id);

-- flashcardsテーブルのポリシー
CREATE POLICY "Users can view own flashcards" ON flashcards
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own flashcards" ON flashcards
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own flashcards" ON flashcards
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own flashcards" ON flashcards
    FOR DELETE USING (auth.uid() = user_id);
```

### 2. 既存データの処理（重要）

既存のデータがある場合、以下のいずれかを選択：

#### オプションA: 特定のユーザーに割り当てる
```sql
-- あなたのユーザーIDを確認
SELECT id, email FROM auth.users;

-- 既存データを特定のユーザーに割り当て
UPDATE categories SET user_id = 'YOUR-USER-ID' WHERE user_id IS NULL;
UPDATE flashcards SET user_id = 'YOUR-USER-ID' WHERE user_id IS NULL;
```

#### オプションB: 既存データを削除
```sql
DELETE FROM flashcards WHERE user_id IS NULL;
DELETE FROM categories WHERE user_id IS NULL;
```

### 3. アプリケーションコードの確認

現在のコードは既に`user_id`を設定していますが、以下を確認してください：

1. **カテゴリ作成時**: user_idを追加
2. **カード作成時**: user_idを追加（✅ 既に実装済み）
3. **データ取得時**: 自動的にユーザーのデータのみ取得されます

### 4. テスト

1. **異なるユーザーでログイン**して、それぞれのデータが分離されていることを確認
2. **新規カード/カテゴリ作成**が正常に動作することを確認
3. **既存データの表示**が正しいユーザーのみに制限されていることを確認

## トラブルシューティング

### エラー: "new row violates row-level security policy"
- user_idが正しく設定されていない
- 解決: コードでuser?.idが正しく渡されているか確認

### データが表示されない
- RLSポリシーが厳しすぎる可能性
- 解決: ポリシーを確認し、auth.uid()が正しく機能しているか確認

### パフォーマンスが遅い
- インデックスが作成されていない
- 解決: user_idカラムにインデックスを作成

## セキュリティの確認

✅ RLSが有効になっている
✅ 各ユーザーは自分のデータのみアクセス可能
✅ user_idはauth.users テーブルと連携
✅ カスケード削除でユーザー削除時にデータも削除される