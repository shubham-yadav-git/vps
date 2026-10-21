import { useCallback, useEffect, useMemo, useState } from 'react';
import Icon from '../../components/Icon';
import { ENQUIRY_STATUSES, deleteEnquiry, friendlyError, listEnquiries, updateEnquiry } from '../api';
import {
  Badge, Button, DataTable, Drawer, EmptyState, ErrorBox, Notice, PageHeader, SearchInput, Segmented, Tabs,
  TextArea, downloadCsv, timeAgo, toDate, useConfirm, useToast, useUnsavedChanges,
} from '../ui';

export const STATUS_TONES = { new: 'red', contacted: 'amber', visited: 'blue', admitted: 'green', closed: 'gray' };
const statusLabel = id => ENQUIRY_STATUSES.find(s => s.id === id)?.label || id;

const digits = phone => String(phone || '').replace(/\D/g, '');
const whatsappNumber = phone => { const d = digits(phone); return d.length === 10 ? `91${d}` : d; };
const fullDate = value => toDate(value)?.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }) || '';

const notifyBadge = () => window.dispatchEvent(new Event('vps:enquiries-changed'));

function Detail({ label, children }) {
  if (!children) return null;
  return (
    <div className="grid gap-0.5 py-2.5 sm:grid-cols-3 sm:gap-4">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="text-sm font-medium break-words text-slate-900 sm:col-span-2 dark:text-slate-100">{children}</dd>
    </div>
  );
}

