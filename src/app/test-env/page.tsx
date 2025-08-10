'use client'

export default function TestEnvPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">環境変数チェック</h1>
      <div className="space-y-2">
        <p>
          <strong>NEXT_PUBLIC_SUPABASE_URL:</strong>{' '}
          {supabaseUrl ? (
            <span className="text-green-600">{supabaseUrl}</span>
          ) : (
            <span className="text-red-600">未設定</span>
          )}
        </p>
        <p>
          <strong>NEXT_PUBLIC_SUPABASE_ANON_KEY:</strong>{' '}
          {hasAnonKey ? (
            <span className="text-green-600">設定済み</span>
          ) : (
            <span className="text-red-600">未設定</span>
          )}
        </p>
        <p className="mt-4">
          <strong>現在のOrigin:</strong> {typeof window !== 'undefined' ? window.location.origin : 'サーバーサイド'}
        </p>
      </div>
      
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-2">Supabase設定の確認事項：</h2>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>Supabase Dashboard → Authentication → Providers → Google が有効になっているか</li>
          <li>Google Cloud ConsoleのOAuth 2.0クライアントIDとシークレットが設定されているか</li>
          <li>Redirect URLsに <code>{typeof window !== 'undefined' ? window.location.origin : 'YOUR_DOMAIN'}/auth/callback</code> が追加されているか</li>
          <li>Site URLが正しく設定されているか</li>
        </ol>
      </div>
    </div>
  )
}