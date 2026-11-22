import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router';
import {
  ArrowDown, ArrowRight, ArrowUpRight, Check, CheckCheck, CircleCheck,
  ClipboardList, LayoutDashboard, Leaf, ListTodo, Moon, Plus, Search,
  Settings2, Sparkles, Sun, Trash2,
} from 'lucide-react';
import { getStats, isFilter, useAppStore } from './store';
import type { Filter, Priority, Task } from './store';

const filters: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Все задачи' },
  { value: 'active', label: 'В работе' },
  { value: 'completed', label: 'Выполненные' },
];
const priorities: Record<Priority, string> = { low: 'Низкий', medium: 'Средний', high: 'Высокий' };

export function App() {
  const name = useAppStore((state) => state.settings.name);
  const theme = useAppStore((state) => state.settings.theme);
  const tasks = useAppStore((state) => state.tasks);
  const { pathname } = useLocation();
  const headingRef = useRef<HTMLElement>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  useEffect(() => {
    const titles: Record<string, string> = { '/': 'Обзор', '/tasks': 'Мои задачи', '/settings': 'Настройки' };
    document.title = `${titles[pathname] ?? 'Страница не найдена'} · Порядок`;
    if (firstRender.current) firstRender.current = false;
    else headingRef.current?.focus();
    window.scrollTo(0, 0);
  }, [pathname]);

  const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'П';

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">К содержимому</a>
      <aside className="sidebar">
        <Link to="/" className="brand" aria-label="Порядок — на главную">
          <span className="brand-mark"><CheckCheck size={23} /></span>
          порядок<span className="brand-dot">.</span>
        </Link>
        <div className="workspace-label">ЛИЧНОЕ ПРОСТРАНСТВО</div>
        <nav className="main-nav" aria-label="Основная навигация">
          <NavLink to="/" end><LayoutDashboard size={19} /><span>Обзор</span></NavLink>
          <NavLink to="/tasks"><ListTodo size={19} /><span>Мои задачи</span>
            <span className="nav-count">{getStats(tasks).active}</span>
          </NavLink>
          <NavLink to="/settings"><Settings2 size={19} /><span>Настройки</span></NavLink>
        </nav>
        <div className="sidebar-note"><Leaf size={27} strokeWidth={1.4} />
          <p>Большие планы.<br />Маленькие шаги.</p>
          <span>Всё начинается с одной задачи.</span>
        </div>
        <Link to="/settings" className="profile">
          <span className="avatar">{initials}</span>
          <span className="profile-copy"><strong>{name}</strong><small>Моё пространство</small></span>
          <Settings2 size={16} />
        </Link>
      </aside>

      <div className="main-shell">
        <header className="topbar">
          <span>Моё пространство <span className="breadcrumb-separator">/</span>
            <strong>{pathname === '/' ? 'Обзор' : pathname === '/tasks' ? 'Мои задачи' : pathname === '/settings' ? 'Настройки' : '404'}</strong>
          </span>
          <span className="local-badge"><span /> Данные на этом устройстве</span>
        </header>
        <main id="main" ref={headingRef} tabIndex={-1}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <footer><span>Порядок в делах — больше места для жизни.</span><span>Сделано шаг за шагом <Leaf size={13} /></span></footer>
      </div>
    </div>
  );
}

