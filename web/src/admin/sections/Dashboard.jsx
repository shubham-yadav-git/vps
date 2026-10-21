import { useCallback, useEffect, useState } from 'react';
import Icon from '../../components/Icon';
import { AREA_LABELS, ENQUIRY_STATUSES, getSettings, listActivity, listEnquiries, loadCounts } from '../api';
import { Badge, Card, PageHeader, StatCard, timeAgo, toDate } from '../ui';
import PhotoOptimizer from './PhotoOptimizer';
import { STATUS_TONES } from './Enquiries';
import { activeNotices, formatDate, galleryItems } from '../../lib/normalize';
import { CALENDAR_KINDS, announcementState, localDate } from '../../lib/schoolData';

const isoToday = () => localDate();
const isoIn = days => localDate(new Date(Date.now() + days * 86400000));

function greeting() {
  const hour = new Date().getHours();
  return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
}

function Skeleton({ rows = 3 }) {
  return <div className="grid gap-3">{Array.from({ length: rows }, (_, i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />)}</div>;
}

const viewAll = href => <a href={href} className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">View all</a>;

export default function Dashboard({ profile }) {
  const [data, setData] = useState(null);
  const [enquiries, setEnquiries] = useState(null);
  const [announcement, setAnnouncement] = useState(undefined);
  const [activity, setActivity] = useState(null);

  const reload = useCallback(() => {
    loadCounts().then(setData);
    listEnquiries().then(setEnquiries).catch(() => setEnquiries([]));
    getSettings('announcement').then(setAnnouncement).catch(() => setAnnouncement(null));
    if (profile.isAdmin) listActivity({ pageSize: 8 }).then(setActivity).catch(() => setActivity([]));
  }, [profile.isAdmin]);
  useEffect(() => { reload(); }, [reload]);

  const events = data?.events || [];
  const active = activeNotices(events);
  const gallery = data?.gallery || [];
  const duplicates = gallery.length - galleryItems(gallery).length;
  const uncaptioned = gallery.filter(g => !g.alt).length;
  const upcoming = (data?.calendar || []).filter(e => (e.end || e.start) >= isoToday()).sort((a, b) => String(a.start).localeCompare(String(b.start)));
  const next30 = upcoming.filter(e => e.start <= isoIn(30));
  const newEnquiries = (enquiries || []).filter(e => e.status === 'new');
  const weekAgo = Date.now() - 7 * 86400000;
  const thisWeek = (enquiries || []).filter(e => (toDate(e.createdAt)?.getTime() || 0) >= weekAgo).length;
  const stale = newEnquiries.filter(e => (toDate(e.createdAt)?.getTime() || Date.now()) < Date.now() - 2 * 86400000);
  const popupState = announcement === undefined ? null : announcementState(announcement);

  const tasks = [];
  if (stale.length) tasks.push({ tone: 'red', text: `${stale.length} enquir${stale.length === 1 ? 'y has' : 'ies have'} waited more than 2 days for a call back.`, href: '#/enquiries' });
  if (data && !active.length) tasks.push({ tone: 'amber', text: 'There are no active notices. Post one so visitors see current news.', href: '#/events' });
  if (data && events.length - active.length > 0) tasks.push({ tone: 'gray', text: `${events.length - active.length} notices have expired and are hidden. You can delete them.`, href: '#/events' });
  if (data && !upcoming.length) tasks.push({ tone: 'amber', text: 'The calendar has no upcoming dates. Add exams, holidays and events.', href: '#/calendar' });
  if (popupState === 'expired') tasks.push({ tone: 'gray', text: 'The homepage popup has ended. Switch it off or set new dates.', href: '#/announcement' });
  if (duplicates > 0) tasks.push({ tone: 'amber', text: `${duplicates} gallery photos are exact duplicates.`, href: '#/gallery' });
  if (uncaptioned > 0) tasks.push({ tone: 'amber', text: `${uncaptioned} gallery photos have no caption.`, href: '#/gallery' });
  if (data && !(data.downloads || []).length) tasks.push({ tone: 'gray', text: 'Add the fee structure, syllabus and forms to Downloads so parents can find them.', href: '#/downloads' });

  const QUICK = [
    ['#/events', 'Post a notice', 'bell'],
    ['#/calendar', 'Add to calendar', 'calendar'],
    ['#/announcement', 'Homepage popup', 'megaphone'],
    ['#/gallery', 'Upload photos', 'image'],
    ['#/achievements', 'Add an achievement', 'trophy'],
    ['#/downloads', 'Upload a document', 'folder'],
  ];

  return (
    <>
      <PageHeader
        title={profile.isOwner ? greeting() : `${greeting()}, ${String(profile.name).split(' ')[0]}`}
        description={new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="New enquiries" icon="inbox" tone={newEnquiries.length ? 'red' : 'blue'} value={enquiries ? newEnquiries.length : null} note={enquiries ? `${thisWeek} received this week` : ' '} href="#/enquiries" />
        <StatCard label="Active notices" icon="bell" value={data ? active.length : null} note={data ? `${events.length} in total` : ' '} href="#/events" />
        <StatCard label="Next 30 days" icon="calendar" tone="green" value={data ? next30.length : null} note="calendar dates" href="#/calendar" />
        <StatCard label="Homepage popup" icon="megaphone" tone={popupState === 'live' ? 'green' : 'amber'} value={popupState ? { live: 'Live', scheduled: 'Soon', expired: 'Ended', off: 'Off' }[popupState] : null} note={announcement?.title || 'Not set up'} href="#/announcement" />
      </div>

      <div className="mt-6 empty:hidden"><PhotoOptimizer data={data} onDone={reload} /></div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="grid min-w-0 content-start gap-6 lg:col-span-2">
          <Card title="Latest enquiries" actions={viewAll('#/enquiries')} padded={false}>
            {!enquiries ? <div className="p-5"><Skeleton /></div> : !enquiries.length ? (
              <p className="p-5 text-sm text-slate-500">No enquiries yet. They arrive here when parents use the contact form on the website.</p>
            ) : (
              <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                {enquiries.slice(0, 5).map(e => (
                  <li key={e.id}>
                    <a href="#/enquiries" className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{e.parentName}</p>
                        <p className="truncate text-xs text-slate-500">{[e.type === 'admission' ? 'Admission' : 'General', e.classApplying, e.phone].filter(Boolean).join(' · ')}</p>
                      </div>
                      <Badge tone={STATUS_TONES[e.status]}>{ENQUIRY_STATUSES.find(s => s.id === e.status)?.label}</Badge>
                      <span className="hidden w-20 text-right text-xs text-slate-500 sm:block">{timeAgo(e.createdAt)}</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Coming up" actions={viewAll('#/calendar')} padded={false}>
            {!data ? <div className="p-5"><Skeleton /></div> : !upcoming.length ? (
              <p className="p-5 text-sm text-slate-500">Nothing on the calendar yet.</p>
            ) : (
              <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                {upcoming.slice(0, 5).map(e => {
                  const date = new Date(`${e.start}T00:00`);
                  const kind = CALENDAR_KINDS.find(k => k.id === e.kind) || CALENDAR_KINDS[0];
                  return (
                    <li key={e.id} className="flex items-center gap-4 px-5 py-3">
                      <div className="w-11 shrink-0 rounded-lg border border-slate-200 text-center dark:border-slate-700">
                        <p className="rounded-t-lg bg-slate-100 text-[10px] font-semibold text-slate-500 uppercase dark:bg-slate-800">{date.toLocaleDateString('en-IN', { month: 'short' })}</p>
                        <p className="py-0.5 text-lg leading-tight font-bold text-slate-900 dark:text-white">{date.getDate()}</p>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{e.title}</p>
                        <p className="truncate text-xs text-slate-500">{[e.end && e.end !== e.start && `until ${formatDate(e.end, 'short')}`, e.time, e.location].filter(Boolean).join(' · ') || formatDate(e.start)}</p>
                      </div>
                      <Badge tone={kind.tone}>{kind.label}</Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>

        <div className="grid min-w-0 content-start gap-6">
          <Card title="Needs attention">
            {!data || !enquiries ? <Skeleton rows={2} /> : tasks.length ? (
              <ul className="-mx-2 grid gap-1">
                {tasks.map(task => (
                  <li key={task.text}>
                    <a href={task.href} className="flex items-start gap-3 rounded-lg p-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800">
                      <span className={`mt-1.5 size-2 shrink-0 rounded-full ${{ red: 'bg-red-500', amber: 'bg-amber-500', gray: 'bg-slate-400' }[task.tone]}`} />
                      <span className="flex-1">{task.text}</span>
                      <Icon name="chevronRight" className="mt-0.5 size-4 shrink-0 text-slate-400" />
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400"><Icon name="check" className="size-4 text-emerald-600" /> Everything is up to date.</p>
            )}
          </Card>

          <Card title="Quick actions">
            <div className="grid grid-cols-2 gap-2">
              {QUICK.map(([href, label, icon]) => (
                <a key={href} href={href} className="flex flex-col items-start gap-2 rounded-lg border border-slate-200 p-3 text-sm font-medium text-slate-700 transition hover:border-brand-300 hover:bg-brand-50/50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-brand-500/10">
                  <Icon name={icon} className="size-5 text-brand-600 dark:text-brand-400" /> {label}
                </a>
              ))}
            </div>
          </Card>

          {profile.isAdmin && (
            <Card title="Recent activity" actions={viewAll('#/activity')} padded={false}>
              {!activity ? <div className="p-5"><Skeleton /></div> : !activity.length ? (
                <p className="p-5 text-sm text-slate-500">No changes recorded yet.</p>
              ) : (
                <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                  {activity.map(a => (
                    <li key={a.id} className="px-5 py-2.5 text-sm">
                      <p className="text-slate-700 dark:text-slate-300"><strong className="font-semibold text-slate-900 dark:text-white">{a.byName}</strong> {{ create: 'added', update: 'changed', delete: 'deleted' }[a.action]} {a.label}</p>
                      <p className="text-xs text-slate-500">{AREA_LABELS[a.area] || a.area} · {timeAgo(a.at)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
