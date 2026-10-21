import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Dialog from '../components/Dialog';
import Icon from '../components/Icon';
import { useTheme } from '../lib/theme';
import { USE_EMULATOR } from '../lib/firebase';
import { setAdminFlag } from '../lib/adminFlag';
import { countNewEnquiries, setActor } from './api';
import { authErrorMessage, emailKey, resendVerification, signOutAdmin, useAuthUser, useStaffProfile } from './auth';
import Login from './Login';
import AboutEditor from './sections/AboutEditor';
import ActivityLog from './sections/ActivityLog';
import AnnouncementEditor from './sections/AnnouncementEditor';
import CollectionEditor from './sections/CollectionEditor';
import Dashboard from './sections/Dashboard';
import DisclosureEditor from './sections/DisclosureEditor';
import Enquiries from './sections/Enquiries';
import FaqEditor from './sections/FaqEditor';
import SettingsPage from './sections/SettingsPages';
import Staff from './sections/Staff';
import { Badge, Button, ConfirmProvider, DirtyProvider, ErrorBox, Loading, ToastProvider, useConfirm, useDirtyTracker, useToast } from './ui';

// adminOnly pages are hidden from editors (the rules enforce it as well)
export const NAV = [
  { group: '', items: [
    { id: 'dashboard', label: 'Dashboard', icon: 'home' },
    { id: 'enquiries', label: 'Enquiries', icon: 'inbox' },
  ] },
  { group: 'Updates', items: [
    { id: 'events', label: 'Notice board', icon: 'bell' },
    { id: 'calendar', label: 'Calendar', icon: 'calendar' },
    { id: 'announcement', label: 'Popup & banner', icon: 'megaphone' },
    { id: 'achievements', label: 'Achievements', icon: 'trophy' },
    { id: 'gallery', label: 'Gallery', icon: 'image' },
    { id: 'downloads', label: 'Downloads', icon: 'folder' },
  ] },
  { group: 'Homepage', items: [
    { id: 'hero', label: 'Banner', icon: 'layout' },
    { id: 'about', label: 'About & leadership', icon: 'book' },
    { id: 'academics', label: 'Academics', icon: 'graduation' },
    { id: 'faculty', label: 'Faculty', icon: 'users' },
    { id: 'testimonials', label: 'Testimonials', icon: 'quote' },
    { id: 'faq', label: 'FAQ', icon: 'help' },
  ] },
  { group: 'School', items: [
    { id: 'disclosure', label: 'Mandatory disclosure', icon: 'file', adminOnly: true },
    { id: 'contact', label: 'Contact details', icon: 'phone', adminOnly: true },
    { id: 'school-info', label: 'School info', icon: 'mapPin', adminOnly: true },
    { id: 'logo', label: 'Logo & name', icon: 'shield', adminOnly: true },
  ] },
  { group: 'Administration', items: [
    { id: 'site', label: 'Site & SEO', icon: 'globe', adminOnly: true },
    { id: 'staff', label: 'Staff accounts', icon: 'users', adminOnly: true },
    { id: 'activity', label: 'Activity log', icon: 'activity', adminOnly: true },
  ] },
];

const COLLECTION_PAGES = ['faculty', 'gallery', 'testimonials', 'events', 'calendar', 'achievements', 'downloads'];

function navFor(profile) {
  return NAV
    .map(group => ({ ...group, items: group.items.filter(item => profile.isAdmin || !item.adminOnly) }))
    .filter(group => group.items.length);
}

