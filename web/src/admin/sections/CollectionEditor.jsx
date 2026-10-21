import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import FadeImage from '../../components/FadeImage';
import Icon from '../../components/Icon';
import {
  deleteDownload, deleteGalleryItem, deleteItem, friendlyError, listCollection,
  saveDownload, saveGalleryItem, saveItem, saveOrder,
} from '../api';
import { compressDataUrl, compressImage, formatBytes } from '../images';
import {
  Badge, Button, Drawer, EmptyState, ErrorBox, FileField, ImageField, PageHeader, SearchInput, Segmented, Select,
  SaveBar, SortableList, Tabs, TextArea, TextInput, useConfirm, useToast, useUnsavedChanges,
} from '../ui';
import { activeNotices, formatDate, initials, safeUrl } from '../../lib/normalize';
import { CATEGORY_STYLES } from '../../lib/useNotices';
import { CALENDAR_KINDS, ACHIEVEMENT_KINDS, DOWNLOAD_CATEGORIES, localDate } from '../../lib/schoolData';

const today = () => localDate();
const options = list => list.map(([value, label]) => ({ value, label }));
const CATEGORY_OPTIONS = Object.entries(CATEGORY_STYLES).map(([value, s]) => ({ value, label: s.label }));
const byOrder = (a, b) => (a.order ?? 1e9) - (b.order ?? 1e9);

