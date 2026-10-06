import Icon from './Icon';
import Section from './Section';
import { useSiteContent } from '../lib/SiteContent';
import { initials } from '../lib/normalize';

export default function Testimonials() {
  const { content } = useSiteContent();
  const testimonials = (Array.isArray(content.testimonials) ? content.testimonials : []).filter(t => t.text);
  if (!testimonials.length) return null;

  return (
    <Section id="testimonials" tone="muted" eyebrow="Testimonials" title="What families say">
      <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {testimonials.map(item => (
          <li key={item.id || item.name} className="flex flex-col rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
            <Icon name="quote" className="size-8 text-brand-200 dark:text-brand-800" />
            <blockquote className="mt-3 flex-1 leading-relaxed text-slate-700 dark:text-slate-300">{item.text}</blockquote>
            <div className="mt-6 flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-full bg-brand-600 text-sm font-bold text-white">{initials(item.name)}</span>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">{item.name}</p>
                {item.role && <p className="text-sm text-slate-500 dark:text-slate-400">{item.role}</p>}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}
