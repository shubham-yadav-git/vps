import { useCallback, useEffect, useMemo, useState } from 'react';
import Icon from '../../components/Icon';
import { friendlyError, listFaq, saveFaq } from '../api';
import { Button, EmptyState, ErrorBox, Loading, PageHeader, SaveBar, TextArea, TextInput, useConfirm, useToast, useUnsavedChanges } from '../ui';

const strip = list => list.map(({ id, question, answer }) => ({ id, question, answer }));

export default function FaqEditor() {
  const toast = useToast();
  const confirm = useConfirm();
  const [saved, setSaved] = useState(null);
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      const list = strip(await listFaq());
      setSaved(list);
      setItems(list);
    } catch (err) {
      setError(friendlyError(err));
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const dirty = useMemo(() => items && JSON.stringify(items) !== JSON.stringify(saved), [items, saved]);
  useUnsavedChanges('faq', Boolean(dirty));
  const invalid = items?.some(item => !item.question.trim() || !item.answer.trim());

  const update = (index, patch) => setItems(list => list.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  const move = (index, delta) => setItems(list => {
    const next = [...list];
    [next[index], next[index + delta]] = [next[index + delta], next[index]];
    return next;
  });

  async function remove(index) {
    if (!(await confirm({ title: 'Remove this question?', message: 'It will be deleted from the website when you save.', confirmLabel: 'Remove', danger: true }))) return;
    setItems(list => list.filter((_, i) => i !== index));
  }

  async function save() {
    setSaving(true);
    try {
      const list = strip(await saveFaq(items));
      setSaved(list);
      setItems(list);
      toast.success('FAQ saved.');
    } catch (err) {
      toast.error(friendlyError(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title="FAQ"
        description="Questions and answers in the FAQ section, in the order shown here."
        actions={items && <Button icon="sparkles" onClick={() => setItems(list => [...list, { id: '', question: '', answer: '' }])}>Add question</Button>}
      />
      {error && <ErrorBox onRetry={load}>{error}</ErrorBox>}
      {!items && !error && <Loading />}
      {items && !items.length && <EmptyState title="No questions yet">Use "Add question" to create one.</EmptyState>}
      {items && items.length > 0 && (
        <ol className="grid gap-4">
          {items.map((item, index) => (
            <li key={item.id || `new-${index}`} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
              <div className="mb-3 flex items-center gap-2">
                <span className="grid size-7 place-items-center rounded-full bg-brand-100 text-sm font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">{index + 1}</span>
                <div className="ml-auto flex gap-1">
                  <Button variant="ghost" size="icon" aria-label="Move up" disabled={index === 0} onClick={() => move(index, -1)}><Icon name="arrowUp" className="size-4" /></Button>
                  <Button variant="ghost" size="icon" aria-label="Move down" disabled={index === items.length - 1} onClick={() => move(index, 1)}><Icon name="arrowUp" className="size-4 rotate-180" /></Button>
                  <Button variant="dangerGhost" size="icon" aria-label="Remove question" onClick={() => remove(index)}><Icon name="x" className="size-4" /></Button>
                </div>
              </div>
              <div className="grid gap-3">
                <TextInput label="Question" value={item.question} error={!item.question.trim() && dirty ? 'Required' : ''} onChange={e => update(index, { question: e.target.value })} />
                <TextArea label="Answer" rows={3} value={item.answer} error={!item.answer.trim() && dirty ? 'Required' : ''} onChange={e => update(index, { answer: e.target.value })} />
              </div>
            </li>
          ))}
        </ol>
      )}
      <SaveBar dirty={dirty} saving={saving} disabled={invalid} label={invalid ? 'Fill in every question and answer' : 'Save FAQ'} onDiscard={() => setItems(saved)} onSave={save} />
    </>
  );
}
