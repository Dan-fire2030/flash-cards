-- Supabase Storage Policies for images bucket

-- 1. アップロードポリシー（全てのユーザーに許可）
CREATE POLICY "Allow public uploads" ON storage.objects
FOR INSERT TO public
WITH CHECK (bucket_id = 'images');

-- 2. 読み取りポリシー（全てのユーザーに許可）
CREATE POLICY "Allow public access" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'images');

-- 3. 削除ポリシー（必要に応じて）
CREATE POLICY "Allow public delete" ON storage.objects
FOR DELETE TO public
USING (bucket_id = 'images');

-- 注意: より安全にしたい場合は、以下のように認証ユーザーのみに制限できます
-- CREATE POLICY "Allow authenticated uploads" ON storage.objects
-- FOR INSERT TO authenticated
-- WITH CHECK (bucket_id = 'images');