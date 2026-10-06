import { useEffect, useState } from 'react';
import Icon from './Icon';
import NoticeTicker from './NoticeTicker';
import { buttonStyles } from './Section';
import { useSiteContent } from '../lib/SiteContent';
import { useTheme } from '../lib/theme';
import { safeUrl } from '../lib/normalize';
import { useNotices } from '../lib/useNotices';
import { useAdminFlag } from '../lib/adminFlag';

export const NAV_LINKS = [
  { id: 'about', label: 'About' },
  { id: 'academics', label: 'Academics' },
  { id: 'faculty', label: 'Faculty' },
  { id: 'notices', label: 'Notices' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'admissions', label: 'Admissions' },
  { id: 'contact', label: 'Contact' },
];

function useActiveSection(enabled) {
  const [active, setActive] = useState('');
  useEffect(() => {
    if (!enabled || typeof IntersectionObserver === 'undefined') return;
    const sections = NAV_LINKS.map(link => document.getElementById(link.id)).filter(Boolean);
    const observer = new IntersectionObserver(
      entries => entries.forEach(entry => { if (entry.isIntersecting) setActive(entry.target.id); }),
      { rootMargin: '-45% 0px -50% 0px' }
    );
    sections.forEach(section => observer.observe(section));
    return () => observer.disconnect();
  }, [enabled]);
  return active;
}

/** linkPrefix is '' on the home page and '/' on other pages so section links go home. */
export default function Header({ linkPrefix = '', onOpenNotices }) {
  const { content } = useSiteContent();
  const { theme, toggleTheme } = useTheme();
  const notices = useNotices();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const active = useActiveSection(linkPrefix === '');
  const isAdmin = useAdminFlag();

  const logo = content.logo || {};
  const schoolName = logo.schoolName || 'Vikas Public School';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = e => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const linkClass = id =>
    `rounded-full px-3 py-2 text-sm font-medium whitespace-nowrap transition ${
      active === id
        ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300'
        : 'text-slate-600 hover:text-brand-700 dark:text-slate-300 dark:hover:text-brand-300'
    }`;

  return (
    <div className="sticky top-0 z-40">
      <header
        className={`border-b transition-colors ${
          scrolled || menuOpen
            ? 'border-slate-200 bg-white/90 shadow-sm backdrop-blur-lg dark:border-slate-800 dark:bg-slate-950/90'
            : 'border-transparent bg-white dark:bg-slate-950'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:h-18 sm:px-6 lg:px-8">
          <a href={linkPrefix || '#top'} className="flex min-w-0 items-center gap-3" aria-label={`${schoolName} home`}>
            <img
              src={safeUrl(logo.logoUrl, '/logo.png')}
              alt=""
              width="44"
              height="44"
              className="size-10 shrink-0 rounded-full object-contain sm:size-11"
            />
            <span className="min-w-0">
              <span className="block truncate font-display text-base leading-tight font-bold text-slate-900 sm:text-lg dark:text-white">
                {schoolName}
              </span>
              <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                {logo.tagline || 'Excellence in Education'}
              </span>
            </span>
          </a>

          <nav aria-label="Primary" className="ml-auto hidden xl:block">
            <ul className="flex items-center gap-1">
              {NAV_LINKS.map(link => (
                <li key={link.id}>
                  <a href={`${linkPrefix}#${link.id}`} className={linkClass(link.id)} aria-current={active === link.id ? 'true' : undefined}>
                    {link.label}
                  </a>
                </li>
              ))}
              <li>
                <a href="/mandatory-public-disclosure.html" className={linkClass('disclosure')}>
                  Disclosure
                </a>
              </li>
            </ul>
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-1 xl:ml-2">
            {isAdmin && (
              <a
                href="/admin.html"
                className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-900 transition hover:bg-amber-200 dark:bg-amber-500/15 dark:text-amber-200 dark:hover:bg-amber-500/25"
                aria-label="Open admin panel"
                title="Admin panel"
              >
                <Icon name="clipboard" className="size-4" />
                <span className="hidden 2xl:inline">Admin panel</span>
              </a>
            )}
            <button
              type="button"
              onClick={onOpenNotices}
              className="relative rounded-full p-2.5 text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label={`Open notice board${notices.length ? `, ${notices.length} active notices` : ''}`}
            >
              <Icon name="bell" />
              {notices.length > 0 && (
                <span className="absolute top-1 right-1 grid min-w-4.5 place-items-center rounded-full bg-red-600 px-1 text-[10px] leading-4.5 font-bold text-white">
                  {notices.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-full p-2.5 text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
            </button>
            {/* Visibility lives on a wrapper: the button style's inline-flex would override "hidden" */}
            <span className="ml-2 hidden sm:inline-flex">
              <a href={`${linkPrefix}#admissions`} className={`${buttonStyles.primary} !px-4 !py-2 whitespace-nowrap`}>
                Apply now
              </a>
            </span>
            <button
              type="button"
              onClick={() => setMenuOpen(open => !open)}
              className="rounded-full p-2.5 text-slate-700 transition hover:bg-slate-100 xl:hidden dark:text-slate-200 dark:hover:bg-slate-800"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            >
              <Icon name={menuOpen ? 'x' : 'menu'} className="size-6" />
            </button>
          </div>
        </div>

        <nav
          id="mobile-menu"
          aria-label="Mobile"
          hidden={!menuOpen}
          className="border-t border-slate-200 bg-white px-4 pt-2 pb-4 xl:hidden dark:border-slate-800 dark:bg-slate-950"
        >
          <ul className="mx-auto grid max-w-7xl gap-1 sm:grid-cols-2">
            {[...NAV_LINKS, { id: 'disclosure', label: 'Mandatory Public Disclosure', href: '/mandatory-public-disclosure.html' }].map(link => (
              <li key={link.id}>
                <a
                  href={link.href || `${linkPrefix}#${link.id}`}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-xl px-4 py-3 text-base font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-3 sm:hidden">
            <a href={`${linkPrefix}#admissions`} onClick={() => setMenuOpen(false)} className={`${buttonStyles.primary} w-full`}>
              Apply now
            </a>
          </div>
        </nav>
      </header>
      <NoticeTicker notices={notices} onOpen={onOpenNotices} />
    </div>
  );
}
