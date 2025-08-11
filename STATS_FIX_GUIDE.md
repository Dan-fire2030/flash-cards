# 統計機能の修正ガイド

## 問題
統計ページでデータが表示されない問題を修正しました。
原因は`study_sessions`テーブルに`user_id`カラムがなく、ユーザーごとのデータを区別できなかったためです。

## 修正内容

### 1. データベースマイグレーション
以下のSQLを実行して、テーブルを更新してください：

```bash
# Supabaseダッシュボードから実行する場合
1. Supabaseダッシュボードにログイン
2. SQL Editorを開く
3. 以下のファイルの内容を実行：
   supabase/migrations/add_user_id_to_study_sessions.sql
```

### 2. 修正したファイル
- `src/app/stats/page.tsx` - user_idでフィルタリング
- `src/app/study/OfflineStudyPage.tsx` - study_session作成時にuser_idを追加

### 3. マイグレーション内容
- `study_sessions`テーブルに`user_id`カラムを追加
- `study_records`テーブルに`user_id`カラムを追加
- RLS（Row Level Security）ポリシーを設定
- 各ユーザーが自分のデータのみアクセス可能に

## 動作確認
1. Supabaseで上記SQLを実行
2. `npm run dev`でアプリを起動
3. 学習ページで何枚かカードを学習
4. 統計ページで学習データが表示されることを確認

## 注意事項
- 既存の学習データはuser_idがNULLのため表示されません
- 新規に学習したデータから統計に反映されます