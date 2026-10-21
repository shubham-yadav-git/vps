import Icon from '../../components/Icon';
import { announcementState } from '../../lib/schoolData';
import { formatDate, safeUrl } from '../../lib/normalize';
import { useSettingsForm } from '../useSettingsForm';
import { Badge, Card, ErrorBox, ImageField, Loading, PageHeader, SaveBar, Segmented, TextArea, TextInput, Toggle } from '../ui';

const EMPTY = { enabled: false, style: 'popup', title: '', message: '', image: '', linkLabel: '', linkUrl: '', start: '', end: '', version: 0 };

const STATE = {
  off: { label: 'Off', tone: 'gray', text: 'Visitors don’t see anything.' },
  scheduled: { label: 'Scheduled', tone: 'amber', text: 'Will start showing on the start date.' },
  live: { label: 'Live now', tone: 'green', text: 'Visitors see this on the homepage.' },
  expired: { label: 'Ended', tone: 'gray', text: 'The end date has passed, so it is hidden.' },
};

function Preview({ values }) {
  const image = safeUrl(values.image);
  const title = values.title || 'Your headline';
  const message = values.message || 'Your message to parents appears here.';
  if (values.style === 'banner') {
    return (
      <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="h-6 bg-slate-100 dark:bg-slate-800" />
        <div className="flex items-center gap-3 bg-accent-500 px-4 py-2.5 text-sm text-slate-950">
          <Icon name="megaphone" className="size-4 shrink-0" />
          <p className="min-w-0 flex-1"><strong>{title}</strong> <span>{message}</span></p>
          {values.linkLabel && <span className="shrink-0 rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">{values.linkLabel}</span>}
          <Icon name="x" className="size-4 shrink-0" />
        </div>
        <div className="h-24 bg-slate-200 dark:bg-slate-800" />
      </div>
    );
  }
  return (
    <div className="grid place-items-center rounded-lg bg-slate-900/80 p-6">
      <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white text-left shadow-2xl dark:bg-slate-900">
        {image && <img src={image} alt="" className="aspect-video w-full object-cover" />}
        <div className="p-5">
          <p className="text-lg font-bold text-slate-900 dark:text-white">{title}</p>
          <p className="mt-2 text-sm whitespace-pre-line text-slate-600 dark:text-slate-400">{message}</p>
          <div className="mt-4 flex gap-2">
            {values.linkLabel && <span className="rounded-full bg-brand-600 px-4 py-2 text-xs font-semibold text-white">{values.linkLabel}</span>}
            <span className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300">Close</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AnnouncementEditor() {
  const form = useSettingsForm('announcement', EMPTY);
  const v = form.values;
  const state = v ? STATE[announcementState(v)] : null;
  const datesInvalid = v && v.start && v.end && v.end < v.start;
  const needsTitle = v && v.enabled && !v.title.trim();

  return (
    <>
      <PageHeader
        title="Popup & banner"
        icon="megaphone"
        description="Announce something important on the homepage: admissions, results, a holiday. Each visitor sees it once until you change it."
      />
      {form.status === 'loading' && <Loading />}
      {form.status === 'error' && <ErrorBox onRetry={form.reload}>{form.error}</ErrorBox>}
      {form.status === 'ready' && (
        <>
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="grid content-start gap-6 lg:col-span-3">
            <Card>
              <div className="flex flex-wrap items-center gap-3">
                <Badge tone={state.tone}>{state.label}</Badge>
                <p className="text-sm text-slate-600 dark:text-slate-400">{state.text}</p>
              </div>
              <div className="mt-5 border-t border-slate-200 pt-5 dark:border-slate-800">
                <Toggle label="Show on the homepage" description="Switch off to hide it straight away." checked={v.enabled} onChange={x => form.setField('enabled', x)} />
              </div>
            </Card>

            <Card title="Message">
              <div className="grid gap-5">
                <div>
                  <p className="mb-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">Style</p>
                  <Segmented label="Style" value={v.style} onChange={x => form.setField('style', x)} options={[{ value: 'popup', label: 'Popup window' }, { value: 'banner', label: 'Strip under the header' }]} />
                </div>
                <TextInput label="Headline *" value={v.title} error={needsTitle ? 'Add a headline before switching it on.' : undefined} recommendedMax={60} onChange={e => form.setField('title', e.target.value)} placeholder="e.g. Admissions open for 2026–27" />
                <TextArea label="Message" rows={3} value={v.message} recommendedMax={v.style === 'banner' ? 90 : 300} onChange={e => form.setField('message', e.target.value)} placeholder="e.g. Forms available at the school office from 1 March. Limited seats in Nursery and Class I." />
                {v.style === 'popup' && <ImageField label="Image (optional)" value={v.image} preset="gallery" previewClass="h-28 w-48 object-cover" onChange={x => form.setField('image', x)} hint="A poster or photo shown above the message." />}
                <div className="grid gap-5 sm:grid-cols-2">
                  <TextInput label="Button text" value={v.linkLabel} onChange={e => form.setField('linkLabel', e.target.value)} placeholder="e.g. Apply now" />
                  <TextInput label="Button link" value={v.linkUrl} onChange={e => form.setField('linkUrl', e.target.value)} placeholder="#admissions or https://…" hint="Use #admissions, #contact, #downloads to jump to a section." />
                </div>
              </div>
            </Card>

            <Card title="Schedule" description="Leave both empty to show it until you switch it off.">
              <div className="grid gap-5 sm:grid-cols-2">
                <TextInput label="Start showing on" type="date" value={v.start} onChange={e => form.setField('start', e.target.value)} />
                <TextInput label="Stop showing after" type="date" value={v.end} error={datesInvalid ? 'Must be on or after the start date.' : undefined} onChange={e => form.setField('end', e.target.value)} />
              </div>
              {(v.start || v.end) && !datesInvalid && (
                <p className="mt-3 text-sm text-slate-500">
                  Shows {v.start ? `from ${formatDate(v.start)}` : 'from now'} {v.end ? `until ${formatDate(v.end)}` : 'until switched off'}.
                </p>
              )}
            </Card>
          </div>

          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24">
              <Card title="Preview"><Preview values={v} /></Card>
            </div>
          </div>
        </div>

          <SaveBar
            dirty={form.dirty}
            saving={form.saving}
            onDiscard={form.discard}
            disabled={Boolean(datesInvalid || needsTitle)}
            // A new version makes visitors who closed the old one see the update
            onSave={() => form.save(x => ({ ...x, title: x.title.trim(), message: x.message.trim(), linkLabel: x.linkLabel.trim(), linkUrl: x.linkUrl.trim(), version: (Number(x.version) || 0) + 1 }))}
          />
        </>
      )}
    </>
  );
}
