'use client';

import React, { useState, useEffect } from 'react';
import { useUpdateWhiteboard, useUpdateTodoList } from '@/hooks/useStudyGroups';
import { PenLine, ListTodo, Plus, Check, Trash2, Loader2 } from 'lucide-react';

interface GroupWhiteboardProps {
  groupId: string;
  userId?: string;
  whiteboardData?: string;
  todoList?: any;
}

export function GroupWhiteboard({ groupId, userId, whiteboardData, todoList }: GroupWhiteboardProps) {
  const [tab, setTab] = useState<'whiteboard' | 'todo'>('whiteboard');
  const [notes, setNotes] = useState(whiteboardData || '');
  const [todos, setTodos] = useState<{ id: string; text: string; done: boolean }[]>(
    Array.isArray(todoList) ? todoList : [],
  );
  const [newTodo, setNewTodo] = useState('');
  const [notesDirty, setNotesDirty] = useState(false);

  const whiteboardMutation = useUpdateWhiteboard();
  const todoMutation = useUpdateTodoList();

  // Sync from server when prop changes
  useEffect(() => {
    setNotes(whiteboardData || '');
  }, [whiteboardData]);

  useEffect(() => {
    setTodos(Array.isArray(todoList) ? todoList : []);
  }, [todoList]);

  // Debounced auto-save whiteboard
  useEffect(() => {
    if (!notesDirty) return;
    const timer = setTimeout(() => {
      whiteboardMutation.mutate({ groupId, whiteboardData: notes, userId });
      setNotesDirty(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [notes, notesDirty, groupId, userId]);

  const addTodo = () => {
    if (!newTodo.trim()) return;
    const updated = [...todos, { id: Date.now().toString(), text: newTodo.trim(), done: false }];
    setTodos(updated);
    setNewTodo('');
    todoMutation.mutate({ groupId, todoList: updated, userId });
  };

  const toggleTodo = (id: string) => {
    const updated = todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
    setTodos(updated);
    todoMutation.mutate({ groupId, todoList: updated, userId });
  };

  const removeTodo = (id: string) => {
    const updated = todos.filter((t) => t.id !== id);
    setTodos(updated);
    todoMutation.mutate({ groupId, todoList: updated, userId });
  };

  const completedCount = todos.filter((t) => t.done).length;
  const saving = whiteboardMutation.isPending || todoMutation.isPending;

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setTab('whiteboard')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-bold text-sm transition-colors ${tab === 'whiteboard' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-foreground/60 hover:bg-hover'}`}
        >
          <PenLine className="w-4 h-4" /> Bảng ghi chú
        </button>
        <button
          onClick={() => setTab('todo')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-bold text-sm transition-colors ${tab === 'todo' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-foreground/60 hover:bg-hover'}`}
        >
          <ListTodo className="w-4 h-4" /> Việc cần làm
          {todos.length > 0 && (
            <span className="text-xs bg-hover px-1.5 py-0.5 rounded-full">{completedCount}/{todos.length}</span>
          )}
        </button>
      </div>

      {/* Saving indicator */}
      {saving && (
        <div className="flex items-center justify-center gap-2 py-1.5 bg-primary/5 text-xs text-primary">
          <Loader2 className="w-3 h-3 animate-spin" /> Đang lưu...
        </div>
      )}

      {/* Content */}
      <div className="p-5">
        {tab === 'whiteboard' ? (
          <textarea
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              setNotesDirty(true);
            }}
            placeholder="Ghi chú chung cho nhóm... (tự động lưu)"
            rows={10}
            className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground resize-none text-sm leading-relaxed"
          />
        ) : (
          <div className="space-y-3">
            {/* Add todo */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTodo()}
                placeholder="Thêm việc cần làm..."
                className="flex-1 px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground text-sm"
              />
              <button
                onClick={addTodo}
                disabled={!newTodo.trim()}
                className="px-3 py-2.5 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-colors disabled:opacity-50 flex items-center gap-1 text-sm font-bold"
              >
                <Plus className="w-4 h-4" /> Thêm
              </button>
            </div>

            {/* Todo list */}
            {todos.length === 0 ? (
              <p className="text-center text-foreground/40 text-sm py-6">Chưa có việc cần làm</p>
            ) : (
              <div className="space-y-2">
                {todos.map((t) => (
                  <div key={t.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-border hover:bg-hover/50 transition-colors group">
                    <button
                      onClick={() => toggleTodo(t.id)}
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors shrink-0 ${t.done ? 'bg-primary border-primary' : 'border-border hover:border-primary'}`}
                    >
                      {t.done && <Check className="w-3 h-3 text-primary-foreground" />}
                    </button>
                    <span className={`flex-1 text-sm ${t.done ? 'line-through text-foreground/40' : 'text-foreground'}`}>
                      {t.text}
                    </span>
                    <button
                      onClick={() => removeTodo(t.id)}
                      className="opacity-0 group-hover:opacity-100 text-foreground/40 hover:text-red-500 transition-all"
                      aria-label="Xóa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}