export const COLLECTIONS = {
  events: {
    title: 'Notice board',
    icon: 'bell',
    description: 'Notices appear in the ticker, the notice drawer and the notice board until their “show until” date passes.',
    singular: 'notice',
    empty: () => ({ title: '', category: 'general', date: today(), validUntil: '', description: '' }),
    fields: [
      { key: 'title', label: 'Title', required: true, placeholder: 'e.g. Annual Sports Day on 15 November' },
      { key: 'category', label: 'Category', type: 'select', options: CATEGORY_OPTIONS, half: true },
      { key: 'date', label: 'Posted on', type: 'date', required: true, half: true },
      { key: 'validUntil', label: 'Show until', type: 'date', hint: 'Leave empty to keep it visible until you delete it.' },
      { key: 'description', label: 'Details', type: 'textarea', rows: 6 },
    ],
    summary: item => ({
      title: item.title || 'Untitled notice',
      badge: { label: CATEGORY_STYLES[item.category]?.label || 'General', tone: { urgent: 'red', academic: 'blue', events: 'amber', general: 'green' }[item.category] || 'gray' },
      subtitle: [item.date && `Posted ${formatDate(item.date, 'short')}`, item.validUntil && `until ${formatDate(item.validUntil, 'short')}`].filter(Boolean).join(' · '),
      text: item.description,
    }),
    sort: (a, b) => (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0),
    tabs: items => {
      const active = new Set(activeNotices(items).map(n => n.id));
      return [
        { id: 'active', label: 'Active', test: i => active.has(i.id) },
        { id: 'expired', label: 'Expired', test: i => !active.has(i.id) },
        { id: 'all', label: 'All', test: () => true },
      ];
    },
  },
  calendar: {
    title: 'Calendar',
    icon: 'calendar',
    description: 'Events, exams and holidays. Upcoming dates appear in the “School calendar” section of the website.',
    singular: 'event',
    calendarView: true,
    empty: () => ({ title: '', kind: 'event', start: today(), end: '', time: '', location: '', description: '' }),
    fields: [
      { key: 'title', label: 'Title', required: true, placeholder: 'e.g. Half-yearly examinations' },
      { key: 'kind', label: 'Type', type: 'select', options: options(CALENDAR_KINDS.map(k => [k.id, k.label])) },
      { key: 'start', label: 'Starts', type: 'date', required: true, half: true },
      { key: 'end', label: 'Ends', type: 'date', half: true, hint: 'Only for events lasting more than a day.' },
      { key: 'time', label: 'Time', half: true, placeholder: 'e.g. 9:00 AM – 1:00 PM' },
      { key: 'location', label: 'Place', half: true, placeholder: 'e.g. School ground' },
      { key: 'description', label: 'Details', type: 'textarea', rows: 4 },
    ],
    summary: item => {
      const kind = CALENDAR_KINDS.find(k => k.id === item.kind) || CALENDAR_KINDS[0];
      return {
        title: item.title || 'Untitled event',
        badge: { label: kind.label, tone: kind.tone },
        subtitle: [formatDate(item.start, 'short') + (item.end && item.end !== item.start ? ` – ${formatDate(item.end, 'short')}` : ''), item.time, item.location].filter(Boolean).join(' · '),
        text: item.description,
      };
    },
    sort: (a, b) => String(a.start).localeCompare(String(b.start)),
    tabs: () => [
      { id: 'upcoming', label: 'Upcoming', test: i => (i.end || i.start) >= today() },
      { id: 'past', label: 'Past', test: i => (i.end || i.start) < today() },
      { id: 'all', label: 'All', test: () => true },
    ],
  },
  achievements: {
    title: 'Achievements',
    icon: 'trophy',
    description: 'Board results, toppers, awards and competitions. Shown in the “Achievements” section of the website, in this order.',
    singular: 'achievement',
    orderable: true,
    views: ['list', 'grid'],
    empty: () => ({ title: '', kind: 'topper', studentName: '', className: '', year: String(new Date().getFullYear()), description: '', photo: '' }),
    fields: [
      { key: 'photo', label: 'Photo', type: 'image', preset: 'photo', hint: 'A photo of the student or the award (optional).' },
      { key: 'title', label: 'Headline', required: true, placeholder: 'e.g. 98.4% in Class X Board Exams' },
      { key: 'kind', label: 'Type', type: 'select', options: options(ACHIEVEMENT_KINDS.map(k => [k.id, k.label])), half: true },
      { key: 'year', label: 'Year', half: true, placeholder: 'e.g. 2025' },
      { key: 'studentName', label: 'Student or team', half: true, placeholder: 'e.g. Priya Yadav' },
      { key: 'className', label: 'Class', half: true, placeholder: 'e.g. Class X' },
      { key: 'description', label: 'Details', type: 'textarea', rows: 3 },
    ],
    summary: item => ({
      title: item.title || 'Untitled',
      badge: { label: ACHIEVEMENT_KINDS.find(k => k.id === item.kind)?.label || 'Achievement', tone: 'amber' },
      subtitle: [item.studentName, item.className, item.year].filter(Boolean).join(' · '),
      text: item.description,
      image: item.photo,
      fallback: initials(item.studentName || item.title),
    }),
  },
  gallery: {
    title: 'Gallery',
    icon: 'image',
    description: 'Photos in the homepage gallery. Exact duplicates are hidden on the website automatically.',
    singular: 'photo',
    views: ['grid', 'list'],
    bulkUpload: true,
    empty: () => ({ photo: '', alt: '' }),
    // Stored as a small preview + separate full-size photo; the editor works with one "photo"
    fromStored: item => ({ id: item.id, alt: item.alt || '', photo: item.thumb || item.src || '' }),
    fields: [
      { key: 'photo', label: 'Photo', type: 'image', preset: 'gallery', required: true, previewClass: 'h-40 w-64 object-cover' },
      { key: 'alt', label: 'Caption', placeholder: 'e.g. Students at the annual science fair', hint: 'Describe the photo; it is read aloud to visually impaired visitors.' },
    ],
    summary: item => ({ title: item.alt || 'No caption', warn: !item.alt, image: item.photo }),
  },
  downloads: {
    title: 'Downloads',
    icon: 'folder',
    description: 'Fee structure, syllabus, book lists, forms and circulars for parents. Shown in the “Downloads” section of the website, in this order.',
    singular: 'download',
    orderable: true,
    empty: () => ({ title: '', category: 'circulars', description: '', fileInfo: { file: '', hasFile: false, fileName: '', size: 0, url: '' } }),
    fromStored: item => ({ ...item, fileInfo: { file: '', hasFile: Boolean(item.hasFile), fileName: item.fileName || '', size: item.size || 0, url: item.url || '' } }),
    fields: [
      { key: 'title', label: 'Title', required: true, placeholder: 'e.g. Fee structure 2026–27' },
      { key: 'category', label: 'Category', type: 'select', options: options(DOWNLOAD_CATEGORIES.map(c => [c.id, c.label])) },
      { key: 'description', label: 'Short note', placeholder: 'e.g. Applies to Nursery to Class V' },
      { key: 'fileInfo', label: 'File', type: 'file' },
    ],
    summary: item => ({
      title: item.title || 'Untitled',
      badge: { label: DOWNLOAD_CATEGORIES.find(c => c.id === item.category)?.label || 'Other', tone: 'blue' },
      subtitle: item.fileInfo?.hasFile ? `${item.fileInfo.fileName || 'File'}${item.fileInfo.size ? ` · ${formatBytes(item.fileInfo.size)}` : ''}` : item.fileInfo?.url ? 'External link' : 'No file yet',
      warn: !item.fileInfo?.hasFile && !item.fileInfo?.url,
      text: item.description,
      icon: 'file',
    }),
  },
  faculty: {
    title: 'Faculty',
    icon: 'users',
    description: 'Teachers shown in the “Our faculty” section, in this order.',
    singular: 'faculty member',
    orderable: true,
    views: ['list', 'grid'],
    empty: () => ({ name: '', role: '', description: '', photo: '' }),
    fields: [
      { key: 'photo', label: 'Photo', type: 'image', preset: 'photo' },
      { key: 'name', label: 'Full name', required: true, placeholder: 'e.g. Ajay Kumar Yadav' },
      { key: 'role', label: 'Role / subject', placeholder: 'e.g. Head of Maths' },
      { key: 'description', label: 'Short bio', type: 'textarea', rows: 3, placeholder: 'e.g. 10 years of teaching experience…' },
    ],
    summary: item => ({ title: item.name || 'Unnamed', subtitle: item.role, text: item.description, image: item.photo, fallback: initials(item.name) }),
  },
  testimonials: {
    title: 'Testimonials',
    icon: 'quote',
    description: 'Quotes from parents and students, in this order.',
    singular: 'testimonial',
    orderable: true,
    empty: () => ({ name: '', role: 'Parent', text: '' }),
    fields: [
      { key: 'name', label: 'Name', required: true },
      { key: 'role', label: 'Who they are', type: 'select', options: ['Parent', 'Student', 'Alumni', 'Teacher', 'Visitor'].map(v => ({ value: v, label: v })) },
      { key: 'text', label: 'Testimonial', type: 'textarea', rows: 5, required: true },
    ],
    summary: item => ({ title: item.name || 'Unnamed', subtitle: item.role, text: item.text, fallback: initials(item.name) }),
  },
};

