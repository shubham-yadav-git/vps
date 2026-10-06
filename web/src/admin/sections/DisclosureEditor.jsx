import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Icon from '../../components/Icon';
import { MAX_DOC_BYTES, docSize, friendlyError, getSettings, saveSettings } from '../api';
import { compressImage, formatBytes, readDocumentFile } from '../images';
import { Button, Card, EmptyState, ErrorBox, Loading, PageHeader, SaveBar, Select, TextInput, useConfirm, useToast, useUnsavedChanges } from '../ui';

// Stored shape (read by the public page): sections[] = { id, label, enabled, fields: [{ label, type }], rows: [{ [label]: value }] }.
// While editing, rows are arrays in column order so renaming or reordering columns can't lose data.

function toEditable(section) {
  const fields = (Array.isArray(section.fields) ? section.fields : []).map(f => ({ ...f, label: String(f.label || ''), type: f.type === 'file' ? 'file' : 'text' }));
  const rows = (Array.isArray(section.rows) ? section.rows : []).map(row =>
    fields.map((f, i) => {
      const v = Array.isArray(row) ? row[i] : row?.[f.label];
      return v === null || v === undefined ? '' : String(v);
    })
  );
  return { ...section, id: String(section.id || ''), label: String(section.label || ''), enabled: section.enabled !== false, fields, rows };
}

function toStored(section) {
  return {
    ...section,
    label: section.label.trim(),
    fields: section.fields.map(f => ({ ...f, label: f.label.trim() })),
    rows: section.rows.map(row => Object.fromEntries(section.fields.map((f, i) => [f.label.trim(), row[i] ?? '']))),
  };
}

function sectionProblems(section) {
  const labels = section.fields.map(f => f.label.trim());
  if (!section.label.trim()) return 'Every section needs a name.';
  if (labels.some(l => !l)) return `"${section.label}" has a column without a name.`;
  if (new Set(labels).size !== labels.length) return `"${section.label}" has two columns with the same name.`;
  return '';
}

const uniqueId = (label, taken) => {
  const base = label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'section';
  let id = base;
  for (let n = 2; taken.has(id); n++) id = `${base}_${n}`;
  return id;
};

function swap(list, index, delta) {
  const next = [...list];
  [next[index], next[index + delta]] = [next[index + delta], next[index]];
  return next;
}

