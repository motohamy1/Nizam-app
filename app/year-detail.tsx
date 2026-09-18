import { api } from '@/convex/_generated/api';
import { useAuth } from '@/hooks/useAuth';
import { useOfflineMutation } from '@/hooks/useOfflineMutation';
import { useOfflineQuery } from '@/hooks/useOfflineQuery';
import useTheme from '@/hooks/useTheme';
import { useTranslation } from '@/utils/i18n';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AnimatedWavyHeader from '@/components/AnimatedWavyHeader';

// ─── Block System ─────────────────────────────────────────────────────────
interface Block {
  id: string;
  type: 'text' | 'todo' | 'h1' | 'h2' | 'h3' | 'bullet';
  content: string;
  checked?: boolean;
}

const parseMarkdown = (text: string): Block[] => {
  if (!text.trim()) return [{ id: 'first', type: 'text', content: '' }];
  return text.split('\n').map((line, idx) => {
    let type: Block['type'] = 'text';
    let content = line;
    let checked = false;

    if (line.startsWith('☐ ')) { type = 'todo'; content = line.substring(2); checked = false; }
    else if (line.startsWith('☑ ')) { type = 'todo'; content = line.substring(2); checked = true; }
    else if (line.startsWith('### ')) { type = 'h3'; content = line.substring(4); }
    else if (line.startsWith('## ')) { type = 'h2'; content = line.substring(3); }
    else if (line.startsWith('• ')) { type = 'bullet'; content = line.substring(2); }
    else if (line.startsWith('# ')) { type = 'h1'; content = line.substring(2); }
    return { id: `block-${idx}-${Date.now()}`, type, content, checked };
  });
};

const serializeBlocks = (blocksToSave: Block[]): string => {
  return blocksToSave.map(b => {
    if (b.type === 'todo') return (b.checked ? '☑ ' : '☐ ') + b.content;
    if (b.type === 'h1') return '# ' + b.content;
    if (b.type === 'h2') return '## ' + b.content;
    if (b.type === 'h3') return '### ' + b.content;
    if (b.type === 'bullet') return '• ' + b.content;
    return b.content;
  }).join('\n');
};

const countStats = (body?: string) => {
  if (!body) return { total: 0, completed: 0 };
  const blocks = parseMarkdown(body);
  const todos = blocks.filter(b => b.type === 'todo');
  return { total: todos.length, completed: todos.filter(b => b.checked).length };
};

// ─── BlockItem ────────────────────────────────────────────────────────────
const BlockItem = React.memo(({
  item, isArabic, colors, blockRefs,
  onContentChange, onToggleTodo, onAddNewBlock, onDeleteBlock, onFocus
}: {
  item: Block; isArabic: boolean; colors: any;
  blockRefs: React.MutableRefObject<{ [key: string]: TextInput | null }>;
  onContentChange: (blockId: string, newContent: string) => void;
  onToggleTodo: (blockId: string) => void;
  onAddNewBlock: (afterBlockId: string, type: Block['type']) => void;
  onDeleteBlock: (blockId: string) => void;
  onFocus: (blockId: string) => void;
}) => {
  const [localText, setLocalText] = useState(item.content);
  const [blockHeight, setBlockHeight] = React.useState(0);
  useEffect(() => { setLocalText(item.content); }, [item.content]);

  const handleTextChange = useCallback((txt: string) => {
    setLocalText(txt);
    onContentChange(item.id, txt);
  }, [item.id, onContentChange]);

  const handleKeyPress = useCallback((e: any) => {
    if (e.nativeEvent.key === 'Backspace' && item.content === '') {
      onDeleteBlock(item.id);
    }
  }, [item.content, item.id, onDeleteBlock]);

  return (
    <View style={{
      flexDirection: isArabic ? 'row-reverse' : 'row',
      alignItems: 'flex-start',
      paddingHorizontal: 4,
      marginBottom: 6,
    }}>
      {item.type === 'todo' && (
        <TouchableOpacity onPress={() => onToggleTodo(item.id)} style={{ marginTop: 10, marginHorizontal: 4 }}>
          <View style={{
            width: 20, height: 20, borderRadius: 6,
            borderWidth: 2, borderColor: item.checked ? colors.success : colors.border,
            backgroundColor: item.checked ? colors.success : 'transparent',
            justifyContent: 'center', alignItems: 'center',
          }}>
            {item.checked && <Ionicons name="checkmark" size={14} color="#FFF" />}
          </View>
        </TouchableOpacity>
      )}
      {item.type === 'bullet' && (
        <View style={{ width: 24, paddingTop: 12, alignItems: 'center' }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary }} />
        </View>
      )}
      <TextInput
        ref={el => { blockRefs.current[item.id] = el; }}
        style={{
          flex: 1,
          paddingTop: 8, paddingBottom: 8,
          fontSize: item.type === 'h1' ? 28 : item.type === 'h2' ? 22 : item.type === 'h3' ? 18 : 15,
          fontWeight: (item.type === 'h1' || item.type === 'h2' || item.type === 'h3') ? '800' : '500',
          color: colors.text,
          textDecorationLine: (item.type === 'todo' && item.checked) ? 'line-through' : 'none',
          opacity: (item.type === 'todo' && item.checked) ? 0.5 : 1,
          textAlign: isArabic ? 'right' : 'left',
          lineHeight: item.type === 'h1' ? 38 : item.type === 'h2' ? 30 : 24,
          minHeight: 40,
          height: Math.max(40, blockHeight + 16),
        }}
        placeholder={item.type.startsWith('h') ? `Heading ${item.type.charAt(1)}` : "Type..."}
        placeholderTextColor={colors.textMuted + '60'}
        value={localText}
        onChangeText={handleTextChange}
        onFocus={() => onFocus(item.id)}
        onKeyPress={handleKeyPress}
        onSubmitEditing={() => { if (item.type !== 'text') onAddNewBlock(item.id, 'text'); }}
        multiline={true}
        blurOnSubmit={false}
        scrollEnabled={false}
        onContentSizeChange={(e) => setBlockHeight(e.nativeEvent.contentSize.height)}
      />
    </View>
  );
});
BlockItem.displayName = 'BlockItem';

