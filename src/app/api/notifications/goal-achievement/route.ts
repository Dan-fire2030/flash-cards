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

    // リクエストボディから目標タイプを取得
    const body = await request.json();
    const { goalType, customMessage } = body;

    if (!goalType) {
      return NextResponse.json(
        { success: false, message: "目標タイプが指定されていません" },
        { status: 400 },
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

    // 目標達成通知が有効でない場合
    if (!settings.goal_notifications_enabled) {
      return NextResponse.json(
        { success: false, message: "目標達成通知が無効です" },
        { status: 400 },
      );
    }

    // 今日の学習データを取得
    const today = new Date().toISOString().split("T")[0];
    const { data: todaySession, error: sessionError } = await supabase
      .from("study_sessions")
      .select("*")
      .eq("user_id", user.id)
      .eq("session_date", today)
      .single();

    let title = "目標達成おめでとうございます！";
    let notificationBody = customMessage || "学習目標を達成しました！";
    let notificationData: Record<string, unknown> = {
      url: "/stats",
      goalType,
      achievedAt: new Date().toISOString(),
    };

    // 目標タイプに応じた通知内容を設定
    switch (goalType) {
      case "daily_cards":
        const cardsStudied = todaySession?.total_cards_studied || 0;
        const dailyGoal = settings.daily_goal_cards || 10;
        title = "今日のカード目標達成！";
        notificationBody = `今日は${cardsStudied}枚のカードを学習し、目標の${dailyGoal}枚を達成しました！`;
        notificationData = {
          ...notificationData,
          cardsStudied,
          dailyGoal,
        };
        break;

      case "accuracy_goal":
        const accuracy = todaySession?.average_accuracy || 0;
        const accuracyGoal = settings.accuracy_goal_percentage || 80;
        title = "正答率目標達成！";
        notificationBody = `今日の正答率は${Math.round(accuracy)}%で、目標の${accuracyGoal}%を達成しました！`;
        notificationData = {
          ...notificationData,
          accuracy: Math.round(accuracy),
          accuracyGoal,
        };
        break;

      case "streak":
        // 連続学習日数の計算（実装が必要）
        title = "連続学習記録更新！";
        notificationBody =
          customMessage || "連続して学習を続けています。素晴らしいです！";
        break;

      case "weekly_goal":
        // 今週の学習日数をチェック
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekStartStr = weekStart.toISOString().split("T")[0];

        const { data: weekSessions, error: weekError } = await supabase
          .from("study_sessions")
          .select("session_date")
          .eq("user_id", user.id)
          .gte("session_date", weekStartStr)
          .gt("total_cards_studied", 0);

        const studyDaysThisWeek = weekSessions?.length || 0;
        const weeklyGoal = settings.weekly_goal_days || 5;

        if (studyDaysThisWeek >= weeklyGoal) {
          title = "週間学習目標達成！";
          notificationBody = `今週は${studyDaysThisWeek}日学習し、目標の${weeklyGoal}日を達成しました！`;
          notificationData = {
            ...notificationData,
            studyDaysThisWeek,
            weeklyGoal,
          };
        } else {
          return NextResponse.json(
            { success: false, message: "週間目標がまだ達成されていません" },
            { status: 400 },
          );
        }
        break;

      default:
        return NextResponse.json(
          { success: false, message: "不明な目標タイプです" },
          { status: 400 },
        );
    }

    // 通知を送信
    const { data, error } = await supabase.functions.invoke(
      "send-notifications",
      {
        body: {
          userId: user.id,
          title,
          body: notificationBody,
          type: "goal",
          data: notificationData,
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
      message: "目標達成通知を送信しました",
      data: {
        goalType,
        notification: data,
        notificationData,
      },
    });
  } catch (error) {
    console.error("Goal achievement notification error:", error);
    return NextResponse.json(
      { success: false, message: "サーバーエラーが発生しました" },
      { status: 500 },
    );
  }
}