function Dashboard() {
  const tasks = useAppStore((state) => state.tasks);
  const name = useAppStore((state) => state.settings.name);
  const stats = getStats(tasks);
  const navigate = useNavigate();
  const setFilter = useAppStore((state) => state.setFilter);
  const cards = [
    { label: 'Всего задач', value: stats.total, filter: 'all' as const, icon: ClipboardList, className: 'neutral', note: 'Все ваши планы' },
    { label: 'В работе', value: stats.active, filter: 'active' as const, icon: ListTodo, className: 'amber', note: 'Каждая — следующий шаг' },
    { label: 'Выполнено', value: stats.completed, filter: 'completed' as const, icon: CircleCheck, className: 'green', note: 'Уже можно собой гордиться' },
  ];

  return (
    <>
      <div className="page-heading"><div><div className="eyebrow">НАЧНЁМ С ГЛАВНОГО</div>
        <h1>Привет, {name}<span className="greeting-dot">.</span></h1>
        <p>Немного ясности для ваших больших планов.</p>
      </div><Link className="button primary" to="/tasks#new-task"><Plus size={18} />Новая задача</Link></div>

      <div className="stats-grid">
        {cards.map(({ label, value, filter, icon: Icon, className, note }) => (
          <button key={filter} className={`stat-card ${className}`} onClick={() => { setFilter(filter); navigate('/tasks'); }}>
            <div className="stat-top"><span>{label}</span><span className="stat-icon"><Icon size={20} /></span></div>
            <strong className="stat-value">{value.toString().padStart(2, '0')}</strong>
            <div className="stat-bottom"><span>{note}</span><ArrowUpRight size={17} /></div>
          </button>
        ))}
      </div>

      <section className="focus-banner" aria-label="Ваш прогресс">
        <div className="focus-copy"><div className="eyebrow"><Sparkles size={14} /> БЕЗ ЛИШНЕЙ СПЕШКИ</div>
          <h2>Один шаг ближе<br />к тому, что важно.</h2>
          <p>{stats.total ? `Вы завершили ${stats.completed} из ${stats.total} задач. Продолжайте в своём ритме.` : 'Запишите первую задачу. Освободите мысли для самого интересного.'}</p>
          <Link to="/tasks">Перейти к задачам <ArrowRight size={17} /></Link>
        </div>
        <div className="progress-art"><div className="orbit orbit-one" /><div className="orbit orbit-two" />
          <div className="progress-ring" style={{ background: `conic-gradient(var(--accent) ${stats.progress}%, var(--ring-track) 0)` }}>
            <div><span className="progress-number">{stats.progress}<small>%</small></span><span>выполнено</span></div>
          </div><span className="art-leaf"><Leaf size={25} strokeWidth={1.4} /></span>
        </div>
      </section>

      <section className="panel recent-panel"><div className="section-title"><div><h2>Последние задачи</h2><p>Всё важное — перед глазами.</p></div>
        <Link className="text-link" to="/tasks">Все задачи <ArrowRight size={16} /></Link></div>
        {tasks.length ? <ul className="task-list">{tasks.slice(0, 4).map((task) => <TaskRow key={task.id} task={task} />)}</ul>
          : <EmptyState title="Здесь начнётся ваш порядок" text="Добавьте первую задачу — и она появится здесь." action />}
      </section>
    </>
  );
}

