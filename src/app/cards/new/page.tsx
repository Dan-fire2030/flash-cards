"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Category } from "@/types";
import ImageUpload from "@/components/ImageUpload";
import MainNavBar from "@/components/MainNavBar";
import SubHeader from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";

export default function NewCardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [cardType, setCardType] = useState<"vocabulary" | "multiple_choice">(
    "vocabulary"
  );
  const [frontText, setFrontText] = useState("");
  const [backText, setBackText] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [backImageUrl, setBackImageUrl] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<string[]>(["", "", "", ""]);
  const [correctOptionIndex, setCorrectOptionIndex] = useState<number>(0);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      // Only run on client side
      if (typeof window === "undefined") return;

      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cardType === "vocabulary") {
      if (!frontText.trim() || !backText.trim() || !categoryId) return;
    } else {
      if (!frontText.trim() || !categoryId) return;
      const validOptions = options.filter((opt) => opt.trim());
      if (validOptions.length !== 4) {
        alert("４つの選択肢をすべて入力してください");
        return;
      }
    }

    setLoading(true);
    try {
      const cardData: {
        front_text: string;
        category_id: string;
        card_type: 'vocabulary' | 'multiple_choice';
        back_text?: string;
        back_image_url?: string | null;
        options?: string[];
        correct_option_index?: number;
        user_id?: string;
      } = {
        front_text: frontText.trim(),
        category_id: categoryId,
        card_type: cardType,
        user_id: user?.id,
      };

      if (cardType === "vocabulary") {
        cardData.back_text = backText.trim();
        cardData.back_image_url = backImageUrl;
      } else {
        cardData.back_text = options[correctOptionIndex].trim();
        cardData.options = options.map((opt) => opt.trim());
        cardData.correct_option_index = correctOptionIndex;
      }

      const { error } = await supabase.from("flashcards").insert(cardData);

      if (error) throw error;
      router.push("/");
    } catch (error) {
      console.error("Error creating card:", error);
      alert("カードの作成に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <MainNavBar />
      <SubHeader title="新規カード作成" showBackButton={true} />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-fadeIn">
          <form
            onSubmit={handleSubmit}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden"
          >
            <div className="px-6 py-5 bg-gradient-to-r from-indigo-500 to-purple-500">
              <h2 className="text-xl font-semibold text-white">
                カード情報を入力
              </h2>
            </div>

            <div className="p-8 space-y-8">
              {/* カードタイプ選択 */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  カードタイプ
                </label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setCardType("vocabulary")}
                    className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all ${
                      cardType === "vocabulary"
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                        : "border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                        />
                      </svg>
                      <span className="font-medium">学習単語</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCardType("multiple_choice")}
                    className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all ${
                      cardType === "multiple_choice"
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                        : "border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                        />
                      </svg>
                      <span className="font-medium">４択問題文</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* 表面 */}
              <div>
                <label
                  htmlFor="front"
                  className="block text-sm font-semibold text-gray-900 dark:text-white mb-3"
                >
                  {cardType === "vocabulary" ? "表面（学習単語）" : "問題文"}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="front"
                    value={frontText}
                    onChange={(e) => setFrontText(e.target.value)}
                    className="w-full px-4 py-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-indigo-500 focus:ring-0 dark:bg-gray-700 dark:text-white transition-colors"
                    placeholder={
                      cardType === "vocabulary"
                        ? "例: apple"
                        : "例: 次のうち、りんごを意味する英単語はどれですか？"
                    }
                    required
                  />
                  <div className="absolute inset-0 rounded-xl ring-2 ring-transparent focus-within:ring-indigo-500/20 transition-all pointer-events-none"></div>
                </div>
              </div>

              {/* 裏面 (単語用) または 選択肢 (４択問題用) */}
              {cardType === "vocabulary" ? (
                <div>
                  <label
                    htmlFor="back"
                    className="block text-sm font-semibold text-gray-900 dark:text-white mb-3"
                  >
                    裏面（説明）
                  </label>
                  <div className="relative">
                    <textarea
                      id="back"
                      value={backText}
                      onChange={(e) => setBackText(e.target.value)}
                      className="w-full px-4 py-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-indigo-500 focus:ring-0 dark:bg-gray-700 dark:text-white transition-colors resize-none"
                      placeholder="例: りんご、果物の一種"
                      rows={4}
                      required
                    />
                    <div className="absolute inset-0 rounded-xl ring-2 ring-transparent focus-within:ring-indigo-500/20 transition-all pointer-events-none"></div>
                  </div>

                  {/* 画像アップロード */}
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      画像を追加（任意）
                    </p>
                    <ImageUpload
                      currentImageUrl={backImageUrl || undefined}
                      onImageUpload={(url) => setBackImageUrl(url)}
                      onImageRemove={() => setBackImageUrl(null)}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    選択肢（４つすべて入力してください）
                  </label>
                  <div className="space-y-3">
                    {options.map((option, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="correctOption"
                          checked={correctOptionIndex === index}
                          onChange={() => setCorrectOptionIndex(index)}
                          className="w-5 h-5 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                        />
                        <div className="flex-1 relative">
                          <input
                            type="text"
                            value={option}
                            onChange={(e) =>
                              handleOptionChange(index, e.target.value)
                            }
                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-indigo-500 focus:ring-0 dark:bg-gray-700 dark:text-white transition-colors"
                            placeholder={`選択肢 ${index + 1}`}
                            required
                          />
                          {correctOptionIndex === index && (
                            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-md font-medium">
                              正解
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    ラジオボタンで正解の選択肢を選んでください
                  </p>
                </div>
              )}

              {/* カテゴリ */}
              <div>
                <label
                  htmlFor="category"
                  className="block text-sm font-semibold text-gray-900 dark:text-white mb-3"
                >
                  カテゴリ
                </label>
                <div className="relative">
                  <select
                    id="category"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-4 py-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-indigo-500 focus:ring-0 dark:bg-gray-700 dark:text-white transition-colors appearance-none"
                    required
                  >
                    <option value="">カテゴリを選択してください</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  <svg
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                  <div className="absolute inset-0 rounded-xl ring-2 ring-transparent focus-within:ring-indigo-500/20 transition-all pointer-events-none"></div>
                </div>
                {categories.length === 0 && (
                  <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                    まず
                    <Link
                      href="/categories/new"
                      className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium mx-1"
                    >
                      カテゴリを作成
                    </Link>
                    してください
                  </p>
                )}
              </div>
            </div>

            {/* ボタン */}
            <div className="px-8 py-6 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-600">
              <div className="flex flex-col sm:flex-row gap-4 sm:justify-end">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="w-full sm:w-auto px-6 py-3 text-center border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-all"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={
                    loading ||
                    !frontText.trim() ||
                    !categoryId ||
                    (cardType === "vocabulary"
                      ? !backText.trim()
                      : options.some((opt) => !opt.trim()))
                  }
                  className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <svg
                        className="w-4 h-4 animate-spin"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      <span>作成中...</span>
                    </div>
                  ) : (
                    "作成"
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