const searchText = item => Object.values(item).filter(v => typeof v === 'string' && !v.startsWith('data:')).join(' ').toLowerCase();

/** Full-size photo plus a small preview for the gallery grid. */
async function galleryPhoto(photo) {
  if (!photo.startsWith('data:')) return { full: photo };
  const { dataUrl: thumb } = await compressDataUrl(photo, 'thumb');
  return { full: photo, thumb };
}

async function saveAny(name, item, original) {
  if (name === 'gallery') {
    const photoChanged = !original?.id || item.photo !== original.photo;
    return { id: await saveGalleryItem({ id: item.id, alt: item.alt }, photoChanged ? await galleryPhoto(item.photo) : null) };
  }
  if (name === 'downloads') {
    const { fileInfo, ...rest } = item;
    const file = fileInfo.file ? fileInfo.file : (original?.fileInfo?.hasFile && !fileInfo.hasFile ? '' : undefined);
    const keepFile = fileInfo.file || fileInfo.hasFile;
    const saved = await saveDownload({ ...rest, fileName: keepFile ? fileInfo.fileName : '', size: keepFile ? fileInfo.size : 0, url: keepFile ? '' : fileInfo.url.trim() }, file);
    return { ...saved, fileInfo: { file: '', hasFile: Boolean(saved.hasFile ?? fileInfo.hasFile ?? fileInfo.file), fileName: saved.fileName, size: saved.size, url: saved.url } };
  }
  return { id: await saveItem(name, item) };
}

