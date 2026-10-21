import { useCallback, useEffect, useState } from 'react';
import Icon from '../../components/Icon';
import { deleteStaff, friendlyError, listStaff, saveStaff } from '../api';
import { OWNER_EMAILS, emailKey } from '../auth';
import { Badge, Button, Card, DataTable, Drawer, ErrorBox, Notice, PageHeader, Select, TextInput, Toggle, useConfirm, useToast } from '../ui';

const ROLE_OPTIONS = [
  { value: 'editor', label: 'Editor: website content and enquiries' },
  { value: 'admin', label: 'Administrator: everything, including staff and settings' },
];

function StaffDrawer({ member, isNew, onClose, onSaved, onDeleted }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [form, setForm] = useState({ name: member.name || '', email: member.email || '', role: member.role || 'editor', active: member.active !== false });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState('');
  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));

  async function save() {
    const email = emailKey(form.email);
    const found = {};
    if (!form.name.trim()) found.name = 'Enter their name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) found.email = 'Enter a valid email address.';
    else if (OWNER_EMAILS.includes(email)) found.email = 'This is the owner account, which always has full access.';
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy('save');
    try {
      await saveStaff(email, form, isNew);
      onSaved({ ...member, ...form, email }, isNew);
      toast.success(isNew ? `Added ${form.name.trim()}.` : 'Changes saved.');
    } catch (error) {
      toast.error(friendlyError(error));
    } finally {
      setBusy('');
    }
  }

  async function remove() {
    if (!(await confirm({ title: `Remove ${member.name}?`, message: 'They will lose access to the admin panel immediately. Their past activity stays in the log.', confirmLabel: 'Remove', danger: true }))) return;
    setBusy('delete');
    try {
      await deleteStaff(member);
      onDeleted(member.email);
      toast.success('Removed.');
    } catch (error) {
      toast.error(friendlyError(error));
      setBusy('');
    }
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title={isNew ? 'Add staff member' : member.name}
      subtitle={isNew ? 'They set their own password the first time they sign in.' : member.email}
      footer={(
        <>
          {!isNew && <Button variant="dangerGhost" icon="trash" onClick={remove} loading={busy === 'delete'}>Remove access</Button>}
          <Button variant="secondary" className="ml-auto" onClick={onClose}>Cancel</Button>
          <Button icon="check" onClick={save} loading={busy === 'save'}>{isNew ? 'Add staff member' : 'Save changes'}</Button>
        </>
      )}
    >
      <div className="grid gap-5">
        <TextInput label="Full name *" value={form.name} error={errors.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Sunita Verma" />
        <TextInput label="Email *" type="email" value={form.email} error={errors.email} disabled={!isNew} onChange={e => set('email', e.target.value)} placeholder="name@gmail.com" hint={isNew ? 'They must be able to open emails sent to this address.' : 'To change the email, remove this person and add them again.'} />
        <Select label="Role" value={form.role} options={ROLE_OPTIONS} onChange={e => set('role', e.target.value)} />
        <Toggle label="Can sign in" description="Switch off to suspend access without deleting the account." checked={form.active} onChange={v => set('active', v)} />
        {isNew && (
          <Notice>
            After saving, ask them to open <strong>{window.location.origin}/admin.html</strong>, choose <strong>“First time here? Set your password”</strong>,
            and use this email. They’ll get an email to confirm the address, then they can sign in.
          </Notice>
        )}
      </div>
    </Drawer>
  );
}

export default function Staff({ currentEmail }) {
  const [staff, setStaff] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    setError('');
    try { setStaff(await listStaff()); } catch (err) { setError(friendlyError(err)); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const rows = staff ? [
    ...OWNER_EMAILS.map(email => ({ email, name: 'School admin (owner)', role: 'admin', active: true, owner: true })),
    ...[...staff].sort((a, b) => String(a.name).localeCompare(String(b.name))),
  ] : [];

  const columns = [
    {
      key: 'name', label: 'Name',
      render: m => (
        <div className="flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-50 text-xs font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
            {String(m.name || m.email).split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase()).join('')}
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 dark:text-white">{m.name}{m.email === currentEmail && <span className="ml-2 text-xs font-normal text-slate-500">(you)</span>}</p>
            <p className="truncate text-sm text-slate-500">{m.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'role', label: 'Role', render: m => <Badge tone={m.role === 'admin' ? 'blue' : 'gray'}>{m.owner ? 'Owner' : m.role === 'admin' ? 'Administrator' : 'Editor'}</Badge> },
    { key: 'active', label: 'Access', render: m => (m.active ? <Badge tone="green">Active</Badge> : <Badge tone="gray">Suspended</Badge>) },
    { key: 'actions', label: '', sortable: false, className: 'md:text-right', render: m => (m.owner || m.email === currentEmail ? null : <span className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 dark:text-brand-400">Manage <Icon name="chevronRight" className="size-4" /></span>) },
  ];

  return (
    <>
      <PageHeader
        title="Staff accounts"
        icon="users"
        description="Give teachers and office staff their own sign-in instead of sharing one password. Everyone’s changes are recorded in the activity log."
        actions={<Button icon="plus" onClick={() => setEditing({ isNew: true, member: {} })}>Add staff member</Button>}
      />
      {error && <ErrorBox onRetry={load}>{error}</ErrorBox>}
      {!staff && !error && <div className="h-40 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />}
      {staff && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <DataTable
              columns={columns}
              rows={rows}
              rowKey={m => m.email}
              onRowClick={m => { if (!m.owner && m.email !== currentEmail) setEditing({ isNew: false, member: m }); }}
            />
          </div>
          <Card title="Roles">
            <dl className="grid gap-4 text-sm">
              <div>
                <dt className="font-semibold text-slate-900 dark:text-white">Editor</dt>
                <dd className="mt-1 text-slate-600 dark:text-slate-400">Notices, calendar, popup, achievements, gallery, downloads, homepage text, faculty, testimonials, FAQ and enquiries.</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-900 dark:text-white">Administrator</dt>
                <dd className="mt-1 text-slate-600 dark:text-slate-400">Everything editors can do, plus the mandatory disclosure, contact details, logo, site & SEO settings, staff accounts and the activity log.</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-900 dark:text-white">Owner</dt>
                <dd className="mt-1 text-slate-600 dark:text-slate-400">The school’s main account. Always an administrator and can’t be removed, so the school can never be locked out.</dd>
              </div>
            </dl>
          </Card>
        </div>
      )}

      {editing && (
        <StaffDrawer
          key={editing.member.email || 'new'}
          member={editing.member}
          isNew={editing.isNew}
          onClose={() => setEditing(null)}
          onSaved={(member, isNew) => {
            setStaff(list => (isNew ? [...list.filter(m => m.email !== member.email), member] : list.map(m => (m.email === member.email ? member : m))));
            setEditing(null);
          }}
          onDeleted={email => { setStaff(list => list.filter(m => m.email !== email)); setEditing(null); }}
        />
      )}
    </>
  );
}
