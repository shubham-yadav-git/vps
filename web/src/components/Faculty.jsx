import { useState } from 'react';
import Section from './Section';
import { useSiteContent } from '../lib/SiteContent';
import { initials, safeUrl } from '../lib/normalize';

function FacultyPhoto({ src, name }) {
  const [failed, setFailed] = useState(false);
  const url = safeUrl(src);
  if (!url || failed) {
    return (
      <span className="grid aspect-square w-full place-items-center bg-gradient-to-br from-brand-100 to-brand-200 text-4xl font-bold text-brand-700 dark:from-brand-900 dark:to-brand-800 dark:text-brand-200">
        {initials(name)}
      </span>
    );
  }
  return <img src={url} alt={name} loading="lazy" onError={() => setFailed(true)} className="aspect-square w-full object-cover" />;
}

export default function Faculty() {
  const { content } = useSiteContent();
  const faculty = Array.isArray(content.faculty) ? content.faculty : [];

  return (
    <Section id="faculty" eyebrow="Our faculty" title="Experienced, caring teachers" intro="Dedicated educators who mentor every student to reach their potential.">
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {faculty.map(member => (
          <li key={member.id || member.name} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
            <FacultyPhoto src={member.photo} name={member.name} />
            <div className="p-5">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{member.name || 'Faculty member'}</h3>
              {member.role && <p className="text-sm font-semibold text-brand-600 dark:text-brand-400">{member.role}</p>}
              {member.description && <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{member.description}</p>}
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}
