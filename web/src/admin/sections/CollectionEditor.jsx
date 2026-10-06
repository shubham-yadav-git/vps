import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Dialog from '../../components/Dialog';
import Icon from '../../components/Icon';
import { deleteItem, friendlyError, listCollection, saveItem } from '../api';
import { compressImage } from '../images';
import {
  Button, EmptyState, ErrorBox, ImageField, Loading, PageHeader, Select, TextArea, TextInput,
  useConfirm, useToast, useUnsavedChanges,
} from '../ui';
import { activeNotices, formatDate, initials, safeUrl } from '../../lib/normalize';
import { CATEGORY_STYLES } from '../../lib/useNotices';

const today = () => new Date().toISOString().slice(0, 10);

const CATEGORY_OPTIONS = Object.entries(CATEGORY_STYLES).map(([value, s]) => ({ value, label: s.label }));

export const COLLECTIONS = {
  faculty: {
    title: 'Faculty',
    description: 'Teachers shown in the "Our faculty" section.',
    singular: 'faculty member',
    empty: () => ({ name: '', role: '', description: '', photo: '' }),
    fields: [
      { key: 'photo', label: 'Photo', type: 'image', preset: 'photo' },
      { key: 'name', label: 'Full name', required: true, placeholder: 'e.g. Ajay Kumar Yadav' },
      { key: 'role', label: 'Role / subject', placeholder: 'e.g. Head of Maths' },
      { key: 'description', label: 'Short bio', type: 'textarea', rows: 3, placeholder: 'e.g. 10 years of teaching experience…' },
    ],
    summary: item => ({ title: item.name || 'Unnamed', subtitle: item.role, text: item.description, image: item.photo, fallback: initials(item.name) }),
  },
  gallery: {
    title: 'Gallery',
    description: 'Photos in the homepage gallery. Exact duplicates are hidden on the website automatically.',
    singular: 'photo',
    layout: 'grid',
    bulkUpload: true,
    empty: () => ({ src: '', alt: '' }),
    fields: [
      { key: 'src', label: 'Photo', type: 'image', preset: 'gallery', required: true, previewClass: 'h-40 w-64 object-cover' },
      { key: 'alt', label: 'Caption', placeholder: 'e.g. Students at the annual science fair', hint: 'Describe the photo; it is read aloud to visually impaired visitors.' },
    ],
    summary: item => ({ title: item.alt || 'No caption', image: item.src }),
  },
  testimonials: {
    title: 'Testimonials',
    description: 'Quotes from parents and students.',
    singular: 'testimonial',
    empty: () => ({ name: '', role: 'Parent', text: '' }),
    fields: [
      { key: 'name', label: 'Name', required: true },
      { key: 'role', label: 'Who they are', type: 'select', options: ['Parent', 'Student', 'Alumni', 'Teacher', 'Visitor'].map(v => ({ value: v, label: v })) },
      { key: 'text', label: 'Testimonial', type: 'textarea', rows: 4, required: true },
    ],
    summary: item => ({ title: item.name || 'Unnamed', subtitle: item.role, text: item.text, fallback: initials(item.name) }),
  },
  events: {
    title: 'Notice board',
    description: 'Notices appear in the ticker, the notice drawer and the notice board until their "valid until" date passes.',
    singular: 'notice',
    empty: () => ({ title: '', category: 'general', date: today(), validUntil: '', description: '' }),
    fields: [
      { key: 'title', label: 'Title', required: true, placeholder: 'e.g. Annual Sports Day on 15 November' },
      { key: 'category', label: 'Category', type: 'select', options: CATEGORY_OPTIONS },
      { key: 'date', label: 'Posted on', type: 'date', required: true },
      { key: 'validUntil', label: 'Show until', type: 'date', hint: 'Leave empty to keep it visible until you delete it.' },
      { key: 'description', label: 'Details', type: 'textarea', rows: 5 },
    ],
    summary: item => ({ title: item.title || 'Untitled notice', subtitle: [CATEGORY_STYLES[item.category]?.label || 'General', item.date && `Posted ${formatDate(item.date, 'short')}`, item.validUntil && `until ${formatDate(item.validUntil, 'short')}`].filter(Boolean).join(' · '), text: item.description }),
    sort: (a, b) => (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0),
  },
};

