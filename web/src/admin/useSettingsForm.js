import { useCallback, useEffect, useMemo, useState } from 'react';
import { friendlyError, getSettings, saveSettings } from './api';
import { useToast, useUnsavedChanges } from './ui';

/** Loads settings/{name}, tracks edits and saves explicitly. */
export function useSettingsForm(name, emptyValues) {
  const toast = useToast();
  const [saved, setSaved] = useState(null);
  const [values, setValues] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const data = { ...emptyValues, ...(await getSettings(name)) };
      setSaved(data);
      setValues(data);
      setStatus('ready');
    } catch (err) {
      setError(friendlyError(err));
      setStatus('error');
    }
    // emptyValues is a static object per page
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  useEffect(() => { load(); }, [load]);

  const dirty = useMemo(() => status === 'ready' && JSON.stringify(values) !== JSON.stringify(saved), [values, saved, status]);
  useUnsavedChanges(`settings:${name}`, dirty);

  const setField = useCallback((field, value) => setValues(v => ({ ...v, [field]: value })), []);

  async function save(transform = v => v) {
    setSaving(true);
    try {
      const data = transform(values);
      await saveSettings(name, data);
      setSaved(data);
      setValues(data);
      toast.success('Saved. The website will show the changes on the next visit.');
    } catch (err) {
      toast.error(friendlyError(err));
    } finally {
      setSaving(false);
    }
  }

  return { values, setValues, setField, status, error, reload: load, dirty, saving, save, discard: () => setValues(saved) };
}
