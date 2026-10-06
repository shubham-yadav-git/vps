import { Card, ErrorBox, ImageField, Loading, PageHeader, SaveBar, TextArea, TextInput } from '../ui';
import { useSettingsForm } from '../useSettingsForm';

// Simple settings documents described as field lists
const PAGES = {
  hero: {
    title: 'Homepage hero',
    description: 'The large banner at the top of the homepage.',
    empty: { title: '', subtitle: '', backgroundImage: '' },
    fields: [
      { key: 'title', label: 'Headline', placeholder: 'Excellence in Education', required: true },
      { key: 'subtitle', label: 'Subheading', placeholder: 'Empowering the Future Leaders' },
      { key: 'backgroundImage', label: 'Background photo', type: 'image', preset: 'hero', hint: 'A wide landscape photo works best. Leave empty to use the default campus photo.', previewClass: 'h-32 w-56 object-cover' },
    ],
  },
  academics: {
    title: 'Academics',
    description: 'The Academics section on the homepage.',
    empty: { description: '', curriculum: '', programs: '', assessment: '', extracurricular: '' },
    fields: [
      { key: 'description', label: 'Introduction', type: 'textarea', rows: 3 },
      { key: 'curriculum', label: 'Curriculum', placeholder: 'CBSE syllabus from Nursery to Class X.' },
      { key: 'programs', label: 'Special programs', placeholder: 'STEM initiatives, Coding clubs…' },
      { key: 'assessment', label: 'Assessment', placeholder: 'Continuous Evaluation, Project Based Learning…' },
      { key: 'extracurricular', label: 'Extra-curricular', placeholder: 'Art, Music, Dance, Debate, Sports…' },
    ],
  },
  logo: {
    title: 'Logo & name',
    description: 'Shown in the header and footer of every page.',
    empty: { logoUrl: '', schoolName: '', tagline: '' },
    fields: [
      { key: 'logoUrl', label: 'School logo', type: 'image', preset: 'logo', hint: 'A square PNG with a transparent background looks best.', previewClass: 'size-28 object-contain p-2' },
      { key: 'schoolName', label: 'School name', placeholder: 'Vikas Public School', required: true },
      { key: 'tagline', label: 'Tagline', placeholder: 'Excellence in Education' },
    ],
  },
  'school-info': {
    title: 'School info',
    description: 'Fallback contact details, used wherever the Contact page leaves a field empty.',
    empty: { name: '', address: '', phone: '', email: '' },
    fields: [
      { key: 'name', label: 'School name' },
      { key: 'address', label: 'Address', type: 'textarea', rows: 2 },
      { key: 'phone', label: 'Phone', hint: 'Separate several numbers with commas.' },
      { key: 'email', label: 'Email', inputType: 'email' },
    ],
  },
  contact: {
    title: 'Contact details',
    description: 'Shown in the Contact section and footer. The contact form sends messages to this email.',
    empty: { address: '', phone: '', email: '', hours: '' },
    fields: [
      { key: 'address', label: 'Address', type: 'textarea', rows: 2, placeholder: 'Bairangiya, Newada, Jaunpur, Uttar Pradesh, 222146' },
      { key: 'phone', label: 'Phone numbers', hint: 'Separate several numbers with commas, e.g. 9559657249, 7275629236' },
      { key: 'email', label: 'Email', inputType: 'email' },
      { key: 'hours', label: 'Office hours', placeholder: '8 AM – 3 PM, Monday to Saturday' },
    ],
  },
};

export default function SettingsPage({ name }) {
  const page = PAGES[name];
  const form = useSettingsForm(name, page.empty);
  const missingRequired = form.values && page.fields.some(f => f.required && !String(form.values[f.key] || '').trim());

  return (
    <>
      <PageHeader title={page.title} description={page.description} />
      {form.status === 'loading' && <Loading />}
      {form.status === 'error' && <ErrorBox onRetry={form.reload}>{form.error}</ErrorBox>}
      {form.status === 'ready' && (
        <>
          <Card>
            <div className="grid max-w-2xl gap-5">
              {page.fields.map(field => {
                const common = {
                  label: field.label + (field.required ? ' *' : ''),
                  hint: field.hint,
                };
                const value = form.values[field.key] || '';
                if (field.type === 'image') {
                  return <ImageField key={field.key} {...common} value={value} preset={field.preset} previewClass={field.previewClass} onChange={v => form.setField(field.key, v)} />;
                }
                if (field.type === 'textarea') {
                  return <TextArea key={field.key} {...common} rows={field.rows} placeholder={field.placeholder} value={value} onChange={e => form.setField(field.key, e.target.value)} />;
                }
                return <TextInput key={field.key} {...common} type={field.inputType || 'text'} placeholder={field.placeholder} value={value} onChange={e => form.setField(field.key, e.target.value)} />;
              })}
            </div>
          </Card>
          <SaveBar
            dirty={form.dirty}
            saving={form.saving}
            onDiscard={form.discard}
            disabled={missingRequired}
            onSave={() => form.save(v => Object.fromEntries(Object.entries(v).map(([k, x]) => [k, typeof x === 'string' ? x.trim() : x])))}
            label={missingRequired ? 'Fill in required fields' : 'Save changes'}
          />
        </>
      )}
    </>
  );
}

export const SETTINGS_PAGE_NAMES = Object.keys(PAGES);
