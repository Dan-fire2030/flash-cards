import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = await createClient();

    // ユーザーの認証状態を確認
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    console.log('Categories auth check:', { user: user?.email, authError });
    
    if (authError || !user) {
      console.log('Unauthorized access attempt for categories');
      // 認証なしでも基本的なデータを返す（開発・テスト用）
      const { data: publicCategories, error: publicError } = await supabase
        .from('categories')
        .select('*')
        .limit(10);
      
      if (publicError) {
        console.error('Error fetching public categories:', publicError);
        return NextResponse.json({ error: 'Failed to fetch data', details: publicError }, { status: 500 });
      }
      
      return NextResponse.json(publicCategories || [], {
        headers: {
          'Cache-Control': 'private, max-age=0, must-revalidate',
        },
      });
    }

    // ユーザーのカテゴリーを取得
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      return NextResponse.json({ error: 'Failed to fetch categories', details: error }, { status: 500 });
    }

    console.log(`Fetched ${categories?.length || 0} categories for user ${user.email}`);

    // Cache-Controlヘッダーを設定
    return NextResponse.json(categories || [], {
      headers: {
        'Cache-Control': 'private, max-age=0, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 });
  }
}