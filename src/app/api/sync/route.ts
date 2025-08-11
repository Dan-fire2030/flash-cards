import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST() {
  try {
    const supabase = await createClient();

    // ユーザーの認証状態を確認
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // カードとカテゴリーのデータを同時に取得
    const [cardsResult, categoriesResult] = await Promise.all([
      supabase
        .from('cards')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true })
    ]);

    if (cardsResult.error || categoriesResult.error) {
      console.error('Error syncing data:', cardsResult.error || categoriesResult.error);
      return NextResponse.json({ error: 'Failed to sync data' }, { status: 500 });
    }

    // 同期完了のレスポンス
    return NextResponse.json({
      message: 'Data synced successfully',
      timestamp: new Date().toISOString(),
      data: {
        cards: cardsResult.data?.length || 0,
        categories: categoriesResult.data?.length || 0
      }
    });
  } catch (error) {
    console.error('Unexpected error during sync:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}