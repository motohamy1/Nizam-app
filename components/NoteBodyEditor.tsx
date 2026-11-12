import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  StyleSheet,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Haptics from 'expo-haptics';

const RNWebView = WebView as unknown as React.ComponentType<any>;

export type BlockType =
  | 'normal'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'checkbox'
  | 'bullet'
  | 'number'
  | 'quote'
  | 'divider';

export interface BlockItem {
  id: string;
  type: BlockType;
  text: string;
  isChecked?: boolean;
  num?: number;
}

export interface ActiveBlockInfo {
  blockType: BlockType;
  isChecked?: boolean;
  hasSelection: boolean;
  selectedText: string;
  isBold: boolean;
  isItalic: boolean;
  isStrike: boolean;
}

export interface NoteBodyEditorHandle {
  toggleHeading: (level: 1 | 2 | 3) => void;
  toggleChecklist: () => void;
  toggleBullet: () => void;
  toggleNumber: () => void;
  toggleQuote: () => void;
  insertHashtag: () => void;
  applyInlineFormat: (marker: '**' | '__' | '~~' | '`') => void;
  insertDivider: () => void;
  getPlainText: () => string;
  focus: () => void;
  insertAtCursor: (content: string) => void;
  insertAudio?: (storageId: string, duration: number, transcript?: string) => void;
}

interface NoteBodyEditorProps {
  value: string;
  onChange: (text: string) => void;
  onCursorChange?: (pos: number) => void;
  onActivateLine?: (y: number, height: number) => void;
  onActiveBlockChange?: (info: ActiveBlockInfo) => void;
  onPlayAudio?: (storageId: string, duration: number, transcript?: string) => void;
  colors: any;
  isArabic: boolean;
  isDark?: boolean;
  baseStyle?: any;
  placeholder?: string;
}

/**
 * Escapes characters for HTML injection
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Converts standard Markdown to HTML for the rich contenteditable canvas
 */
