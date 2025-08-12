import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = await createClient();

    // ユーザーの認証状態を確認
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    console.log('Auth check:', { user: user?.email, authError });
    
    if (authError || !user) {
      console.log('Unauthorized access attempt:', authError);
      // 認証が失敗した場合は401を返す
      return NextResponse.json({ 
        error: 'Unauthorized', 
        message: 'Please log in to access your flashcards',
        authError: authError?.message 
      }, { status: 401 });
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