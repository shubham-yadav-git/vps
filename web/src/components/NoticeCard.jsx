import { useState } from 'react';
import Icon from './Icon';
import { CATEGORY_STYLES } from '../lib/useNotices';
import { formatDate } from '../lib/normalize';

const PREVIEW_LENGTH = 140;

export default function NoticeCard({ notice, compact = false }) {
  const [expanded, setExpanded] = useState(false);
  const style = CATEGORY_STYLES[notice.category];
  const isLong = notice.description.length > PREVIEW_LENGTH;
  const description = expanded || !isLong
    ? notice.description
    : notice.description.slice(0, PREVIEW_LENGTH).trimEnd() + '…';

  return (
    <article className={`rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 ${compact ? 'p-4' : 'p-6 shadow-sm'}`}>
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
        <span className={`rounded-full px-2.5 py-1 font-semibold ${style.badge}`}>{style.label}</span>
        {notice.date && (
          <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
            <Icon name="calendar" className="size-3.5" /> {formatDate(notice.date, 'short')}
          </span>
        )}
      </div>
      <h3 className={`font-semibold text-slate-900 dark:text-white ${compact ? 'text-base' : 'text-lg'}`}>{notice.title}</h3>
      {description && <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{description}</p>}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        {notice.validUntil ? (
          <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <Icon name="clock" className="size-3.5" /> Valid until {formatDate(notice.validUntil, 'short')}
          </span>
        ) : <span />}
        {isLong && (
          <button
            type="button"
            onClick={() => setExpanded(value => !value)}
            className="text-sm font-semibold text-brand-600 hover:text-brand-800 dark:text-brand-400 dark:hover:text-brand-300"
            aria-expanded={expanded}
          >
            {expanded ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>
    </article>
  );
}