function EnquiryDrawer({ enquiry, onClose, onChanged, onDeleted }) {
  const toast = useToast();
  const confirm = useConfirm();
  // Status and a new note are drafts until "Save changes"
  const [status, setStatus] = useState(enquiry.status);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState('');
  const notes = Array.isArray(enquiry.notes) ? enquiry.notes : [];
  const phone = enquiry.phone;
  const dirty = status !== enquiry.status || Boolean(note.trim());
  useUnsavedChanges(`enquiry:${enquiry.id}`, dirty);

  async function save() {
    const patch = {};
    if (status !== enquiry.status) patch.status = status;
    if (note.trim()) patch.notes = [...notes, { text: note.trim().slice(0, 1000), at: new Date().toISOString() }];
    setBusy('save');
    try {
      await updateEnquiry(enquiry, patch);
      onChanged({ ...enquiry, ...patch });
      setNote('');
      notifyBadge();
      toast.success('Changes saved.');
    } catch (error) {
      toast.error(friendlyError(error));
    } finally {
      setBusy('');
    }
  }

  function discard() {
    setStatus(enquiry.status);
    setNote('');
  }

  async function close() {
    if (dirty && !(await confirm({ title: 'Discard changes?', message: 'Your changes to this enquiry have not been saved.', confirmLabel: 'Discard', danger: true }))) return;
    onClose();
  }

  async function remove() {
    if (!(await confirm({ title: 'Delete this enquiry?', message: 'Use this for spam or duplicates. To keep a record, mark it “Closed” instead.', confirmLabel: 'Delete', danger: true }))) return;
    setBusy('delete');
    try {
      await deleteEnquiry(enquiry);
      onDeleted(enquiry.id);
      notifyBadge();
      toast.success('Enquiry deleted.');
    } catch (error) {
      toast.error(friendlyError(error));
      setBusy('');
    }
  }

  return (
    <Drawer
      open
      onClose={close}
      title={enquiry.parentName}
      subtitle={`${enquiry.type === 'admission' ? 'Admission enquiry' : 'General enquiry'} · received ${fullDate(enquiry.createdAt)}`}
      footer={(
        <>
          <Button variant="dangerGhost" icon="trash" onClick={remove} loading={busy === 'delete'} disabled={Boolean(busy)}>Delete</Button>
          {dirty && <span className="ml-auto flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-400"><span className="size-2 rounded-full bg-amber-500" /> Unsaved</span>}
          <Button variant="secondary" className={dirty ? '' : 'ml-auto'} onClick={dirty ? discard : close} disabled={Boolean(busy)}>{dirty ? 'Discard' : 'Close'}</Button>
          <Button icon="check" onClick={save} loading={busy === 'save'} disabled={!dirty || Boolean(busy)}>Save changes</Button>
        </>
      )}
    >
      <div className="flex flex-wrap gap-2">
        {phone && <a href={`tel:${digits(phone)}`} className="inline-flex h-9 items-center gap-2 rounded-lg bg-brand-600 px-3 text-sm font-semibold text-white hover:bg-brand-700"><Icon name="phone" className="size-4" /> Call {phone}</a>}
        {phone && <a href={`https://wa.me/${whatsappNumber(phone)}`} target="_blank" rel="noopener" className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"><Icon name="message" className="size-4" /> WhatsApp</a>}
        {enquiry.email && <a href={`mailto:${enquiry.email}?subject=${encodeURIComponent('Your enquiry to Vikas Public School')}`} className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"><Icon name="mail" className="size-4" /> Email</a>}
      </div>

      <section className="mt-6">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Status</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {ENQUIRY_STATUSES.map(s => (
            <button
              key={s.id}
              type="button"
              disabled={Boolean(busy)}
              onClick={() => setStatus(s.id)}
              aria-pressed={status === s.id}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${status === s.id ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Details</h3>
        <dl className="mt-1 divide-y divide-slate-200 dark:divide-slate-800">
          <Detail label="Parent / guardian">{enquiry.parentName}</Detail>
          <Detail label="Phone">{enquiry.phone}</Detail>
          <Detail label="Email">{enquiry.email}</Detail>
          <Detail label="Student">{enquiry.studentName}</Detail>
          <Detail label="Class applying for">{enquiry.classApplying}</Detail>
        </dl>
        {enquiry.message && (
          <div className="mt-3 rounded-lg bg-slate-50 p-4 text-sm leading-relaxed whitespace-pre-wrap text-slate-700 dark:bg-slate-800/60 dark:text-slate-300">{enquiry.message}</div>
        )}
      </section>

      <section className="mt-6">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Follow-up notes</h3>
        {notes.length ? (
          <ol className="mt-3 grid gap-3 border-l-2 border-slate-200 pl-4 dark:border-slate-700">
            {notes.map((n, i) => (
              <li key={i} className="relative">
                <span className="absolute top-1.5 -left-[1.4rem] size-2.5 rounded-full border-2 border-white bg-brand-500 dark:border-slate-900" />
                <p className="text-xs text-slate-500">{fullDate(n.at)}</p>
                <p className="text-sm whitespace-pre-wrap text-slate-800 dark:text-slate-200">{n.text}</p>
              </li>
            ))}
          </ol>
        ) : <p className="mt-1 text-sm text-slate-500">No notes yet. Record each call or visit here.</p>}
        <TextArea className="mt-4" label="Add a note" hint="Saved with the button below." rows={3} placeholder="e.g. Called, parent will visit on Saturday with documents." value={note} onChange={e => setNote(e.target.value)} />
      </section>
    </Drawer>
  );
}

export default function Enquiries() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('open');
  const [type, setType] = useState('all');
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState(null);

  const load = useCallback(async () => {
    setError('');
    try { setItems(await listEnquiries()); } catch (err) { setError(friendlyError(err)); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const tabs = useMemo(() => {
    const list = items || [];
    const count = test => list.filter(test).length;
    return [
      { id: 'open', label: 'Open', count: count(e => !['admitted', 'closed'].includes(e.status)), test: e => !['admitted', 'closed'].includes(e.status) },
      ...ENQUIRY_STATUSES.map(s => ({ id: s.id, label: s.label, count: count(e => e.status === s.id), test: e => e.status === s.id })),
      { id: 'all', label: 'All', count: list.length, test: () => true },
    ];
  }, [items]);

  const visible = useMemo(() => {
    if (!items) return [];
    const q = query.trim().toLowerCase();
    const tab = tabs.find(t => t.id === status);
    return items
      .filter(tab.test)
      .filter(e => type === 'all' || e.type === type)
      .filter(e => !q || [e.parentName, e.phone, e.email, e.studentName, e.classApplying, e.message].join(' ').toLowerCase().includes(q));
  }, [items, tabs, status, type, query]);

  function exportCsv() {
    downloadCsv(
      `enquiries-${new Date().toISOString().slice(0, 10)}.csv`,
      ['Received', 'Type', 'Status', 'Parent', 'Phone', 'Email', 'Student', 'Class', 'Message', 'Notes'],
      visible.map(e => [fullDate(e.createdAt), e.type, statusLabel(e.status), e.parentName, e.phone, e.email, e.studentName, e.classApplying, e.message, (e.notes || []).map(n => `${fullDate(n.at)}: ${n.text}`).join(' | ')]),
    );
  }

  const open = items?.find(e => e.id === openId);
  const replace = updated => setItems(list => list.map(e => (e.id === updated.id ? updated : e)));

  const columns = [
    {
      key: 'createdAt', label: 'Received', sortValue: e => toDate(e.createdAt)?.getTime() || 0, className: 'md:w-36',
      render: e => <span className="text-sm text-slate-500" title={fullDate(e.createdAt)}>{timeAgo(e.createdAt)}</span>,
    },
    {
      key: 'parentName', label: 'Parent',
      render: e => (
        <div className="min-w-0">
          <p className="font-semibold text-slate-900 dark:text-white">{e.parentName}</p>
          <p className="truncate text-sm text-slate-500">{[e.phone, e.email].filter(Boolean).join(' · ')}</p>
        </div>
      ),
    },
    {
      key: 'studentName', label: 'Student', hideOnMobile: true,
      render: e => <span className="text-sm text-slate-700 dark:text-slate-300">{[e.studentName, e.classApplying].filter(Boolean).join(', ') || '—'}</span>,
    },
    { key: 'type', label: 'Type', hideOnMobile: true, render: e => <Badge tone={e.type === 'admission' ? 'blue' : 'gray'}>{e.type === 'admission' ? 'Admission' : 'General'}</Badge> },
    { key: 'status', label: 'Status', sortValue: e => ENQUIRY_STATUSES.findIndex(s => s.id === e.status), render: e => <Badge tone={STATUS_TONES[e.status]}>{statusLabel(e.status)}</Badge> },
  ];

  return (
    <>
      <PageHeader
        title="Enquiries"
        icon="inbox"
        description="Messages and admission enquiries sent from the website’s contact form. Call back, record what happened and track each family to admission."
        actions={items && (
          <>
            <Button variant="secondary" icon="refresh" onClick={load}>Refresh</Button>
            <Button variant="secondary" icon="download" onClick={exportCsv} disabled={!visible.length}>Export CSV</Button>
          </>
        )}
      />

      {error && <ErrorBox onRetry={load}>{error}</ErrorBox>}
      {!items && !error && <div className="grid gap-2" aria-busy="true">{[0, 1, 2, 3].map(i => <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />)}</div>}

      {items && (
        <>
          <Tabs className="mb-4" value={status} onChange={setStatus} tabs={tabs} />
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <SearchInput value={query} onChange={setQuery} placeholder="Search name, phone, class…" className="w-full sm:w-80" />
            <div className="ml-auto">
              <Segmented label="Enquiry type" value={type} onChange={setType} options={[{ value: 'all', label: 'All' }, { value: 'admission', label: 'Admission' }, { value: 'general', label: 'General' }]} />
            </div>
          </div>
          <DataTable
            columns={columns}
            rows={visible}
            onRowClick={e => setOpenId(e.id)}
            empty={(
              <EmptyState icon="inbox" title={items.length ? 'No enquiries here' : 'No enquiries yet'}>
                {items.length ? 'Try another tab or clear the search.' : 'When a parent sends the contact form on the website, it will appear here.'}
              </EmptyState>
            )}
          />
          {items.length >= 500 && <Notice tone="amber" className="mt-4">Showing the latest 500 enquiries. Delete or export older ones to keep the list fast.</Notice>}
        </>
      )}

      {open && (
        <EnquiryDrawer
          key={open.id}
          enquiry={open}
          onClose={() => setOpenId(null)}
          onChanged={replace}
          onDeleted={id => { setItems(list => list.filter(e => e.id !== id)); setOpenId(null); }}
        />
      )}
    </>
  );
}
