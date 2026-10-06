import Icon from '../../components/Icon';
import { Button, Card, ErrorBox, ImageField, Loading, PageHeader, SaveBar, TextArea, TextInput, useConfirm } from '../ui';
import { useSettingsForm } from '../useSettingsForm';

const EMPTY = { content: '', leadership: [], highlights: [] };
const slug = text => String(text || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `item-${Date.now()}`;

export default function AboutEditor() {
  const form = useSettingsForm('about', EMPTY);
  const confirm = useConfirm();
  const values = form.values;

  const updateList = (key, index, patch) =>
    form.setField(key, values[key].map((item, i) => (i === index ? { ...item, ...patch } : item)));

  async function removeFrom(key, index, what) {
    if (await confirm({ title: `Remove this ${what}?`, message: 'It will be removed from the website when you save.', confirmLabel: 'Remove', danger: true })) {
      form.setField(key, values[key].filter((_, i) => i !== index));
    }
  }

  // Leadership ids are used as stable keys; give new entries one based on their position
  const prepare = v => ({
    ...v,
    content: v.content.trim(),
    leadership: v.leadership.map(l => ({ ...l, id: l.id || slug(l.position || l.name) })),
    highlights: v.highlights.map(h => ({ ...h, id: h.id || slug(h.title) })),
  });

  return (
    <>
      <PageHeader title="About section" description="The introduction, leadership profiles and highlight cards on the homepage." />
      {form.status === 'loading' && <Loading />}
      {form.status === 'error' && <ErrorBox onRetry={form.reload}>{form.error}</ErrorBox>}
      {form.status === 'ready' && (
        <div className="grid gap-6">
          <Card title="Introduction">
            <TextArea label="About the school" rows={5} value={values.content} onChange={e => form.setField('content', e.target.value)} />
          </Card>

          <Card
            title="Leadership"
            description="Manager, principal and other leaders."
            actions={<Button variant="secondary" size="sm" icon="sparkles" onClick={() => form.setField('leadership', [...values.leadership, { id: '', name: '', position: '', description: '', image: '' }])}>Add person</Button>}
          >
            <div className="grid gap-6 lg:grid-cols-2">
              {values.leadership.map((leader, index) => (
                <div key={leader.id || index} className="grid gap-4 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                  <ImageField label="Photo" preset="photo" value={leader.image} onChange={image => updateList('leadership', index, { image })} />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <TextInput label="Name" value={leader.name} onChange={e => updateList('leadership', index, { name: e.target.value })} />
                    <TextInput label="Position" value={leader.position} placeholder="e.g. Principal" onChange={e => updateList('leadership', index, { position: e.target.value })} />
                  </div>
                  <TextArea label="Short description" rows={2} value={leader.description} onChange={e => updateList('leadership', index, { description: e.target.value })} />
                  <Button variant="dangerGhost" size="sm" className="justify-self-start" onClick={() => removeFrom('leadership', index, 'person')}>Remove person</Button>
                </div>
              ))}
            </div>
          </Card>

          <Card
            title="Highlights"
            description="The cards under the leadership profiles, also shown in the homepage banner."
            actions={<Button variant="secondary" size="sm" icon="sparkles" onClick={() => form.setField('highlights', [...values.highlights, { id: '', icon: '⭐', title: '', description: '' }])}>Add highlight</Button>}
          >
            <div className="grid gap-4 lg:grid-cols-2">
              {values.highlights.map((item, index) => (
                <div key={item.id || index} className="grid gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                  <div className="grid grid-cols-[5rem_1fr] gap-3">
                    <TextInput label="Icon" hint="An emoji" value={item.icon} maxLength={4} onChange={e => updateList('highlights', index, { icon: e.target.value })} />
                    <TextInput label="Title" value={item.title} onChange={e => updateList('highlights', index, { title: e.target.value })} />
                  </div>
                  <TextArea label="Description" rows={2} value={item.description} onChange={e => updateList('highlights', index, { description: e.target.value })} />
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" disabled={index === 0} onClick={() => {
                      const next = [...values.highlights];
                      [next[index - 1], next[index]] = [next[index], next[index - 1]];
                      form.setField('highlights', next);
                    }}><Icon name="chevronLeft" className="size-4" /> Earlier</Button>
                    <Button variant="dangerGhost" size="sm" className="ml-auto" onClick={() => removeFrom('highlights', index, 'highlight')}>Remove</Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
      <SaveBar dirty={form.dirty} saving={form.saving} onDiscard={form.discard} onSave={() => form.save(prepare)} />
    </>
  );
}
