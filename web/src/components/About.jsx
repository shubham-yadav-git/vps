import Section, { buttonStyles } from './Section';
import { useSiteContent } from '../lib/SiteContent';
import { initials, safeUrl } from '../lib/normalize';

export default function About() {
  const { content } = useSiteContent();
  const about = content.about || {};
  const leaders = Array.isArray(about.leadership) ? about.leadership : [];
  const highlights = Array.isArray(about.highlights) ? about.highlights : [];

  return (
    <Section id="about" eyebrow="About us" title="Nurturing young minds" intro={about.content}>
      {leaders.length > 0 && (
        <div className="mb-16">
          <h3 className="mb-6 text-center text-sm font-semibold tracking-widest text-slate-500 uppercase dark:text-slate-400">
            Our leadership
          </h3>
          <div className="mx-auto grid max-w-3xl gap-6 sm:grid-cols-2">
            {leaders.map(leader => {
              const image = safeUrl(leader.image);
              return (
                <article key={leader.id || leader.name} className="flex items-center gap-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  {image ? (
                    <img src={image} alt={leader.name} loading="lazy" className="size-24 shrink-0 rounded-2xl object-cover" />
                  ) : (
                    <span className="grid size-24 shrink-0 place-items-center rounded-2xl bg-brand-100 text-2xl font-bold text-brand-700">{initials(leader.name)}</span>
                  )}
                  <div>
                    <p className="text-xs font-semibold tracking-wider text-accent-600 uppercase dark:text-accent-500">{leader.position}</p>
                    <h4 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{leader.name}</h4>
                    {leader.description && <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{leader.description}</p>}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {highlights.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {highlights.map(item => (
            <article key={item.id || item.title} className="rounded-3xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-6 transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:from-slate-900 dark:to-slate-900/40">
              <span className="grid size-12 place-items-center rounded-2xl bg-brand-50 text-2xl dark:bg-brand-500/10" aria-hidden="true">{item.icon}</span>
              <h3 className="mt-4 font-semibold text-slate-900 dark:text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{item.description}</p>
            </article>
          ))}
        </div>
      )}

      <div className="mt-12 flex flex-wrap justify-center gap-3">
        <a href="#admissions" className={buttonStyles.primary}>Explore admissions</a>
        <a href="/mandatory-public-disclosure.html" className={buttonStyles.secondary}>Mandatory public disclosure</a>
      </div>
    </Section>
  );
}
