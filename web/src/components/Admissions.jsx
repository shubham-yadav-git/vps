import Icon from './Icon';
import Section, { buttonStyles } from './Section';

const STEPS = [
  { title: 'Get the form', text: 'Download the admission form, or collect one from the school office.' },
  { title: 'Fill it in', text: 'Complete every section and attach the required documents.' },
  { title: 'Submit', text: 'Hand in the form and documents at the school office.' },
  { title: 'Test & interview', text: 'Eligible candidates are invited for an admission test or interview.' },
  { title: 'Confirmation', text: 'Admission is confirmed based on the test and interview results.' },
];

const DOCUMENTS = [
  'Birth certificate',
  'Transfer certificate from previous school (if applicable)',
  'Report card of previous class',
  'Recent passport-size photographs',
  'Address proof',
  'Aadhaar card copy of student and parents',
  'Category certificate (if applicable)',
];

export default function Admissions() {
  return (
    <Section id="admissions" eyebrow="Admissions" title="Join our school family" intro="Admissions are open. Here's how to apply.">
      <div className="grid gap-8 lg:grid-cols-5">
        <ol className="space-y-4 lg:col-span-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="flex gap-4 rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-600 font-bold text-white">{index + 1}</span>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">{step.title}</h3>
                <p className="mt-1 text-slate-600 dark:text-slate-400">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>

        <aside className="rounded-3xl bg-gradient-to-br from-brand-700 to-brand-900 p-7 text-white shadow-xl lg:col-span-2">
          <h3 className="text-xl font-bold">Documents required</h3>
          <ul className="mt-5 space-y-3">
            {DOCUMENTS.map(doc => (
              <li key={doc} className="flex gap-3 text-brand-50">
                <Icon name="check" className="mt-0.5 size-5 shrink-0 text-accent-500" />
                <span>{doc}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8 grid gap-3">
            <a href="/assets/admission-form.html" download="VPS-Admission-Form.html" className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand-800 transition hover:bg-brand-50">
              <Icon name="download" className="size-4" /> Download admission form
            </a>
            <a href="/assets/admission-form.html" target="_blank" rel="noopener" className={buttonStyles.light}>
              View &amp; print online <Icon name="external" className="size-4" />
            </a>
          </div>
        </aside>
      </div>
    </Section>
  );
}
