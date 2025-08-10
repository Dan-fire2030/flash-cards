import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const error_description = requestUrl.searchParams.get('error_description')

  // エラーがある場合はログインページにリダイレクト
  if (error) {
    console.error('OAuth error:', error, error_description)
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error_description || error)}`, request.url))
  }

  if (code) {
    try {
      const cookieStore = await cookies()
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value
            },
            set(name: string, value: string, options: Record<string, unknown>) {
              cookieStore.set({ name, value, ...options })
            },
            remove(name: string, options: Record<string, unknown>) {
              cookieStore.delete(name)
            },
          },
        }
      )
      
      console.log('Exchanging code for session...')
      const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (sessionError) {
        console.error('Session exchange error:', sessionError)
        return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(sessionError.message)}`, request.url))
      }
      
      console.log('Session exchange successful, redirecting to home...')
      return NextResponse.redirect(new URL('/', request.url))
    } catch (err) {
      console.error('Callback error:', err)
      return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent('認証エラーが発生しました')}`, request.url))
    }
  }

  // codeがない場合はログインページへ
  return NextResponse.redirect(new URL('/login', request.url))
}