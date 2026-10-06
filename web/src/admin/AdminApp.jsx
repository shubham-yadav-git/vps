import { useEffect, useState } from 'react';
import Icon from '../components/Icon';
import { useTheme } from '../lib/theme';
import { USE_EMULATOR } from '../lib/firebase';
import { isAdminUser, signOutAdmin, useAuthUser } from './auth';
import Login from './Login';
import AboutEditor from './sections/AboutEditor';
import CollectionEditor from './sections/CollectionEditor';
import Dashboard from './sections/Dashboard';
import DisclosureEditor from './sections/DisclosureEditor';
import FaqEditor from './sections/FaqEditor';
import SettingsPage from './sections/SettingsPages';
import { Button, ConfirmProvider, DirtyProvider, Loading, ToastProvider, useConfirm, useDirtyTracker } from './ui';

const NAV = [
  { group: '', items: [{ id: 'dashboard', label: 'Dashboard', icon: 'sparkles' }] },
  { group: 'Homepage', items: [
    { id: 'events', label: 'Notice board', icon: 'bell' },
    { id: 'hero', label: 'Hero banner', icon: 'sun' },
    { id: 'about', label: 'About', icon: 'book' },
    { id: 'academics', label: 'Academics', icon: 'clipboard' },
    { id: 'faculty', label: 'Faculty', icon: 'check' },
    { id: 'gallery', label: 'Gallery', icon: 'palette' },
    { id: 'testimonials', label: 'Testimonials', icon: 'quote' },
    { id: 'faq', label: 'FAQ', icon: 'chevronDown' },
  ] },
  { group: 'School', items: [
    { id: 'disclosure', label: 'Mandatory disclosure', icon: 'file' },
    { id: 'contact', label: 'Contact details', icon: 'phone' },
    { id: 'school-info', label: 'School info', icon: 'mapPin' },
    { id: 'logo', label: 'Logo & name', icon: 'external' },
  ] },
];
const PAGE_IDS = NAV.flatMap(g => g.items.map(i => i.id));

function pageFromHash() {
  const id = window.location.hash.replace(/^#\/?/, '');
  return PAGE_IDS.includes(id) ? id : 'dashboard';
}

function Page({ id, user }) {
  if (id === 'dashboard') return <Dashboard user={user} />;
  if (['faculty', 'gallery', 'testimonials', 'events'].includes(id)) return <CollectionEditor key={id} name={id} />;
  if (id === 'faq') return <FaqEditor />;
  if (id === 'about') return <AboutEditor />;
  if (id === 'disclosure') return <DisclosureEditor />;
  return <SettingsPage key={id} name={id} />;
}

function Shell({ user }) {
  const [page, setPage] = useState(pageFromHash);
  const [menuOpen, setMenuOpen] = useState(false);
  const dirty = useDirtyTracker();
  const confirm = useConfirm();
  const { theme, toggleTheme } = useTheme();

  // Hash navigation, with a prompt when leaving a page that has unsaved edits
  useEffect(() => {
    let current = pageFromHash();
    const onHashChange = async () => {
      const next = pageFromHash();
      if (next === current) return;
      if (dirty.any()) {
        const leave = await confirm({ title: 'Leave without saving?', message: 'Your unsaved changes on this page will be lost.', confirmLabel: 'Leave page', danger: true });
        if (!leave) {
          history.replaceState(null, '', `#/${current}`);
          return;
        }
        dirty.clear();
      }
      current = next;
      setPage(next);
      setMenuOpen(false);
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [dirty, confirm]);

  async function handleSignOut() {
    if (dirty.any() && !(await confirm({ title: 'Sign out without saving?', message: 'Your unsaved changes will be lost.', confirmLabel: 'Sign out', danger: true }))) return;
    dirty.clear();
    signOutAdmin();
  }

  const nav = (
    <nav aria-label="Admin sections" className="grid gap-6 p-4">
      {NAV.map(group => (
        <div key={group.group || 'top'}>
          {group.group && <p className="mb-2 px-3 text-xs font-semibold tracking-wider text-slate-400 uppercase">{group.group}</p>}
          <ul className="grid gap-0.5">
            {group.items.map(item => (
              <li key={item.id}>
                <a
                  href={`#/${item.id}`}
                  aria-current={page === item.id ? 'page' : undefined}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${page === item.id ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}
                >
                  <Icon name={item.icon} className="size-4" /> {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-slate-950">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900">
        <button type="button" className="rounded-lg p-2 hover:bg-slate-100 lg:hidden dark:hover:bg-slate-800" aria-label="Open menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(o => !o)}>
          <Icon name={menuOpen ? 'x' : 'menu'} />
        </button>
        <img src="/logo.png" alt="" width="36" height="36" className="size-9 rounded-full" />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-900 dark:text-white">VPS Admin</p>
          <p className="hidden truncate text-xs text-slate-500 sm:block">{user.email}</p>
        </div>
        {USE_EMULATOR && <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">Test database</span>}
        <div className="ml-auto flex items-center gap-1">
          <a href="/" target="_blank" rel="noopener" className="hidden items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 sm:inline-flex dark:text-slate-300 dark:hover:bg-slate-800">
            <Icon name="external" className="size-4" /> View website
          </a>
          <Button variant="ghost" size="icon" aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} onClick={toggleTheme}>
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
          </Button>
          <Button variant="secondary" size="sm" onClick={handleSignOut}>Sign out</Button>
        </div>
      </header>
      <div className="flex">
        <aside className="sticky top-16 hidden h-[calc(100dvh-4rem)] w-64 shrink-0 overflow-y-auto border-r border-slate-200 bg-white lg:block dark:border-slate-800 dark:bg-slate-900">{nav}</aside>
        {menuOpen && (
          <div className="fixed inset-0 top-16 z-20 lg:hidden">
            <button type="button" aria-label="Close menu" className="absolute inset-0 bg-slate-950/40" onClick={() => setMenuOpen(false)} />
            <aside className="relative h-full w-72 max-w-[85vw] overflow-y-auto bg-white shadow-xl dark:bg-slate-900">{nav}</aside>
          </div>
        )}
        <main className="min-w-0 flex-1 px-4 pt-6 pb-10 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl"><Page id={page} user={user} /></div>
        </main>
      </div>
    </div>
  );
}

function NotAuthorized({ user }) {
  return (
    <div className="grid min-h-dvh place-items-center px-4">
      <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-xl ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">This account can't edit the website</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">You're signed in as {user.email}. Only the school admin account can make changes.</p>
        <Button className="mt-6" onClick={signOutAdmin}>Sign in with a different account</Button>
      </div>
    </div>
  );
}

export default function AdminApp() {
  const user = useAuthUser();
  return (
    <ToastProvider>
      <ConfirmProvider>
        <DirtyProvider>
          {user === undefined ? <Loading label="Starting…" /> : !user ? <Login /> : !isAdminUser(user) ? <NotAuthorized user={user} /> : <Shell user={user} />}
        </DirtyProvider>
      </ConfirmProvider>
    </ToastProvider>
  );
}
