import { useEffect, useState } from 'react';
import Icon from '../../components/Icon';
import { loadCounts } from '../api';
import { Card, PageHeader } from '../ui';
import PhotoOptimizer from './PhotoOptimizer';
import { activeNotices, galleryItems } from '../../lib/normalize';

function Stat({ label, value, note, href }) {
  return (
    <a href={href} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:ring-brand-400 dark:bg-slate-900 dark:ring-slate-800">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">{value ?? '–'}</p>
      {note && <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">{note}</p>}
    </a>
  );
}

export default function Dashboard({ user }) {
  const [data, setData] = useState(null);
  const reload = () => loadCounts().then(setData);
  useEffect(() => { reload(); }, []);

  const events = data?.events || [];
  const active = activeNotices(events);
  const gallery = data?.gallery || [];
  const duplicates = gallery.length - galleryItems(gallery).length;
  const uncaptioned = gallery.filter(g => !g.alt).length;

  const tasks = [];
  if (data && !active.length) tasks.push({ text: 'There are no active notices. Post one so visitors see current news.', href: '#/events' });
  if (data && events.length - active.length > 0) tasks.push({ text: `${events.length - active.length} notices have expired and are hidden. You can delete them.`, href: '#/events' });
  if (duplicates > 0) tasks.push({ text: `${duplicates} gallery photos are exact duplicates.`, href: '#/gallery' });
  if (uncaptioned > 0) tasks.push({ text: `${uncaptioned} gallery photos have no caption.`, href: '#/gallery' });

  return (
    <>
      <PageHeader title="Welcome back" description={`Signed in as ${user.email}`} />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Active notices" value={data ? active.length : null} href="#/events" />
        <Stat label="Faculty" value={data?.faculty?.length} href="#/faculty" />
        <Stat label="Gallery photos" value={data?.gallery?.length} href="#/gallery" />
        <Stat label="Testimonials" value={data?.testimonials?.length} href="#/testimonials" />
      </div>
      <div className="mt-6 empty:hidden"><PhotoOptimizer data={data} onDone={reload} /></div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Suggestions">
          {!data ? <p className="text-sm text-slate-500">Checking…</p> : tasks.length ? (
            <ul className="grid gap-3">
              {tasks.map(task => (
                <li key={task.text}>
                  <a href={task.href} className="flex items-start gap-3 rounded-xl p-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800">
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-amber-500" /> {task.text}
                    <Icon name="chevronRight" className="ml-auto size-4 shrink-0 text-slate-400" />
                  </a>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-slate-500">Everything looks up to date.</p>}
        </Card>
        <Card title="Quick actions">
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              ['#/events', 'Post a notice'],
              ['#/gallery', 'Upload photos'],
              ['#/hero', 'Change homepage banner'],
              ['#/disclosure', 'Update disclosure'],
            ].map(([href, label]) => (
              <a key={href} href={href} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:border-brand-400 hover:text-brand-700 dark:border-slate-700 dark:text-slate-300">{label}</a>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
