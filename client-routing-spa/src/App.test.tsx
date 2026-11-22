import { beforeEach, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { App } from './App';
import { defaultSettings, useAppStore } from './store';

beforeEach(() => {
  localStorage.clear();
  useAppStore.setState({ tasks: [], settings: { ...defaultSettings }, draft: { title: '', priority: 'medium' }, filter: 'all' });
});

it('добавляет задачу через форму и обновляет обзор после перехода', async () => {
  const user = userEvent.setup();
  render(<MemoryRouter initialEntries={['/tasks']}><App /></MemoryRouter>);
  await user.type(screen.getByLabelText('Название задачи'), 'Изучить роутинг');
  await user.click(screen.getByRole('button', { name: 'Добавить' }));
  expect(screen.getByText('Изучить роутинг')).toBeInTheDocument();
  await user.click(screen.getByRole('checkbox', { name: 'Завершить: Изучить роутинг' }));
  await user.click(screen.getByRole('link', { name: 'Обзор' }));
  expect(screen.getByRole('heading', { name: 'Привет, Екатерина.' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Выполнено/ })).toHaveTextContent('01');
  expect(screen.getByText('100')).toBeInTheDocument();
});

it('показывает ошибку пустой формы, фильтрует, ищет и удаляет задачи', async () => {
  const user = userEvent.setup();
  render(<MemoryRouter initialEntries={['/tasks']}><App /></MemoryRouter>);
  await user.click(screen.getByRole('button', { name: 'Добавить' }));
  expect(screen.getByRole('alert')).toHaveTextContent('Введите название');
  await user.type(screen.getByLabelText('Название задачи'), 'Купить книгу');
  await user.click(screen.getByRole('button', { name: 'Добавить' }));
  await user.click(screen.getByRole('checkbox', { name: 'Завершить: Купить книгу' }));
  await user.click(screen.getByRole('button', { name: /В работе/ }));
  expect(screen.queryByText('Купить книгу')).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /Выполненные/ }));
  expect(screen.getByText('Купить книгу')).toBeInTheDocument();
  await user.type(screen.getByLabelText('Поиск задач'), 'нет совпадений');
  expect(screen.getByText('Ничего не нашлось')).toBeInTheDocument();
  await user.clear(screen.getByLabelText('Поиск задач'));
  await user.click(screen.getByRole('button', { name: 'Удалить: Купить книгу' }));
  expect(screen.queryByText('Купить книгу')).not.toBeInTheDocument();
});

it('применяет имя и тему на нескольких страницах', async () => {
  const user = userEvent.setup();
  render(<MemoryRouter initialEntries={['/settings']}><App /></MemoryRouter>);
  const name = screen.getByLabelText('Ваше имя');
  await user.clear(name);
  await user.type(name, 'Анна');
  await user.click(screen.getByRole('button', { name: 'Сохранить имя' }));
  await user.click(screen.getByRole('button', { name: 'Тёмная' }));
  expect(document.documentElement.dataset.theme).toBe('dark');
  await user.click(within(screen.getByRole('navigation')).getByRole('link', { name: 'Обзор' }));
  expect(screen.getByRole('heading', { name: 'Привет, Анна.' })).toBeInTheDocument();
  expect(useAppStore.getState().settings.theme).toBe('dark');
});

it('обрабатывает неизвестный адрес и возвращает на главную', async () => {
  const user = userEvent.setup();
  render(<MemoryRouter initialEntries={['/unknown']}><App /></MemoryRouter>);
  expect(screen.getByRole('heading', { name: 'Такой страницы нет' })).toBeInTheDocument();
  await user.click(screen.getByRole('link', { name: /Вернуться к обзору/ }));
  expect(screen.getByRole('heading', { name: 'Привет, Екатерина.' })).toBeInTheDocument();
});