function deleteAny(name, item, label) {
  if (name === 'gallery') return deleteGalleryItem(item.id, label);
  if (name === 'downloads') return deleteDownload(item.id, label);
  return deleteItem(name, item.id, label);
}

function ItemForm({ config, item, onChange, errors }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {config.fields.map(field => {
        const label = field.label + (field.required ? ' *' : '');
        const value = item[field.key] ?? '';
        const set = v => onChange({ ...item, [field.key]: v });
        const span = field.half ? '' : 'sm:col-span-2';
        if (field.type === 'image') return <div key={field.key} className={span}><ImageField label={label} hint={field.hint} value={value} preset={field.preset} previewClass={field.previewClass} onChange={set} /></div>;
        if (field.type === 'file') return <div key={field.key} className={span}><FileField label={label} value={value} onChange={set} /> {errors[field.key] && <p className="mt-1.5 text-sm text-red-600">{errors[field.key]}</p>}</div>;
        if (field.type === 'textarea') return <TextArea key={field.key} className={span} label={label} hint={field.hint} error={errors[field.key]} rows={field.rows} placeholder={field.placeholder} value={value} onChange={e => set(e.target.value)} />;
        if (field.type === 'select') return <Select key={field.key} className={span} label={label} hint={field.hint} options={field.options} value={value} onChange={e => set(e.target.value)} />;
        return <TextInput key={field.key} className={span} type={field.type || 'text'} label={label} hint={field.hint} error={errors[field.key]} placeholder={field.placeholder} value={value} onChange={e => set(e.target.value)} />;
      })}
    </div>
  );
}

function validate(config, item) {
  const errors = {};
  for (const field of config.fields) {
    if (field.required && !String(item[field.key] || '').trim()) errors[field.key] = `${field.label} is required.`;
  }
  if (item.validUntil && item.date && item.validUntil < item.date) errors.validUntil = '“Show until” must be on or after the posted date.';
  if (item.end && item.start && item.end < item.start) errors.end = 'The end date must be on or after the start date.';
  if (item.fileInfo && !item.fileInfo.file && !item.fileInfo.hasFile && !/^https?:\/\//i.test(item.fileInfo.url.trim())) {
    errors.fileInfo = 'Attach a file or paste a link starting with https://';
  }
  return errors;
}

function EditDrawer({ config, name, editing, onClose, onSaved, onDeleted }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [item, setItem] = useState(editing);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const isNew = !editing?.id;
  const dirty = JSON.stringify(item) !== JSON.stringify(editing);
  useUnsavedChanges(`item:${name}`, dirty);

  async function save() {
    const trimmed = Object.fromEntries(Object.entries(item).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v]));
    const found = validate(config, trimmed);
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    try {
      const result = await saveAny(name, trimmed, editing);
      onSaved({ ...trimmed, ...result });
      toast.success(isNew ? `Added ${config.singular}.` : 'Changes saved.');
    } catch (error) {
      toast.error(friendlyError(error));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!(await confirm({ title: `Delete this ${config.singular}?`, message: 'It will be removed from the website. This cannot be undone.', confirmLabel: 'Delete', danger: true }))) return;
    setBusy(true);
    try {
      await deleteAny(name, item, config.summary(item).title);
      onDeleted(item.id);
      toast.success(`Deleted ${config.singular}.`);
    } catch (error) {
      toast.error(friendlyError(error));
      setBusy(false);
    }
  }

  async function close() {
    if (dirty && !(await confirm({ title: 'Discard changes?', message: 'Your edits to this item have not been saved.', confirmLabel: 'Discard', danger: true }))) return;
    onClose();
  }

  const title = isNew ? `Add ${config.singular}` : `Edit ${config.singular}`;
  return (
    <Drawer
      open
      onClose={close}
      title={title.charAt(0).toUpperCase() + title.slice(1)}
      subtitle={isNew ? 'Fields marked * are required.' : config.summary(editing).title}
      footer={(
        <>
          {!isNew && <Button variant="dangerGhost" icon="trash" onClick={remove} disabled={busy}>Delete</Button>}
          <Button variant="secondary" className="ml-auto" onClick={close} disabled={busy}>Cancel</Button>
          <Button onClick={save} loading={busy} icon="check">{isNew ? `Add ${config.singular}` : 'Save changes'}</Button>
        </>
      )}
    >
      <ItemForm config={config} item={item} onChange={setItem} errors={errors} />
    </Drawer>
  );
}

