export default function Section({ id, eyebrow, title, intro, tone = 'plain', children }) {
  const tones = {
    plain: 'bg-white dark:bg-slate-950',
    muted: 'bg-slate-50 dark:bg-slate-900/60',
  };
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className={`${tones[tone]} py-16 sm:py-24`}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <header className="mx-auto mb-12 max-w-2xl text-center">
          {eyebrow && (
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-accent-600 dark:text-accent-500">
              {eyebrow}
            </p>
          )}
          <h2 id={`${id}-heading`} className="font-display text-3xl font-bold text-slate-900 sm:text-4xl dark:text-white">
            {title}
          </h2>
          {intro && <p className="mt-4 text-lg leading-relaxed text-slate-600 dark:text-slate-400">{intro}</p>}
        </header>
        {children}
      </div>
    </section>
  );
}

export const buttonStyles = {
  primary:
    'inline-flex items-center justify-center gap-2 rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700 hover:shadow-brand-700/30',
  secondary:
    'inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:border-brand-400 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-brand-400 dark:hover:text-brand-300',
  light:
    'inline-flex items-center justify-center gap-2 rounded-full border border-white/40 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20',
};
