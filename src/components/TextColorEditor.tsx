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
  const [hasSelection, setHasSelection] = useState(false);
  const [selectionRange, setSelectionRange] = useState({ start: 0, end: 0 });
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
    if (text && text.includes("<span")) {
      parseHtmlToRanges(text);
    } else {
      setPlainText(text || "");
      setColoredRanges([]);
    }
  }, [text]);

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
    
    setSelectionRange({ start, end });
    setHasSelection(start !== end);
  };

  // タッチイベントとマウスイベントの両方に対応
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const handleSelectionChange = () => {
      setTimeout(checkSelection, 50);
    };

    textarea.addEventListener('select', checkSelection);
    textarea.addEventListener('mouseup', handleSelectionChange);
    textarea.addEventListener('keyup', handleSelectionChange);
    textarea.addEventListener('touchend', handleSelectionChange);
    textarea.addEventListener('selectionchange', handleSelectionChange);
    
    const documentSelectionChange = () => {
      if (document.activeElement === textarea) {
        handleSelectionChange();
      }
    };
    document.addEventListener('selectionchange', documentSelectionChange);

    return () => {
      textarea.removeEventListener('select', checkSelection);
      textarea.removeEventListener('mouseup', handleSelectionChange);
      textarea.removeEventListener('keyup', handleSelectionChange);
      textarea.removeEventListener('touchend', handleSelectionChange);
      textarea.removeEventListener('selectionchange', handleSelectionChange);
      document.removeEventListener('selectionchange', documentSelectionChange);
    };
  }, []);

  const applyColor = (color: string) => {
    if (!hasSelection) return;
    
    const start = selectionRange.start;
    const end = selectionRange.end;
    
    if (start === end) return;

    const currentText = textareaRef.current?.value || plainText;
    setPlainText(currentText);

    const newRange = { start, end, color };
    
    const updatedRanges = coloredRanges.filter(
      range => range.end <= start || range.start >= end
    );
    
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
    
    const html = generateHtml(currentText, updatedRanges);
    onChange(html);
    
    setHasSelection(false);
    setSelectionRange({ start: 0, end: 0 });
    
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(end, end);
    }
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
      .replace(/'/g, "&#039;");
  };

  const clearFormatting = () => {
    setColoredRanges([]);
    onChange(plainText);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setPlainText(newText);
    
    if (coloredRanges.length > 0) {
      const adjustedRanges = coloredRanges.filter(range => 
        range.start < newText.length && range.end <= newText.length
      );
      
      const oldLineCount = (plainText.match(/\n/g) || []).length;
      const newLineCount = (newText.match(/\n/g) || []).length;
      
      if (oldLineCount !== newLineCount) {
        const finalRanges = adjustedRanges.filter(range => {
          const beforeText = newText.substring(0, range.start);
          const selectedText = newText.substring(range.start, range.end);
          return beforeText.length === range.start && selectedText.length === (range.end - range.start);
        });
        setColoredRanges(finalRanges);
        
        const html = generateHtml(newText, finalRanges);
        onChange(html);
      } else {
        setColoredRanges(adjustedRanges);
        
        const html = generateHtml(newText, adjustedRanges);
        onChange(html);
      }
    } else {
      onChange(newText);
    }
  };

  // プレビュー用のコンポーネント
  const renderPreview = () => {
    if (coloredRanges.length === 0) return null;
    
    let lastIndex = 0;
    const elements: JSX.Element[] = [];
    
    coloredRanges.forEach((range, index) => {
      if (range.start > lastIndex) {
        const beforeText = plainText.substring(lastIndex, range.start);
        if (beforeText) {
          elements.push(
            <span key={`text-${index}`}>
              {beforeText.split('\n').map((line, lineIndex, lines) => (
                <span key={lineIndex}>
                  {line}
                  {lineIndex < lines.length - 1 && <br />}
                </span>
              ))}
            </span>
          );
        }
      }
      
      const coloredText = plainText.substring(range.start, range.end);
      elements.push(
        <span key={`colored-${index}`} style={{ color: range.color }}>
          {coloredText.split('\n').map((line, lineIndex, lines) => (
            <span key={lineIndex}>
              {line}
              {lineIndex < lines.length - 1 && <br />}
            </span>
          ))}
        </span>
      );
      lastIndex = range.end;
    });
    
    if (lastIndex < plainText.length) {
      const afterText = plainText.substring(lastIndex);
      if (afterText) {
        elements.push(
          <span key="text-last">
            {afterText.split('\n').map((line, lineIndex, lines) => (
              <span key={lineIndex}>
                {line}
                {lineIndex < lines.length - 1 && <br />}
              </span>
            ))}
          </span>
        );
      }
    }
    
    return <div>{elements}</div>;
  };

  return (
    <div className="space-y-2">
      {/* カラーツールバー */}
      <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
        {/* カラーセレクター */}
        <div className="flex gap-1">
          {(Object.keys(colors) as Array<keyof typeof colors>).map((colorKey) => (
            <button
              key={colorKey}
              type="button"
              onClick={() => applyColor(colors[colorKey].color)}
              disabled={!hasSelection}
              className={`w-10 h-10 rounded-lg ${colors[colorKey].buttonBg} flex items-center justify-center transition-all border-2 border-transparent hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
              aria-label={`${colors[colorKey].label}色を適用`}
            >
              <span className="font-bold text-sm text-white">
                {colors[colorKey].label}
              </span>
            </button>
          ))}
        </div>

        <div className="flex-1"></div>

        <button
          type="button"
          onClick={clearFormatting}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 active:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 dark:active:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg font-medium text-sm transition-all"
        >
          リセット
        </button>
      </div>

      {/* 選択範囲の状態表示（デバッグ用） */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-500 dark:text-gray-400">
          選択: {hasSelection ? `${selectionRange.start}-${selectionRange.end}` : 'なし'}
        </div>
      )}

      {/* テキストエリア */}
      <div className="space-y-2">
        <textarea
          ref={textareaRef}
          value={plainText}
          onChange={handleTextChange}
          onSelect={checkSelection}
          onMouseUp={checkSelection}
          onKeyUp={checkSelection}
          onTouchEnd={checkSelection}
          onFocus={checkSelection}
          onBlur={() => {
            setTimeout(checkSelection, 100);
          }}
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