import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

interface SendNotificationRequest {
  userId?: string;
  title: string;
  body: string;
  type:
    | "test"
    | "reminder"
    | "achievement"
    | "goal"
    | "streak"
    | "weekly_summary";
  data?: Record<string, any>;
  scheduleFor?: string; // ISO date string for scheduled notifications
}

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

    // リクエストボディを取得
    const body: SendNotificationRequest = await request.json();
    const { userId, title, body: messageBody, type, data, scheduleFor } = body;

    // バリデーション
    if (!title || !messageBody || !type) {
      return NextResponse.json(
        { success: false, message: "必須フィールドが不足しています" },
        { status: 400 },
      );
    }

    // 管理者権限チェック（必要に応じて）
    const targetUserId = userId || user.id;

    if (scheduleFor) {
      // スケジュール通知の場合はDBに保存
      const { error: scheduleError } = await supabase
        .from("scheduled_notifications")
        .insert({
          user_id: targetUserId,
          notification_type: type,
          title,
          body: messageBody,
          data: data || {},
          scheduled_for: scheduleFor,
        });

      if (scheduleError) {
        console.error("Error scheduling notification:", scheduleError);
        return NextResponse.json(
          { success: false, message: "通知のスケジュールに失敗しました" },
          { status: 500 },
        );
      }

      return NextResponse.json({
        success: true,
        message: "通知をスケジュールしました",
      });
    } else {
      // 即座に送信
      const { data: result, error } = await supabase.functions.invoke(
        "send-notifications",
        {
          body: {
            userId: targetUserId,
            title,
            body: messageBody,
            type,
            data,
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
        message: "通知を送信しました",
        data: result,
      });
    }
  } catch (error) {
    console.error("Send notification error:", error);
    return NextResponse.json(
      { success: false, message: "サーバーエラーが発生しました" },
      { status: 500 },
    );
  }
}