function ItemForm({ config, item, onChange, errors }) {
  return (
    <div className="grid gap-5">
      {config.fields.map(field => {
        const label = field.label + (field.required ? ' *' : '');
        const value = item[field.key] ?? '';
        const set = v => onChange({ ...item, [field.key]: v });
        if (field.type === 'image') return <ImageField key={field.key} label={label} hint={field.hint} value={value} preset={field.preset} previewClass={field.previewClass} onChange={set} />;
        if (field.type === 'textarea') return <TextArea key={field.key} label={label} hint={field.hint} error={errors[field.key]} rows={field.rows} placeholder={field.placeholder} value={value} onChange={e => set(e.target.value)} />;
        if (field.type === 'select') return <Select key={field.key} label={label} hint={field.hint} options={field.options} value={value} onChange={e => set(e.target.value)} />;
        return <TextInput key={field.key} type={field.type || 'text'} label={label} hint={field.hint} error={errors[field.key]} placeholder={field.placeholder} value={value} onChange={e => set(e.target.value)} />;
      })}
    </div>
  );
}

function validate(config, item) {
  const errors = {};
  for (const field of config.fields) {
    if (field.required && !String(item[field.key] || '').trim()) errors[field.key] = `${field.label} is required.`;
  }
  if (item.validUntil && item.date && item.validUntil < item.date) errors.validUntil = '"Show until" must be on or after the posted date.';
  return errors;
}

function EditDialog({ config, name, editing, onClose, onSaved, onDeleted }) {
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
      const id = await saveItem(name, trimmed);
      onSaved({ ...trimmed, id });
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
      await deleteItem(name, item.id);
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

  return (
    <Dialog open onClose={close} label={isNew ? `Add ${config.singular}` : `Edit ${config.singular}`} className="!w-[min(40rem,calc(100vw-2rem))]">
      <div className="flex max-h-[calc(100dvh-2rem)] flex-col">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 capitalize dark:text-white">{isNew ? `Add ${config.singular}` : `Edit ${config.singular}`}</h2>
          <Button variant="ghost" size="icon" aria-label="Close" onClick={close}><Icon name="x" /></Button>
        </div>
        <div className="overflow-y-auto px-6 py-5">
          <ItemForm config={config} item={item} onChange={setItem} errors={errors} />
        </div>
        <div className="flex items-center gap-3 border-t border-slate-200 px-6 py-4 dark:border-slate-800">
          {!isNew && <Button variant="dangerGhost" onClick={remove} disabled={busy}>Delete</Button>}
          <Button variant="secondary" className="ml-auto" onClick={close} disabled={busy}>Cancel</Button>
          <Button onClick={save} loading={busy} icon="check">{isNew ? 'Add' : 'Save'}</Button>
        </div>
      </div>
    </Dialog>
  );
}

