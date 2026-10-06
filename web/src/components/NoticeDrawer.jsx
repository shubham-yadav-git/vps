import { useState } from 'react';
import Dialog from './Dialog';
import Icon from './Icon';
import NoticeCard from './NoticeCard';
import NoticeFilters, { filterNotices } from './NoticeFilters';
import { useNotices } from '../lib/useNotices';
import { useSiteContent } from '../lib/SiteContent';

export default function NoticeDrawer({ open, onClose }) {
  const notices = useNotices();
  const { noticesLoaded } = useSiteContent();
  const [filter, setFilter] = useState('all');
  const visible = filterNotices(notices, filter);

  return (
    <Dialog open={open} onClose={onClose} label="School notice board" variant="drawer">
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
            <Icon name="bell" className="size-5 text-brand-600" /> Notice board
          </h2>
          <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Close notice board">
            <Icon name="x" />
          </button>
        </div>
        <div className="border-b border-slate-200 bg-white px-5 py-3 dark:border-slate-800 dark:bg-slate-900">
          <NoticeFilters notices={notices} value={filter} onChange={setFilter} />
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto p-5" aria-live="polite">
          {!noticesLoaded ? (
            <p className="text-center text-sm text-slate-500">Loading notices…</p>
          ) : visible.length ? (
            visible.map(notice => <NoticeCard key={notice.id} notice={notice} compact />)
          ) : (
            <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700">
              No active notices right now.
            </p>
          )}
        </div>
      </div>
    </Dialog>
  );
}
