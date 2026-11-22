import { beforeEach, describe, expect, it } from 'vitest';
import { defaultSettings, getStats, useAppStore } from './store';

beforeEach(() => {
  localStorage.clear();
  useAppStore.setState({ tasks: [], settings: { ...defaultSettings }, draft: { title: '', priority: 'medium' }, filter: 'all' });
});

describe('Глобальный стор', () => {
  it('добавляет задачу с нормализованным названием и очищает черновик', () => {
    useAppStore.getState().setDraft({ title: '  Прочитать книгу  ', priority: 'high' });
    expect(useAppStore.getState().addTask()).toBe(true);
    expect(useAppStore.getState().tasks[0]).toMatchObject({ title: 'Прочитать книгу', priority: 'high', completed: false });
    expect(useAppStore.getState().draft.title).toBe('');
  });

  it('не создаёт пустые и слишком длинные задачи', () => {
    useAppStore.getState().setDraft({ title: '   ' });
    expect(useAppStore.getState().addTask()).toBe(false);
    useAppStore.getState().setDraft({ title: 'a'.repeat(121) });
    expect(useAppStore.getState().addTask()).toBe(false);
    expect(useAppStore.getState().tasks).toHaveLength(0);
  });

  it('переключает статус, считает прогресс и удаляет задачу', () => {
    useAppStore.getState().setDraft({ title: 'Задача' });
    useAppStore.getState().addTask();
    const id = useAppStore.getState().tasks[0].id;
    useAppStore.getState().toggleTask(id);
    expect(getStats(useAppStore.getState().tasks)).toEqual({ total: 1, completed: 1, active: 0, progress: 100 });
    useAppStore.getState().toggleTask(id);
    expect(getStats(useAppStore.getState().tasks).active).toBe(1);
    useAppStore.getState().removeTask(id);
    expect(getStats(useAppStore.getState().tasks).progress).toBe(0);
  });

  it('сохраняет задачи и настройки, но не черновик и текущий фильтр', async () => {
    useAppStore.getState().setDraft({ title: 'Задача для сохранения' });
    useAppStore.getState().addTask();
    useAppStore.getState().updateSettings({ name: 'Анна', theme: 'dark', defaultFilter: 'active' });
    useAppStore.getState().setDraft({ title: 'Не сохранять' });
    useAppStore.getState().setFilter('completed');
    const serialized = localStorage.getItem('poryadok-app')!;
    const saved = JSON.parse(serialized);
    expect(saved.state.tasks).toHaveLength(1);
    expect(saved.state.settings.theme).toBe('dark');
    expect(saved.state).not.toHaveProperty('draft');
    expect(saved.state).not.toHaveProperty('filter');
    useAppStore.setState({ tasks: [], settings: { ...defaultSettings }, draft: { title: '', priority: 'medium' }, filter: 'all' });
    localStorage.setItem('poryadok-app', serialized);
    await useAppStore.persist.rehydrate();
    expect(useAppStore.getState().tasks[0].title).toBe('Задача для сохранения');
    expect(useAppStore.getState().settings.name).toBe('Анна');
    expect(useAppStore.getState().filter).toBe('active');
  });

  it('отбрасывает некорректные сохранённые данные', async () => {
    localStorage.setItem('poryadok-app', JSON.stringify({ version: 1, state: { tasks: [{ id: 1 }], settings: { name: null, theme: 'unknown' } } }));
    await useAppStore.persist.rehydrate();
    expect(useAppStore.getState().tasks).toEqual([]);
    expect(useAppStore.getState().settings).toEqual(defaultSettings);
  });
});
