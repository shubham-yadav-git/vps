import Icon from './Icon';
import Section from './Section';
import { useSiteContent } from '../lib/SiteContent';
import { sortedFaq } from '../lib/normalize';

export default function Faq() {
  const { content } = useSiteContent();
  const faqs = sortedFaq(content.faq);
  if (!faqs.length) return null;

  return (
    <Section id="faq" tone="muted" eyebrow="FAQ" title="Frequently asked questions">
      <div className="mx-auto max-w-3xl space-y-3">
        {faqs.map(faq => (
          // <details> gives keyboard and screen reader support with no JS
          <details key={faq.id || faq.question} name="faq" className="group rounded-2xl border border-slate-200 bg-white open:shadow-md dark:border-slate-800 dark:bg-slate-900">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-semibold text-slate-900 dark:text-white [&::-webkit-details-marker]:hidden">
              {faq.question}
              <Icon name="chevronDown" className="size-5 shrink-0 text-slate-400 transition group-open:rotate-180" />
            </summary>
            <p className="px-5 pb-5 leading-relaxed text-slate-600 dark:text-slate-400">{faq.answer}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}