function ItemRow({ config, item, onEdit }) {
  const s = config.summary(item);
  const image = safeUrl(s.image);
  return (
    <button type="button" onClick={onEdit} className="group flex w-full items-start gap-4 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-xs transition hover:border-brand-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-brand-500/50">
      {image ? (
        <span className="size-14 shrink-0 overflow-hidden rounded-lg bg-slate-200 dark:bg-slate-800"><FadeImage src={image} alt="" loading="lazy" className="size-full object-cover" /></span>
      ) : s.fallback ? (
        <span className="grid size-14 shrink-0 place-items-center rounded-lg bg-brand-50 font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">{s.fallback}</span>
      ) : s.icon ? (
        <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800"><Icon name={s.icon} className="size-5" /></span>
      ) : null}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-slate-900 dark:text-white">{s.title}</p>
          {s.badge && <Badge tone={s.badge.tone}>{s.badge.label}</Badge>}
          {s.warn && <Badge tone="amber">Needs attention</Badge>}
        </div>
        {s.subtitle && <p className="mt-0.5 text-sm text-slate-500">{s.subtitle}</p>}
        {s.text && <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">{s.text}</p>}
      </div>
      <Icon name="edit" className="mt-1 size-4 shrink-0 text-slate-300 group-hover:text-brand-600" />
    </button>
  );
}

function ItemTile({ config, item, onEdit }) {
  const s = config.summary(item);
  const image = safeUrl(s.image);
  return (
    <button type="button" onClick={onEdit} className="group overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-xs transition hover:border-brand-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="aspect-[4/3] bg-slate-100 dark:bg-slate-800">
        {image ? <FadeImage src={image} alt="" loading="lazy" className="size-full object-cover" /> : <span className="grid size-full place-items-center text-2xl font-bold text-slate-400">{s.fallback}</span>}
      </div>
      <div className="px-3 py-2.5">
        <p className={`truncate text-sm font-medium ${s.warn ? 'text-amber-600' : 'text-slate-800 dark:text-slate-200'}`}>{s.title}</p>
        {s.subtitle && <p className="truncate text-xs text-slate-500">{s.subtitle}</p>}
      </div>
    </button>
  );
}

function NoticeTools({ items, onImported }) {
  const toast = useToast();
  const confirm = useConfirm();
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);

  function exportJson() {
    const blob = new Blob([JSON.stringify({ notices: items.map(({ id, ...n }) => n), exportDate: new Date().toISOString(), version: '1.0' }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href: url, download: `notices-${today()}.json` });
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importJson(file) {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const list = (Array.isArray(parsed) ? parsed : parsed.notices || []).filter(n => n && n.title);
      if (!list.length) throw new Error('No notices found in this file.');
      if (!(await confirm({ title: `Import ${list.length} notices?`, message: 'They will be added alongside the existing notices.', confirmLabel: 'Import' }))) return;
      setBusy(true);
      const added = [];
      for (const n of list) {
        const item = { title: String(n.title), category: CATEGORY_STYLES[n.category] ? n.category : 'general', date: n.date || today(), validUntil: n.validUntil || '', description: String(n.description || '') };
        added.push({ ...item, id: await saveItem('events', item) });
      }
      onImported(added);
      toast.success(`Imported ${added.length} notices.`);
    } catch (error) {
      toast.error(error instanceof SyntaxError ? 'That file is not valid JSON.' : friendlyError(error));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <>
      <Button variant="secondary" icon="download" onClick={exportJson} disabled={!items.length}>Export</Button>
      <input ref={inputRef} type="file" accept="application/json,.json" className="hidden" onChange={e => importJson(e.target.files[0])} />
      <Button variant="secondary" icon="file" loading={busy} onClick={() => inputRef.current?.click()}>Import</Button>
    </>
  );
}

function BulkUpload({ onAdded }) {
  const toast = useToast();
  const inputRef = useRef(null);
  const [progress, setProgress] = useState(null);

  async function upload(files) {
    const list = Array.from(files || []);
    if (!list.length) return;
    const added = [];
    for (let i = 0; i < list.length; i++) {
      setProgress(`${i + 1} / ${list.length}`);
      try {
        const { dataUrl } = await compressImage(list[i], 'gallery');
        const photo = await galleryPhoto(dataUrl);
        const id = await saveGalleryItem({ alt: '' }, photo);
        added.push({ id, alt: '', photo: photo.thumb });
      } catch (error) {
        toast.error(`${list[i].name}: ${friendlyError(error)}`);
      }
    }
    setProgress(null);
    if (inputRef.current) inputRef.current.value = '';
    if (added.length) {
      onAdded(added);
      toast.success(`Added ${added.length} photo${added.length > 1 ? 's' : ''}. Click a photo to add a caption.`);
    }
  }

  return (
    <>
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => upload(e.target.files)} />
      <Button icon="image" loading={Boolean(progress)} onClick={() => inputRef.current?.click()}>
        {progress ? `Uploading ${progress}` : 'Upload photos'}
      </Button>
    </>
  );
}

// ---------- Month view for the calendar ----------

const pad = n => String(n).padStart(2, '0');
const isoDay = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;

function MonthView({ items, onEdit, onAdd }) {
  const [cursor, setCursor] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; });
  const first = new Date(cursor.y, cursor.m, 1);
  const days = new Date(cursor.y, cursor.m + 1, 0).getDate();
  const lead = (first.getDay() + 6) % 7; // weeks start on Monday
  const cells = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  const todayIso = today();
  const shift = delta => setCursor(({ y, m }) => { const d = new Date(y, m + delta, 1); return { y: d.getFullYear(), m: d.getMonth() }; });

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">{first.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</h2>
        <div className="ml-auto flex gap-1">
          <Button variant="secondary" size="sm" onClick={() => { const d = new Date(); setCursor({ y: d.getFullYear(), m: d.getMonth() }); }}>Today</Button>
          <Button variant="ghost" size="icon" aria-label="Previous month" onClick={() => shift(-1)}><Icon name="chevronLeft" /></Button>
          <Button variant="ghost" size="icon" aria-label="Next month" onClick={() => shift(1)}><Icon name="chevronRight" /></Button>
        </div>
      </div>
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-900/60">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => <div key={d} className="py-2">{d}</div>)}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          if (!day) return <div key={i} className="min-h-24 border-r border-b border-slate-100 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-950/40" />;
          const iso = isoDay(cursor.y, cursor.m, day);
          const dayItems = items.filter(e => e.start <= iso && (e.end || e.start) >= iso);
          return (
            <div key={i} className="group relative min-h-24 border-r border-b border-slate-100 p-1.5 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className={`grid size-6 place-items-center rounded-full text-xs font-semibold ${iso === todayIso ? 'bg-brand-600 text-white' : 'text-slate-600 dark:text-slate-400'}`}>{day}</span>
                <button type="button" onClick={() => onAdd(iso)} aria-label={`Add event on ${formatDate(iso)}`} className="rounded p-0.5 text-slate-400 opacity-0 group-hover:opacity-100 hover:bg-slate-100 hover:text-brand-600 focus:opacity-100 dark:hover:bg-slate-800">
                  <Icon name="plus" className="size-4" />
                </button>
              </div>
              <div className="mt-1 grid gap-1">
                {dayItems.slice(0, 3).map(e => {
                  const kind = CALENDAR_KINDS.find(k => k.id === e.kind) || CALENDAR_KINDS[0];
                  return (
                    <button key={e.id} type="button" onClick={() => onEdit(e)} title={e.title} className={`truncate rounded px-1.5 py-0.5 text-left text-[11px] font-medium ${kind.chip}`}>{e.title}</button>
                  );
                })}
                {dayItems.length > 3 && <span className="px-1.5 text-[11px] text-slate-500">+{dayItems.length - 3} more</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Page ----------

export default function CollectionEditor({ name }) {
  const config = COLLECTIONS[name];
  const toast = useToast();
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [query, setQuery] = useState('');
  const [orderDraft, setOrderDraft] = useState(null); // ids in the new order, before saving
  const [savingOrder, setSavingOrder] = useState(false);
  const [view, setView] = useState(config.calendarView ? 'month' : (config.views?.[0] || 'list'));
  const tabs = useMemo(() => (items && config.tabs ? config.tabs(items) : null), [items, config]);
  const [tab, setTab] = useState(null);
  const activeTab = tabs?.find(t => t.id === tab) || tabs?.[0];

  const load = useCallback(async () => {
    setError('');
    setItems(null);
    try {
      const list = await listCollection(name);
      setItems(config.fromStored ? list.map(config.fromStored) : list);
    } catch (err) { setError(friendlyError(err)); }
  }, [name, config]);

  useEffect(() => { load(); }, [load]);

  const visible = useMemo(() => {
    if (!items) return [];
    let list = [...items];
    if (orderDraft) {
      // Items added or deleted since dragging keep sensible positions
      const position = id => { const i = orderDraft.indexOf(id); return i === -1 ? Infinity : i; };
      list.sort((a, b) => position(a.id) - position(b.id));
    } else {
      list.sort(config.sort || byOrder);
    }
    if (activeTab) list = list.filter(activeTab.test);
    const q = query.trim().toLowerCase();
    if (q) list = list.filter(item => searchText(item).includes(q));
    return list;
  }, [items, config, activeTab, query, orderDraft]);

  const canReorder = config.orderable && !query.trim() && view === 'list';

  // Reordering is a draft until "Save order", like every other change in the panel
  const savedOrderIds = useMemo(() => (items ? [...items].sort(byOrder).map(i => i.id) : []), [items]);
  // The draft, ignoring items deleted since dragging; anything added since goes last
  const draftIds = useMemo(() => (orderDraft && items
    ? [...orderDraft.filter(id => items.some(i => i.id === id)), ...savedOrderIds.filter(id => !orderDraft.includes(id))]
    : null), [orderDraft, items, savedOrderIds]);
  const orderDirty = Boolean(draftIds) && draftIds.join() !== savedOrderIds.join();
  useUnsavedChanges(`order:${name}`, orderDirty);

  async function saveOrderDraft() {
    const ids = draftIds;
    setSavingOrder(true);
    try {
      await saveOrder(name, ids);
      setItems(list => list.map(item => ({ ...item, order: ids.indexOf(item.id) })));
      setOrderDraft(null);
      toast.success('New order saved. The website shows it on the next visit.');
    } catch (err) {
      toast.error(friendlyError(err));
    } finally {
      setSavingOrder(false);
    }
  }

  const upsert = saved => {
    setItems(list => (list.some(i => i.id === saved.id) ? list.map(i => (i.id === saved.id ? { ...i, ...saved } : i)) : [...list, saved]));
    setEditing(null);
  };

  const addNew = (preset = {}) => {
    const item = { ...config.empty(), ...preset };
    if (config.orderable && items) item.order = items.reduce((max, i) => Math.max(max, i.order ?? -1), -1) + 1;
    setEditing(item);
  };

  const viewOptions = config.calendarView
    ? [{ value: 'month', label: 'Month', icon: 'calendar' }, { value: 'list', label: 'List', icon: 'list' }]
    : config.views?.map(v => ({ value: v, label: v === 'grid' ? 'Grid' : 'List', icon: v }));

  return (
    <>
      <PageHeader
        title={config.title}
        icon={config.icon}
        description={config.description}
        actions={items && (
          <>
            {name === 'events' && <NoticeTools items={items} onImported={added => setItems(list => [...list, ...added])} />}
            {config.bulkUpload && <BulkUpload onAdded={added => setItems(list => [...list, ...added])} />}
            <Button variant={config.bulkUpload ? 'secondary' : 'primary'} icon="plus" onClick={() => addNew()}>
              Add {config.singular}
            </Button>
          </>
        )}
      />

      {error && <ErrorBox onRetry={load}>{error}</ErrorBox>}

      {!items && !error && (
        <div aria-busy="true" aria-label="Loading" className={view === 'grid' ? 'grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4' : 'grid gap-3'}>
          {[0, 1, 2, 3, 4, 5].map(i => <div key={i} className={`animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800 ${view === 'grid' ? 'aspect-[4/3]' : 'h-22'}`} />)}
        </div>
      )}

      {items && (
        <>
          {tabs && view !== 'month' && (
            <Tabs className="mb-4" value={activeTab.id} onChange={setTab} tabs={tabs.map(t => ({ id: t.id, label: t.label, count: items.filter(t.test).length }))} />
          )}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            {view !== 'month' && <SearchInput value={query} onChange={setQuery} placeholder={`Search ${config.title.toLowerCase()}…`} className="w-full sm:w-72" />}
            {canReorder && visible.length > 1 && <p className="hidden items-center gap-1.5 text-xs text-slate-500 md:flex"><Icon name="grip" className="size-4" /> Drag to change the order, then save</p>}
            {viewOptions && <div className="ml-auto"><Segmented label="View" value={view} onChange={setView} options={viewOptions} /></div>}
          </div>

          {view === 'month' ? (
            <MonthView items={items} onEdit={setEditing} onAdd={iso => addNew({ start: iso })} />
          ) : !visible.length ? (
            <EmptyState
              icon={config.icon}
              title={query ? 'No matches' : items.length ? 'Nothing here' : `No ${config.title.toLowerCase()} yet`}
              action={!items.length && <Button icon="plus" onClick={() => addNew()}>Add {config.singular}</Button>}
            >
              {query ? `Nothing matches “${query}”.` : items.length ? 'Try another tab.' : `Add the first ${config.singular} and it will appear on the website.`}
            </EmptyState>
          ) : view === 'grid' ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {visible.map(item => <ItemTile key={item.id} config={config} item={item} onEdit={() => setEditing(item)} />)}
            </div>
          ) : canReorder ? (
            <SortableList items={visible} onReorder={next => setOrderDraft(next.map(i => i.id))} renderItem={item => <ItemRow config={config} item={item} onEdit={() => setEditing(item)} />} />
          ) : (
            <div className="grid gap-2">
              {visible.map(item => <ItemRow key={item.id} config={config} item={item} onEdit={() => setEditing(item)} />)}
            </div>
          )}
        </>
      )}

      {config.orderable && (
        <SaveBar dirty={orderDirty} saving={savingOrder} onSave={saveOrderDraft} onDiscard={() => setOrderDraft(null)} label="Save order" />
      )}

      {editing && (
        <EditDrawer
          key={editing.id || 'new'}
          config={config}
          name={name}
          editing={editing}
          onClose={() => setEditing(null)}
          onSaved={upsert}
          onDeleted={id => { setItems(list => list.filter(i => i.id !== id)); setEditing(null); }}
        />
      )}
    </>
  );
}