function markdownToHtml(md: string): string {
  if (!md || md.trim().length === 0) {
    return '<p dir="auto"><br></p>';
  }

  const lines = md.split('\n');
  const result: string[] = [];
  let inUl = false;
  let inOl = false;

  const closeLists = () => {
    if (inUl) {
      result.push('</ul>');
      inUl = false;
    }
    if (inOl) {
      result.push('</ol>');
      inOl = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Inline audio card placeholder: {{audio:storageId|duration|transcript}}
    const audioMatch = rawLine.match(/^\{\{audio:([^|]+)\|(\d+)(?:\|([^}]*))?\}\}$/);
    if (audioMatch) {
      closeLists();
      const storageId = audioMatch[1];
      const duration = parseInt(audioMatch[2], 10) || 0;
      const transcript = audioMatch[3] || '';
      result.push(
        `<div class="audio-block" data-storage-id="${escapeHtml(storageId)}" data-duration="${duration}" data-transcript="${escapeHtml(transcript)}" contenteditable="false">` +
          `<div class="audio-btn">▶</div>` +
          `<div class="audio-content">` +
            `<div class="audio-header">` +
              `<span class="audio-tag">🎙 Voice Note</span>` +
              `<span class="audio-time">${formatTime(duration)}</span>` +
            `</div>` +
            (transcript ? `<div class="audio-sub">${escapeHtml(transcript)}</div>` : '') +
          `</div>` +
        `</div>`
      );
      continue;
    }

    // Horizontal Divider
    if (/^-{3,}$/.test(trimmed)) {
      closeLists();
      result.push('<hr contenteditable="false" />');
      continue;
    }

    // Headings
    if (/^###\s+/.test(rawLine)) {
      closeLists();
      const text = formatInlineSpans(rawLine.replace(/^###\s+/, ''));
      result.push(`<h3 dir="auto">${text || '<br>'}</h3>`);
      continue;
    }
    if (/^##\s+/.test(rawLine)) {
      closeLists();
      const text = formatInlineSpans(rawLine.replace(/^##\s+/, ''));
      result.push(`<h2 dir="auto">${text || '<br>'}</h2>`);
      continue;
    }
    if (/^#\s+/.test(rawLine)) {
      closeLists();
      const text = formatInlineSpans(rawLine.replace(/^#\s+/, ''));
      result.push(`<h1 dir="auto">${text || '<br>'}</h1>`);
      continue;
    }

    // Checklist Item
    const checkMatch = rawLine.match(/^(\s*)[-*•]\s*\[([ xX])\]\s?(.*)$/);
    if (checkMatch) {
      closeLists();
      const isChecked = checkMatch[2].toLowerCase() === 'x';
      const text = formatInlineSpans(checkMatch[3] || '');
      result.push(
        `<div class="checklist-row" data-checked="${isChecked}" dir="auto">` +
          `<span class="checkbox-box ${isChecked ? 'checked' : ''}" contenteditable="false"></span>` +
          `<span class="checklist-text ${isChecked ? 'striked' : ''}">${text || '<br>'}</span>` +
        `</div>`
      );
      continue;
    }

    // Bullet list
    const bulletMatch = rawLine.match(/^(\s*)[-*•]\s+(.*)$/);
    if (bulletMatch) {
      if (inOl) {
        result.push('</ol>');
        inOl = false;
      }
      if (!inUl) {
        result.push('<ul>');
        inUl = true;
      }
      const text = formatInlineSpans(bulletMatch[2]);
      result.push(`<li dir="auto">${text || '<br>'}</li>`);
      continue;
    }

    // Numbered list
    const numMatch = rawLine.match(/^(\s*)\d+\.\s+(.*)$/);
    if (numMatch) {
      if (inUl) {
        result.push('</ul>');
        inUl = false;
      }
      if (!inOl) {
        result.push('<ol>');
        inOl = true;
      }
      const text = formatInlineSpans(numMatch[2]);
      result.push(`<li dir="auto">${text || '<br>'}</li>`);
      continue;
    }

    // Blockquote
    const quoteMatch = rawLine.match(/^(\s*)>\s?(.*)$/);
    if (quoteMatch) {
      closeLists();
      const text = formatInlineSpans(quoteMatch[2]);
      result.push(`<blockquote dir="auto">${text || '<br>'}</blockquote>`);
      continue;
    }

    // Normal paragraph
    closeLists();
    const formatted = formatInlineSpans(rawLine);
    result.push(`<p dir="auto">${formatted || '<br>'}</p>`);
  }

  closeLists();
  return result.join('');
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function formatInlineSpans(text: string): string {
  if (!text) return '';
  let str = escapeHtml(text);
  // Bold: **text**
  str = str.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  // Italic: __text__ or *text*
  str = str.replace(/__(.+?)__/g, '<i>$1</i>');
  str = str.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<i>$1</i>');
  // Strikethrough: ~~text~~
  str = str.replace(/~~(.+?)~~/g, '<s>$1</s>');
  // Inline Code: `code`
  str = str.replace(/`([^`]+)`/g, '<code>$1</code>');
  return str;
}

const NoteBodyEditor = forwardRef<NoteBodyEditorHandle, NoteBodyEditorProps>((props, ref) => {
  const {
    value,
    onChange,
    onActivateLine,
    onActiveBlockChange,
    onPlayAudio,
    colors,
    isArabic,
    isDark = true,
    placeholder,
  } = props;

  const [editorHeight, setEditorHeight] = useState(380);
  const webViewRef = useRef<WebView>(null);
  const lastMarkdownRef = useRef(value || '');
  const isLoadedRef = useRef(false);
  const isFocusedRef = useRef(false);

  // Sync external changes (e.g. AI summary insertions, initial load)
  useEffect(() => {
    if (value === undefined) return;
    if (value === lastMarkdownRef.current) return;
    lastMarkdownRef.current = value;

    // Do NOT wipe DOM or reset selection if the user is actively focused and typing!
    if (isFocusedRef.current) return;

    if (isLoadedRef.current && webViewRef.current) {
      const html = markdownToHtml(value);
      const safeHtml = JSON.stringify(html);
      webViewRef.current.injectJavaScript(`
        window.__setMarkdownContent(${safeHtml});
        true;
      `);
    }
  }, [value]);

  const handleMessage = useCallback(
    (event: any) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        switch (data.type) {
          case 'LOADED': {
            isLoadedRef.current = true;
            // Send initial content
            const initialHtml = markdownToHtml(lastMarkdownRef.current);
            webViewRef.current?.injectJavaScript(`
              window.__setMarkdownContent(${JSON.stringify(initialHtml)});
              true;
            `);
            break;
          }
          case 'FOCUS': {
            isFocusedRef.current = true;
            break;
          }
          case 'BLUR': {
            isFocusedRef.current = false;
            break;
          }
          case 'CARET_POS': {
            if (typeof data.y === 'number') {
              onActivateLine?.(data.y, data.height || 22);
            }
            break;
          }
          case 'CHANGE': {
            lastMarkdownRef.current = data.markdown;
            onChange(data.markdown);
            break;
          }
          case 'HEIGHT': {
            if (typeof data.height === 'number' && data.height > 50) {
              const newHeight = Math.max(380, data.height + 60);
              // Avoid LayoutAnimation here to prevent visual jumping during typing
              setEditorHeight(newHeight);
            }
            break;
          }
          case 'SELECTION_STATE': {
            onActiveBlockChange?.({
              blockType: data.blockType || 'normal',
              isChecked: data.isChecked,
              hasSelection: Boolean(data.hasSelection),
              selectedText: data.selectedText || '',
              isBold: Boolean(data.isBold),
              isItalic: Boolean(data.isItalic),
              isStrike: Boolean(data.isStrike),
            });
            break;
          }
          case 'HAPTIC': {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } catch {}
            break;
          }
          case 'PLAY_AUDIO': {
            onPlayAudio?.(data.storageId, data.duration, data.transcript);
            break;
          }
        }
      } catch (err) {
        console.warn('Error handling editor message:', err);
      }
    },
    [onChange, onActiveBlockChange, onPlayAudio, onActivateLine]
  );

  useImperativeHandle(ref, () => ({
    toggleHeading: (level: 1 | 2 | 3) => {
      webViewRef.current?.injectJavaScript(`window.__toggleHeading(${level}); true;`);
    },
    toggleChecklist: () => {
      webViewRef.current?.injectJavaScript(`window.__toggleChecklist(); true;`);
    },
    toggleBullet: () => {
      webViewRef.current?.injectJavaScript(`window.__toggleBullet(); true;`);
    },
    toggleNumber: () => {
      webViewRef.current?.injectJavaScript(`window.__toggleNumber(); true;`);
    },
    toggleQuote: () => {
      webViewRef.current?.injectJavaScript(`window.__toggleQuote(); true;`);
    },
    insertHashtag: () => {
      webViewRef.current?.injectJavaScript(`window.__insertText('#'); true;`);
    },
    applyInlineFormat: (marker: '**' | '__' | '~~' | '`') => {
      let cmd = 'bold';
      if (marker === '__') cmd = 'italic';
      if (marker === '~~') cmd = 'strikeThrough';
      if (marker === '`') {
        webViewRef.current?.injectJavaScript(`window.__wrapCode(); true;`);
        return;
      }
      webViewRef.current?.injectJavaScript(`document.execCommand('${cmd}', false, null); window.__checkSelection(); window.__triggerChange(); true;`);
    },
    insertDivider: () => {
      webViewRef.current?.injectJavaScript(`window.__insertDivider(); true;`);
    },
    getPlainText: () => {
      return lastMarkdownRef.current;
    },
    focus: () => {
      webViewRef.current?.injectJavaScript(`window.__focusEditor(); true;`);
    },
    insertAtCursor: (content: string) => {
      const trimmed = content ? content.trim() : '';
      if (!trimmed) return;
      const html = markdownToHtml(trimmed);
      webViewRef.current?.injectJavaScript(`window.__insertHtmlAtCursor(${JSON.stringify(html)}, ${JSON.stringify(trimmed)}); true;`);
    },
    insertAudio: (storageId: string, duration: number, transcript?: string) => {
      webViewRef.current?.injectJavaScript(`
        window.__insertAudioBlock(${JSON.stringify(storageId)}, ${duration}, ${JSON.stringify(transcript || '')});
        true;
      `);
    },
  }));

  // Background and accent colors according to OLED True Black (#0B0812) theme
  const bgColor = isDark ? '#0B0812' : (colors?.bg || '#FFFFFF');
  const textColor = isDark ? '#F1F5F9' : (colors?.text || '#0F172A');
  const mutedColor = isDark ? '#94A3B8' : (colors?.textMuted || '#64748B');
  const accentLime = colors?.accent || '#AFE607';
  const violetBorder = colors?.border || '#5B1497';
  const placeholderText = placeholder || (isArabic ? 'ابدأ في كتابة ملاحظتك هنا...' : 'Start typing your note here...');

  const editorHtml = useMemo(() => `
<!DOCTYPE html>
<html lang="${isArabic ? 'ar' : 'en'}" dir="${isArabic ? 'rtl' : 'ltr'}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <style>
    * {
      box-sizing: border-box;
      -webkit-tap-highlight-color: transparent;
      outline: none;
    }
    html, body {
      margin: 0;
      padding: 0;
      background-color: ${bgColor};
      min-height: 100%;
    }
    body {
      padding: 12px 18px 60px 18px;
      background-color: ${bgColor};
      color: ${textColor};
      font-family: -apple-system, BlinkMacSystemFont, 'Cairo', 'Plus Jakarta Sans', Roboto, sans-serif;
      font-size: 16px;
      line-height: 1.6;
      word-break: break-word;
      user-select: text;
      -webkit-user-select: text;
    }
    #editor {
      min-height: 320px;
      cursor: text;
      caret-color: ${accentLime};
    }
    #editor:empty:before {
      content: "${escapeHtml(placeholderText)}";
      color: ${mutedColor};
      pointer-events: none;
      display: block;
      white-space: pre-wrap;
    }
    h1 {
      font-size: 26px;
      font-weight: 800;
      line-height: 1.3;
      margin: 14px 0 6px 0;
      color: #FFFFFF;
    }
    h2 {
      font-size: 21px;
      font-weight: 700;
      line-height: 1.35;
      margin: 12px 0 5px 0;
      color: #F8FAFC;
    }
    h3 {
      font-size: 17px;
      font-weight: 600;
      line-height: 1.4;
      margin: 10px 0 4px 0;
      color: #E2E8F0;
    }
    p {
      margin: 4px 0;
      font-size: 16px;
    }
    b, strong {
      font-weight: 800;
      color: #FFFFFF;
    }
    i, em {
      font-style: italic;
    }
    s, del {
      text-decoration: line-through;
      opacity: 0.6;
    }
    code {
      background: rgba(139, 92, 246, 0.18);
      border: 1px solid rgba(139, 92, 246, 0.35);
      border-radius: 4px;
      padding: 2px 6px;
      font-family: monospace;
      font-size: 14px;
      color: ${accentLime};
    }
    blockquote {
      margin: 8px 0;
      padding: 6px 14px;
      border-${isArabic ? 'right' : 'left'}: 3px solid ${violetBorder};
      background: rgba(91, 20, 151, 0.12);
      border-radius: 4px;
      color: #CBD5E1;
      font-style: italic;
    }
    hr {
      border: none;
      border-top: 1px solid rgba(255, 255, 255, 0.12);
      margin: 18px 0;
    }
    ul, ol {
      margin: 4px 0;
      padding-inline-start: 24px;
    }
    li {
      margin: 3px 0;
    }
    /* Checklist row */
    .checklist-row {
      display: flex;
      flex-direction: row;
      align-items: flex-start;
      margin: 6px 0;
      gap: 10px;
      width: 100%;
      min-height: 24px;
    }
    .checkbox-box {
      width: 20px;
      height: 20px;
      border-radius: 6px;
      border: 2px solid ${mutedColor};
      flex-shrink: 0;
      margin-top: 3px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;
    }
    .checkbox-box.checked {
      background-color: ${accentLime};
      border-color: ${accentLime};
    }
    .checkbox-box.checked:after {
      content: '✓';
      color: #0B0812;
      font-size: 13px;
      font-weight: 900;
    }
    .checklist-text {
      flex: 1;
      min-width: 0;
      outline: none;
      word-break: break-word;
      white-space: pre-wrap;
      line-height: 1.5;
    }
    .checklist-text.striked {
      text-decoration: line-through;
      opacity: 0.5;
    }
    /* Inline Audio Widget */
    .audio-block {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 12px 0;
      padding: 12px 14px;
      border-radius: 14px;
      background: rgba(91, 20, 151, 0.15);
      border: 1.5px solid rgba(139, 92, 246, 0.35);
      user-select: none;
      -webkit-user-select: none;
    }
    .audio-btn {
      width: 36px;
      height: 36px;
      border-radius: 18px;
      background: ${accentLime};
      color: #0B0812;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 900;
      cursor: pointer;
      flex-shrink: 0;
    }
    .audio-content {
      flex: 1;
      overflow: hidden;
    }
    .audio-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 2px;
    }
    .audio-tag {
      font-size: 13px;
      font-weight: 700;
      color: #FFFFFF;
    }
    .audio-time {
      font-size: 12px;
      font-weight: 600;
      color: ${accentLime};
    }
    .audio-sub {
      font-size: 12px;
      color: ${mutedColor};
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  </style>
</head>
<body>
  <div id="editor" contenteditable="true" spellcheck="false"></div>

  <script>
    const editor = document.getElementById('editor');
    let lastReportedHeight = 0;

    function post(data) {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify(data));
      }
    }

    function checkHeight() {
      const height = document.body.scrollHeight;
      if (Math.abs(height - lastReportedHeight) > 5) {
        lastReportedHeight = height;
        post({ type: 'HEIGHT', height: height });
      }
    }

    const resizeObserver = new ResizeObserver(() => checkHeight());
    resizeObserver.observe(document.body);

    // Serialization: DOM -> Markdown
    function domToMarkdown() {
      let md = [];
      const children = Array.from(editor.childNodes);

      for (const node of children) {
        if (node.nodeType === Node.TEXT_NODE) {
          const t = node.textContent.trim();
          if (t) md.push(t);
          continue;
        }
        if (node.nodeType !== Node.ELEMENT_NODE) continue;

        const tag = node.tagName.toLowerCase();

        if (node.classList.contains('audio-block')) {
          const sid = node.getAttribute('data-storage-id') || '';
          const dur = node.getAttribute('data-duration') || '0';
          const tra = node.getAttribute('data-transcript') || '';
          md.push('{{audio:' + sid + '|' + dur + (tra ? '|' + tra : '') + '}}');
          continue;
        }

        if (tag === 'hr') {
          md.push('---');
          continue;
        }

        if (node.classList.contains('checklist-row')) {
          const isChecked = node.getAttribute('data-checked') === 'true';
          const textEl = node.querySelector('.checklist-text');
          const t = textEl ? inlineHtmlToMarkdown(textEl.innerHTML) : '';
          md.push('- [' + (isChecked ? 'x' : ' ') + '] ' + t);
          continue;
        }

        if (tag === 'h1') {
          md.push('# ' + inlineHtmlToMarkdown(node.innerHTML));
          continue;
        }
        if (tag === 'h2') {
          md.push('## ' + inlineHtmlToMarkdown(node.innerHTML));
          continue;
        }
        if (tag === 'h3') {
          md.push('### ' + inlineHtmlToMarkdown(node.innerHTML));
          continue;
        }
        if (tag === 'blockquote') {
          md.push('> ' + inlineHtmlToMarkdown(node.innerHTML));
          continue;
        }
        if (tag === 'ul') {
          const lis = node.querySelectorAll('li');
          lis.forEach(li => {
            md.push('- ' + inlineHtmlToMarkdown(li.innerHTML));
          });
          continue;
        }
        if (tag === 'ol') {
          const lis = node.querySelectorAll('li');
          lis.forEach((li, idx) => {
            md.push((idx + 1) + '. ' + inlineHtmlToMarkdown(li.innerHTML));
          });
          continue;
        }

        // Default paragraph or div
        const inner = inlineHtmlToMarkdown(node.innerHTML);
        md.push(inner);
      }

      return md.join('\\n');
    }

    function inlineHtmlToMarkdown(html) {
      if (!html) return '';
      let str = html;
      str = str.replace(/<br\\s*\\/?>/gi, '');
      str = str.replace(/<b\\b[^>]*>(.*?)<\\/b>/gi, '**$1**');
      str = str.replace(/<strong\\b[^>]*>(.*?)<\\/strong>/gi, '**$1**');
      str = str.replace(/<i\\b[^>]*>(.*?)<\\/i>/gi, '__$1__');
      str = str.replace(/<em\\b[^>]*>(.*?)<\\/em>/gi, '__$1__');
      str = str.replace(/<s\\b[^>]*>(.*?)<\\/s>/gi, '~~$1~~');
      str = str.replace(/<del\\b[^>]*>(.*?)<\\/del>/gi, '~~$1~~');
      str = str.replace(/<code\\b[^>]*>(.*?)<\\/code>/gi, '\`$1\`');
      // Strip any other tags
      const tmp = document.createElement('div');
      tmp.innerHTML = str;
      return tmp.textContent || tmp.innerText || '';
    }

    let changeTimer = null;
    function triggerChange() {
      if (changeTimer) clearTimeout(changeTimer);
      changeTimer = setTimeout(() => {
        const md = domToMarkdown();
        post({ type: 'CHANGE', markdown: md });
        checkHeight();
      }, 80);
    }

    window.__triggerChange = triggerChange;

    editor.addEventListener('input', () => {
      triggerChange();
    });

    let savedRange = null;

    function saveCurrentRange() {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        if (editor.contains(range.commonAncestorContainer)) {
          savedRange = range.cloneRange();
        }
      }
    }

    editor.addEventListener('focus', () => {
      post({ type: 'FOCUS' });
      saveCurrentRange();
      checkSelection();
    });

    editor.addEventListener('blur', () => {
      saveCurrentRange();
      post({ type: 'BLUR' });
    });

    editor.addEventListener('keyup', saveCurrentRange);
    editor.addEventListener('mouseup', saveCurrentRange);
    editor.addEventListener('touchend', saveCurrentRange);

    // Keyboard interception for Enter and Backspace in checklists
    editor.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const sel = window.getSelection();
        if (!sel || !sel.rangeCount) return;

        let node = sel.anchorNode;
        if (node && node.nodeType === Node.TEXT_NODE) node = node.parentNode;
        const currentRow = node ? node.closest('.checklist-row') : null;

        if (currentRow) {
          e.preventDefault();
          e.stopPropagation();

          const textEl = currentRow.querySelector('.checklist-text');
          const rowText = textEl ? textEl.textContent.trim() : '';

          // Empty checklist row -> convert to normal paragraph (exit checklist mode)
          if (!rowText) {
            const p = document.createElement('p');
            p.setAttribute('dir', 'auto');
            p.innerHTML = '<br>';
            currentRow.replaceWith(p);

            const range = document.createRange();
            range.setStart(p, 0);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
            savedRange = range.cloneRange();

            checkSelection();
            triggerChange();
            checkHeight();
            return;
          }

          // Split existing checklist row into a new row
          const curRange = sel.getRangeAt(0);
          const afterRange = document.createRange();
          if (textEl) {
            afterRange.setStart(curRange.endContainer, curRange.endOffset);
            afterRange.setEndAfter(textEl.lastChild || textEl);
          }
          const trailing = afterRange.extractContents();

          const newRow = document.createElement('div');
          newRow.className = 'checklist-row';
          newRow.setAttribute('data-checked', 'false');
          newRow.setAttribute('dir', 'auto');

          const newBox = document.createElement('span');
          newBox.className = 'checkbox-box';
          newBox.setAttribute('contenteditable', 'false');

          const newText = document.createElement('span');
          newText.className = 'checklist-text';

          if (trailing && trailing.textContent && trailing.textContent.length > 0) {
            newText.appendChild(trailing);
          } else {
            newText.innerHTML = '<br>';
          }

          newRow.appendChild(newBox);
          newRow.appendChild(newText);
          currentRow.after(newRow);

          // Place caret at start of new item
          const newRange = document.createRange();
          if (newText.firstChild && newText.firstChild.nodeType === Node.TEXT_NODE) {
            newRange.setStart(newText.firstChild, 0);
          } else {
            newRange.setStart(newText, 0);
          }
          newRange.collapse(true);
          sel.removeAllRanges();
          sel.addRange(newRange);
          savedRange = newRange.cloneRange();

          checkSelection();
          triggerChange();
          checkHeight();
          return;
        }
      }

      if (e.key === 'Backspace') {
        const sel = window.getSelection();
        if (!sel || !sel.rangeCount) return;

        let node = sel.anchorNode;
        if (node && node.nodeType === Node.TEXT_NODE) node = node.parentNode;
        const currentRow = node ? node.closest('.checklist-row') : null;

        if (currentRow) {
          const textEl = currentRow.querySelector('.checklist-text');
          const range = sel.getRangeAt(0);
          const isAtStart = range.startOffset === 0 && (sel.anchorNode === textEl || (textEl && textEl.firstChild === sel.anchorNode));
          const rowText = textEl ? textEl.textContent.trim() : '';

          if (isAtStart && !rowText) {
            e.preventDefault();
            const p = document.createElement('p');
            p.setAttribute('dir', 'auto');
            p.innerHTML = '<br>';
            currentRow.replaceWith(p);

            const newRange = document.createRange();
            newRange.setStart(p, 0);
            newRange.collapse(true);
            sel.removeAllRanges();
            sel.addRange(newRange);
            savedRange = newRange.cloneRange();

            checkSelection();
            triggerChange();
            checkHeight();
            return;
          }
        }
      }
    });

    // Checkbox click delegator
    editor.addEventListener('click', (e) => {
      const box = e.target.closest('.checkbox-box');
      if (box) {
        e.preventDefault();
        const row = box.closest('.checklist-row');
        if (row) {
          const current = row.getAttribute('data-checked') === 'true';
          const next = !current;
          row.setAttribute('data-checked', next ? 'true' : 'false');
          box.classList.toggle('checked', next);
          const textEl = row.querySelector('.checklist-text');
          if (textEl) textEl.classList.toggle('striked', next);
          post({ type: 'HAPTIC' });
          triggerChange();
        }
        return;
      }

      const audioBtn = e.target.closest('.audio-btn');
      if (audioBtn) {
        const block = audioBtn.closest('.audio-block');
        if (block) {
          const sid = block.getAttribute('data-storage-id');
          const dur = parseInt(block.getAttribute('data-duration') || '0', 10);
          const tra = block.getAttribute('data-transcript');
          post({ type: 'PLAY_AUDIO', storageId: sid, duration: dur, transcript: tra });
        }
      }
    });

    // Selection monitoring for toolbar sync
    function checkSelection() {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;

      if (!sel.isCollapsed || sel.rangeCount > 0) {
        try {
          const range = sel.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          if (rect && (rect.top !== 0 || rect.bottom !== 0)) {
            post({
              type: 'CARET_POS',
              y: rect.top,
              height: rect.height || 22,
            });
          }
        } catch (_) {}
      }

      const isBold = document.queryCommandState('bold');
      const isItalic = document.queryCommandState('italic');
      const isStrike = document.queryCommandState('strikeThrough');

      let node = sel.anchorNode;
      if (node && node.nodeType === Node.TEXT_NODE) node = node.parentNode;

      let blockType = 'normal';
      let isChecked = false;

      let cur = node;
      while (cur && cur !== editor) {
        if (cur.classList && cur.classList.contains('checklist-row')) {
          blockType = 'checkbox';
          isChecked = cur.getAttribute('data-checked') === 'true';
          break;
        }
        const t = cur.tagName ? cur.tagName.toLowerCase() : '';
        if (t === 'h1') { blockType = 'h1'; break; }
        if (t === 'h2') { blockType = 'h2'; break; }
        if (t === 'h3') { blockType = 'h3'; break; }
        if (t === 'blockquote') { blockType = 'quote'; break; }
        if (t === 'ul') { blockType = 'bullet'; break; }
        if (t === 'ol') { blockType = 'number'; break; }
        cur = cur.parentNode;
      }

      post({
        type: 'SELECTION_STATE',
        isBold,
        isItalic,
        isStrike,
        blockType,
        isChecked,
        hasSelection: !sel.isCollapsed,
        selectedText: sel.toString(),
      });
    }

    window.__checkSelection = checkSelection;
    document.addEventListener('selectionchange', () => {
      saveCurrentRange();
      checkSelection();
    });

    // Range recovery and safe insertion helpers
    function getOrRestoreRange() {
      editor.focus();
      const sel = window.getSelection();
      let range = null;
      if (savedRange && editor.contains(savedRange.commonAncestorContainer)) {
        try {
          sel.removeAllRanges();
          sel.addRange(savedRange);
          range = savedRange;
        } catch (_) {}
      } else if (sel && sel.rangeCount > 0 && editor.contains(sel.getRangeAt(0).commonAncestorContainer)) {
        range = sel.getRangeAt(0);
      }

      if (!range || !editor.contains(range.commonAncestorContainer)) {
        const endRange = document.createRange();
        if (editor.lastChild) {
          endRange.selectNodeContents(editor.lastChild);
          endRange.collapse(false);
        } else {
          endRange.selectNodeContents(editor);
          endRange.collapse(false);
        }
        sel.removeAllRanges();
        sel.addRange(endRange);
        range = endRange;
        savedRange = range.cloneRange();
      }
      return { sel, range };
    }

    function insertTextSafely(text) {
      const { sel, range } = getOrRestoreRange();
      let ok = false;
      try {
        ok = document.execCommand('insertText', false, text);
      } catch (_) {
        ok = false;
      }
      if (!ok && range) {
        range.deleteContents();
        const textNode = document.createTextNode(text);
        range.insertNode(textNode);
        const newRange = document.createRange();
        newRange.setStartAfter(textNode);
        newRange.collapse(true);
        sel.removeAllRanges();
        sel.addRange(newRange);
        savedRange = newRange.cloneRange();
      } else if (sel && sel.rangeCount > 0) {
        savedRange = sel.getRangeAt(0).cloneRange();
      }
      checkSelection();
      triggerChange();
      checkHeight();
    }

    function insertHtmlSafely(html, plainText) {
      const { sel, range } = getOrRestoreRange();

      // If plainText is single-line inline text without markdown block markers, insert as inline text directly
      const isSimpleInline = plainText && !plainText.includes('\n') && !/^([#>\-*]|<div|<p)/.test(plainText.trim());
      if (isSimpleInline) {
        insertTextSafely(plainText);
        return;
      }

      // Check if current block is an empty paragraph (<p dir="auto"><br></p>)
      let startNode = range.startContainer;
      if (startNode && startNode.nodeType === Node.TEXT_NODE) startNode = startNode.parentNode;
      let currentBlock = startNode;
      while (currentBlock && currentBlock.parentNode !== editor && currentBlock !== editor) {
        currentBlock = currentBlock.parentNode;
      }

      if (
        currentBlock &&
        currentBlock !== editor &&
        currentBlock.tagName &&
        currentBlock.tagName.toLowerCase() === 'p' &&
        (!currentBlock.textContent.trim() || currentBlock.innerHTML === '<br>')
      ) {
        const temp = document.createElement('div');
        temp.innerHTML = html;
        const frag = document.createDocumentFragment();
        let lastNode = null;
        while (temp.firstChild) {
          lastNode = frag.appendChild(temp.firstChild);
        }
        currentBlock.replaceWith(frag);
        if (lastNode) {
          const newRange = document.createRange();
          newRange.setStartAfter(lastNode);
          newRange.collapse(true);
          sel.removeAllRanges();
          sel.addRange(newRange);
          savedRange = newRange.cloneRange();
        }
        checkSelection();
        triggerChange();
        checkHeight();
        return;
      }

      // Try execCommand('insertHTML')
      let ok = false;
      try {
        ok = document.execCommand('insertHTML', false, html);
      } catch (_) {
        ok = false;
      }

      if (!ok && range) {
        const temp = document.createElement('div');
        temp.innerHTML = html;
        const frag = document.createDocumentFragment();
        let lastNode = null;
        while (temp.firstChild) {
          lastNode = frag.appendChild(temp.firstChild);
        }
        range.deleteContents();
        range.insertNode(frag);
        if (lastNode) {
          const newRange = document.createRange();
          newRange.setStartAfter(lastNode);
          newRange.collapse(true);
          sel.removeAllRanges();
          sel.addRange(newRange);
          savedRange = newRange.cloneRange();
        }
      } else if (sel && sel.rangeCount > 0) {
        savedRange = sel.getRangeAt(0).cloneRange();
      }

      checkSelection();
      triggerChange();
      checkHeight();
    }

    // Global APIs exposed to React Native
    window.__setMarkdownContent = function(html) {
      editor.innerHTML = html;
      checkHeight();
    };

    window.__toggleHeading = function(level) {
      const tag = 'h' + level;
      const { sel, range } = getOrRestoreRange();
      let node = sel.anchorNode;
      if (node && node.nodeType === Node.TEXT_NODE) node = node.parentNode;
      let block = node;
      while (block && block.parentNode !== editor && block !== editor) {
        block = block.parentNode;
      }
      if (!block || block === editor) {
        document.execCommand('formatBlock', false, tag);
      } else if (block.tagName && block.tagName.toLowerCase() === tag) {
        document.execCommand('formatBlock', false, 'p');
      } else {
        document.execCommand('formatBlock', false, tag);
      }
      checkSelection();
      triggerChange();
    };

    window.__toggleChecklist = function() {
      const { sel, range } = getOrRestoreRange();
      let node = sel.anchorNode;
      if (node && node.nodeType === Node.TEXT_NODE) node = node.parentNode;
      let block = node;
      while (block && block.parentNode !== editor && block !== editor) {
        block = block.parentNode;
      }
      if (block && block.classList && block.classList.contains('checklist-row')) {
        const text = block.querySelector('.checklist-text')?.innerHTML || '<br>';
        const p = document.createElement('p');
        p.setAttribute('dir', 'auto');
        p.innerHTML = text;
        block.replaceWith(p);
        const newRange = document.createRange();
        newRange.selectNodeContents(p);
        newRange.collapse(false);
        sel.removeAllRanges();
        sel.addRange(newRange);
        savedRange = newRange.cloneRange();
      } else if (block && block !== editor) {
        const text = block.innerHTML || '<br>';
        const row = document.createElement('div');
        row.className = 'checklist-row';
        row.setAttribute('data-checked', 'false');
        row.setAttribute('dir', 'auto');
        row.innerHTML = '<span class="checkbox-box" contenteditable="false"></span><span class="checklist-text">' + text + '</span>';
        block.replaceWith(row);
        const textEl = row.querySelector('.checklist-text');
        const newRange = document.createRange();
        if (textEl) {
          newRange.selectNodeContents(textEl);
          newRange.collapse(false);
        }
        sel.removeAllRanges();
        sel.addRange(newRange);
        savedRange = newRange.cloneRange();
      }
      checkSelection();
      triggerChange();
    };

    window.__toggleBullet = function() {
      getOrRestoreRange();
      document.execCommand('insertUnorderedList', false, null);
      checkSelection();
      triggerChange();
    };

    window.__toggleNumber = function() {
      getOrRestoreRange();
      document.execCommand('insertOrderedList', false, null);
      checkSelection();
      triggerChange();
    };

    window.__toggleQuote = function() {
      const { sel } = getOrRestoreRange();
      let node = sel.anchorNode;
      if (node && node.nodeType === Node.TEXT_NODE) node = node.parentNode;
      let block = node;
      while (block && block.parentNode !== editor && block !== editor) {
        block = block.parentNode;
      }
      if (block && block.tagName && block.tagName.toLowerCase() === 'blockquote') {
        document.execCommand('formatBlock', false, 'p');
      } else {
        document.execCommand('formatBlock', false, 'blockquote');
      }
      checkSelection();
      triggerChange();
    };

    window.__insertDivider = function() {
      getOrRestoreRange();
      document.execCommand('insertHorizontalRule', false, null);
      checkSelection();
      triggerChange();
    };

    window.__insertText = function(text) {
      insertTextSafely(text);
    };

    window.__wrapCode = function() {
      const { sel } = getOrRestoreRange();
      const text = sel.toString();
      if (text) {
        insertHtmlSafely('<code>' + text + '</code>');
      } else {
        insertHtmlSafely('<code>&nbsp;</code>');
      }
    };

    window.__insertHtmlAtCursor = function(html, plainText) {
      insertHtmlSafely(html, plainText);
    };

    window.__insertAudioBlock = function(storageId, duration, transcript) {
      const html = '<div class="audio-block" data-storage-id="' + storageId + '" data-duration="' + duration + '" data-transcript="' + transcript + '" contenteditable="false">' +
        '<div class="audio-btn">▶</div>' +
        '<div class="audio-content">' +
          '<div class="audio-header">' +
            '<span class="audio-tag">🎙 Voice Note</span>' +
            '<span class="audio-time">' + Math.floor(duration / 60) + ':' + (duration % 60 < 10 ? '0' : '') + (duration % 60) + '</span>' +
          '</div>' +
          (transcript ? '<div class="audio-sub">' + transcript + '</div>' : '') +
        '</div>' +
      '</div><p dir="auto"><br></p>';
      insertHtmlSafely(html);
    };

    window.__focusEditor = function() {
      editor.focus();
    };

    // Ready notification
    post({ type: 'LOADED' });
  </script>
</body>
</html>
  `, [bgColor, textColor, mutedColor, accentLime, violetBorder, placeholderText, isArabic]);

  const webViewSource = useMemo(() => ({ html: editorHtml }), [editorHtml]);

  return (
    <View style={[styles.container, { minHeight: editorHeight, backgroundColor: bgColor }]}>
      <RNWebView
        ref={webViewRef}
        source={webViewSource}
        scrollEnabled={false}
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={['*']}
        onMessage={handleMessage}
        style={{
          width: '100%',
          height: editorHeight,
          backgroundColor: bgColor,
        }}
        containerStyle={{
          backgroundColor: bgColor,
        }}
        keyboardDisplayRequiresUserAction={false}
        hideKeyboardAccessoryView
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
});

NoteBodyEditor.displayName = 'NoteBodyEditor';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
});

export default NoteBodyEditor;
