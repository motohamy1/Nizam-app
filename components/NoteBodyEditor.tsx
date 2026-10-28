import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View, type TextInputInstance } from 'react-native';

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
}

interface NoteBodyEditorProps {
  value: string;
  onChange: (text: string) => void;
  onCursorChange?: (pos: number) => void;
  onActivateLine?: (y: number, height: number) => void;
  onActiveBlockChange?: (info: ActiveBlockInfo) => void;
  colors: any;
  isArabic: boolean;
  isDark?: boolean;
  baseStyle?: any;
  placeholder?: string;
}

let nextId = 1;
const generateId = () => `b_${Date.now()}_${nextId++}`;

/**
 * Parses raw Markdown text into block items for WYSIWYG rendering.
 * Preserves existing block IDs whenever possible so React never unmounts active TextInputs.
 */
const parseMarkdownToBlocks = (markdown: string, existingBlocks: BlockItem[] = []): BlockItem[] => {
  if (!markdown || markdown.length === 0) {
    const id = existingBlocks[0]?.id || generateId();
    return [{ id, type: 'normal', text: '' }];
  }

  const rawLines = markdown.split('\n');
  const blocks: BlockItem[] = [];

  for (let i = 0; i < rawLines.length; i++) {
    const raw = rawLines[i];
    const trimmed = raw.trim();
    const id = existingBlocks[i]?.id || generateId();

    if (/^-{3,}$/.test(trimmed)) {
      blocks.push({ id, type: 'divider', text: '' });
      continue;
    }

    if (/^###\s+/.test(raw) || /^###$/.test(raw)) {
      blocks.push({ id, type: 'h3', text: raw.replace(/^###\s?/, '') });
      continue;
    }
    if (/^##\s+/.test(raw) || /^##$/.test(raw)) {
      blocks.push({ id, type: 'h2', text: raw.replace(/^##\s?/, '') });
      continue;
    }
    if (/^#\s+/.test(raw) || /^#$/.test(raw)) {
      blocks.push({ id, type: 'h1', text: raw.replace(/^#\s?/, '') });
      continue;
    }

    const checkMatch = raw.match(/^(\s*)[-*•]\s*\[([ xX])\]\s?(.*)$/);
    if (checkMatch) {
      const isChecked = checkMatch[2].toLowerCase() === 'x';
      blocks.push({
        id,
        type: 'checkbox',
        isChecked,
        text: checkMatch[3] || '',
      });
      continue;
    }

    const bulletMatch = raw.match(/^(\s*)[-*•]\s+(.*)$/);
    if (bulletMatch) {
      blocks.push({
        id,
        type: 'bullet',
        text: bulletMatch[2] || '',
      });
      continue;
    }

    const numMatch = raw.match(/^(\s*)(\d+)\.\s+(.*)$/);
    if (numMatch) {
      blocks.push({
        id,
        type: 'number',
        num: parseInt(numMatch[2], 10),
        text: numMatch[3] || '',
      });
      continue;
    }

    const quoteMatch = raw.match(/^(\s*)>\s?(.*)$/);
    if (quoteMatch) {
      blocks.push({
        id,
        type: 'quote',
        text: quoteMatch[2] || '',
      });
      continue;
    }

    blocks.push({ id, type: 'normal', text: raw });
  }

  return blocks.length > 0 ? blocks : [{ id: generateId(), type: 'normal', text: '' }];
};

/**
 * Serializes block items into standard Markdown for saving to database.
 */
const serializeBlocksToMarkdown = (blocks: BlockItem[]): string => {
  return blocks
    .map((b) => {
      switch (b.type) {
        case 'h1':
          return `# ${b.text}`;
        case 'h2':
          return `## ${b.text}`;
        case 'h3':
          return `### ${b.text}`;
        case 'checkbox':
          return `- [${b.isChecked ? 'x' : ' '}] ${b.text}`;
        case 'bullet':
          return `- ${b.text}`;
        case 'number':
          return `${b.num ?? 1}. ${b.text}`;
        case 'quote':
          return `> ${b.text}`;
        case 'divider':
          return '---';
        case 'normal':
        default:
          return b.text;
      }
    })
    .join('\n');
};

const NoteBodyEditor = forwardRef<NoteBodyEditorHandle, NoteBodyEditorProps>((props, ref) => {
  const {
    value,
    onChange,
    onCursorChange,
    onActiveBlockChange,
    colors,
    isArabic,
    baseStyle,
    placeholder,
  } = props;

  const [blocks, setBlocks] = useState<BlockItem[]>(() => parseMarkdownToBlocks(value));
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeIdRef = useRef<string | null>(null);
  const blocksRef = useRef<BlockItem[]>(blocks);
  const inputRefs = useRef<Record<string, any>>({});
  const selectionMapRef = useRef<Record<string, { start: number; end: number }>>({});
  const lastSerializedRef = useRef<string>(value || '');

  // Keep blocksRef in sync
  blocksRef.current = blocks;

  const notifyActiveState = useCallback(
    (blockId: string | null) => {
      if (!blockId) return;
      const block = blocksRef.current.find((b) => b.id === blockId);
      if (!block) return;

      const sel = selectionMapRef.current[blockId] || { start: 0, end: 0 };
      const selText = block.text.slice(sel.start, sel.end);
      const hasSelection = sel.start !== sel.end;

      const checkText = hasSelection ? selText : block.text;
      const isBold = /\*\*[^*]+\*\*/.test(checkText);
      const isItalic = /__[^_]+__|_[^_]+_|\*[^*]+\*/.test(checkText);
      const isStrike = /~~[^~]+~~/.test(checkText);

      onActiveBlockChange?.({
        blockType: block.type,
        isChecked: block.isChecked,
        hasSelection,
        selectedText: selText,
        isBold,
        isItalic,
        isStrike,
      });
    },
    [onActiveBlockChange]
  );

  // Sync external changes (e.g. AI summary insertions, initial load) while ignoring local keystrokes
  useEffect(() => {
    if (value === undefined) return;
    if (value === lastSerializedRef.current) return;
    const currentSerialized = serializeBlocksToMarkdown(blocksRef.current);
    if (value === currentSerialized) return;

    lastSerializedRef.current = value;
    const parsed = parseMarkdownToBlocks(value, blocksRef.current);
    setBlocks(parsed);
    blocksRef.current = parsed;
  }, [value]);

  const commitBlocks = useCallback(
    (newBlocks: BlockItem[]) => {
      blocksRef.current = newBlocks;
      setBlocks(newBlocks);
      const markdown = serializeBlocksToMarkdown(newBlocks);
      lastSerializedRef.current = markdown;
      onChange(markdown);
    },
    [onChange]
  );

  const getActiveIndex = useCallback((): number => {
    const id = activeIdRef.current || activeId;
    if (!id) return blocksRef.current.length - 1;
    const idx = blocksRef.current.findIndex((b) => b.id === id);
    return idx >= 0 ? idx : blocksRef.current.length - 1;
  }, [activeId]);

  const focusBlock = useCallback((id: string, cursorPosition?: number) => {
    activeIdRef.current = id;
    setActiveId(id);
    setTimeout(() => {
      const input = inputRefs.current[id];
      if (input) {
        input.focus();
        if (typeof cursorPosition === 'number') {
          input.setNativeProps({
            selection: { start: cursorPosition, end: cursorPosition },
          });
        }
      }
    }, 30);
  }, []);

  const handleSelectionChange = useCallback(
    (blockId: string, selection: { start: number; end: number }) => {
      selectionMapRef.current[blockId] = selection;
      onCursorChange?.(selection.start);
      notifyActiveState(blockId);
    },
    [onCursorChange, notifyActiveState]
  );

  /**
   * Handles text changes and Enter keypresses within a specific line block.
   */
  const handleBlockTextChange = useCallback(
    (index: number, newText: string) => {
      const currentBlock = blocksRef.current[index];
      if (!currentBlock) return;

      // Detect if user pressed Enter inside this line
      const nlIndex = newText.indexOf('\n');
      if (nlIndex >= 0) {
        const textBeforeNl = newText.slice(0, nlIndex);
        const textAfterNl = newText.slice(nlIndex + 1);

        const currentType = currentBlock.type;
        const currentTextTrimmed = textBeforeNl.trim();

        // 1. Enter on an empty formatted line -> revert to normal paragraph
        if (
          (currentType === 'checkbox' ||
            currentType === 'bullet' ||
            currentType === 'number' ||
            currentType === 'quote') &&
          currentTextTrimmed === ''
        ) {
          const updatedBlocks = [...blocksRef.current];
          updatedBlocks[index] = {
            ...currentBlock,
            type: 'normal',
            text: '',
          };
          commitBlocks(updatedBlocks);
          focusBlock(currentBlock.id, 0);
          notifyActiveState(currentBlock.id);
          return;
        }

        // 2. Enter on a filled line -> determine the next line's type
        let nextType: BlockType = 'normal';
        let nextNum: number | undefined = undefined;

        if (currentType === 'checkbox') {
          nextType = 'checkbox';
        } else if (currentType === 'bullet') {
          nextType = 'bullet';
        } else if (currentType === 'number') {
          nextType = 'number';
          nextNum = (currentBlock.num ?? 1) + 1;
        } else {
          // Headings and quotes cleanly exit to normal body text on Enter
          nextType = 'normal';
        }

        const newBlock: BlockItem = {
          id: generateId(),
          type: nextType,
          text: textAfterNl,
          isChecked: false,
          num: nextNum,
        };

        const updatedBlocks = [...blocksRef.current];
        updatedBlocks[index] = {
          ...currentBlock,
          text: textBeforeNl,
        };
        updatedBlocks.splice(index + 1, 0, newBlock);

        commitBlocks(updatedBlocks);
        focusBlock(newBlock.id, 0);
        notifyActiveState(newBlock.id);
        return;
      }

      // Normal typing on current block
      const updatedBlocks = [...blocksRef.current];
      updatedBlocks[index] = {
        ...currentBlock,
        text: newText,
      };
      commitBlocks(updatedBlocks);
      notifyActiveState(currentBlock.id);
    },
    [commitBlocks, focusBlock, notifyActiveState]
  );

  /**
   * Handles Backspace when a block's text is empty.
   */
  const handleBlockKeyPress = useCallback(
    (index: number, key: string) => {
      if (key === 'Backspace') {
        const currentBlock = blocksRef.current[index];
        if (!currentBlock) return;

        // If line is empty and has formatting, strip format back to normal
        if (currentBlock.text === '' && currentBlock.type !== 'normal') {
          const updatedBlocks = [...blocksRef.current];
          updatedBlocks[index] = {
            ...currentBlock,
            type: 'normal',
          };
          commitBlocks(updatedBlocks);
          notifyActiveState(currentBlock.id);
          return;
        }

        // If line is empty and normal, delete this line and jump to previous line
        if (currentBlock.text === '' && currentBlock.type === 'normal' && index > 0) {
          const prevBlock = blocksRef.current[index - 1];
          const updatedBlocks = [...blocksRef.current];
          updatedBlocks.splice(index, 1);
          commitBlocks(updatedBlocks);
          if (prevBlock) {
            focusBlock(prevBlock.id, prevBlock.text.length);
            notifyActiveState(prevBlock.id);
          }
        }
      }
    },
    [commitBlocks, focusBlock, notifyActiveState]
  );

  /**
   * Toggles checkbox checked state.
   */
  const toggleCheckboxState = useCallback(
    (index: number) => {
      const currentBlock = blocksRef.current[index];
      if (!currentBlock || currentBlock.type !== 'checkbox') return;

      const updatedBlocks = [...blocksRef.current];
      updatedBlocks[index] = {
        ...currentBlock,
        isChecked: !currentBlock.isChecked,
      };
      commitBlocks(updatedBlocks);
      notifyActiveState(currentBlock.id);
    },
    [commitBlocks, notifyActiveState]
  );

  /**
   * Toolbar helpers to toggle line types.
   */
  const toggleHeading = useCallback(
    (level: 1 | 2 | 3) => {
      const idx = getActiveIndex();
      const currentBlock = blocksRef.current[idx];
      if (!currentBlock) return;

      const targetType = `h${level}` as BlockType;
      const nextType = currentBlock.type === targetType ? 'normal' : targetType;

      const updatedBlocks = [...blocksRef.current];
      updatedBlocks[idx] = {
        ...currentBlock,
        type: nextType,
      };
      commitBlocks(updatedBlocks);
      focusBlock(currentBlock.id);
      notifyActiveState(currentBlock.id);
    },
    [getActiveIndex, commitBlocks, focusBlock, notifyActiveState]
  );

  const toggleChecklist = useCallback(() => {
    const idx = getActiveIndex();
    const currentBlock = blocksRef.current[idx];
    if (!currentBlock) return;

    let nextType: BlockType = 'checkbox';
    let nextChecked = false;

    if (currentBlock.type === 'checkbox') {
      if (!currentBlock.isChecked) {
        nextType = 'checkbox';
        nextChecked = true;
      } else {
        nextType = 'normal';
        nextChecked = false;
      }
    }

    const updatedBlocks = [...blocksRef.current];
    updatedBlocks[idx] = {
      ...currentBlock,
      type: nextType,
      isChecked: nextChecked,
    };
    commitBlocks(updatedBlocks);
    focusBlock(currentBlock.id);
    notifyActiveState(currentBlock.id);
  }, [getActiveIndex, commitBlocks, focusBlock, notifyActiveState]);

  const toggleBullet = useCallback(() => {
    const idx = getActiveIndex();
    const currentBlock = blocksRef.current[idx];
    if (!currentBlock) return;

    const nextType = currentBlock.type === 'bullet' ? 'normal' : 'bullet';
    const updatedBlocks = [...blocksRef.current];
    updatedBlocks[idx] = {
      ...currentBlock,
      type: nextType,
    };
    commitBlocks(updatedBlocks);
    focusBlock(currentBlock.id);
    notifyActiveState(currentBlock.id);
  }, [getActiveIndex, commitBlocks, focusBlock, notifyActiveState]);

  const toggleNumber = useCallback(() => {
    const idx = getActiveIndex();
    const currentBlock = blocksRef.current[idx];
    if (!currentBlock) return;

    const nextType = currentBlock.type === 'number' ? 'normal' : 'number';
    const updatedBlocks = [...blocksRef.current];
    updatedBlocks[idx] = {
      ...currentBlock,
      type: nextType,
      num: 1,
    };
    commitBlocks(updatedBlocks);
    focusBlock(currentBlock.id);
    notifyActiveState(currentBlock.id);
  }, [getActiveIndex, commitBlocks, focusBlock, notifyActiveState]);

  const toggleQuote = useCallback(() => {
    const idx = getActiveIndex();
    const currentBlock = blocksRef.current[idx];
    if (!currentBlock) return;

    const nextType = currentBlock.type === 'quote' ? 'normal' : 'quote';
    const updatedBlocks = [...blocksRef.current];
    updatedBlocks[idx] = {
      ...currentBlock,
      type: nextType,
    };
    commitBlocks(updatedBlocks);
    focusBlock(currentBlock.id);
    notifyActiveState(currentBlock.id);
  }, [getActiveIndex, commitBlocks, focusBlock, notifyActiveState]);

  const insertHashtag = useCallback(() => {
    const idx = getActiveIndex();
    const currentBlock = blocksRef.current[idx];
    if (!currentBlock) return;

    const prefix = currentBlock.text.length > 0 && !currentBlock.text.endsWith(' ') ? ' ' : '';
    const updatedBlocks = [...blocksRef.current];
    updatedBlocks[idx] = {
      ...currentBlock,
      text: `${currentBlock.text}${prefix}#tag `,
    };
    commitBlocks(updatedBlocks);
    focusBlock(currentBlock.id);
    notifyActiveState(currentBlock.id);
  }, [getActiveIndex, commitBlocks, focusBlock, notifyActiveState]);

  const applyInlineFormat = useCallback(
    (marker: '**' | '__' | '~~' | '`') => {
      const idx = getActiveIndex();
      const currentBlock = blocksRef.current[idx];
      if (!currentBlock) return;

      const sel = selectionMapRef.current[currentBlock.id] || {
        start: currentBlock.text.length,
        end: currentBlock.text.length,
      };
      const { start, end } = sel;
      const original = currentBlock.text;

      let newText = '';
      let newCursor = start;

      if (start !== end) {
        const selected = original.slice(start, end);
        if (
          start >= marker.length &&
          original.slice(start - marker.length, start) === marker &&
          original.slice(end, end + marker.length) === marker
        ) {
          // Unwrap
          newText =
            original.slice(0, start - marker.length) +
            selected +
            original.slice(end + marker.length);
          newCursor = start - marker.length + selected.length;
        } else {
          // Wrap selected text
          newText = original.slice(0, start) + marker + selected + marker + original.slice(end);
          newCursor = end + marker.length * 2;
        }
      } else {
        // No selection: insert marker pair with cursor in the middle
        newText = original.slice(0, start) + marker + marker + original.slice(start);
        newCursor = start + marker.length;
      }

      const updatedBlocks = [...blocksRef.current];
      updatedBlocks[idx] = {
        ...currentBlock,
        text: newText,
      };
      commitBlocks(updatedBlocks);
      focusBlock(currentBlock.id, newCursor);
      notifyActiveState(currentBlock.id);
    },
    [getActiveIndex, commitBlocks, focusBlock, notifyActiveState]
  );

  const insertDivider = useCallback(() => {
    const idx = getActiveIndex();
    const newDivider: BlockItem = { id: generateId(), type: 'divider', text: '' };
    const nextNormal: BlockItem = { id: generateId(), type: 'normal', text: '' };

    const updatedBlocks = [...blocksRef.current];
    updatedBlocks.splice(idx + 1, 0, newDivider, nextNormal);
    commitBlocks(updatedBlocks);
    focusBlock(nextNormal.id, 0);
    notifyActiveState(nextNormal.id);
  }, [getActiveIndex, commitBlocks, focusBlock, notifyActiveState]);

  const focus = useCallback(() => {
    const lastBlock = blocksRef.current[blocksRef.current.length - 1];
    if (lastBlock) {
      focusBlock(lastBlock.id, lastBlock.text.length);
      notifyActiveState(lastBlock.id);
    }
  }, [focusBlock, notifyActiveState]);

  useImperativeHandle(
    ref,
    () => ({
      toggleHeading,
      toggleChecklist,
      toggleBullet,
      toggleNumber,
      toggleQuote,
      insertHashtag,
      applyInlineFormat,
      insertDivider,
      getPlainText: () => serializeBlocksToMarkdown(blocksRef.current),
      focus,
    }),
    [
      toggleHeading,
      toggleChecklist,
      toggleBullet,
      toggleNumber,
      toggleQuote,
      insertHashtag,
      applyInlineFormat,
      insertDivider,
      focus,
    ]
  );

  const baseFontSize = baseStyle?.fontSize || 17;
  const activeFontFamily = baseStyle?.fontFamily;
  const activeFontWeight = baseStyle?.fontWeight || 'normal';
  const activeFontStyle = baseStyle?.fontStyle || 'normal';
  const activeFontColor = baseStyle?.color || colors.text;

  return (
    <View style={styles.container}>
      {blocks.map((block, index) => {
        if (block.type === 'divider') {
          return (
            <View
              key={block.id}
              style={[
                styles.divider,
                { backgroundColor: colors.border || 'rgba(255, 255, 255, 0.12)' },
              ]}
            />
          );
        }

        // Determine typography styles based on block type
        let fontSize = baseFontSize;
        let fontWeight = activeFontWeight;
        let fontStyle = activeFontStyle;
        let textColor = activeFontColor;
        let lineHeight = Math.round(baseFontSize * 1.45);

        if (block.type === 'h1') {
          fontSize = Math.round(baseFontSize * 1.55);
          fontWeight = '800';
          lineHeight = Math.round(fontSize * 1.3);
        } else if (block.type === 'h2') {
          fontSize = Math.round(baseFontSize * 1.3);
          fontWeight = '700';
          lineHeight = Math.round(fontSize * 1.35);
        } else if (block.type === 'h3') {
          fontSize = Math.round(baseFontSize * 1.12);
          fontWeight = '700';
          lineHeight = Math.round(fontSize * 1.4);
        } else if (block.type === 'quote') {
          fontStyle = 'italic';
          textColor = colors.textMuted || activeFontColor;
        }

        if (block.type === 'checkbox' && block.isChecked) {
          textColor = colors.textMuted || '#888';
        }

        return (
          <View
            key={block.id}
            style={[
              styles.blockRow,
              isArabic && { flexDirection: 'row-reverse' },
              block.type === 'quote' &&
                (isArabic
                  ? {
                      borderRightWidth: 3,
                      borderRightColor: colors.primary || '#6366F1',
                      paddingRight: 12,
                      marginRight: 4,
                    }
                  : {
                      borderLeftWidth: 3,
                      borderLeftColor: colors.primary || '#6366F1',
                      paddingLeft: 12,
                      marginLeft: 4,
                    }),
            ]}
          >
            {/* Interactive Checkbox Widget */}
            {block.type === 'checkbox' && (
              <TouchableOpacity
                onPress={() => toggleCheckboxState(index)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={[
                  styles.checkboxBox,
                  isArabic ? { marginLeft: 10, marginRight: 0 } : { marginRight: 10, marginLeft: 0 },
                  {
                    borderColor: block.isChecked
                      ? colors.primary || '#6366F1'
                      : colors.textMuted || '#666',
                    backgroundColor: block.isChecked
                      ? colors.primary || '#6366F1'
                      : 'transparent',
                    marginTop: Math.max(3, (lineHeight - 20) / 2),
                  },
                ]}
              >
                {block.isChecked && (
                  <Text style={styles.checkmarkIcon}>✓</Text>
                )}
              </TouchableOpacity>
            )}

            {/* Bullet Point Widget */}
            {block.type === 'bullet' && (
              <Text
                style={[
                  styles.bulletGlyph,
                  isArabic ? { marginLeft: 6, marginRight: 0 } : { marginRight: 6, marginLeft: 0 },
                  {
                    color: colors.primary || colors.text,
                    fontSize: baseFontSize,
                    lineHeight: lineHeight,
                    marginTop: 1,
                  },
                ]}
              >
                •
              </Text>
            )}

            {/* Numbered List Widget */}
            {block.type === 'number' && (
              <Text
                style={[
                  styles.numberGlyph,
                  isArabic
                    ? { marginLeft: 6, marginRight: 0, textAlign: 'right' }
                    : { marginRight: 6, marginLeft: 0, textAlign: 'left' },
                  {
                    color: colors.primary || colors.text,
                    fontSize: baseFontSize,
                    lineHeight: lineHeight,
                    marginTop: 1,
                  },
                ]}
              >
                {`${block.num ?? index + 1}.`}
              </Text>
            )}

            {/* Main Text Input for this Line */}
            <TextInput
              ref={(r) => {
                inputRefs.current[block.id] = r;
              }}
              style={[
                styles.blockInput,
                {
                  fontSize,
                  fontWeight: fontWeight as any,
                  fontStyle: fontStyle as any,
                  fontFamily: activeFontFamily,
                  color: textColor,
                  lineHeight,
                  textAlign: isArabic ? 'right' : 'left',
                  textDecorationLine:
                    block.type === 'checkbox' && block.isChecked
                      ? 'line-through'
                      : 'none',
                },
              ]}
              value={block.text}
              onChangeText={(t) => handleBlockTextChange(index, t)}
              onSelectionChange={(e) => handleSelectionChange(block.id, e.nativeEvent.selection)}
              onKeyPress={(e) => handleBlockKeyPress(index, e.nativeEvent.key)}
              onFocus={() => {
                activeIdRef.current = block.id;
                setActiveId(block.id);
                notifyActiveState(block.id);
              }}
              multiline
              blurOnSubmit={false}
              placeholder={
                blocks.length === 1 && index === 0
                  ? placeholder || (isArabic ? 'ابدأ الكتابة هنا...' : 'Start typing here...')
                  : undefined
              }
              placeholderTextColor={colors.textMuted}
              selectionColor={colors.primary || '#6366F1'}
              underlineColorAndroid="transparent"
              disableFullscreenUI
              scrollEnabled={false}
            />
          </View>
        );
      })}

      {/* Trailing empty tap zone to continue writing at the end */}
      <TouchableWithoutFeedback onPress={focus}>
        <View style={styles.trailingArea} />
      </TouchableWithoutFeedback>
    </View>
  );
});

NoteBodyEditor.displayName = 'NoteBodyEditor';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 8,
    minHeight: 350,
  },
  blockRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 2,
    minHeight: 28,
  },
  blockInput: {
    flex: 1,
    paddingVertical: 2,
    paddingHorizontal: 0,
    margin: 0,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkmarkIcon: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  bulletGlyph: {
    width: 22,
    textAlign: 'center',
    fontWeight: '700',
    marginRight: 4,
  },
  numberGlyph: {
    minWidth: 22,
    textAlign: 'left',
    fontWeight: '700',
    marginRight: 6,
  },
  divider: {
    height: 1,
    marginVertical: 12,
    opacity: 0.6,
  },
  trailingArea: {
    flex: 1,
    minHeight: 200,
  },
});

export default NoteBodyEditor;
