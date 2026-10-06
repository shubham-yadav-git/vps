import Icon from './Icon';
import { CATEGORY_STYLES } from '../lib/useNotices';

export default function NoticeTicker({ notices, onOpen }) {
  if (!notices.length) return null;

  // Rendered twice so the -50% translate loops seamlessly
  const items = [...notices, ...notices];
  const duration = Math.max(20, notices.length * 8);

  return (
    <div className="border-b border-brand-800 bg-brand-700 text-white dark:border-brand-900 dark:bg-brand-900">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <span className="flex shrink-0 items-center gap-1.5 py-2 text-xs font-bold tracking-wider uppercase">
          <Icon name="bell" className="size-4" /> Notices
        </span>
        <div className="group relative min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_4%,#000_96%,transparent)]">
          <button
            type="button"
            onClick={onOpen}
            className="flex w-max animate-ticker gap-10 py-2 text-left text-sm group-hover:[animation-play-state:paused] focus-visible:[animation-play-state:paused] motion-reduce:animate-none"
            style={{ '--ticker-duration': `${duration}s` }}
            aria-label="Open notice board"
          >
            {items.map((notice, index) => (
              <span key={`${notice.id}-${index}`} className="flex items-center gap-2 whitespace-nowrap" aria-hidden={index >= notices.length}>
                <span className={`size-2 rounded-full ${CATEGORY_STYLES[notice.category].dot}`} />
                {notice.title}
              </span>
            ))}
          </button>
        </div>
        <button
          type="button"
          onClick={onOpen}
          className="shrink-0 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold transition hover:bg-white/25"
        >
          View all
        </button>
      </div>
    </div>
  );
}
