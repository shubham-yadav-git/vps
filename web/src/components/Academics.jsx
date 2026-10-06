import Icon from './Icon';
import Section from './Section';
import { useSiteContent } from '../lib/SiteContent';

const ITEMS = [
  { key: 'curriculum', title: 'Curriculum', icon: 'book' },
  { key: 'programs', title: 'Special programs', icon: 'sparkles' },
  { key: 'assessment', title: 'Assessment', icon: 'clipboard' },
  { key: 'extracurricular', title: 'Extra-curricular', icon: 'palette' },
];

export default function Academics() {
  const { content } = useSiteContent();
  const academics = content.academics || {};

  return (
    <Section id="academics" tone="muted" eyebrow="Academics" title="Learning that goes further" intro={academics.description}>
      <div className="grid gap-5 sm:grid-cols-2">
        {ITEMS.filter(item => academics[item.key]).map(item => (
          <article key={item.key} className="flex gap-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-600 text-white">
              <Icon name={item.icon} className="size-6" />
            </span>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">{item.title}</h3>
              <p className="mt-1.5 leading-relaxed text-slate-600 dark:text-slate-400">{academics[item.key]}</p>
            </div>
          </article>
        ))}
      </div>
    </Section>
  );
}
