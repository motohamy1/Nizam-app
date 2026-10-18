import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOfflineMutation } from '@/hooks/useOfflineMutation';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useOfflineQuery } from '@/hooks/useOfflineQuery';
import { LIST_TYPE_COLORS } from '@/utils/magicColors';
import { useKeyboard } from '@/hooks/useKeyboard';

const LIST_TYPE_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  checklist: { label: 'Checklist', icon: 'checkbox-outline', color: LIST_TYPE_COLORS.checklist },
  todo: { label: 'To-Do Tasks', icon: 'list-outline', color: LIST_TYPE_COLORS.todo },
  bullet: { label: 'Bullet Points', icon: 'ellipse', color: LIST_TYPE_COLORS.bullet },
  toggle: { label: 'Toggle Lists', icon: 'albums-outline', color: LIST_TYPE_COLORS.toggle },
};

interface CategoryListModalProps {
  visible: boolean;
  onClose: () => void;
  categoryId?: Id<'projectCategories'>;
  subCategoryId?: Id<'projectSubCategories'>;
  listType: string;
  colors: any;
  styles: any;
  userId: Id<'users'> | null;
}

export default function CategoryListModal({
  visible,
  onClose,
  categoryId,
  subCategoryId,
  listType,
  colors,
  styles,
  userId,
}: CategoryListModalProps) {
  const config = LIST_TYPE_CONFIG[listType] || LIST_TYPE_CONFIG.bullet;
  const isTodo = listType === 'todo';
  const isToggle = listType === 'toggle';

  // Data fetching
  const allTodos = useOfflineQuery<any[]>('todos', api.todos.get, userId ? { userId } : 'skip');
  const categoryItems = useOfflineQuery<any[]>('categoryItems', api.projects.getCategoryItems, {
    ...(subCategoryId ? { subCategoryId } : { categoryId }),
    listType,
  });

  // Mutations
  const addTodoMutation = useOfflineMutation(api.todos.addTodo, 'todos:addTodo');
  const updateTodoStatus = useOfflineMutation(api.todos.updateStatus, 'todos:updateStatus');
  const deleteTodoMutation = useOfflineMutation(api.todos.deleteTodo, 'todos:deleteTodo');
  const addItem = useOfflineMutation(api.projects.addCategoryItem, 'projects:addCategoryItem');
  const updateItem = useOfflineMutation(api.projects.updateCategoryItem, 'projects:updateCategoryItem');
  const deleteItem = useOfflineMutation(api.projects.deleteCategoryItem, 'projects:deleteCategoryItem');

  // Local state
  const { keyboardHeight, isKeyboardVisible } = useKeyboard();
  const { height: screenHeight } = useWindowDimensions();
  const [newText, setNewText] = useState('');
  const [newContent, setNewContent] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const items = isTodo
    ? allTodos?.filter((t: any) =>
        subCategoryId
          ? t.subCategoryId === subCategoryId && !t.projectId
          : t.categoryId === categoryId && !t.projectId && !t.subCategoryId
      ) || []
    : categoryItems || [];

  const handleAdd = () => {
    const textToAdd = newText.trim();
    const contentToAdd = newContent.trim();
    if (!textToAdd || !userId) return;

    setNewText('');
    setNewContent('');
    setIsAdding(false);

    if (isTodo) {
      addTodoMutation({
        userId,
        text: textToAdd,
        date: Date.now(),
        status: 'not_started',
        ...(subCategoryId ? { subCategoryId } : { categoryId }),
      });
    } else {
      addItem({
        userId,
        ...(subCategoryId ? { subCategoryId } : { categoryId }),
        listType,
        text: textToAdd,
        content: isToggle ? contentToAdd || undefined : undefined,
      });
    }
  };

  const handleToggleCheck = (item: any) => {
    if (isTodo) {
      updateTodoStatus({
        id: item._id,
        status: item.status === 'done' ? 'not_started' : 'done',
      });
    } else {
      updateItem({ id: item._id, isCompleted: !item.isCompleted });
    }
  };

  const handleDelete = (item: any) => {
    if (isTodo) deleteTodoMutation({ id: item._id });
    else deleteItem({ id: item._id });
  };

  const handleToggleExpand = (item: any) => {
    if (isToggle) {
      updateItem({ id: item._id, isExpanded: !item.isExpanded });
    }
  };

  const getAddPlaceholder = () => {
    if (isToggle) return 'Toggle title...';
    if (isTodo) return 'Add a task...';
    if (listType === 'checklist') return 'Add checklist item...';
    return 'Add bullet point...';
  };

  const getIconName = () => {
    if (listType === 'checklist') return 'square-outline';
    if (listType === 'bullet') return 'ellipse';
    if (isTodo) return 'ellipse-outline';
    return 'chevron-forward';
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1 }}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.6)' }]} />
        </TouchableWithoutFeedback>
        <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
          <View style={{ flex: 1, justifyContent: 'flex-end', marginBottom: keyboardHeight }}>
            <ScrollView
              style={{
                maxHeight: isKeyboardVisible 
                  ? Math.max(280, screenHeight - keyboardHeight - 40)
                  : '90%',
              }}
              contentContainerStyle={{ 
                justifyContent: 'flex-end', 
                flexGrow: 1,
                paddingBottom: isKeyboardVisible ? 100 : 20,
              }}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.listModalSheet}>
                <View style={styles.modalHandle} />
                <Text style={styles.listModalTitle}>{config.label}</Text>
                <Text style={styles.listModalSubtitle}>
                  {items.length} item{items.length !== 1 ? 's' : ''}
                </Text>

                {items.length === 0 && !isAdding && (
                  <View style={styles.emptyListContainer}>
                    <Ionicons name={config.icon as any} size={32} color={colors.border} />
                    <Text style={styles.emptyListText}>No {config.label.toLowerCase()} yet</Text>
                  </View>
                )}

                {items.map((item: any) => {
                  const isDone = item.isCompleted || item.status === 'done';
                  return (
                    <View
                      key={item._id}
                      style={[
                        styles.listItemRow,
                        isToggle && { flexDirection: 'column', alignItems: 'stretch' },
                      ]}
                    >
                      {!isToggle && (
                        <>
                          {listType === 'checklist' && (
                            <TouchableOpacity onPress={() => handleToggleCheck(item)}>
                              <Ionicons
                                name={isDone ? 'checkbox' : 'square-outline'}
                                size={22}
                                color={isDone ? colors.success : colors.border}
                              />
                            </TouchableOpacity>
                          )}
                          {listType === 'bullet' && <View style={styles.bulletDot} />}
                          {isTodo && (
                            <TouchableOpacity onPress={() => handleToggleCheck(item)}>
                              <Ionicons
                                name={item.status === 'done' ? 'checkmark-circle' : 'ellipse-outline'}
                                size={22}
                                color={item.status === 'done' ? colors.success : colors.border}
                              />
                            </TouchableOpacity>
                          )}
                          <Text
                            style={[
                              styles.listItemText,
                              isDone && { textDecorationLine: 'line-through', color: colors.textMuted },
                            ]}
                          >
                            {item.text}
                          </Text>
                          <TouchableOpacity onPress={() => handleDelete(item)}>
                            <Ionicons name="close" size={18} color={colors.danger} />
                          </TouchableOpacity>
                        </>
                      )}

                      {isToggle && (
                        <>
                          <TouchableOpacity
                            style={styles.toggleHeader}
                            onPress={() => handleToggleExpand(item)}
                          >
                            <Ionicons
                              name={item.isExpanded ? 'chevron-down' : 'chevron-forward'}
                              size={20}
                              color={colors.primary}
                            />
                            <Text style={styles.listItemText}>{item.text}</Text>
                            <TouchableOpacity onPress={() => handleDelete(item)}>
                              <Ionicons name="close" size={18} color={colors.danger} />
                            </TouchableOpacity>
                          </TouchableOpacity>
                          {item.isExpanded && (
                            <View style={styles.toggleContent}>
                              <Text style={styles.toggleContentText}>
                                {item.content || 'No content added yet...'}
                              </Text>
                            </View>
                          )}
                        </>
                      )}
                    </View>
                  );
                })}

                {isAdding ? (
                  <View style={{ marginTop: 8, gap: 8 }}>
                    <View style={styles.listAddRow}>
                      <Ionicons name={getIconName() as any} size={20} color={colors.border} />
                      <TextInput
                        style={styles.listInput}
                        placeholder={getAddPlaceholder()}
                        placeholderTextColor={colors.textMuted}
                        value={newText}
                        onChangeText={setNewText}
                        autoFocus
                        onSubmitEditing={() => {
                          if (!isToggle) handleAdd();
                        }}
                      />
                      {!isToggle && (
                        <TouchableOpacity onPress={handleAdd}>
                          <Ionicons
                            name="arrow-up-circle"
                            size={28}
                            color={newText.trim() ? colors.primary : colors.textMuted}
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                    {isToggle && (
                      <TextInput
                        style={[styles.modalInput, { minHeight: 80, textAlignVertical: 'top' }]}
                        placeholder="Toggle content..."
                        placeholderTextColor={colors.textMuted}
                        value={newContent}
                        onChangeText={setNewContent}
                        multiline
                      />
                    )}
                    {isToggle && (
                      <>
                        <TouchableOpacity style={styles.modalPrimaryBtn} onPress={handleAdd}>
                          <Text style={styles.modalPrimaryBtnText}>Add Toggle Item</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.modalSecondaryBtn}
                          onPress={() => {
                            setIsAdding(false);
                            setNewText('');
                            setNewContent('');
                          }}
                        >
                          <Text style={styles.modalSecondaryBtnText}>Cancel</Text>
                        </TouchableOpacity>
                      </>
                    )}
                    {!isToggle && (
                      <TouchableOpacity
                        style={styles.modalSecondaryBtn}
                        onPress={() => {
                          setIsAdding(false);
                          setNewText('');
                        }}
                      >
                        <Text style={styles.modalSecondaryBtnText}>Cancel</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ) : (
                  <TouchableOpacity style={styles.listAddButton} onPress={() => setIsAdding(true)}>
                    <Ionicons name="add" size={20} color={colors.primary} />
                    <Text style={styles.listAddButtonText}>Add item</Text>
                  </TouchableOpacity>
                )}

                {!isAdding && (
                  <TouchableOpacity style={styles.modalSecondaryBtn} onPress={onClose}>
                    <Text style={styles.modalSecondaryBtnText}>Close</Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  );
}