function ItemCard({ config, item, onEdit, expired }) {
  const s = config.summary(item);
  const image = safeUrl(s.image);
  if (config.layout === 'grid') {
    return (
      <button type="button" onClick={onEdit} className="group overflow-hidden rounded-2xl bg-white text-left shadow-sm ring-1 ring-slate-200 transition hover:ring-brand-400 dark:bg-slate-900 dark:ring-slate-800">
        <div className="aspect-[4/3] bg-slate-100 dark:bg-slate-800">
          {image && <img src={image} alt="" loading="lazy" className="size-full object-cover" />}
        </div>
        <p className={`truncate px-3 py-2.5 text-sm ${s.title === 'No caption' ? 'text-amber-600' : 'text-slate-700 dark:text-slate-300'}`}>{s.title}</p>
      </button>
    );
  }
  return (
    <button type="button" onClick={onEdit} className="flex w-full items-start gap-4 rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-slate-200 transition hover:ring-brand-400 dark:bg-slate-900 dark:ring-slate-800">
      {(image || s.fallback) && (
        image
          ? <img src={image} alt="" loading="lazy" className="size-14 shrink-0 rounded-xl object-cover" />
          : <span className="grid size-14 shrink-0 place-items-center rounded-xl bg-brand-100 font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">{s.fallback}</span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-slate-900 dark:text-white">{s.title}</p>
          {expired && <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">Expired</span>}
        </div>
        {s.subtitle && <p className="text-sm text-slate-500">{s.subtitle}</p>}
        {s.text && <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">{s.text}</p>}
      </div>
      <Icon name="chevronRight" className="mt-1 size-5 shrink-0 text-slate-400" />
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
        const item = { src: dataUrl, alt: '' };
        added.push({ ...item, id: await saveItem('gallery', item) });
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
      <Button icon="download" loading={Boolean(progress)} onClick={() => inputRef.current?.click()}>
        {progress ? `Uploading ${progress}` : 'Upload photos'}
      </Button>
    </>
  );
}

export default function CollectionEditor({ name }) {
  const config = COLLECTIONS[name];
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [tab, setTab] = useState('active');

  const load = useCallback(async () => {
    setError('');
    setItems(null);
    try { setItems(await listCollection(name)); } catch (err) { setError(friendlyError(err)); }
  }, [name]);

  useEffect(() => { load(); }, [load]);

  const activeIds = useMemo(() => (name === 'events' && items ? new Set(activeNotices(items).map(n => n.id)) : null), [items, name]);
  const visible = useMemo(() => {
    if (!items) return [];
    let list = [...items];
    if (config.sort) list.sort(config.sort);
    if (activeIds && tab !== 'all') list = list.filter(item => (tab === 'active') === activeIds.has(item.id));
    return list;
  }, [items, config, activeIds, tab]);

  const upsert = saved => {
    setItems(list => (list.some(i => i.id === saved.id) ? list.map(i => (i.id === saved.id ? saved : i)) : [...list, saved]));
    setEditing(null);
  };

  return (
    <>
      <PageHeader
        title={config.title}
        description={config.description}
        actions={items && (
          <>
            {name === 'events' && <NoticeTools items={items} onImported={added => setItems(list => [...list, ...added])} />}
            {config.bulkUpload && <BulkUpload onAdded={added => setItems(list => [...list, ...added])} />}
            <Button variant={config.bulkUpload ? 'secondary' : 'primary'} icon="sparkles" onClick={() => setEditing(config.empty())}>
              Add {config.singular}
            </Button>
          </>
        )}
      />

      {error && <ErrorBox onRetry={load}>{error}</ErrorBox>}
      {!items && !error && <Loading />}

      {items && activeIds && (
        <div role="tablist" className="mb-4 flex gap-2">
          {[['active', 'Active'], ['expired', 'Expired'], ['all', 'All']].map(([id, label]) => {
            const count = id === 'all' ? items.length : items.filter(i => (id === 'active') === activeIds.has(i.id)).length;
            return (
              <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`rounded-full px-3.5 py-1.5 text-sm font-medium ${tab === id ? 'bg-brand-600 text-white' : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700'}`}>
                {label} <span className="opacity-70">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {items && !visible.length && (
        <EmptyState title={items.length ? 'Nothing here' : `No ${config.title.toLowerCase()} yet`}>
          {items.length ? 'Try another tab.' : `Use "Add ${config.singular}" to create the first one.`}
        </EmptyState>
      )}

      {items && visible.length > 0 && (
        <div className={config.layout === 'grid' ? 'grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4' : 'grid gap-3'}>
          {visible.map(item => (
            <ItemCard key={item.id} config={config} item={item} expired={activeIds && !activeIds.has(item.id)} onEdit={() => setEditing(item)} />
          ))}
        </div>
      )}

      {editing && (
        <EditDialog
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