// ─── RichEditor (no big title, just blocks) ────────────────────────────────
const RichEditor = React.memo(({
  blocks, setBlocks, isArabic, colors, activeBlockId, setActiveBlockId, blockRefs
}: {
  blocks: Block[];
  setBlocks: React.Dispatch<React.SetStateAction<Block[]>>;
  isArabic: boolean; colors: any;
  activeBlockId: string | null;
  setActiveBlockId: (id: string | null) => void;
  blockRefs: React.MutableRefObject<{ [key: string]: TextInput | null }>;
}) => {
  const handleBlockTextChange = useCallback((blockId: string, newContent: string) => {
    if (newContent.includes('\n')) {
      const parts = newContent.split('\n');
      const textBefore = parts[0];
      const textAfter = parts.slice(1).join('\n');
      setBlocks(prev => {
        const idx = prev.findIndex(b => b.id === blockId);
        if (idx === -1) return prev;
        const currentBlock = prev[idx];
        const newBlocks = [...prev];
        newBlocks[idx] = { ...currentBlock, content: textBefore };
        const newType = (currentBlock.type === 'todo' || currentBlock.type === 'bullet') ? currentBlock.type : 'text';
        const newBlock: Block = { id: Math.random().toString(), type: newType, content: textAfter };
        newBlocks.splice(idx + 1, 0, newBlock);
        setTimeout(() => blockRefs.current[newBlock.id]?.focus(), 50);
        return newBlocks;
      });
      return;
    }
    setBlocks(prev => prev.map(b => b.id === blockId ? { ...b, content: newContent } : b));
  }, [setBlocks, blockRefs]);

  const toggleTodo = useCallback((blockId: string) => {
    setBlocks(prev => prev.map(b => b.id === blockId ? { ...b, checked: !b.checked } : b));
  }, [setBlocks]);

  const addNewBlock = useCallback((afterBlockId: string, type: Block['type'] = 'text') => {
    setBlocks(prev => {
      const idx = prev.findIndex(b => b.id === afterBlockId);
      const newBlock: Block = { id: Math.random().toString(), type, content: '' };
      const newBlocks = [...prev];
      newBlocks.splice(idx + 1, 0, newBlock);
      setTimeout(() => blockRefs.current[newBlock.id]?.focus(), 100);
      return newBlocks;
    });
  }, [setBlocks, blockRefs]);

  const deleteBlock = useCallback((blockId: string) => {
    setBlocks(prev => {
      if (prev.length <= 1) return prev;
      const idx = prev.findIndex(b => b.id === blockId);
      const newBlocks = prev.filter(b => b.id !== blockId);
      const prevBlock = prev[idx - 1];
      if (prevBlock) setTimeout(() => blockRefs.current[prevBlock.id]?.focus(), 100);
      return newBlocks;
    });
  }, [setBlocks, blockRefs]);

  return (
    <View style={{
      backgroundColor: colors.surface,
      borderRadius: 24,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border + '30',
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.22,
      shadowRadius: 28,
      elevation: 9,
    }}>
      {blocks.map((item) => (
        <BlockItem
          key={item.id}
          item={item}
          isArabic={isArabic}
          colors={colors}
          blockRefs={blockRefs}
          onContentChange={handleBlockTextChange}
          onToggleTodo={toggleTodo}
          onAddNewBlock={addNewBlock}
          onDeleteBlock={deleteBlock}
          onFocus={(id) => setActiveBlockId(id)}
        />
      ))}
      <TouchableOpacity
        style={{ padding: 8, alignSelf: 'center' }}
        onPress={() => {
          if (blocks.length > 0) {
            const lastBlock = blocks[blocks.length - 1];
            addNewBlock(lastBlock.id, 'text');
          }
        }}
      >
        <Ionicons name="add-circle-outline" size={24} color={colors.textMuted} />
      </TouchableOpacity>
    </View>
  );
});
RichEditor.displayName = 'RichEditor';

