import { CATEGORY_STYLES } from '../lib/useNotices';

const FILTERS = [{ id: 'all', label: 'All' }, ...Object.entries(CATEGORY_STYLES).map(([id, s]) => ({ id, label: s.label }))];

export function filterNotices(notices, filter) {
  return filter === 'all' ? notices : notices.filter(n => n.category === filter);
}

export default function NoticeFilters({ notices, value, onChange }) {
  return (
    <div role="group" aria-label="Filter notices" className="flex flex-wrap gap-2">
      {FILTERS.map(filter => {
        const count = filterNotices(notices, filter.id).length;
        const selected = value === filter.id;
        return (
          <button
            key={filter.id}
            type="button"
            onClick={() => onChange(filter.id)}
            aria-pressed={selected}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              selected
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            {filter.label}
            <span className={`ml-1.5 text-xs ${selected ? 'text-white/80' : 'text-slate-500'}`}>{count}</span>
          </button>
        );
      })}
    </div>
  );
}