function TaskRow({ task }: { task: Task }) {
  const toggleTask = useAppStore((state) => state.toggleTask);
  const removeTask = useAppStore((state) => state.removeTask);
  return (
    <li className={`task-row ${task.completed ? 'is-complete' : ''}`}>
      <button className="task-checkbox" role="checkbox" aria-checked={task.completed}
        aria-label={`${task.completed ? 'Вернуть в работу' : 'Завершить'}: ${task.title}`} onClick={() => toggleTask(task.id)}>
        {task.completed && <Check size={14} strokeWidth={3} />}
      </button>
      <div className="task-copy"><span className="task-title">{task.title}</span>
        <span className="task-date">{new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' }).format(new Date(task.createdAt))}</span>
      </div>
      <span className={`priority priority-${task.priority}`}><span />{priorities[task.priority]}</span>
      <button className="icon-button delete-task" aria-label={`Удалить: ${task.title}`} onClick={() => removeTask(task.id)}><Trash2 size={16} /></button>
    </li>
  );
}

function EmptyState({ title, text, action = false }: { title: string; text: string; action?: boolean }) {
  return <div className="empty-state"><div className="empty-icon"><ListTodo size={25} strokeWidth={1.5} /></div>
    <h3>{title}</h3><p>{text}</p>{action && <Link className="text-link" to="/tasks#new-task"><Plus size={16} />Добавить задачу</Link>}
  </div>;
}

function TasksPage() {
  const tasks = useAppStore((state) => state.tasks);
  const draft = useAppStore((state) => state.draft);
  const setDraft = useAppStore((state) => state.setDraft);
  const addTask = useAppStore((state) => state.addTask);
  const filter = useAppStore((state) => state.filter);
  const setFilter = useAppStore((state) => state.setFilter);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();

  useEffect(() => {
    if (location.hash === '#new-task') inputRef.current?.focus();
  }, [location.hash]);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!addTask()) {
      setError('Введите название задачи: от 1 до 120 символов.');
      setMessage('');
      inputRef.current?.focus();
      return;
    }
    setError('');
    setMessage('Задача добавлена.');
    setQuery('');
    inputRef.current?.focus();
  }

  const stats = getStats(tasks);
  const counts = { all: stats.total, active: stats.active, completed: stats.completed };
  const visible = tasks.filter((task) =>
    (filter === 'all' || (filter === 'completed' ? task.completed : !task.completed)) &&
    task.title.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
  );

  return <>
    <div className="page-heading"><div><div className="eyebrow">ОТ ПЛАНОВ К ДЕЙСТВИЯМ</div><h1>Мои задачи<span className="greeting-dot">.</span></h1>
      <p>Запишите. Сосредоточьтесь. Сделайте.</p></div><span className="page-symbol"><ListTodo size={30} strokeWidth={1.2} /></span></div>
    <section className="panel new-task-panel" aria-labelledby="new-task-heading"><div className="section-title"><div><h2 id="new-task-heading">Что нужно сделать?</h2><p>Даже большой путь начинается с небольшого дела.</p></div></div>
      <form onSubmit={submit} noValidate>
        <div className="task-form-grid"><div className="field"><label htmlFor="task-title">Название задачи</label>
          <input id="task-title" ref={inputRef} placeholder="Например, прочитать главу книги" maxLength={120} value={draft.title}
            aria-invalid={!!error} aria-describedby={error ? 'task-error' : undefined}
            onChange={(event) => { setDraft({ title: event.target.value }); setError(''); setMessage(''); }} />
        </div><div className="field"><label htmlFor="task-priority">Приоритет</label><select id="task-priority" value={draft.priority} onChange={(event) => setDraft({ priority: event.target.value as Priority })}>
          {Object.entries(priorities).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select></div><button type="submit" className="button primary"><Plus size={18} />Добавить</button></div>
        {error && <p id="task-error" role="alert" className="form-error">{error}</p>}
        <p className="form-status" role="status">{message}</p>
      </form>
    </section>
    <section className="panel tasks-panel" aria-label="Список задач"><div className="tasks-toolbar">
      <div className="filter-tabs" role="group" aria-label="Фильтр задач">
        {filters.map(({ value, label }) => <button key={value} aria-pressed={filter === value} className={filter === value ? 'selected' : ''} onClick={() => setFilter(value)}>{label}<span>{counts[value]}</span></button>)}
      </div><label className="search-field"><Search size={17} /><span className="sr-only">Поиск задач</span><input placeholder="Найти задачу…" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
    </div>
      {visible.length ? <ul className="task-list">{visible.map((task) => <TaskRow key={task.id} task={task} />)}</ul>
        : <EmptyState title={tasks.length ? 'Ничего не нашлось' : 'Чистый лист. Хорошее начало.'} text={tasks.length ? 'Попробуйте другой поиск или измените фильтр.' : 'Добавьте задачу в форме выше, чтобы начать.'} />}
      <div className="list-footer"><span>Показано: {visible.length} из {stats.total}</span><span><ArrowDown size={13} /> Сначала новые</span></div>
    </section>
    <div className="quiet-note"><Leaf size={16} />Не нужно успевать всё. Начните с того, что важно сегодня.</div>
  </>;
}