// ─── YearDetailScreen ──────────────────────────────────────────────────────
export default function YearDetailScreen() {
  const router = useRouter();
  const { year } = useLocalSearchParams<{ year: string }>();
  const yearNum = parseInt(year || '2025', 10);
  const { colors } = useTheme();
  const { userId, language } = useAuth();
  const { t, isArabic } = useTranslation(language);
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<'goals' | 'achievements'>('goals');

  // Categories
  const [activeGoalCategory, setActiveGoalCategory] = useState<string | null>(null);
  const [activeAchievementCategory, setActiveAchievementCategory] = useState<string | null>(null);
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Blocks per category
  const [blocksMap, setBlocksMap] = useState<Record<string, Block[]>>({});
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const blockRefs = useRef<{ [key: string]: TextInput | null }>({});

  // Queries
  const goalsData = useOfflineQuery<any[]>('yearlyGoals', api.yearlyGoals.getGoals, userId ? { userId, year: yearNum } : 'skip') || [];
  const achievementsData = useOfflineQuery<any[]>('yearlyAchievements', api.yearlyGoals.getAchievements, userId ? { userId, year: yearNum } : 'skip') || [];

  // Mutations
  const addGoalMutation = useOfflineMutation(api.yearlyGoals.addGoal, 'yearlyGoals:addGoal');
  const updateGoalMutation = useOfflineMutation(api.yearlyGoals.updateGoal, 'yearlyGoals:updateGoal');
  const deleteGoalMutation = useOfflineMutation(api.yearlyGoals.deleteGoal, 'yearlyGoals:deleteGoal');
  const addAchievementMutation = useOfflineMutation(api.yearlyGoals.addAchievement, 'yearlyGoals:addAchievement');
  const updateAchievementMutation = useOfflineMutation(api.yearlyGoals.updateAchievement, 'yearlyGoals:updateAchievement');
  const deleteAchievementMutation = useOfflineMutation(api.yearlyGoals.deleteAchievement, 'yearlyGoals:deleteAchievement');

  const currentData = activeTab === 'goals' ? goalsData : achievementsData;
  const activeCategory = activeTab === 'goals' ? activeGoalCategory : activeAchievementCategory;
  const setActiveCategory = activeTab === 'goals' ? setActiveGoalCategory : setActiveAchievementCategory;

  // Load blocks when data or active category changes
  useEffect(() => {
    const data = activeTab === 'goals' ? goalsData : achievementsData;
    const categories = data.map((d: any) => d.text).filter(Boolean);

    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0]);
    }

    // Build blocks map from all docs
    const newMap: Record<string, Block[]> = {};
    data.forEach((doc: any) => {
      const key = `${activeTab}-${doc.text}`;
      newMap[key] = doc.description ? parseMarkdown(doc.description) : [{ id: `first-${doc._id}`, type: 'text', content: '' }];
    });
    setBlocksMap(prev => ({ ...prev, ...newMap }));
  }, [goalsData, achievementsData, activeTab]);

  // Get blocks for active category
  const getBlocks = (): Block[] => {
    if (!activeCategory) return [{ id: 'first', type: 'text', content: '' }];
    const key = `${activeTab}-${activeCategory}`;
    return blocksMap[key] || [{ id: 'first', type: 'text', content: '' }];
  };

  const setBlocks = (updater: React.SetStateAction<Block[]>) => {
    if (!activeCategory) return;
    const key = `${activeTab}-${activeCategory}`;
    setBlocksMap(prev => {
      const current = prev[key] || [{ id: 'first', type: 'text', content: '' }];
      const next = typeof updater === 'function' ? (updater as any)(current) : updater;
      return { ...prev, [key]: next };
    });
  };

  const saveCurrentCategory = async () => {
    if (!userId || !activeCategory) return;
    const data = activeTab === 'goals' ? goalsData : achievementsData;
    const doc = data.find((d: any) => d.text === activeCategory);
    const body = serializeBlocks(getBlocks());

    if (activeTab === 'goals') {
      if (doc) {
        await updateGoalMutation({ id: doc._id, text: activeCategory, description: body });
      } else {
        await addGoalMutation({ userId, year: yearNum, text: activeCategory, description: body });
      }
    } else {
      if (doc) {
        await updateAchievementMutation({ id: doc._id, text: activeCategory, description: body });
      } else {
        await addAchievementMutation({ userId, year: yearNum, text: activeCategory, description: body });
      }
    }
  };

  const handleSaveAll = async () => {
    if (!userId) return;
    // Save current active category first
    await saveCurrentCategory();
    router.back();
  };

  const handleDeleteCategory = async () => {
    if (!userId || !activeCategory) return;
    const data = activeTab === 'goals' ? goalsData : achievementsData;
    const doc = data.find((d: any) => d.text === activeCategory);
    if (doc) {
      if (activeTab === 'goals') {
        await deleteGoalMutation({ id: doc._id });
      } else {
        await deleteAchievementMutation({ id: doc._id });
      }
    }
    // Clear from local map
    const key = `${activeTab}-${activeCategory}`;
    setBlocksMap(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setActiveCategory(null);
  };

  const handleAddCategory = async () => {
    const name = newCategoryName.trim();
    if (!name || !userId) return;
    setNewCategoryName('');
    setShowNewCategoryInput(false);

    // Create empty doc
    if (activeTab === 'goals') {
      await addGoalMutation({ userId, year: yearNum, text: name, description: '' });
    } else {
      await addAchievementMutation({ userId, year: yearNum, text: name, description: '' });
    }

    // Switch to new category
    setActiveCategory(name);
    const key = `${activeTab}-${name}`;
    setBlocksMap(prev => ({ ...prev, [key]: [{ id: `first-${name}`, type: 'text', content: '' }] }));
  };

  const categories = currentData.map((d: any) => d.text).filter(Boolean);
  const isCurrentYear = yearNum === new Date().getFullYear();

  // Toolbar format toggle
  const toggleFormat = (format: 'h1' | 'h2' | 'h3' | 'todo' | 'bullet') => {
    if (!activeBlockId) return;
    const key = `${activeTab}-${activeCategory}`;
    setBlocksMap(prev => {
      const current = prev[key] || [];
      return {
        ...prev,
        [key]: current.map(b => {
          if (b.id !== activeBlockId) return b;
          if (b.type === format) return { ...b, type: 'text' as Block['type'] };
          return { ...b, type: format };
        }),
      };
    });
  };

  // ─── Category Pills ─────────────────────────────────────────────────────
  const renderCategoryPills = () => (
    <View style={{ marginBottom: 12 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 4, gap: 8, flexDirection: isArabic ? 'row-reverse' : 'row' }}
      >
        {categories.map((cat: string) => {
          const isActive = cat === activeCategory;
          const doc = currentData.find((d: any) => d.text === cat);
          const stats = countStats(doc?.description);
          const activeColor = activeTab === 'goals' ? colors.primary : colors.success;

          return (
            <TouchableOpacity
              key={cat}
              onPress={async () => {
                // Auto-save current before switching
                if (activeCategory && activeCategory !== cat) {
                  await saveCurrentCategory();
                }
                setActiveCategory(cat);
              }}
              activeOpacity={0.8}
              style={{
                flexDirection: isArabic ? 'row-reverse' : 'row',
                alignItems: 'center',
                gap: 6,
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 12,
                backgroundColor: isActive ? activeColor + '18' : colors.bg,
                borderWidth: 1.5,
                borderColor: isActive ? activeColor : colors.border + '30',
              }}
            >
              <Text style={{
                fontSize: 12,
                fontWeight: '700',
                color: isActive ? activeColor : colors.textMuted,
              }} numberOfLines={1}>
                {cat}
              </Text>
              {stats.total > 0 && (
                <View style={{
                  backgroundColor: isActive ? activeColor : colors.border + '40',
                  borderRadius: 8,
                  paddingHorizontal: 5,
                  paddingVertical: 1,
                }}>
                  <Text style={{
                    fontSize: 10,
                    fontWeight: '800',
                    color: isActive ? activeColor : colors.textMuted,
                  }}>
                    {stats.completed}/{stats.total}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        {/* Add Category */}
        {showNewCategoryInput ? (
          <View style={{
            flexDirection: isArabic ? 'row-reverse' : 'row',
            alignItems: 'center',
            gap: 6,
            backgroundColor: colors.bg,
            borderRadius: 12,
            borderWidth: 1.5,
            borderColor: colors.border + '40',
            paddingHorizontal: 8,
          }}>
            <TextInput
              style={{
                fontSize: 12,
                fontWeight: '600',
                color: colors.text,
                padding: 0,
                width: 100,
                textAlign: isArabic ? 'right' : 'left',
              }}
              placeholder={t.newCategoryPlaceholder}
              placeholderTextColor={colors.textMuted}
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              autoFocus
              onSubmitEditing={handleAddCategory}
              blurOnSubmit={false}
            />
            <TouchableOpacity onPress={handleAddCategory}>
              <Ionicons name="checkmark" size={16} color={colors.success} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setShowNewCategoryInput(false); setNewCategoryName(''); }}>
              <Ionicons name="close" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => setShowNewCategoryInput(true)}
            activeOpacity={0.8}
            style={{
              flexDirection: isArabic ? 'row-reverse' : 'row',
              alignItems: 'center',
              gap: 4,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 12,
              backgroundColor: colors.bg,
              borderWidth: 1.5,
              borderColor: colors.border + '30',
              borderStyle: 'dashed',
            }}
          >
            <Ionicons name="add" size={14} color={colors.textMuted} />
            <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textMuted }}>
              {t.addCategory}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDarkMode ? 'transparent' : colors.bg }} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={{ flex: 1 }}>
          {/* Header */}
          <AnimatedWavyHeader backgroundColor={colors.bg} waveHeight={10} contentStyle={{ paddingBottom: 2 }}>
            <View style={{
              flexDirection: isArabic ? 'row-reverse' : 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 20,
              paddingVertical: 8,
            }}>
              <TouchableOpacity
                style={{
                  width: 40, height: 40, borderRadius: 14,
                  backgroundColor: colors.surface,
                  justifyContent: 'center', alignItems: 'center',
                }}
                onPress={() => router.back()}
              >
                <Ionicons name={isArabic ? 'chevron-forward' : 'chevron-back'} size={22} color={colors.text} />
              </TouchableOpacity>

              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text }}>
                  {yearNum}
                </Text>
                {isCurrentYear && (
                  <View style={{
                    backgroundColor: colors.primary + '15',
                    paddingHorizontal: 8, paddingVertical: 2,
                    borderRadius: 6, marginTop: 2,
                  }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: colors.primary }}>{t.current}</Text>
                  </View>
                )}
              </View>

              <View style={{ flexDirection: isArabic ? 'row-reverse' : 'row', gap: 8 }}>
                <TouchableOpacity
                  style={{
                    width: 40, height: 40, borderRadius: 14,
                    backgroundColor: colors.success + '15',
                    justifyContent: 'center', alignItems: 'center',
                  }}
                  onPress={handleSaveAll}
                >
                  <Ionicons name="checkmark" size={22} color={colors.success} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    width: 40, height: 40, borderRadius: 14,
                    backgroundColor: colors.danger + '10',
                    justifyContent: 'center', alignItems: 'center',
                  }}
                  onPress={handleDeleteCategory}
                >
                  <Ionicons name="trash-outline" size={20} color={colors.danger} />
                </TouchableOpacity>
              </View>
            </View>
          </AnimatedWavyHeader>

          {/* ─── Toggle Segmented Control ─── */}
          <View style={{
            marginHorizontal: 20,
            marginTop: 12,
            marginBottom: 8,
            backgroundColor: colors.bg,
            borderRadius: 16,
            paddingVertical: 4,
            paddingHorizontal: 4,
            flexDirection: isArabic ? 'row-reverse' : 'row',
            borderWidth: 1,
            borderColor: colors.border + '25',
            gap: 4,
          }}>
            <TouchableOpacity
              style={{
                flex: 1,
                flexDirection: isArabic ? 'row-reverse' : 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                paddingVertical: 10,
                borderRadius: 12,
                backgroundColor: activeTab === 'goals' ? colors.primary : 'transparent',
              }}
              onPress={() => setActiveTab('goals')}
              activeOpacity={0.8}
            >
              <Ionicons name="flag-outline" size={16} color={activeTab === 'goals' ? colors.primaryText : colors.textMuted} />
              <Text style={{
                fontSize: 13,
                fontWeight: '700',
                color: activeTab === 'goals' ? colors.primaryText : colors.textMuted,
              }}>{t.goalsOfTheYear}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flex: 1,
                flexDirection: isArabic ? 'row-reverse' : 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                paddingVertical: 10,
                borderRadius: 12,
                backgroundColor: activeTab === 'achievements' ? colors.success : 'transparent',
              }}
              onPress={() => setActiveTab('achievements')}
              activeOpacity={0.8}
            >
              <Ionicons name="trophy-outline" size={16} color={activeTab === 'achievements' ? '#FFF' : colors.textMuted} />
              <Text style={{
                fontSize: 13,
                fontWeight: '700',
                color: activeTab === 'achievements' ? '#FFF' : colors.textMuted,
              }}>{t.achievementsOfTheYear}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Category Pills */}
            {renderCategoryPills()}

            {/* Category Title (small) */}
            {activeCategory && (
              <View style={{
                flexDirection: isArabic ? 'row-reverse' : 'row',
                alignItems: 'center',
                gap: 6,
                marginBottom: 10,
                paddingHorizontal: 4,
              }}>
                <Ionicons
                  name={activeTab === 'goals' ? 'flag' : 'trophy'}
                  size={14}
                  color={activeTab === 'goals' ? colors.primary : colors.success}
                />
                <Text style={{
                  fontSize: 15,
                  fontWeight: '700',
                  color: colors.text,
                }}>
                  {activeCategory}
                </Text>
              </View>
            )}

            {/* Rich Editor */}
            {activeCategory ? (
              <RichEditor
                blocks={getBlocks()}
                setBlocks={setBlocks}
                isArabic={isArabic}
                colors={colors}
                activeBlockId={activeBlockId}
                setActiveBlockId={setActiveBlockId}
                blockRefs={blockRefs}
              />
            ) : (
              <View style={{
                backgroundColor: colors.surface,
                borderRadius: 24,
                padding: 30,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: colors.border + '30',
                shadowColor: colors.shadow,
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.22,
                shadowRadius: 28,
                elevation: 9,
              }}>
                <Ionicons
                  name={activeTab === 'goals' ? 'flag-outline' : 'trophy-outline'}
                  size={36}
                  color={colors.textMuted}
                  style={{ marginBottom: 12 }}
                />
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textMuted, textAlign: 'center' }}>
                  {activeTab === 'goals' ? t.noGoalsYet : t.noAchievementsYet}
                </Text>
                <TouchableOpacity
                  style={{
                    marginTop: 16,
                    backgroundColor: activeTab === 'goals' ? colors.primary : colors.success,
                    paddingHorizontal: 20,
                    paddingVertical: 10,
                    borderRadius: 12,
                  }}
                  onPress={() => setShowNewCategoryInput(true)}
                >
                  <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 13 }}>
                    {t.addCategory}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>

          {/* Toolbar */}
          <View style={{
            backgroundColor: colors.surface,
            borderTopWidth: 1,
            borderColor: colors.border + '30',
            paddingVertical: 10,
            paddingHorizontal: 16,
            paddingBottom: Math.max(insets.bottom, 10) + 10,
            flexDirection: isArabic ? 'row-reverse' : 'row',
            alignItems: 'center',
            justifyContent: 'space-around',
          }}>
            <TouchableOpacity onPress={() => toggleFormat('h1')}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text }}>H1</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => toggleFormat('h2')}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>H2</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => toggleFormat('h3')}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>H3</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => toggleFormat('todo')}>
              <Ionicons name="checkbox-outline" size={22} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => toggleFormat('bullet')}>
              <Ionicons name="list-outline" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
