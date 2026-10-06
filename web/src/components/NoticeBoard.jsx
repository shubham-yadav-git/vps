import { useState } from 'react';
import NoticeCard from './NoticeCard';
import NoticeFilters, { filterNotices } from './NoticeFilters';
import Section from './Section';
import { useNotices } from '../lib/useNotices';
import { useSiteContent } from '../lib/SiteContent';

export default function NoticeBoard() {
  const notices = useNotices();
  const { noticesLoaded } = useSiteContent();
  const [filter, setFilter] = useState('all');
  const visible = filterNotices(notices, filter);

  return (
    <Section id="notices" tone="muted" eyebrow="Notice board" title="News & announcements" intro="Exams, events and important updates from the school office.">
      <div className="mb-8 flex justify-center">
        <NoticeFilters notices={notices} value={filter} onChange={setFilter} />
      </div>
      <div aria-live="polite">
        {!noticesLoaded ? (
          <div className="grid gap-5 md:grid-cols-2">
            {[0, 1].map(i => <div key={i} className="h-40 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />)}
          </div>
        ) : visible.length ? (
          <div className="grid gap-5 md:grid-cols-2">
            {visible.map(notice => <NoticeCard key={notice.id} notice={notice} />)}
          </div>
        ) : (
          <p className="mx-auto max-w-md rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-900">
            {filter === 'all' ? 'No active notices right now. Please check back soon.' : 'No active notices in this category.'}
          </p>
        )}
      </div>
    </Section>
  );
}