function SettingsPage() {
  const settings = useAppStore((state) => state.settings);
  const updateSettings = useAppStore((state) => state.updateSettings);
  const [name, setName] = useState(settings.name);
  const [saved, setSaved] = useState('');
  const [error, setError] = useState('');

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim() || name.trim().length > 40) {
      setError('Введите имя: от 1 до 40 символов.');
      setSaved('');
      return;
    }
    updateSettings({ name: name.trim() });
    setName(name.trim());
    setError('');
    setSaved('Имя сохранено. Приветствие обновлено на всех страницах.');
  }

  return <>
    <div className="page-heading"><div><div className="eyebrow">ВАШ РИТМ, ВАШИ ПРАВИЛА</div><h1>Настройки<span className="greeting-dot">.</span></h1>
      <p>Сделайте это пространство чуть больше своим.</p></div><span className="page-symbol"><Settings2 size={30} strokeWidth={1.2} /></span></div>
    <section className="panel settings-panel"><div className="section-title"><div><h2>Личное пространство</h2><p>Как к вам обращаться?</p></div></div>
      <form onSubmit={submit} noValidate><div className="name-form"><div className="field"><label htmlFor="user-name">Ваше имя</label><input id="user-name" value={name} maxLength={40} aria-invalid={!!error} aria-describedby={error ? 'name-error' : undefined} onChange={(event) => { setName(event.target.value); setSaved(''); setError(''); }} /></div><button className="button primary" type="submit"><Check size={17} />Сохранить имя</button></div>
        {error && <p className="form-error" id="name-error" role="alert">{error}</p>}<p role="status" className="form-status">{saved}</p>
      </form>
    </section>
    <section className="panel settings-panel"><div className="section-title"><div><h2>Внешний вид</h2><p>Выберите свет для своих планов. Применяется сразу.</p></div></div>
      <div className="theme-options" role="group" aria-label="Тема оформления">
        <button className={`theme-option ${settings.theme === 'light' ? 'chosen' : ''}`} aria-pressed={settings.theme === 'light'} onClick={() => updateSettings({ theme: 'light' })}>
          <div className="theme-preview preview-light"><span /><div><i /><i /><i /></div></div><span><Sun size={18} />Светлая{settings.theme === 'light' && <CircleCheck size={18} />}</span>
        </button>
        <button className={`theme-option ${settings.theme === 'dark' ? 'chosen' : ''}`} aria-pressed={settings.theme === 'dark'} onClick={() => updateSettings({ theme: 'dark' })}>
          <div className="theme-preview preview-dark"><span /><div><i /><i /><i /></div></div><span><Moon size={18} />Тёмная{settings.theme === 'dark' && <CircleCheck size={18} />}</span>
        </button>
      </div>
    </section>
    <section className="panel settings-panel"><div className="settings-row"><div><h2>Фильтр по умолчанию</h2><p>Какие задачи показывать после открытия приложения.</p></div>
      <select aria-label="Фильтр по умолчанию" value={settings.defaultFilter} onChange={(event) => { if (isFilter(event.target.value)) updateSettings({ defaultFilter: event.target.value }); }}>
        {filters.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
      </select></div>
    </section>
    <div className="storage-note"><span className="storage-icon"><CheckCheck size={21} /></span><div><strong>Ваши настройки остаются с вами</strong><p>Задачи и настройки сохраняются в этом браузере. После обновления страницы всё будет на месте. Очистка данных браузера удалит сохранённое.</p></div></div>
  </>;
}

function NotFound() {
  return <div className="not-found"><span className="eyebrow">НЕМНОГО СБИЛИСЬ С ПУТИ</span><div className="error-number">404<span>.</span></div><h1>Такой страницы нет</h1><p>Зато ваши планы всё ещё на месте.</p><Link className="button primary" to="/">Вернуться к обзору <ArrowRight size={17} /></Link></div>;
}
