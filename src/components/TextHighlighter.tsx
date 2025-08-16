"use client";

import React, { useState, useRef } from "react";

interface TextHighlighterProps {
  text: string;
  onChange: (text: string) => void;
  placeholder?: string;
}

export default function TextHighlighter({
  text,
  onChange,
  placeholder = "例: りんご、果物の一種",
}: TextHighlighterProps) {
  const [highlightColor, setHighlightColor] = useState<"yellow" | "green" | "pink">("yellow");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightedRef = useRef<HTMLDivElement>(null);
  const [selections, setSelections] = useState<Array<{
    start: number;
    end: number;
    color: "yellow" | "green" | "pink";
  }>>([]);

  const colors = {
    yellow: "bg-yellow-200 dark:bg-yellow-600/40",
    green: "bg-green-200 dark:bg-green-600/40",
    pink: "bg-pink-200 dark:bg-pink-600/40",
  };

  const buttonColors = {
    yellow: "bg-yellow-300 hover:bg-yellow-400 dark:bg-yellow-600 dark:hover:bg-yellow-700",
    green: "bg-green-300 hover:bg-green-400 dark:bg-green-600 dark:hover:bg-green-700",
    pink: "bg-pink-300 hover:bg-pink-400 dark:bg-pink-600 dark:hover:bg-pink-700",
  };

  const handleHighlight = () => {
    if (!textareaRef.current) return;
    
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    
    if (start === end) return;

    // 既存の選択範囲と重複をチェックして更新
    const newSelections = selections.filter(
      (sel) => sel.end < start || sel.start > end
    );
    
    newSelections.push({ start, end, color: highlightColor });
    newSelections.sort((a, b) => a.start - b.start);
    setSelections(newSelections);
  };

  const clearAllHighlights = () => {
    setSelections([]);
  };

  const renderHighlightedText = () => {
    if (!text) return null;
    
    let lastIndex = 0;
    const elements: React.ReactElement[] = [];
    
    selections.forEach((sel, index) => {
      if (sel.start > lastIndex) {
        elements.push(
          <span key={`text-${index}`}>{text.substring(lastIndex, sel.start)}</span>
        );
      }
      elements.push(
        <mark
          key={`mark-${index}`}
          className={`${colors[sel.color]} px-0.5 rounded-sm`}
        >
          {text.substring(sel.start, sel.end)}
        </mark>
      );
      lastIndex = sel.end;
    });
    
    if (lastIndex < text.length) {
      elements.push(
        <span key="text-last">{text.substring(lastIndex)}</span>
      );
    }
    
    return elements;
  };

  return (
    <div className="space-y-2">
      {/* マーカーツールバー - モバイル最適化 */}
      <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
        {/* カラーピッカー */}
        <div className="flex gap-1">
          {(["yellow", "green", "pink"] as const).map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setHighlightColor(color)}
              className={`w-10 h-10 rounded-lg ${buttonColors[color]} flex items-center justify-center transition-all ${
                highlightColor === color
                  ? "ring-2 ring-offset-1 ring-gray-600 dark:ring-gray-300 scale-110"
                  : ""
              }`}
              aria-label={`${color}マーカー`}
            >
              {highlightColor === color && (
                <svg className="w-5 h-5 text-gray-700 dark:text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>

        <div className="flex-1"></div>

        {/* アクションボタン */}
        <button
          type="button"
          onClick={handleHighlight}
          className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium text-sm transition-all active:scale-95"
        >
          マーク
        </button>

        <button
          type="button"
          onClick={clearAllHighlights}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 rounded-lg font-medium text-sm transition-all active:scale-95"
        >
          クリア
        </button>
      </div>

      {/* テキストエリア */}
      <div className="relative">
        {/* ハイライト表示レイヤー */}
        <div
          ref={highlightedRef}
          className="absolute inset-0 px-4 py-4 border-2 border-transparent rounded-xl pointer-events-none whitespace-pre-wrap break-words overflow-hidden"
          style={{
            fontFamily: "inherit",
            fontSize: "inherit",
            lineHeight: "inherit",
          }}
        >
          {renderHighlightedText()}
        </div>
        
        {/* 実際のテキストエリア */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => onChange(e.target.value)}
          className="relative w-full px-4 py-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-indigo-500 focus:ring-0 dark:bg-gray-700/90 dark:text-white transition-colors resize-none bg-transparent"
          placeholder={placeholder}
          rows={4}
          style={{
            caretColor: "auto",
          }}
          required
        />
      </div>
    </div>
  );
}