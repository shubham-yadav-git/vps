import FadeImage from './FadeImage';
import Icon from './Icon';
import Section from './Section';
import { useSiteContent } from '../lib/SiteContent';
import { ACHIEVEMENT_KINDS } from '../lib/schoolData';
import { safeUrl } from '../lib/normalize';

export function sortedAchievements(items) {
  return (Array.isArray(items) ? items : [])
    .filter(item => item.title)
    .map((item, index) => ({ ...item, order: Number(item.order ?? index) }))
    .sort((a, b) => a.order - b.order);
}

export default function Achievements() {
  const { content } = useSiteContent();
  const items = sortedAchievements(content.achievements);
  if (!items.length) return null;

  return (
    <Section id="achievements" eyebrow="Achievements" title="Our students shine" intro="Board results, toppers, awards and competitions our students have made us proud of.">
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(item => {
          const photo = safeUrl(item.photo);
          const kind = ACHIEVEMENT_KINDS.find(k => k.id === item.kind)?.label;
          return (
            <li key={item.id} className="flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              {photo ? (
                <span className="block aspect-[4/3] bg-slate-200 dark:bg-slate-800">
                  <FadeImage src={photo} alt={item.studentName || item.title} loading="lazy" className="size-full object-cover" />
                </span>
              ) : null}
              <div className="flex flex-1 flex-col p-5">
                {!photo && (
                  <span className="mb-4 grid size-12 place-items-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                    <Icon name="trophy" className="size-6" />
                  </span>
                )}
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                  {kind && <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">{kind}</span>}
                  {item.year && <span className="text-slate-500 dark:text-slate-400">{item.year}</span>}
                </div>
                <h3 className="mt-2 text-lg font-bold text-slate-900 dark:text-white">{item.title}</h3>
                {(item.studentName || item.className) && (
                  <p className="text-sm font-semibold text-brand-600 dark:text-brand-400">{[item.studentName, item.className].filter(Boolean).join(', ')}</p>
                )}
                {item.description && <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{item.description}</p>}
              </div>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
