import Icon from './Icon';
import { NAV_LINKS } from './Header';
import { useSiteContent } from '../lib/SiteContent';
import { contactDetails, emailParts, safeUrl, telHref } from '../lib/normalize';

const SOCIAL = [
  { name: 'Facebook', icon: 'facebook', href: 'https://facebook.com/vikaspublicschool' },
  { name: 'Instagram', icon: 'instagram', href: 'https://instagram.com/vikaspublicschool' },
  { name: 'YouTube', icon: 'youtube', href: 'https://youtube.com/vikaspublicschool' },
];

export default function Footer({ linkPrefix = '' }) {
  const { content } = useSiteContent();
  const { address, email, phones } = contactDetails(content);
  const logo = content.logo || {};
  const linkClass = 'text-slate-400 transition hover:text-white';

  return (
    <footer className="bg-slate-950 text-slate-300 dark:border-t dark:border-slate-800">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-3">
            <img src={safeUrl(logo.logoUrl, '/logo.png')} alt="" width="44" height="44" loading="lazy" className="size-11 rounded-full bg-white object-contain p-0.5" />
            <p className="font-display text-xl font-bold text-white">{logo.schoolName || 'Vikas Public School'}</p>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">
            Nurturing young minds through holistic development, dedicated teachers and a safe, caring campus. Affiliated to CBSE.
          </p>
          <div className="mt-5 flex gap-2">
            {SOCIAL.map(s => (
              <a key={s.name} href={s.href} target="_blank" rel="noopener" aria-label={s.name} className="rounded-full bg-white/5 p-2.5 text-slate-300 transition hover:bg-brand-600 hover:text-white">
                <Icon name={s.icon} className="size-4.5" />
              </a>
            ))}
          </div>
        </div>

        <nav aria-label="Footer">
          <h2 className="text-sm font-semibold tracking-wider text-white uppercase">Explore</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            {NAV_LINKS.map(link => (
              <li key={link.id}><a href={`${linkPrefix}#${link.id}`} className={linkClass}>{link.label}</a></li>
            ))}
            <li><a href="/mandatory-public-disclosure.html" className={linkClass}>Mandatory Public Disclosure</a></li>
            <li><a href="/assets/admission-form.html" className={linkClass}>Admission form</a></li>
          </ul>
        </nav>

        <div>
          <h2 className="text-sm font-semibold tracking-wider text-white uppercase">Get in touch</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {address && <li className="flex gap-2.5"><Icon name="mapPin" className="mt-0.5 size-4 shrink-0 text-brand-400" /><span className="text-slate-400">{address}</span></li>}
            {phones.slice(0, 2).map(phone => (
              <li key={phone} className="flex gap-2.5"><Icon name="phone" className="mt-0.5 size-4 shrink-0 text-brand-400" /><a href={telHref(phone)} className={linkClass}>{phone}</a></li>
            ))}
            {email && <li className="flex gap-2.5"><Icon name="mail" className="mt-0.5 size-4 shrink-0 text-brand-400" /><a href={`mailto:${email}`} className={linkClass}>{emailParts(email)[0]}<wbr />{emailParts(email)[1]}</a></li>}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-slate-500 sm:flex-row sm:justify-between sm:px-6 lg:px-8">
          <p>© <span suppressHydrationWarning>{new Date().getFullYear()}</span> Vikas Public School. All rights reserved.</p>
          <p>Affiliated to CBSE · Jaunpur, Uttar Pradesh</p>
        </div>
      </div>
    </footer>
  );
}
