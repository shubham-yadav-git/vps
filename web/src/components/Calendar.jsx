import Icon from './Icon';
import Section from './Section';
import { useSiteContent } from '../lib/SiteContent';
import { CALENDAR_KINDS, localDate } from '../lib/schoolData';

const KIND_BADGE = {
  event: 'bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300',
  exam: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
  holiday: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  meeting: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
};
const MAX_ITEMS = 10;
const dayLabel = date => date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

/** Upcoming calendar entries; empty until hydrated, since "upcoming" depends on today's date. */
export function useUpcomingEvents() {
  const { content, hydrated } = useSiteContent();
  if (!hydrated) return [];
  const today = localDate();
  return (Array.isArray(content.calendar) ? content.calendar : [])
    .filter(e => e.title && e.start && (e.end || e.start) >= today)
    .sort((a, b) => String(a.start).localeCompare(String(b.start)));
}

export default function Calendar() {
  const events = useUpcomingEvents();
  if (!events.length) return null;

  // Group the next few dates by month
  const months = [];
  for (const event of events.slice(0, MAX_ITEMS)) {
    const label = new Date(`${event.start}T00:00`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    if (months.at(-1)?.label !== label) months.push({ label, events: [] });
    months.at(-1).events.push(event);
  }

  return (
    <Section id="calendar" tone="muted" eyebrow="School calendar" title="Upcoming events & holidays" intro="Examinations, holidays, meetings and celebrations in the weeks ahead.">
      <div className="mx-auto grid max-w-4xl gap-10">
        {months.map(month => (
          <div key={month.label}>
            <h3 className="mb-4 text-sm font-semibold tracking-widest text-slate-500 uppercase dark:text-slate-400">{month.label}</h3>
            <ol className="grid gap-3">
              {month.events.map(event => {
                const start = new Date(`${event.start}T00:00`);
                const kind = CALENDAR_KINDS.find(k => k.id === event.kind) || CALENDAR_KINDS[0];
                const multiDay = event.end && event.end !== event.start;
                return (
                  <li key={event.id} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:gap-5 sm:p-5 dark:border-slate-800 dark:bg-slate-900">
                    <div className="w-14 shrink-0 overflow-hidden rounded-xl text-center ring-1 ring-slate-200 dark:ring-slate-700">
                      <p className="bg-brand-600 py-0.5 text-[11px] font-semibold tracking-wide text-white uppercase">{start.toLocaleDateString('en-IN', { month: 'short' })}</p>
                      <p className="py-1 text-2xl leading-tight font-bold text-slate-900 dark:text-white">{start.getDate()}</p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-semibold text-slate-900 dark:text-white">{event.title}</h4>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${KIND_BADGE[kind.id]}`}>{kind.label}</span>
                      </div>
                      <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
                        <span className="inline-flex items-center gap-1.5"><Icon name="calendar" className="size-3.5" />{multiDay ? `${dayLabel(start)} – ${dayLabel(new Date(`${event.end}T00:00`))}` : start.toLocaleDateString('en-IN', { weekday: 'long' })}</span>
                        {event.time && <span className="inline-flex items-center gap-1.5"><Icon name="clock" className="size-3.5" />{event.time}</span>}
                        {event.location && <span className="inline-flex items-center gap-1.5"><Icon name="mapPin" className="size-3.5" />{event.location}</span>}
                      </p>
                      {event.description && <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{event.description}</p>}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        ))}
      </div>
    </Section>
  );
}
