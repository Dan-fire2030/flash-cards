import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = await createClient();

    // ユーザーの認証状態を確認
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    console.log('Auth check:', { user: user?.email, authError });
    
    if (authError || !user) {
      console.log('Unauthorized access attempt');
      // 認証なしでも基本的なデータを返す（開発・テスト用）
      const { data: publicCards, error: publicError } = await supabase
        .from('flashcards')
        .select('*')
        .limit(10);
      
      if (publicError) {
        console.error('Error fetching public cards:', publicError);
        return NextResponse.json({ error: 'Failed to fetch data', details: publicError }, { status: 500 });
      }
      
      return NextResponse.json(publicCards || [], {
        headers: {
          'Cache-Control': 'private, max-age=0, must-revalidate',
        },
      });
    }

    // ユーザーのカードを取得
    const { data: cards, error } = await supabase
      .from('flashcards')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching cards:', error);
      return NextResponse.json({ error: 'Failed to fetch cards', details: error }, { status: 500 });
    }

    console.log(`Fetched ${cards?.length || 0} cards for user ${user.email}`);

    // Cache-Controlヘッダーを設定
    return NextResponse.json(cards || [], {
      headers: {
        'Cache-Control': 'private, max-age=0, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 });
  }
}