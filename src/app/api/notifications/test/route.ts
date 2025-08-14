import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    // リクエストヘッダーからAuthorizationトークンを取得
    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: "認証トークンがありません" },
        { status: 401 },
      );
    }

    // Supabaseクライアントを作成（サーバーサイド用）
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      },
    );

    // 認証されたユーザーを取得
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: "ユーザーが認証されていません" },
        { status: 401 },
      );
    }

    // Supabase Edge Functionを呼び出し
    const { data, error } = await supabase.functions.invoke(
      "send-notifications",
      {
        body: {
          userId: user.id,
          title: "テスト通知",
          body: "フラッシュカードアプリからのテスト通知です！",
          type: "test",
          data: {
            url: "/study",
          },
        },
      },
    );

    if (error) {
      console.error("Error calling edge function:", error);
      return NextResponse.json(
        {
          success: false,
          message: "Edge Function呼び出しエラー: " + error.message,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "テスト通知を送信しました",
      data,
    });
  } catch (error) {
    console.error("Test notification error:", error);
    return NextResponse.json(
      { success: false, message: "サーバーエラーが発生しました" },
      { status: 500 },
    );
  }
}
