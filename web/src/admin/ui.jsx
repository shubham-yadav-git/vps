import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from 'react';
import Dialog from '../components/Dialog';
import Icon from '../components/Icon';
import { compressImage, formatBytes } from './images';
import { safeUrl } from '../lib/normalize';

// ---------- Buttons ----------

const BUTTON = {
  primary: 'bg-brand-600 text-white shadow-sm hover:bg-brand-700 disabled:bg-brand-400',
  secondary: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800',
  danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-400',
  ghost: 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
  dangerGhost: 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10',
};

export function Button({ variant = 'primary', size = 'md', loading = false, icon, children, className = '', ...props }) {
  const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2.5 text-sm', icon: 'p-2' };
  return (
    <button
      type="button"
      disabled={loading || props.disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${BUTTON[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading ? <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : icon && <Icon name={icon} className="size-4" />}
      {children}
    </button>
  );
}

// ---------- Form fields ----------

const inputClass =
  'w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/25 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white';

export function Field({ label, hint, error, children, className = '' }) {
  const id = useId();
  return (
    <div className={className}>
      {label && <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>}
      {typeof children === 'function' ? children(id) : children}
      {error ? <p className="mt-1.5 text-sm text-red-600">{error}</p> : hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export function TextInput({ label, hint, error, className, ...props }) {
  return <Field label={label} hint={hint} error={error} className={className}>{id => <input id={id} className={inputClass} {...props} value={props.value ?? ''} />}</Field>;
}

export function TextArea({ label, hint, error, className, rows = 4, ...props }) {
  return <Field label={label} hint={hint} error={error} className={className}>{id => <textarea id={id} rows={rows} className={inputClass} {...props} value={props.value ?? ''} />}</Field>;
}

export function Select({ label, hint, className, options, ...props }) {
  return (
    <Field label={label} hint={hint} className={className}>
      {id => (
        <select id={id} className={inputClass} {...props}>
          {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      )}
    </Field>
  );
}

// ---------- Layout ----------

export function PageHeader({ title, description, actions }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, description, actions, children, className = '' }) {
  return (
    <section className={`rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800 ${className}`}>
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div>
            {title && <h2 className="font-semibold text-slate-900 dark:text-white">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Loading({ label = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-slate-500" role="status">
      <span className="size-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" /> {label}
    </div>
  );
}

export function EmptyState({ title, children }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center dark:border-slate-700">
      <p className="font-semibold text-slate-700 dark:text-slate-300">{title}</p>
      {children && <div className="mt-2 text-sm text-slate-500">{children}</div>}
    </div>
  );
}

export function ErrorBox({ children, onRetry }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
      {children}
      {onRetry && <Button variant="secondary" size="sm" className="ml-3" onClick={onRetry}>Try again</Button>}
    </div>
  );
}

/** Sticky save bar shown while a form has unsaved changes. */
export function SaveBar({ dirty, saving, onSave, onDiscard, disabled = false, label = 'Save changes' }) {
  return (
    <div className={`sticky bottom-0 z-10 -mx-4 mt-6 flex items-center justify-end gap-3 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 dark:border-slate-800 dark:bg-slate-950/95 ${dirty ? '' : 'hidden'}`}>
      <span className="mr-auto text-sm text-amber-700 dark:text-amber-400">You have unsaved changes</span>
      {onDiscard && <Button variant="ghost" onClick={onDiscard} disabled={saving}>Discard</Button>}
      <Button onClick={onSave} loading={saving} disabled={disabled} icon="check">{label}</Button>
    </div>
  );
}

// ---------- Image picker ----------

export function ImageField({ label, value, onChange, preset = 'photo', hint, previewClass = 'h-32 w-32 object-cover' }) {
  const inputRef = useRef(null);
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const src = safeUrl(value);

  async function handleFile(file) {
    if (!file) return;
    setBusy(true);
    try {
      const result = await compressImage(file, preset);
      onChange(result.dataUrl);
      toast.success(`Image ready (${formatBytes(result.bytes)}). Remember to save.`);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <Field label={label} hint={hint}>
      <div className="flex flex-wrap items-center gap-4">
        <div className="grid place-items-center overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
          {src ? <img src={src} alt="" className={previewClass} /> : <span className={`grid place-items-center text-xs text-slate-400 ${previewClass}`}>No image</span>}
        </div>
        <div className="flex flex-col gap-2">
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => handleFile(e.target.files[0])} />
          <Button variant="secondary" size="sm" icon="download" loading={busy} onClick={() => inputRef.current?.click()}>
            {src ? 'Replace image' : 'Upload image'}
          </Button>
          {src && <Button variant="dangerGhost" size="sm" onClick={() => onChange('')}>Remove</Button>}
        </div>
      </div>
    </Field>
  );
}

// ---------- Toasts ----------

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((kind, message) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(list => [...list, { id, kind, message }]);
    setTimeout(() => setToasts(list => list.filter(t => t.id !== id)), kind === 'error' ? 7000 : 3500);
  }, []);
  const api = useRef({ success: m => push('success', m), error: m => push('error', m) });
  api.current.success = m => push('success', m);
  api.current.error = m => push('error', m);

  return (
    <ToastContext.Provider value={api.current}>
      {children}
      <div className="pointer-events-none fixed top-20 right-4 z-50 flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2" aria-live="polite">
        {toasts.map(t => (
          <div key={t.id} role={t.kind === 'error' ? 'alert' : 'status'} className={`pointer-events-auto flex items-start gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg ${t.kind === 'error' ? 'bg-red-600' : 'bg-slate-900 dark:bg-slate-700'}`}>
            <Icon name={t.kind === 'error' ? 'x' : 'check'} className="mt-0.5 size-4 shrink-0" />
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

// ---------- Confirm dialog ----------

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [request, setRequest] = useState(null);
  const confirm = useCallback(options => new Promise(resolve => setRequest({ ...options, resolve })), []);
  const close = result => { request?.resolve(result); setRequest(null); };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog open={Boolean(request)} onClose={() => close(false)} label={request?.title || 'Confirm'} className="!w-[min(28rem,calc(100vw-2rem))]">
        {request && (
          <div className="p-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{request.title}</h2>
            {request.message && <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{request.message}</p>}
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => close(false)}>Cancel</Button>
              <Button variant={request.danger ? 'danger' : 'primary'} onClick={() => close(true)}>{request.confirmLabel || 'Confirm'}</Button>
            </div>
          </div>
        )}
      </Dialog>
    </ConfirmContext.Provider>
  );
}

export const useConfirm = () => useContext(ConfirmContext);

// ---------- Unsaved changes ----------

const DirtyContext = createContext(null);

/** Tracks unsaved forms so navigation and tab close can warn first. */
export function DirtyProvider({ children }) {
  const dirtyRef = useRef(new Set());
  const api = useRef({
    set(key, dirty) { if (dirty) dirtyRef.current.add(key); else dirtyRef.current.delete(key); },
    any() { return dirtyRef.current.size > 0; },
    clear() { dirtyRef.current.clear(); },
  });

  useEffect(() => {
    const onBeforeUnload = e => { if (api.current.any()) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  return <DirtyContext.Provider value={api.current}>{children}</DirtyContext.Provider>;
}

export function useDirtyTracker() {
  return useContext(DirtyContext);
}

export function useUnsavedChanges(key, dirty) {
  const tracker = useContext(DirtyContext);
  useEffect(() => {
    tracker.set(key, dirty);
    return () => tracker.set(key, false);
  }, [tracker, key, dirty]);
}
