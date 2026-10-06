import FadeImage from './FadeImage';
import Icon from './Icon';
import { buttonStyles } from './Section';
import { useSiteContent } from '../lib/SiteContent';
import { safeUrl } from '../lib/normalize';

export default function Hero() {
  const { content, isResolved } = useSiteContent();
  const hero = content.hero || {};
  // Wait for the real banner photo so the default one never flashes first
  const background = isResolved('hero') ? safeUrl(hero.backgroundImage, '/campus.jpg') : '';
  const highlights = isResolved('about') ? (content.about?.highlights || []).slice(0, 4) : [];

  return (
    <section id="top" aria-label="Welcome" className="relative isolate overflow-hidden bg-brand-950">
      {background && <FadeImage key={background} src={background} alt="" className="absolute inset-0 -z-20 size-full object-cover" fetchPriority="high" />}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-brand-950/95 via-brand-950/80 to-brand-900/40" />

      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-36">
        <div className="max-w-2xl animate-fade-up">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium text-white backdrop-blur">
            <span className="size-2 rounded-full bg-accent-500" /> Admissions open · CBSE pattern
          </p>
          <h1 className="font-display text-4xl leading-tight font-bold text-white sm:text-5xl lg:text-6xl">
            {hero.title || 'Excellence in Education'}
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-brand-100 sm:text-xl">
            {hero.subtitle || 'Empowering the Future Leaders'}
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <a href="#admissions" className={buttonStyles.primary}>
              Apply for admission <Icon name="arrowRight" className="size-4" />
            </a>
            <a href="#about" className={buttonStyles.light}>Discover our school</a>
          </div>
        </div>

        {highlights.length > 0 && (
          <ul className="mt-14 grid max-w-3xl animate-fade-up grid-cols-2 gap-3 sm:grid-cols-4">
            {highlights.map(item => (
              <li key={item.id || item.title} className="rounded-2xl border border-white/15 bg-white/10 p-4 text-white backdrop-blur">
                <span className="text-2xl" aria-hidden="true">{item.icon}</span>
                <p className="mt-2 text-sm font-semibold">{item.title}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
