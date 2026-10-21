import { Card, ErrorBox, ImageField, Loading, Notice, PageHeader, SaveBar, TextArea, TextInput } from '../ui';
import { SEO_DEFAULTS } from '../../lib/schoolData';
import { useSettingsForm } from '../useSettingsForm';

// Simple settings documents described as field lists
const PAGES = {
  hero: {
    title: 'Homepage banner',
    icon: 'layout',
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
    icon: 'graduation',
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
    icon: 'shield',
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
    icon: 'mapPin',
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
    icon: 'phone',
    description: 'Shown in the Contact section and footer. The contact form sends messages to this email.',
    empty: { address: '', phone: '', email: '', hours: '' },
    fields: [
      { key: 'address', label: 'Address', type: 'textarea', rows: 2, placeholder: 'Bairangiya, Newada, Jaunpur, Uttar Pradesh, 222146' },
      { key: 'phone', label: 'Phone numbers', hint: 'Separate several numbers with commas, e.g. 9559657249, 7275629236' },
      { key: 'email', label: 'Email', inputType: 'email' },
      { key: 'hours', label: 'Office hours', placeholder: '8 AM – 3 PM, Monday to Saturday' },
    ],
  },
  site: {
    title: 'Site & SEO',
    icon: 'globe',
    description: 'Social media links, WhatsApp and how the school appears in Google search results.',
    empty: { facebook: '', instagram: '', youtube: '', whatsapp: '', mapUrl: '', seoTitle: '', seoDescription: '' },
    sections: [
      {
        title: 'Search engines',
        description: 'Google shows these in search results. Changes reach Google after the website’s nightly rebuild, then whenever Google next visits.',
        fields: [
          { key: 'seoTitle', label: 'Page title', placeholder: SEO_DEFAULTS.title, recommendedMax: 60, hint: 'Include the school name and town. About 60 characters fit in Google results.' },
          { key: 'seoDescription', label: 'Description', type: 'textarea', rows: 3, placeholder: SEO_DEFAULTS.description, recommendedMax: 160, hint: 'One or two sentences about the school. About 160 characters fit.' },
        ],
      },
      {
        title: 'Social media & WhatsApp',
        description: 'Shown as icons in the website footer. Leave a field empty to hide that icon.',
        fields: [
          { key: 'facebook', label: 'Facebook page', inputType: 'url', placeholder: 'https://facebook.com/…' },
          { key: 'instagram', label: 'Instagram', inputType: 'url', placeholder: 'https://instagram.com/…' },
          { key: 'youtube', label: 'YouTube channel', inputType: 'url', placeholder: 'https://youtube.com/@…' },
          { key: 'whatsapp', label: 'WhatsApp number', inputType: 'tel', placeholder: 'e.g. 9559657249', hint: 'Parents can tap to message the school on WhatsApp.' },
          { key: 'mapUrl', label: 'Google Maps link', inputType: 'url', placeholder: 'https://maps.app.goo.gl/…', hint: 'Open the school in Google Maps, tap Share, and paste the link. Used for “Get directions”.' },
        ],
      },
    ],
  },
};

/** How the homepage looks as a Google result. */
function SearchPreview({ title, description }) {
  return (
    <Card title="Preview in Google">
      <div className="max-w-xl font-[arial,sans-serif]">
        <p className="text-xs text-slate-600 dark:text-slate-400">vikaspublicschool.in</p>
        <p className="mt-0.5 truncate text-xl text-[#1a0dab] dark:text-[#8ab4f8]">{title || SEO_DEFAULTS.title}</p>
        <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">{description || SEO_DEFAULTS.description}</p>
      </div>
    </Card>
  );
}

function renderField(field, form) {
  const common = { label: field.label + (field.required ? ' *' : ''), hint: field.hint };
  const value = form.values[field.key] || '';
  if (field.type === 'image') {
    return <ImageField key={field.key} {...common} value={value} preset={field.preset} previewClass={field.previewClass} onChange={v => form.setField(field.key, v)} />;
  }
  if (field.type === 'textarea') {
    return <TextArea key={field.key} {...common} rows={field.rows} placeholder={field.placeholder} recommendedMax={field.recommendedMax} value={value} onChange={e => form.setField(field.key, e.target.value)} />;
  }
  return <TextInput key={field.key} {...common} type={field.inputType || 'text'} placeholder={field.placeholder} recommendedMax={field.recommendedMax} value={value} onChange={e => form.setField(field.key, e.target.value)} />;
}

export default function SettingsPage({ name }) {
  const page = PAGES[name];
  const form = useSettingsForm(name, page.empty);
  const sections = page.sections || [{ fields: page.fields }];
  const allFields = sections.flatMap(section => section.fields);
  const missingRequired = form.values && allFields.some(f => f.required && !String(form.values[f.key] || '').trim());

  return (
    <>
      <PageHeader title={page.title} icon={page.icon} description={page.description} />
      {form.status === 'loading' && <Loading />}
      {form.status === 'error' && <ErrorBox onRetry={form.reload}>{form.error}</ErrorBox>}
      {form.status === 'ready' && (
        <>
          <div className="grid gap-6">
            {name === 'site' && <SearchPreview title={form.values.seoTitle} description={form.values.seoDescription} />}
            {sections.map((section, index) => (
              <Card key={index} title={section.title} description={section.description}>
                <div className="grid max-w-2xl gap-5">{section.fields.map(field => renderField(field, form))}</div>
              </Card>
            ))}
            {name === 'contact' && <Notice>Messages from the website’s contact form arrive in <a href="#/enquiries" className="font-semibold underline">Enquiries</a>. If the database can’t be reached, the form opens the visitor’s email app addressed to the email above.</Notice>}
          </div>
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
