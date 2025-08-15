"use client";

import { useState, useRef, useEffect } from "react";

interface TextColorEditorProps {
  text: string;
  onChange: (text: string) => void;
  placeholder?: string;
}

export default function TextColorEditor({
  text,
  onChange,
  placeholder = "例: りんご、果物の一種",
}: TextColorEditorProps) {
  const [selectedColor, setSelectedColor] = useState<"yellow" | "green" | "pink">("yellow");
  const [hasSelection, setHasSelection] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [plainText, setPlainText] = useState("");
  const [coloredRanges, setColoredRanges] = useState<Array<{
    start: number;
    end: number;
    color: string;
  }>>([]);

  const colors = {
    yellow: { color: "#ca8a04", label: "黄", buttonBg: "bg-yellow-400" },
    green: { color: "#16a34a", label: "緑", buttonBg: "bg-green-400" },
    pink: { color: "#db2777", label: "桃", buttonBg: "bg-pink-400" },
  };

  // 初期化時とtext変更時にHTMLをパース
  useEffect(() => {
    if (text.includes("<span")) {
      parseHtmlToRanges(text);
    } else {
      setPlainText(text);
      setColoredRanges([]);
    }
  }, []);

  const parseHtmlToRanges = (html: string) => {
    const div = document.createElement("div");
    div.innerHTML = html;
    const plain = div.textContent || "";
    setPlainText(plain);

    const ranges: Array<{ start: number; end: number; color: string }> = [];
    let currentIndex = 0;
    
    const walkNodes = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        currentIndex += node.textContent?.length || 0;
      } else if (node.nodeType === Node.ELEMENT_NODE && node.nodeName === "SPAN") {
        const element = node as HTMLElement;
        const style = element.style.color;
        if (style) {
          const start = currentIndex;
          const length = element.textContent?.length || 0;
          ranges.push({
            start,
            end: start + length,
            color: style
          });
          currentIndex += length;
        }
      } else {
        node.childNodes.forEach(walkNodes);
      }
    };
    
    div.childNodes.forEach(walkNodes);
    setColoredRanges(ranges);
  };

  const checkSelection = () => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    setHasSelection(start !== end);
  };

  const applyColor = () => {
    if (!textareaRef.current || !hasSelection) return;
    
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    
    if (start === end) return;

    // 既存の範囲と新しい範囲をマージ
    const newRange = { start, end, color: colors[selectedColor].color };
    
    // 重複する範囲を削除して新しい範囲を追加
    const updatedRanges = coloredRanges.filter(
      range => range.end <= start || range.start >= end
    );
    
    // 部分的に重複する範囲を分割
    coloredRanges.forEach(range => {
      if (range.start < start && range.end > start && range.end <= end) {
        updatedRanges.push({ ...range, end: start });
      } else if (range.start >= start && range.start < end && range.end > end) {
        updatedRanges.push({ ...range, start: end });
      } else if (range.start < start && range.end > end) {
        updatedRanges.push({ ...range, end: start });
        updatedRanges.push({ ...range, start: end });
      }
    });
    
    updatedRanges.push(newRange);
    updatedRanges.sort((a, b) => a.start - b.start);
    setColoredRanges(updatedRanges);
    
    // HTMLを生成
    const html = generateHtml(plainText, updatedRanges);
    onChange(html);
    
    // 選択を解除
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.setSelectionRange(end, end);
        setHasSelection(false);
      }
    }, 0);
  };

  const generateHtml = (text: string, ranges: Array<{ start: number; end: number; color: string }>) => {
    if (ranges.length === 0) return text;
    
    let html = "";
    let lastIndex = 0;
    
    ranges.forEach(range => {
      if (range.start > lastIndex) {
        html += escapeHtml(text.substring(lastIndex, range.start));
      }
      html += `<span style="color: ${range.color}">${escapeHtml(text.substring(range.start, range.end))}</span>`;
      lastIndex = range.end;
    });
    
    if (lastIndex < text.length) {
      html += escapeHtml(text.substring(lastIndex));
    }
    
    return html;
  };

  const escapeHtml = (text: string) => {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;")
      .replace(/\n/g, "<br>");
  };

  const clearFormatting = () => {
    setColoredRanges([]);
    onChange(plainText);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setPlainText(newText);
    
    // テキスト変更時は色情報をクリア（シンプルな実装）
    setColoredRanges([]);
    onChange(newText);
  };

  // プレビュー用のHTMLを生成
  const renderPreview = () => {
    if (coloredRanges.length === 0) return null;
    
    const html = generateHtml(plainText, coloredRanges);
    return (
      <div 
        dangerouslySetInnerHTML={{ __html: html }}
        style={{ whiteSpace: 'pre-wrap' }}
      />
    );
  };

  return (
    <div className="space-y-2">
      {/* カラーツールバー */}
      <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
        {/* カラーセレクター */}
        <div className="flex gap-1">
          {(Object.keys(colors) as Array<keyof typeof colors>).map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setSelectedColor(color)}
              className={`w-10 h-10 rounded-lg ${colors[color].buttonBg} flex items-center justify-center transition-all border-2 ${
                selectedColor === color
                  ? "border-gray-800 dark:border-white scale-110 shadow-lg"
                  : "border-transparent hover:scale-105"
              }`}
              aria-label={`${colors[color].label}色`}
            >
              <span className="font-bold text-sm text-white">
                {colors[color].label}
              </span>
            </button>
          ))}
        </div>

        <div className="flex-1"></div>

        {/* アクションボタン */}
        <button
          type="button"
          onClick={applyColor}
          disabled={!hasSelection}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all active:scale-95 ${
            hasSelection
              ? "bg-indigo-500 hover:bg-indigo-600 text-white"
              : "bg-gray-200 dark:bg-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed"
          }`}
        >
          色変更
        </button>

        <button
          type="button"
          onClick={clearFormatting}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 rounded-lg font-medium text-sm transition-all active:scale-95"
        >
          リセット
        </button>
      </div>

      {/* テキストエリア */}
      <div className="space-y-2">
        <textarea
          ref={textareaRef}
          value={plainText}
          onChange={handleTextChange}
          onSelect={checkSelection}
          onMouseUp={checkSelection}
          onKeyUp={checkSelection}
          className="w-full px-4 py-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-indigo-500 focus:ring-0 dark:bg-gray-700 dark:text-white transition-colors resize-none"
          placeholder={placeholder}
          rows={4}
          required
        />
        
        {/* プレビュー */}
        {coloredRanges.length > 0 && (
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">プレビュー:</p>
            <div className="text-gray-900 dark:text-white">
              {renderPreview()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}