function FileCell({ value, onChange }) {
  const toast = useToast();
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const isEmbedded = value.startsWith('data:');

  async function upload(file) {
    if (!file) return;
    setBusy(true);
    try {
      const dataUrl = file.type.startsWith('image/') ? (await compressImage(file, 'gallery')).dataUrl : await readDocumentFile(file);
      onChange(dataUrl);
      toast.success('File attached. Remember to save.');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="flex min-w-56 flex-col gap-1.5">
      {isEmbedded ? (
        <div className="flex items-center gap-2 rounded-lg bg-brand-50 px-2.5 py-1.5 text-xs font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
          <Icon name="file" className="size-4" /> Attached file ({formatBytes(value.length * 0.75)})
          <button type="button" className="ml-auto text-red-600 hover:underline" onClick={() => onChange('')}>Remove</button>
        </div>
      ) : (
        <input className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950" placeholder="Paste a link, or text like “Will be updated soon”" value={value} onChange={e => onChange(e.target.value)} />
      )}
      <input ref={inputRef} type="file" accept="application/pdf,image/*" className="hidden" onChange={e => upload(e.target.files[0])} />
      {!isEmbedded && (
        <button type="button" disabled={busy} onClick={() => inputRef.current?.click()} className="self-start text-xs font-semibold text-brand-600 hover:underline disabled:opacity-60 dark:text-brand-400">
          {busy ? 'Processing…' : 'or upload a PDF / image'}
        </button>
      )}
    </div>
  );
}

function SectionEditor({ section, onChange }) {
  const confirm = useConfirm();
  const set = patch => onChange({ ...section, ...patch });

  const setField = (index, patch) => set({ fields: section.fields.map((f, i) => (i === index ? { ...f, ...patch } : f)) });
  const addField = () => set({ fields: [...section.fields, { label: '', type: 'text' }], rows: section.rows.map(r => [...r, '']) });
  const moveField = (index, delta) => set({ fields: swap(section.fields, index, delta), rows: section.rows.map(r => swap(r, index, delta)) });
  async function removeField(index) {
    const hasData = section.rows.some(r => r[index]);
    if (hasData && !(await confirm({ title: `Remove column "${section.fields[index].label}"?`, message: 'Its values in every row will be deleted when you save.', confirmLabel: 'Remove', danger: true }))) return;
    set({ fields: section.fields.filter((_, i) => i !== index), rows: section.rows.map(r => r.filter((_, i) => i !== index)) });
  }

  const setCell = (rowIndex, colIndex, value) => set({ rows: section.rows.map((r, i) => (i === rowIndex ? r.map((c, j) => (j === colIndex ? value : c)) : r)) });
  const addRow = () => set({ rows: [...section.rows, section.fields.map(() => '')] });
  async function removeRow(index) {
    if (section.rows[index].some(Boolean) && !(await confirm({ title: 'Delete this row?', confirmLabel: 'Delete', danger: true }))) return;
    set({ rows: section.rows.filter((_, i) => i !== index) });
  }

  return (
    <div className="grid gap-6">
      <Card title="Section">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <TextInput label="Section name" value={section.label} onChange={e => set({ label: e.target.value })} />
          <label className="flex items-center gap-2 pb-2.5 text-sm font-medium text-slate-700 dark:text-slate-300">
            <input type="checkbox" className="size-4 accent-brand-600" checked={section.enabled} onChange={e => set({ enabled: e.target.checked })} />
            Show on website
          </label>
        </div>
      </Card>

      <Card title="Columns" description="File columns accept links or uploaded PDFs/images." actions={<Button variant="secondary" size="sm" icon="sparkles" onClick={addField}>Add column</Button>}>
        {section.fields.length === 0 ? <EmptyState title="No columns yet">Add a column to start the table.</EmptyState> : (
          <ul className="grid gap-2">
            {section.fields.map((field, index) => (
              <li key={index} className="flex flex-wrap items-end gap-2">
                <TextInput className="min-w-48 flex-1" label={index === 0 ? 'Column name' : undefined} value={field.label} placeholder="e.g. Document / Information" onChange={e => setField(index, { label: e.target.value })} />
                <Select className="w-40" label={index === 0 ? 'Type' : undefined} value={field.type} options={[{ value: 'text', label: 'Text' }, { value: 'file', label: 'Link or file' }]} onChange={e => setField(index, { type: e.target.value })} />
                <div className="flex gap-1 pb-0.5">
                  <Button variant="ghost" size="icon" aria-label="Move column left" disabled={index === 0} onClick={() => moveField(index, -1)}><Icon name="arrowUp" className="size-4" /></Button>
                  <Button variant="ghost" size="icon" aria-label="Move column right" disabled={index === section.fields.length - 1} onClick={() => moveField(index, 1)}><Icon name="arrowUp" className="size-4 rotate-180" /></Button>
                  <Button variant="dangerGhost" size="icon" aria-label="Remove column" onClick={() => removeField(index)}><Icon name="x" className="size-4" /></Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {section.fields.length > 0 && (
        <Card title={`Rows (${section.rows.length})`} actions={<Button variant="secondary" size="sm" icon="sparkles" onClick={addRow}>Add row</Button>}>
          {section.rows.length === 0 ? <EmptyState title="No rows yet" /> : (
            <div className="-mx-5 overflow-x-auto px-5">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-xs tracking-wider text-slate-500 uppercase">
                    <th className="w-8 pb-2" />
                    {section.fields.map((f, i) => <th key={i} className="pr-3 pb-2 font-semibold">{f.label || <span className="text-amber-600">Unnamed</span>}</th>)}
                    <th className="pb-2" />
                  </tr>
                </thead>
                <tbody className="align-top">
                  {section.rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-t border-slate-100 dark:border-slate-800">
                      <td className="py-2 pr-2 text-xs text-slate-400">{rowIndex + 1}</td>
                      {section.fields.map((field, colIndex) => (
                        <td key={colIndex} className="py-2 pr-3">
                          {field.type === 'file' ? (
                            <FileCell value={row[colIndex] || ''} onChange={v => setCell(rowIndex, colIndex, v)} />
                          ) : (
                            <textarea rows={1} className="field-sizing-content min-w-40 w-full resize-y rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950" value={row[colIndex] || ''} onChange={e => setCell(rowIndex, colIndex, e.target.value)} />
                          )}
                        </td>
                      ))}
                      <td className="py-2">
                        <div className="flex gap-0.5">
                          <Button variant="ghost" size="icon" aria-label="Move row up" disabled={rowIndex === 0} onClick={() => set({ rows: swap(section.rows, rowIndex, -1) })}><Icon name="arrowUp" className="size-4" /></Button>
                          <Button variant="ghost" size="icon" aria-label="Move row down" disabled={rowIndex === section.rows.length - 1} onClick={() => set({ rows: swap(section.rows, rowIndex, 1) })}><Icon name="arrowUp" className="size-4 rotate-180" /></Button>
                          <Button variant="dangerGhost" size="icon" aria-label="Delete row" onClick={() => removeRow(rowIndex)}><Icon name="x" className="size-4" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

export default function DisclosureEditor() {
  const toast = useToast();
  const confirm = useConfirm();
  const [saved, setSaved] = useState(null);
  const [sections, setSections] = useState(null);
  const [selectedId, setSelectedId] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [newName, setNewName] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const doc = await getSettings('disclosure');
      const list = (Array.isArray(doc?.sections) ? doc.sections : []).map(toEditable);
      setSaved(list);
      setSections(list);
      setSelectedId(current => current || list[0]?.id || '');
    } catch (err) {
      setError(friendlyError(err));
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const dirty = useMemo(() => sections && JSON.stringify(sections) !== JSON.stringify(saved), [sections, saved]);
  useUnsavedChanges('disclosure', Boolean(dirty));
  const stored = useMemo(() => (sections ? sections.map(toStored) : []), [sections]);
  const size = useMemo(() => docSize({ sections: stored }), [stored]);
  const problem = sections?.map(sectionProblems).find(Boolean) || '';
  const selectedIndex = sections ? sections.findIndex(s => s.id === selectedId) : -1;

  function addSection() {
    const label = newName.trim();
    if (!label) return;
    const id = uniqueId(label, new Set(sections.map(s => s.id)));
    setSections(list => [...list, { id, label, enabled: true, fields: [{ label: 'SL No.', type: 'text' }, { label: 'Information', type: 'text' }, { label: 'Details', type: 'text' }], rows: [] }]);
    setSelectedId(id);
    setNewName('');
  }

  async function removeSection(index) {
    const section = sections[index];
    if (!(await confirm({ title: `Delete "${section.label}"?`, message: `Its ${section.rows.length} rows will be removed from the website when you save.`, confirmLabel: 'Delete section', danger: true }))) return;
    const next = sections.filter((_, i) => i !== index);
    setSections(next);
    if (section.id === selectedId) setSelectedId(next[0]?.id || '');
  }

  async function save() {
    setSaving(true);
    try {
      await saveSettings('disclosure', { sections: stored });
      setSaved(sections);
      toast.success('Disclosure saved.');
    } catch (err) {
      toast.error(friendlyError(err));
    } finally {
      setSaving(false);
    }
  }

  const sizeRatio = size / MAX_DOC_BYTES;

  return (
    <>
      <PageHeader
        title="Mandatory disclosure"
        description="The tables on the Mandatory Public Disclosure page, as required by CBSE."
        actions={<a href="/mandatory-public-disclosure.html" target="_blank" rel="noopener" className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"><Icon name="external" className="size-4" /> View page</a>}
      />
      {error && <ErrorBox onRetry={load}>{error}</ErrorBox>}
      {!sections && !error && <Loading />}
      {sections && (
        <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
          <aside className="grid min-w-0 content-start gap-4 [&>*]:min-w-0">
            <Card title="Sections">
              <ul className="-mx-2 space-y-1">
                {sections.map((section, index) => (
                  <li key={section.id} className={`flex items-center gap-1 rounded-xl px-2 py-1 ${section.id === selectedId ? 'bg-brand-50 dark:bg-brand-500/10' : ''}`}>
                    <button type="button" title={section.label} onClick={() => setSelectedId(section.id)} className="min-w-0 flex-1 truncate py-1.5 text-left text-sm font-medium text-slate-800 dark:text-slate-200" aria-current={section.id === selectedId}>
                      {section.label || 'Unnamed'}
                      {!section.enabled && <span className="ml-1.5 text-xs text-slate-400">(hidden)</span>}
                    </button>
                    <Button variant="ghost" size="icon" aria-label={`Move ${section.label} up`} disabled={index === 0} onClick={() => setSections(list => swap(list, index, -1))}><Icon name="arrowUp" className="size-3.5" /></Button>
                    <Button variant="ghost" size="icon" aria-label={`Move ${section.label} down`} disabled={index === sections.length - 1} onClick={() => setSections(list => swap(list, index, 1))}><Icon name="arrowUp" className="size-3.5 rotate-180" /></Button>
                    <Button variant="dangerGhost" size="icon" aria-label={`Delete ${section.label}`} onClick={() => removeSection(index)}><Icon name="x" className="size-3.5" /></Button>
                  </li>
                ))}
              </ul>
              <form className="mt-4 flex gap-2" onSubmit={e => { e.preventDefault(); addSection(); }}>
                <input className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" placeholder="New section name" value={newName} onChange={e => setNewName(e.target.value)} aria-label="New section name" />
                <Button type="submit" size="sm" disabled={!newName.trim()}>Add</Button>
              </form>
            </Card>
            <div className="rounded-2xl bg-white p-4 text-sm shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
              <p className="flex justify-between font-medium text-slate-700 dark:text-slate-300"><span>Storage used</span><span>{formatBytes(size)} of 1 MB</span></p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                <div className={`h-full rounded-full ${sizeRatio > 0.9 ? 'bg-red-500' : sizeRatio > 0.7 ? 'bg-amber-500' : 'bg-accent-500'}`} style={{ width: `${Math.min(100, sizeRatio * 100)}%` }} />
              </div>
              {sizeRatio > 0.7 && <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">Getting full. Link large PDFs from Google Drive instead of uploading them.</p>}
            </div>
          </aside>
          <div className="min-w-0">
            {selectedIndex >= 0
              ? <SectionEditor section={sections[selectedIndex]} onChange={updated => setSections(list => list.map((s, i) => (i === selectedIndex ? updated : s)))} />
              : <EmptyState title="No section selected">Add a section on the left to get started.</EmptyState>}
          </div>
        </div>
      )}
      {problem && dirty && <p className="mt-4 text-sm text-red-600">{problem}</p>}
      <SaveBar dirty={dirty} saving={saving} disabled={Boolean(problem) || size > MAX_DOC_BYTES} label={size > MAX_DOC_BYTES ? 'Too large to save' : 'Save disclosure'} onDiscard={() => setSections(saved)} onSave={save} />
    </>
  );
}
