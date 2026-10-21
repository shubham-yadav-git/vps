import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from 'react';
import Dialog from '../components/Dialog';
import Icon from '../components/Icon';
import { compressImage, formatBytes, readDocumentFile } from './images';
import { safeUrl } from '../lib/normalize';

// ---------- Buttons ----------

const BUTTON = {
  primary: 'bg-brand-600 text-white shadow-sm hover:bg-brand-700 disabled:bg-brand-400',
  secondary: 'border border-slate-300 bg-white text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800',
  danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-400',
  ghost: 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
  dangerGhost: 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10',
};

export function Button({ variant = 'primary', size = 'md', loading = false, icon, children, className = '', ...props }) {
  const sizes = { sm: 'h-8 px-3 text-sm', md: 'h-10 px-4 text-sm', icon: 'size-9' };
  return (
    <button
      type="button"
      disabled={loading || props.disabled}
      className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-lg font-semibold whitespace-nowrap transition disabled:cursor-not-allowed disabled:opacity-60 ${BUTTON[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading ? <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : icon && <Icon name={icon} className="size-4" />}
      {children}
    </button>
  );
}

// ---------- Form fields ----------

export const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:disabled:bg-slate-900';

export function Field({ label, hint, error, counter, children, className = '' }) {
  const id = useId();
  return (
    <div className={className}>
      {label && (
        <div className="mb-1.5 flex items-baseline justify-between gap-3">
          <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
          {counter}
        </div>
      )}
      {typeof children === 'function' ? children(id) : children}
      {error ? <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{error}</p> : hint && <p className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{hint}</p>}
    </div>
  );
}

/** "42 / 60" that turns amber past the recommended length. */
function Counter({ value, max }) {
  const length = String(value || '').length;
  return <span className={`text-xs tabular-nums ${length > max ? 'text-amber-600' : 'text-slate-400'}`}>{length} / {max}</span>;
}

export function TextInput({ label, hint, error, className, recommendedMax, ...props }) {
  return (
    <Field label={label} hint={hint} error={error} className={className} counter={recommendedMax && <Counter value={props.value} max={recommendedMax} />}>
      {id => <input id={id} className={inputClass} aria-invalid={Boolean(error)} {...props} value={props.value ?? ''} />}
    </Field>
  );
}

export function TextArea({ label, hint, error, className, rows = 4, recommendedMax, ...props }) {
  return (
    <Field label={label} hint={hint} error={error} className={className} counter={recommendedMax && <Counter value={props.value} max={recommendedMax} />}>
      {id => <textarea id={id} rows={rows} className={inputClass} aria-invalid={Boolean(error)} {...props} value={props.value ?? ''} />}
    </Field>
  );
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

/** On/off switch with a label and optional description. */
export function Toggle({ label, description, checked, onChange, disabled }) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <label htmlFor={id} className="text-sm font-medium text-slate-800 dark:text-slate-200">{label}</label>
        {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition disabled:opacity-50 ${checked ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-700'}`}
      >
        <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${checked ? 'left-5.5' : 'left-0.5'}`} />
      </button>
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder = 'Search…', className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
      <input type="search" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} className={`${inputClass} pl-9`} />
    </div>
  );
}

// ---------- Layout ----------

export function PageHeader({ title, description, actions, icon }) {
  return (
    <div className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between dark:border-slate-800">
      <div className="flex min-w-0 items-start gap-3">
        {icon && (
          <span className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
            <Icon name={icon} className="size-5" />
          </span>
        )}
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{title}</h1>
          {description && <p className="mt-1 max-w-3xl text-sm text-slate-600 dark:text-slate-400">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, description, actions, children, className = '', padded = true }) {
  return (
    <section className={`min-w-0 rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 ${className}`}>
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-3.5 dark:border-slate-800">
          <div>
            {title && <h2 className="font-semibold text-slate-900 dark:text-white">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className={padded ? 'p-5' : ''}>{children}</div>
    </section>
  );
}

const BADGE_TONES = {
  gray: 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
  blue: 'bg-brand-50 text-brand-700 ring-brand-200 dark:bg-brand-500/15 dark:text-brand-300 dark:ring-brand-500/30',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/30',
  amber: 'bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/30',
  red: 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-500/30',
};

export function Badge({ tone = 'gray', children, className = '' }) {
  return <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset ${BADGE_TONES[tone]} ${className}`}>{children}</span>;
}

export function Tabs({ tabs, value, onChange, className = '' }) {
  return (
    <div role="tablist" className={`flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-800 ${className}`}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={value === tab.id}
          onClick={() => onChange(tab.id)}
          className={`-mb-px inline-flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition ${
            value === tab.id ? 'border-brand-600 text-brand-700 dark:border-brand-400 dark:text-brand-300' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={`rounded-full px-1.5 text-xs tabular-nums ${value === tab.id ? 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-200' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>{tab.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

/** Two-or-three-way switch, e.g. list / grid. */
export function Segmented({ options, value, onChange, label }) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-900">
      {options.map(option => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          title={option.label}
          onClick={() => onChange(option.value)}
          className={`inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium ${value === option.value ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
        >
          {option.icon && <Icon name={option.icon} className="size-4" />}
          {option.showLabel !== false && <span className={option.icon ? 'sr-only sm:not-sr-only' : ''}>{option.label}</span>}
        </button>
      ))}
    </div>
  );
}

export function StatCard({ label, value, icon, href, note, tone = 'blue' }) {
  const iconTone = {
    blue: 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300',
    green: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
    red: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300',
  }[tone];
  return (
    <a href={href} className="group flex min-w-0 items-start gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition hover:border-brand-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-brand-500/50">
      {icon && <span className={`grid size-10 shrink-0 place-items-center rounded-lg ${iconTone}`}><Icon name={icon} className="size-5" /></span>}
      <div className="min-w-0">
        <p className="truncate text-sm text-slate-500 dark:text-slate-400">{label}</p>
        <p className="mt-0.5 text-2xl font-bold text-slate-900 tabular-nums dark:text-white">{value ?? <span className="inline-block h-7 w-10 animate-pulse rounded bg-slate-200 align-middle dark:bg-slate-800" />}</p>
        {note && <p className="mt-0.5 truncate text-xs text-slate-500">{note}</p>}
      </div>
    </a>
  );
}

export function Loading({ label = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-slate-500" role="status">
      <span className="size-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" /> {label}
    </div>
  );
}

export function EmptyState({ title, icon = 'inbox', children, action }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-900">
      <span className="mx-auto grid size-12 place-items-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800"><Icon name={icon} className="size-6" /></span>
      <p className="mt-4 font-semibold text-slate-800 dark:text-slate-200">{title}</p>
      {children && <div className="mx-auto mt-1 max-w-sm text-sm text-slate-500">{children}</div>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorBox({ children, onRetry }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
      <Icon name="info" className="size-5 shrink-0" />
      <span className="flex-1">{children}</span>
      {onRetry && <Button variant="secondary" size="sm" onClick={onRetry}>Try again</Button>}
    </div>
  );
}

export function Notice({ tone = 'blue', children, className = '' }) {
  const tones = {
    blue: 'border-brand-200 bg-brand-50 text-brand-900 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-100',
    amber: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100',
  };
  return (
    <div className={`flex gap-3 rounded-xl border p-4 text-sm leading-relaxed ${tones[tone]} ${className}`}>
      <Icon name="info" className="mt-0.5 size-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

/** Sticky save bar shown while a form has unsaved changes. */
export function SaveBar({ dirty, saving, onSave, onDiscard, disabled = false, label = 'Save changes' }) {
  return (
    <div className={`sticky bottom-0 z-10 -mx-4 mt-6 flex items-center justify-end gap-3 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 dark:border-slate-800 dark:bg-slate-950/95 ${dirty ? '' : 'hidden'}`}>
      <span className="mr-auto flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-400"><span className="size-2 rounded-full bg-amber-500" /> Unsaved changes</span>
      {onDiscard && <Button variant="ghost" onClick={onDiscard} disabled={saving}>Discard</Button>}
      <Button onClick={onSave} loading={saving} disabled={disabled} icon="check">{label}</Button>
    </div>
  );
}

// ---------- Data table ----------

/**
 * columns: [{ key, label, render?(row), sortValue?(row), className?, hideOnMobile? }]
 * On small screens rows become stacked cards.
 */
export function DataTable({ columns, rows, rowKey = row => row.id, onRowClick, initialSort, empty }) {
  const [sort, setSort] = useState(initialSort || null);
  const sorted = useMemo(() => {
    if (!sort) return rows;
    const column = columns.find(c => c.key === sort.key);
    const value = column?.sortValue || (row => row[sort.key]);
    return [...rows].sort((a, b) => {
      const x = value(a) ?? ''; const y = value(b) ?? '';
      const result = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'en', { numeric: true });
      return sort.dir === 'asc' ? result : -result;
    });
  }, [rows, sort, columns]);

  if (!rows.length) return empty || null;

  const toggleSort = key => setSort(current => (current?.key === key ? { key, dir: current.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <table className="w-full text-left text-sm">
        <thead className="hidden border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500 md:table-header-group dark:border-slate-800 dark:bg-slate-900/60">
          <tr>
            {columns.map(column => (
              <th key={column.key} scope="col" className={`px-4 py-3 ${column.className || ''}`} aria-sort={sort?.key === column.key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}>
                {column.sortable === false ? column.label : (
                  <button type="button" onClick={() => toggleSort(column.key)} className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-white">
                    {column.label}
                    {sort?.key === column.key && <Icon name={sort.dir === 'asc' ? 'arrowUp' : 'arrowDown'} className="size-3" />}
                  </button>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
          {sorted.map(row => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              onKeyDown={onRowClick ? e => { if (e.key === 'Enter') onRowClick(row); } : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              className={`grid gap-1 px-4 py-3 md:table-row md:p-0 ${onRowClick ? 'cursor-pointer hover:bg-slate-50 focus-visible:bg-slate-50 dark:hover:bg-slate-800/50 dark:focus-visible:bg-slate-800/50' : ''}`}
            >
              {columns.map(column => (
                <td key={column.key} className={`md:px-4 md:py-3 md:align-middle ${column.hideOnMobile ? 'hidden md:table-cell' : ''} ${column.className || ''}`}>
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------- Drawer (side panel for editing) ----------

export function Drawer({ open, onClose, title, subtitle, children, footer, wide = false }) {
  return (
    <Dialog open={open} onClose={onClose} label={title} variant="drawer" className={wide ? '!max-w-2xl' : '!max-w-xl'}>
      <div className="flex h-full flex-col bg-white dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
          </div>
          <Button variant="ghost" size="icon" aria-label="Close" onClick={onClose}><Icon name="x" /></Button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 bg-slate-50 px-6 py-3.5 dark:border-slate-800 dark:bg-slate-900/80">{footer}</div>}
      </div>
    </Dialog>
  );
}

// ---------- Sortable list ----------

/** Drag a row by its handle, or use the arrow buttons (keyboard and touch friendly). */
export function SortableList({ items, keyOf = item => item.id, onReorder, renderItem, disabled = false }) {
  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);

  const move = (from, to) => {
    if (to < 0 || to >= items.length || from === to) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onReorder(next);
  };

  return (
    <ul className="grid gap-2">
      {items.map((item, index) => (
        <li
          key={keyOf(item)}
          draggable={!disabled}
          onDragStart={e => { setDragIndex(index); e.dataTransfer.effectAllowed = 'move'; }}
          onDragOver={e => { if (dragIndex !== null) { e.preventDefault(); setOverIndex(index); } }}
          onDragEnd={() => { setDragIndex(null); setOverIndex(null); }}
          onDrop={e => { e.preventDefault(); if (dragIndex !== null) move(dragIndex, index); setDragIndex(null); setOverIndex(null); }}
          className={`flex items-stretch gap-1 rounded-xl transition ${dragIndex === index ? 'opacity-40' : ''} ${overIndex === index && dragIndex !== index ? 'ring-2 ring-brand-400' : ''}`}
        >
          {!disabled && (
            <div className="flex flex-col items-center justify-center gap-0.5 text-slate-400">
              <button type="button" aria-label="Move up" disabled={index === 0} onClick={() => move(index, index - 1)} className="rounded p-0.5 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 dark:hover:bg-slate-800"><Icon name="arrowUp" className="size-3.5" /></button>
              <span className="cursor-grab active:cursor-grabbing" title="Drag to reorder"><Icon name="grip" className="size-4" /></span>
              <button type="button" aria-label="Move down" disabled={index === items.length - 1} onClick={() => move(index, index + 1)} className="rounded p-0.5 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 dark:hover:bg-slate-800"><Icon name="arrowDown" className="size-3.5" /></button>
            </div>
          )}
          <div className="min-w-0 flex-1">{renderItem(item, index)}</div>
        </li>
      ))}
    </ul>
  );
}

// ---------- Image and file pickers ----------

export function ImageField({ label, value, onChange, preset = 'photo', hint, previewClass = 'h-32 w-32 object-cover' }) {
  const inputRef = useRef(null);
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
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
      <div
        onDragOver={e => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={e => { e.preventDefault(); setOver(false); handleFile(e.dataTransfer.files[0]); }}
        className={`flex flex-wrap items-center gap-4 rounded-xl border border-dashed p-3 transition ${over ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10' : 'border-slate-300 dark:border-slate-700'}`}
      >
        <div className="grid place-items-center overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
          {src ? <img src={src} alt="" className={previewClass} /> : <span className={`grid place-items-center text-slate-400 ${previewClass}`}><Icon name="image" className="size-8" /></span>}
        </div>
        <div className="flex flex-col gap-2">
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => handleFile(e.target.files[0])} />
          <Button variant="secondary" size="sm" icon="image" loading={busy} onClick={() => inputRef.current?.click()}>
            {src ? 'Replace image' : 'Choose image'}
          </Button>
          {src && <Button variant="dangerGhost" size="sm" icon="trash" onClick={() => onChange('')}>Remove</Button>}
          <p className="text-xs text-slate-500">or drag and drop here</p>
        </div>
      </div>
    </Field>
  );
}

/**
 * A PDF or image stored with the item, or an external link instead.
 * value: { file: dataUrl|'' , fileName, size, url }
 */
export function FileField({ label, value, onChange, hint, maxBytes = 900 * 1024 }) {
  const inputRef = useRef(null);
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const hasFile = Boolean(value.file || value.hasFile);

  async function handleFile(file) {
    if (!file) return;
    setBusy(true);
    try {
      const data = file.type.startsWith('image/') ? (await compressImage(file, 'gallery')).dataUrl : await readDocumentFile(file, maxBytes);
      if (!/^data:(application\/pdf|image\/)/.test(data)) throw new Error('Please choose a PDF or an image.');
      onChange({ ...value, file: data, fileName: file.name, size: Math.round(data.length * 0.75), url: '' });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <Field label={label} hint={hint}>
      <div className="grid gap-3">
        <div
          onDragOver={e => { e.preventDefault(); setOver(true); }}
          onDragLeave={() => setOver(false)}
          onDrop={e => { e.preventDefault(); setOver(false); handleFile(e.dataTransfer.files[0]); }}
          className={`flex flex-wrap items-center gap-3 rounded-xl border border-dashed p-4 transition ${over ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10' : 'border-slate-300 dark:border-slate-700'}`}
        >
          <span className="grid size-10 place-items-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800"><Icon name="file" className="size-5" /></span>
          <div className="min-w-0 flex-1 text-sm">
            {hasFile ? (
              <>
                <p className="truncate font-medium text-slate-800 dark:text-slate-200">{value.fileName || 'Attached file'}</p>
                {value.size ? <p className="text-xs text-slate-500">{formatBytes(value.size)}</p> : null}
              </>
            ) : <p className="text-slate-500">Drop a PDF or image here (up to {formatBytes(maxBytes)})</p>}
          </div>
          <input ref={inputRef} type="file" accept="application/pdf,image/*" className="hidden" onChange={e => handleFile(e.target.files[0])} />
          <Button variant="secondary" size="sm" loading={busy} onClick={() => inputRef.current?.click()}>{hasFile ? 'Replace' : 'Choose file'}</Button>
          {hasFile && <Button variant="dangerGhost" size="sm" onClick={() => onChange({ ...value, file: '', hasFile: false, fileName: '', size: 0 })}>Remove</Button>}
        </div>
        {!hasFile && (
          <TextInput
            label="Or link to a file"
            type="url"
            placeholder="https://drive.google.com/…"
            hint="For larger files, upload them to Google Drive (set to “Anyone with the link”) and paste the link."
            value={value.url}
            onChange={e => onChange({ ...value, url: e.target.value })}
          />
        )}
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
      <div className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2" aria-live="polite">
        {toasts.map(t => (
          <div key={t.id} role={t.kind === 'error' ? 'alert' : 'status'} className="pointer-events-auto flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-lg dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
            <span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full ${t.kind === 'error' ? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-300' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300'}`}>
              <Icon name={t.kind === 'error' ? 'x' : 'check'} className="size-3.5" />
            </span>
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
            <div className="flex gap-4">
              <span className={`grid size-10 shrink-0 place-items-center rounded-full ${request.danger ? 'bg-red-100 text-red-600 dark:bg-red-500/20' : 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300'}`}>
                <Icon name={request.danger ? 'trash' : 'help'} className="size-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{request.title}</h2>
                {request.message && <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">{request.message}</p>}
              </div>
            </div>
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

// ---------- Small helpers ----------

/** "5 min ago", "Yesterday", "12 Oct" for Firestore timestamps, Dates or ISO strings. */
export function timeAgo(value) {
  const date = value?.toDate ? value.toDate() : value instanceof Date ? value : new Date(value);
  if (!date || isNaN(date)) return '';
  const seconds = (Date.now() - date.getTime()) / 1000;
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} h ago`;
  if (seconds < 172800) return 'Yesterday';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: date.getFullYear() === new Date().getFullYear() ? undefined : 'numeric' });
}

export function toDate(value) {
  const date = value?.toDate ? value.toDate() : value ? new Date(value) : null;
  return date && !isNaN(date) ? date : null;
}

/** Downloads rows as a CSV file Excel opens correctly (UTF-8 with BOM). */
export function downloadCsv(filename, header, rows) {
  const escape = value => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const csv = [header, ...rows].map(row => row.map(escape).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  a.click();
  URL.revokeObjectURL(url);
}
