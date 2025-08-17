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

    // ユーザーの通知設定を取得
    const { data: settings, error: settingsError } = await supabase
      .from("user_notification_settings")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (settingsError || !settings) {
      return NextResponse.json(
        { success: false, message: "通知設定が見つかりません" },
        { status: 404 },
      );
    }

    // 学習リマインダーが有効でない場合
    if (!settings.study_reminders_enabled) {
      return NextResponse.json(
        { success: false, message: "学習リマインダーが無効です" },
        { status: 400 },
      );
    }

    // 今日の学習進捗をチェック
    const today = new Date().toISOString().split("T")[0];
    const { data: todaySession, error: sessionError } = await supabase
      .from("study_sessions")
      .select("total_cards_studied")
      .eq("user_id", user.id)
      .eq("session_date", today)
      .single();

    const cardsStudiedToday = todaySession?.total_cards_studied || 0;
    const dailyGoal = settings.daily_goal_cards || 10;
    const remainingCards = Math.max(0, dailyGoal - cardsStudiedToday);

    // メッセージ内容を決定
    let title = "学習リマインダー";
    let body = "フラッシュカードで学習しませんか？";

    if (cardsStudiedToday === 0) {
      title = "今日はまだ学習していませんね";
      body = `目標の${dailyGoal}枚のカードを学習して、知識を定着させましょう！`;
    } else if (remainingCards > 0) {
      title = "目標まであと少し！";
      body = `今日はすでに${cardsStudiedToday}枚学習しました。目標達成まであと${remainingCards}枚です！`;
    } else {
      title = "目標達成おめでとうございます！";
      body = `今日は${cardsStudiedToday}枚学習して目標を達成しました。復習も大切です！`;
    }

    // 通知を送信
    const { data, error } = await supabase.functions.invoke(
      "send-notifications",
      {
        body: {
          userId: user.id,
          title,
          body,
          type: "reminder",
          data: {
            url: "/study",
            cardsStudiedToday,
            dailyGoal,
            remainingCards,
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
      message: "学習リマインダーを送信しました",
      data: {
        cardsStudiedToday,
        dailyGoal,
        remainingCards,
        notification: data,
      },
    });
  } catch (error) {
    console.error("Study reminder error:", error);
    return NextResponse.json(
      { success: false, message: "サーバーエラーが発生しました" },
      { status: 500 },
    );
  }
}
