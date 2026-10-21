import { useEffect, useState } from 'react';
import Dialog from './Dialog';
import Icon from './Icon';
import { useSiteContent } from '../lib/SiteContent';
import { announcementState } from '../lib/schoolData';
import { safeUrl } from '../lib/normalize';

const KEY = 'vps:announcement-dismissed';

function readDismissed() {
  try { return localStorage.getItem(KEY); } catch { return null; }
}

/**
 * The homepage popup or banner set in the admin panel. Shown only while its dates
 * are current, and once per visitor until the admin saves a new version.
 */
export default function Announcement() {
  const { content, isResolved } = useSiteContent();
  const a = content.announcement || {};
  const [visible, setVisible] = useState(false);
  const ready = isResolved('announcement');
  const versionKey = `${a.version || 0}:${a.title || ''}`;

  useEffect(() => {
    if (!ready || announcementState(a) !== 'live' || readDismissed() === versionKey) return;
    // Let the page settle before a popup appears
    const timer = setTimeout(() => setVisible(true), a.style === 'banner' ? 0 : 1200);
    return () => clearTimeout(timer);
  }, [ready, versionKey]); // eslint-disable-line react-hooks/exhaustive-deps

  function dismiss() {
    setVisible(false);
    try { localStorage.setItem(KEY, versionKey); } catch { /* storage blocked */ }
  }

  if (!visible) return null;
  const link = safeUrl(a.linkUrl);
  const image = safeUrl(a.image);
  const isExternal = /^https?:/i.test(link);

  const button = a.linkLabel && link && (
    <a
      href={link}
      onClick={dismiss}
      {...(isExternal ? { target: '_blank', rel: 'noopener' } : {})}
      className={a.style === 'banner'
        ? 'shrink-0 rounded-full bg-slate-950 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800'
        : 'inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700'}
    >
      {a.linkLabel}{a.style !== 'banner' && <Icon name="arrowRight" className="size-4" />}
    </a>
  );

  if (a.style === 'banner') {
    return (
      <div role="region" aria-label="Announcement" className="bg-accent-500 text-slate-950">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5 text-sm sm:px-6 lg:px-8">
          <Icon name="megaphone" className="hidden size-4 shrink-0 sm:block" />
          <p className="min-w-0 flex-1"><strong className="font-semibold">{a.title}</strong>{a.message && <span className="ml-1.5">{a.message}</span>}</p>
          {button}
          <button type="button" onClick={dismiss} aria-label="Dismiss announcement" className="shrink-0 rounded-full p-1 hover:bg-black/10"><Icon name="x" className="size-4" /></button>
        </div>
      </div>
    );
  }

  return (
    <Dialog open onClose={dismiss} label={a.title} className="!w-[min(30rem,calc(100vw-2rem))] overflow-hidden">
      <div className="relative">
        {image && <img src={image} alt="" className="max-h-72 w-full object-cover" />}
        <button type="button" onClick={dismiss} aria-label="Close" className="absolute top-3 right-3 rounded-full bg-white/90 p-2 text-slate-700 shadow hover:bg-white dark:bg-slate-900/90 dark:text-slate-200">
          <Icon name="x" className="size-4" />
        </button>
        <div className="p-6 sm:p-7">
          <h2 className="pr-8 font-display text-2xl font-bold text-slate-900 dark:text-white">{a.title}</h2>
          {a.message && <p className="mt-3 leading-relaxed whitespace-pre-line text-slate-600 dark:text-slate-400">{a.message}</p>}
          <div className="mt-6 flex flex-wrap gap-3">
            {button}
            <button type="button" onClick={dismiss} className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">Close</button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