function pageFromHash(ids) {
  const id = window.location.hash.replace(/^#\/?/, '');
  return ids.includes(id) ? id : 'dashboard';
}

function Page({ id, user, profile }) {
  if (id === 'dashboard') return <Dashboard user={user} profile={profile} />;
  if (id === 'enquiries') return <Enquiries />;
  if (COLLECTION_PAGES.includes(id)) return <CollectionEditor key={id} name={id} />;
  if (id === 'faq') return <FaqEditor />;
  if (id === 'about') return <AboutEditor />;
  if (id === 'disclosure') return <DisclosureEditor />;
  if (id === 'announcement') return <AnnouncementEditor />;
  if (id === 'staff') return <Staff currentEmail={emailKey(user.email)} />;
  if (id === 'activity') return <ActivityLog />;
  return <SettingsPage key={id} name={id} />;
}

/** Ctrl/⌘K: jump to any section by typing its name. */
function QuickJump({ open, onClose, items }) {
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);
  const inputRef = useRef(null);
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? items.filter(item => item.label.toLowerCase().includes(q) || item.group.toLowerCase().includes(q)) : items;
  }, [items, query]);

  useEffect(() => { if (open) { setQuery(''); setIndex(0); setTimeout(() => inputRef.current?.focus(), 0); } }, [open]);
  useEffect(() => { setIndex(0); }, [query]);

  const go = item => { if (!item) return; window.location.hash = `#/${item.id}`; onClose(); };

  return (
    <Dialog open={open} onClose={onClose} label="Go to section" className="!m-auto !mt-[12vh] !w-[min(32rem,calc(100vw-2rem))]">
      <div className="flex items-center gap-3 border-b border-slate-200 px-4 dark:border-slate-800">
        <Icon name="search" className="size-5 text-slate-400" />
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setIndex(i => Math.min(i + 1, matches.length - 1)); }
            if (e.key === 'ArrowUp') { e.preventDefault(); setIndex(i => Math.max(i - 1, 0)); }
            if (e.key === 'Enter') go(matches[index]);
          }}
          placeholder="Go to…"
          aria-label="Search sections"
          className="h-14 flex-1 bg-transparent text-base text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-white"
        />
        <kbd className="rounded border border-slate-300 px-1.5 text-xs text-slate-500 dark:border-slate-700">Esc</kbd>
      </div>
      <ul className="max-h-80 overflow-y-auto p-2">
        {matches.map((item, i) => (
          <li key={item.id}>
            <button type="button" onClick={() => go(item)} onMouseEnter={() => setIndex(i)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm ${i === index ? 'bg-brand-50 text-brand-800 dark:bg-brand-500/15 dark:text-brand-200' : 'text-slate-700 dark:text-slate-300'}`}>
              <Icon name={item.icon} className="size-4" /> {item.label}
              <span className="ml-auto text-xs text-slate-400">{item.group || 'Overview'}</span>
            </button>
          </li>
        ))}
        {!matches.length && <li className="px-3 py-6 text-center text-sm text-slate-500">No section matches “{query}”.</li>}
      </ul>
    </Dialog>
  );
}

function UserMenu({ user, profile, onSignOut }) {
  const [open, setOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onClick = e => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const onKey = e => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onClick); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const initials = (profile.name || user.email).split(/[\s@.]+/).filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join('');

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open} aria-haspopup="menu" className="flex items-center gap-2 rounded-lg p-1 pr-2 hover:bg-slate-100 dark:hover:bg-slate-800">
        <span className="grid size-8 place-items-center rounded-full bg-brand-600 text-xs font-bold text-white">{initials}</span>
        <span className="hidden text-left md:block">
          <span className="block max-w-40 truncate text-sm leading-tight font-semibold text-slate-800 dark:text-slate-100">{profile.name}</span>
          <span className="block text-xs leading-tight text-slate-500">{profile.isAdmin ? 'Administrator' : 'Editor'}</span>
        </span>
        <Icon name="chevronDown" className="hidden size-4 text-slate-400 md:block" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-40 mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
          <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{profile.name}</p>
            <p className="truncate text-xs text-slate-500">{user.email}</p>
            <Badge tone={profile.isAdmin ? 'blue' : 'gray'} className="mt-2">{profile.isOwner ? 'Owner · Administrator' : profile.isAdmin ? 'Administrator' : 'Editor'}</Badge>
          </div>
          <div className="p-1.5">
            <a role="menuitem" href="/" target="_blank" rel="noopener" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"><Icon name="external" className="size-4" /> View website</a>
            <button role="menuitem" type="button" onClick={toggleTheme} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"><Icon name={theme === 'dark' ? 'sun' : 'moon'} className="size-4" /> {theme === 'dark' ? 'Light mode' : 'Dark mode'}</button>
            <button role="menuitem" type="button" onClick={onSignOut} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"><Icon name="logout" className="size-4" /> Sign out</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Shell({ user, profile }) {
  const nav = useMemo(() => navFor(profile), [profile]);
  const flat = useMemo(() => nav.flatMap(g => g.items.map(i => ({ ...i, group: g.group }))), [nav]);
  const ids = useMemo(() => flat.map(i => i.id), [flat]);
  const [page, setPage] = useState(() => pageFromHash(ids));
  const [menuOpen, setMenuOpen] = useState(false);
  const [jumpOpen, setJumpOpen] = useState(false);
  const [newEnquiries, setNewEnquiries] = useState(0);
  const dirty = useDirtyTracker();
  const confirm = useConfirm();

  const refreshBadge = useCallback(() => { countNewEnquiries().then(setNewEnquiries).catch(() => {}); }, []);
  useEffect(() => { refreshBadge(); }, [refreshBadge, page]);
  useEffect(() => {
    window.addEventListener('vps:enquiries-changed', refreshBadge);
    return () => window.removeEventListener('vps:enquiries-changed', refreshBadge);
  }, [refreshBadge]);

  useEffect(() => {
    const onKey = e => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setJumpOpen(true); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Hash navigation, with a prompt when leaving a page that has unsaved edits
  useEffect(() => {
    let current = pageFromHash(ids);
    const onHashChange = async () => {
      const next = pageFromHash(ids);
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
  }, [dirty, confirm, ids]);

  async function handleSignOut() {
    if (dirty.any() && !(await confirm({ title: 'Sign out without saving?', message: 'Your unsaved changes will be lost.', confirmLabel: 'Sign out', danger: true }))) return;
    dirty.clear();
    signOutAdmin();
  }

  const current = flat.find(i => i.id === page);

  const sidebar = (
    <nav aria-label="Admin sections" className="grid gap-5 px-3 py-4">
      {nav.map(group => (
        <div key={group.group || 'top'}>
          {group.group && <p className="mb-1.5 px-3 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">{group.group}</p>}
          <ul className="grid gap-0.5">
            {group.items.map(item => {
              const active = page === item.id;
              return (
                <li key={item.id}>
                  <a
                    href={`#/${item.id}`}
                    aria-current={active ? 'page' : undefined}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${active ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'}`}
                  >
                    <Icon name={item.icon} className={`size-4 ${active ? 'text-brand-600 dark:text-brand-300' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                    {item.id === 'enquiries' && newEnquiries > 0 && (
                      <span className="ml-auto rounded-full bg-red-600 px-1.5 text-xs leading-5 font-semibold text-white tabular-nums">{newEnquiries > 99 ? '99+' : newEnquiries}</span>
                    )}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  const brand = (
    <a href="#/dashboard" className="flex items-center gap-3">
      <img src="/logo.png" alt="" width="36" height="36" className="size-9 rounded-full bg-white" />
      <span className="min-w-0">
        <span className="block truncate text-sm leading-tight font-bold text-slate-900 dark:text-white">Vikas Public School</span>
        <span className="block text-xs leading-tight text-slate-500">Admin console</span>
      </span>
    </a>
  );

  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-slate-950">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex dark:border-slate-800 dark:bg-slate-900">
        <div className="flex h-16 shrink-0 items-center border-b border-slate-200 px-5 dark:border-slate-800">{brand}</div>
        <div className="flex-1 overflow-y-auto">{sidebar}</div>
        <div className="border-t border-slate-200 p-3 text-xs text-slate-500 dark:border-slate-800">
          <a href="/" target="_blank" rel="noopener" className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-200"><Icon name="external" className="size-4" /> Open website</a>
        </div>
      </aside>

      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button type="button" aria-label="Close menu" className="absolute inset-0 bg-slate-950/50" onClick={() => setMenuOpen(false)} />
          <aside className="relative flex h-full w-72 max-w-[85vw] flex-col bg-white shadow-xl dark:bg-slate-900">
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-800">
              {brand}
              <Button variant="ghost" size="icon" aria-label="Close menu" onClick={() => setMenuOpen(false)}><Icon name="x" /></Button>
            </div>
            <div className="flex-1 overflow-y-auto">{sidebar}</div>
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6 lg:px-8 dark:border-slate-800 dark:bg-slate-900/90">
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}>
            <Icon name="menu" />
          </Button>
          <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-2 text-sm sm:flex">
            <span className="text-slate-500">{current?.group || 'Overview'}</span>
            <Icon name="chevronRight" className="size-4 text-slate-300" />
            <span className="truncate font-semibold text-slate-900 dark:text-white">{current?.label}</span>
          </nav>
          {USE_EMULATOR && <Badge tone="amber">Test database</Badge>}
          <button
            type="button"
            onClick={() => setJumpOpen(true)}
            className="ml-auto flex h-9 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-500 hover:border-slate-400 sm:w-64 dark:border-slate-700 dark:bg-slate-950"
          >
            <Icon name="search" className="size-4" />
            <span className="hidden sm:inline">Go to section…</span>
            <kbd className="ml-auto hidden rounded border border-slate-300 px-1.5 text-[11px] sm:inline dark:border-slate-700">{typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform) ? '⌘K' : 'Ctrl K'}</kbd>
          </button>
          <UserMenu user={user} profile={profile} onSignOut={handleSignOut} />
        </header>
        <main className="min-w-0 px-4 pt-6 pb-10 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl"><Page id={page} user={user} profile={profile} /></div>
        </main>
      </div>

      <QuickJump open={jumpOpen} onClose={() => setJumpOpen(false)} items={flat} />
    </div>
  );
}

function CenteredCard({ children }) {
  return (
    <div className="grid min-h-dvh place-items-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <img src="/logo.png" alt="" width="56" height="56" className="mx-auto mb-5 size-14 rounded-full" />
        {children}
      </div>
    </div>
  );
}

function NotAuthorized({ user }) {
  return (
    <CenteredCard>
      <h1 className="text-xl font-bold text-slate-900 dark:text-white">No access yet</h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        You're signed in as <strong>{user.email}</strong>, but this email isn't on the school's staff list, or its access was switched off.
        Ask the school administrator to add you on the <em>Staff accounts</em> page.
      </p>
      <Button className="mt-6" onClick={signOutAdmin}>Sign in with a different account</Button>
    </CenteredCard>
  );
}

function VerifyEmail({ user, onRecheck }) {
  const toast = useToast();
  const [busy, setBusy] = useState('');

  async function resend() {
    setBusy('resend');
    try { await resendVerification(user); toast.success(`Sent a new link to ${user.email}.`); } catch (error) { toast.error(authErrorMessage(error)); }
    setBusy('');
  }
  async function recheck() {
    setBusy('check');
    try { await onRecheck(); } catch (error) { toast.error(authErrorMessage(error)); }
    setBusy('');
  }

  return (
    <CenteredCard>
      <span className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"><Icon name="mail" /></span>
      <h1 className="text-xl font-bold text-slate-900 dark:text-white">Confirm your email</h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        We sent a link to <strong>{user.email}</strong>. Open it to confirm the address is yours, then come back here.
        Check your spam folder if you can't find it.
      </p>
      <div className="mt-6 grid gap-2">
        <Button onClick={recheck} loading={busy === 'check'}>I've confirmed my email</Button>
        <Button variant="secondary" onClick={resend} loading={busy === 'resend'}>Send the link again</Button>
        <Button variant="ghost" onClick={signOutAdmin}>Sign out</Button>
      </div>
    </CenteredCard>
  );
}

function SignedIn({ user }) {
  const profile = useStaffProfile(user);

  useEffect(() => {
    if (profile.status === 'ok') setActor({ email: emailKey(user.email), name: profile.name });
    // Lets the public site show an "Admin panel" shortcut in this browser
    if (profile.status !== 'loading') setAdminFlag(profile.status === 'ok');
  }, [profile.status, profile.name, user.email]);

  if (profile.status === 'loading') return <Loading label="Checking your access…" />;
  if (profile.status === 'error') return <CenteredCard><ErrorBox onRetry={profile.recheck}>Could not check your access. Check your internet connection.</ErrorBox></CenteredCard>;
  if (profile.status === 'none') return <NotAuthorized user={user} />;
  if (profile.status === 'unverified') return <VerifyEmail user={user} onRecheck={profile.recheck} />;
  return <Shell user={user} profile={profile} />;
}

export default function AdminApp() {
  const user = useAuthUser();

  useEffect(() => {
    if (user === null) { setAdminFlag(false); setActor(null); }
  }, [user]);

  return (
    <ToastProvider>
      <ConfirmProvider>
        <DirtyProvider>
          {user === undefined ? <Loading label="Starting…" /> : !user ? <Login /> : <SignedIn key={user.uid} user={user} />}
        </DirtyProvider>
      </ConfirmProvider>
    </ToastProvider>
  );
}
