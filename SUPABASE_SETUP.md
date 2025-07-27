# Supabaseストレージの設定

このフラッシュカードアプリケーションは画像アップロードにSupabase Storageを使用しています。以下の手順に従ってストレージバケットを設定してください。

## 1. ストレージバケットの作成

1. Supabaseプロジェクトのダッシュボードにアクセス
2. 左側のサイドバーから「Storage」を選択
3. 「New bucket」をクリック
4. 以下の設定でバケットを作成：
   - **Name**: `images`
   - **Public bucket**: ✅ 有効にする（チェックを入れる）
   - **File size limit**: 5MB
   - **Allowed MIME types**: `image/*`

## 2. バケットポリシーの設定

バケット作成後、ポリシーを設定する必要があります：

1. 「images」バケットをクリック
2. 「Policies」タブに移動
3. 以下のポリシーを作成：

### アップロードポリシー (INSERT)
```sql
-- 認証されたユーザーに画像のアップロードを許可
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'images');
```

### パブリック読み取りポリシー (SELECT)
```sql
-- 画像の公開アクセスを許可
CREATE POLICY "Allow public access" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'images');
```

## 3. 環境変数の確認

`.env.local`ファイルに以下の環境変数が設定されていることを確認してください：

```
NEXT_PUBLIC_SUPABASE_URL=あなたのsupabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=あなたのsupabase_anon_key
```

## よくある問題

1. **「Bucket not found」エラー**: 「images」という名前のバケットが存在しません。手順1に従って作成してください。
2. **「Permission denied」エラー**: バケットポリシーが設定されていません。手順2のポリシーを追加してください。
3. **「Invalid API key」エラー**: 環境変数が正しく設定されているか確認してください。