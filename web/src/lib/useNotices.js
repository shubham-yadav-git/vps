import { useMemo } from 'react';
import { useSiteContent } from './SiteContent';
import { activeNotices } from './normalize';

/** Active notices; empty until hydrated, since expiry depends on today's date. */
export function useNotices() {
  const { content, hydrated } = useSiteContent();
  return useMemo(() => (hydrated ? activeNotices(content.events) : []), [content.events, hydrated]);
}

export const CATEGORY_STYLES = {
  urgent: { label: 'Urgent', badge: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300', dot: 'bg-red-500' },
  academic: { label: 'Academic', badge: 'bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300', dot: 'bg-brand-500' },
  events: { label: 'Event', badge: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300', dot: 'bg-amber-500' },
  general: { label: 'General', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300', dot: 'bg-emerald-500' },
};
