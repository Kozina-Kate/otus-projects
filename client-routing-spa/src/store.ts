import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type Filter = 'all' | 'active' | 'completed';
export type Priority = 'low' | 'medium' | 'high';
export type Theme = 'light' | 'dark';

export interface Task {
  id: string;
  title: string;
  priority: Priority;
  completed: boolean;
  createdAt: string;
}

export interface Settings {
  name: string;
  theme: Theme;
  defaultFilter: Filter;
}

interface Draft {
  title: string;
  priority: Priority;
}

interface AppState {
  tasks: Task[];
  settings: Settings;
  draft: Draft;
  filter: Filter;
  setDraft: (patch: Partial<Draft>) => void;
  addTask: () => boolean;
  toggleTask: (id: string) => void;
  removeTask: (id: string) => void;
  setFilter: (filter: Filter) => void;
  updateSettings: (patch: Partial<Settings>) => void;
}

export const defaultSettings: Settings = {
  name: 'Екатерина',
  theme: 'light',
  defaultFilter: 'all',
};

const emptyDraft: Draft = { title: '', priority: 'medium' };

export function isFilter(value: unknown): value is Filter {
  return value === 'all' || value === 'active' || value === 'completed';
}

function isPriority(value: unknown): value is Priority {
  return value === 'low' || value === 'medium' || value === 'high';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isTask(value: unknown): value is Task {
  return isRecord(value) && typeof value.id === 'string' &&
    typeof value.title === 'string' && value.title.trim().length > 0 &&
    value.title.length <= 120 && isPriority(value.priority) &&
    typeof value.completed === 'boolean' && typeof value.createdAt === 'string' &&
    Number.isFinite(Date.parse(value.createdAt));
}

// localStorage может содержать устаревшие или изменённые вручную данные.
// При восстановлении проверяем значения, а не только их TypeScript-типы.
function restore(persisted: unknown, current: AppState): AppState {
  if (!isRecord(persisted)) return current;
  const saved = isRecord(persisted.settings) ? persisted.settings : {};
  const settings: Settings = {
    name: typeof saved.name === 'string' && saved.name.trim() && saved.name.length <= 40
      ? saved.name.trim() : defaultSettings.name,
    theme: saved.theme === 'dark' ? 'dark' : 'light',
    defaultFilter: isFilter(saved.defaultFilter) ? saved.defaultFilter : 'all',
  };
  const tasks = Array.isArray(persisted.tasks) ? persisted.tasks.filter(isTask) : [];
  const seen = new Set<string>();
  return {
    ...current,
    tasks: tasks.filter((task) => !seen.has(task.id) && !!seen.add(task.id)),
    settings,
    filter: settings.defaultFilter,
  };
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      tasks: [],
      settings: { ...defaultSettings },
      draft: { ...emptyDraft },
      filter: 'all',
      setDraft: (patch) => set((state) => ({ draft: { ...state.draft, ...patch } })),
      addTask: () => {
        const { draft } = get();
        const title = draft.title.trim();
        if (!title || title.length > 120) return false;
        const task: Task = {
          id: crypto.randomUUID(),
          title,
          priority: draft.priority,
          completed: false,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          tasks: [task, ...state.tasks],
          draft: { ...emptyDraft },
          filter: 'all',
        }));
        return true;
      },
      toggleTask: (id) => set((state) => ({
        tasks: state.tasks.map((task) => task.id === id
          ? { ...task, completed: !task.completed } : task),
      })),
      removeTask: (id) => set((state) => ({ tasks: state.tasks.filter((task) => task.id !== id) })),
      setFilter: (filter) => set({ filter }),
      updateSettings: (patch) => set((state) => ({
        settings: { ...state.settings, ...patch },
        ...(patch.defaultFilter ? { filter: patch.defaultFilter } : {}),
      })),
    }),
    {
      name: 'poryadok-app',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ tasks, settings }) => ({ tasks, settings }),
      merge: restore,
      // Некорректный JSON не должен мешать запуску приложения.
      onRehydrateStorage: () => (_state, error) => {
        if (error) console.warn('Не удалось восстановить данные приложения.', error);
      },
    },
  ),
);

export function getStats(tasks: Task[]) {
  const completed = tasks.filter((task) => task.completed).length;
  return {
    total: tasks.length,
    completed,
    active: tasks.length - completed,
    progress: tasks.length ? Math.round(completed / tasks.length * 100) : 0,
  };
}
