# カテゴリ・カード作成の修正ガイド

## 問題
カテゴリやカードの作成・表示が失敗していた問題を修正しました。
原因は全てのデータ操作でuser_idを指定していなかったためです。

## 修正したファイル

### 1. カテゴリ関連
- `src/app/categories/new/page.tsx`
  - カテゴリ作成時にuser_idを追加
  - 親カテゴリ読み込み時にuser_idでフィルタリング

- `src/app/categories/[id]/edit/page.tsx`
  - 編集時のカテゴリ読み込みにuser_idフィルタを追加

- `src/app/categories/page.tsx`
  - カテゴリ一覧表示時にuser_idでフィルタリング
  - カードカウント取得時にuser_idでフィルタリング

### 2. カード関連
- `src/app/cards/new/page.tsx`
  - カード作成時にuser_idを追加
  - カテゴリ選択肢読み込み時にuser_idでフィルタリング

- `src/app/cards/page.tsx`
  - カード一覧表示時にuser_idでフィルタリング
  - カテゴリ選択肢読み込み時にuser_idでフィルタリング

## 主な変更内容

### パターン1: データ作成時
```typescript
// 修正前
const { error } = await supabase
  .from('categories')
  .insert({
    name: name.trim(),
    parent_id: parentId || null
  });

// 修正後
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  alert('ログインが必要です');
  router.push('/login');
  return;
}

const { error } = await supabase
  .from('categories')
  .insert({
    name: name.trim(),
    parent_id: parentId || null,
    user_id: user.id
  });
```

### パターン2: データ取得時
```typescript
// 修正前
const { data, error } = await supabase
  .from('categories')
  .select('*')
  .order('name');

// 修正後
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  console.error('User not authenticated');
  return;
}

const { data, error } = await supabase
  .from('categories')
  .select('*')
  .eq('user_id', user.id)
  .order('name');
```

## 必要な前提条件
以下のマイグレーションが既に実行済みであることを確認してください：
- `supabase/migrations/add_user_authentication.sql`

## 動作確認
1. ログイン後にカテゴリ作成が正常に動作することを確認
2. 作成したカテゴリが一覧に表示されることを確認
3. カード作成でカテゴリ選択肢が表示されることを確認
4. 作成したカードが一覧に表示されることを確認

## 注意事項
- 既存データは各ユーザーに表示されません（user_idがNULL）
- 必要に応じて既存データの移行を行ってください