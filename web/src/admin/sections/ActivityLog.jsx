import { useCallback, useEffect, useMemo, useState } from 'react';
import Icon from '../../components/Icon';
import { AREA_LABELS, friendlyError, listActivity } from '../api';
import { Badge, Button, EmptyState, ErrorBox, PageHeader, Select, timeAgo, toDate } from '../ui';

const ACTION_STYLE = {
  create: { label: 'Added', tone: 'green', icon: 'plus' },
  update: { label: 'Changed', tone: 'blue', icon: 'edit' },
  delete: { label: 'Deleted', tone: 'red', icon: 'trash' },
};

const dayLabel = date => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const day = new Date(date); day.setHours(0, 0, 0, 0);
  const diff = Math.round((today - day) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

export default function ActivityLog() {
  const [entries, setEntries] = useState(null);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [person, setPerson] = useState('all');
  const [area, setArea] = useState('all');

  const load = useCallback(async () => {
    setError('');
    setEntries(null);
    try {
      const page = await listActivity();
      setEntries(page);
      setHasMore(page.length === 40);
    } catch (err) { setError(friendlyError(err)); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function more() {
    setLoadingMore(true);
    try {
      const page = await listActivity({ after: entries[entries.length - 1] });
      setEntries(list => [...list, ...page]);
      setHasMore(page.length === 40);
    } catch (err) { setError(friendlyError(err)); }
    setLoadingMore(false);
  }

  const people = useMemo(() => [...new Map((entries || []).map(e => [e.by, e.byName || e.by])).entries()], [entries]);
  const areas = useMemo(() => [...new Set((entries || []).map(e => e.area))], [entries]);
  const visible = (entries || []).filter(e => (person === 'all' || e.by === person) && (area === 'all' || e.area === area));

  // Group by calendar day
  const groups = [];
  for (const entry of visible) {
    const date = toDate(entry.at);
    const label = date ? dayLabel(date) : 'Just now';
    if (groups.at(-1)?.label !== label) groups.push({ label, entries: [] });
    groups.at(-1).entries.push(entry);
  }

  return (
    <>
      <PageHeader
        title="Activity log"
        icon="activity"
        description="Every change made in the admin panel: who made it, what changed and when. Entries can't be edited or deleted."
        actions={<Button variant="secondary" icon="refresh" onClick={load}>Refresh</Button>}
      />
      {error && <ErrorBox onRetry={load}>{error}</ErrorBox>}
      {!entries && !error && <div className="grid gap-2">{[0, 1, 2, 3, 4].map(i => <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />)}</div>}
      {entries && (
        <>
          <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:w-2/3">
            <Select label="Person" value={person} onChange={e => setPerson(e.target.value)} options={[{ value: 'all', label: 'Everyone' }, ...people.map(([value, label]) => ({ value, label }))]} />
            <Select label="Section" value={area} onChange={e => setArea(e.target.value)} options={[{ value: 'all', label: 'All sections' }, ...areas.map(a => ({ value: a, label: AREA_LABELS[a] || a }))]} />
          </div>
          {!visible.length ? (
            <EmptyState icon="activity" title="No activity yet">Changes made in the admin panel will be listed here.</EmptyState>
          ) : (
            <div className="grid gap-6">
              {groups.map(group => (
                <section key={group.label}>
                  <h2 className="mb-2 text-xs font-semibold tracking-wider text-slate-500 uppercase">{group.label}</h2>
                  <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
                    {group.entries.map(entry => {
                      const style = ACTION_STYLE[entry.action] || ACTION_STYLE.update;
                      return (
                        <li key={entry.id} className="flex items-start gap-3 px-4 py-3">
                          <span className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-full ${{ green: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15', blue: 'bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300', red: 'bg-red-50 text-red-600 dark:bg-red-500/15' }[style.tone]}`}>
                            <Icon name={style.icon} className="size-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-slate-800 dark:text-slate-200">
                              <strong className="font-semibold">{entry.byName || entry.by}</strong> {style.label.toLowerCase()} <span className="font-medium">{entry.label}</span>
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                              <Badge tone="gray">{AREA_LABELS[entry.area] || entry.area}</Badge>
                              <span title={toDate(entry.at)?.toLocaleString('en-IN')}>{timeAgo(entry.at)}</span>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>
          )}
          {hasMore && <div className="mt-6 text-center"><Button variant="secondary" onClick={more} loading={loadingMore}>Load older activity</Button></div>}
        </>
      )}
    </>
  );
}
