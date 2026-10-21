import { useState } from 'react';
import FileViewer from './FileViewer';
import Icon from './Icon';
import Section from './Section';
import { useSiteContent } from '../lib/SiteContent';
import { DOWNLOAD_CATEGORIES } from '../lib/schoolData';
import { formatDate, safeUrl } from '../lib/normalize';

const formatSize = bytes => (!bytes ? '' : bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

const categoryOf = item => (DOWNLOAD_CATEGORIES.some(c => c.id === item.category) ? item.category : 'other');
const fileType = item => (item.fileName?.includes('.') ? item.fileName.split('.').pop().toUpperCase() : 'File');

export function downloadItems(items) {
  return (Array.isArray(items) ? items : [])
    .filter(item => item.title && (item.hasFile || safeUrl(item.url)))
    .map((item, index) => ({ ...item, order: Number(item.order ?? index) }))
    .sort((a, b) => a.order - b.order);
}

export default function Downloads() {
  const { content } = useSiteContent();
  const items = downloadItems(content.downloads);
  const [file, setFile] = useState(null);
  const [loadingId, setLoadingId] = useState(null);
  const [failedId, setFailedId] = useState(null);
  if (!items.length) return null;

  const groups = DOWNLOAD_CATEGORIES
    .map(category => ({ ...category, items: items.filter(i => categoryOf(i) === category.id) }))
    .filter(group => group.items.length);

  async function open(item) {
    setLoadingId(item.id);
    setFailedId(null);
    try {
      const { fetchDownloadFile } = await import('../lib/content');
      const data = await fetchDownloadFile(item.id);
      if (!data) throw new Error('missing');
      setFile({ url: data, title: item.title });
    } catch {
      setFailedId(item.id);
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <Section id="downloads" tone="muted" eyebrow="Downloads" title="Forms & documents" intro="Fee structure, syllabus, book lists, forms and circulars for parents.">
      <div className="mx-auto grid max-w-4xl gap-10">
        {groups.map(group => (
          <div key={group.id}>
            <h3 className="mb-3 text-sm font-semibold tracking-widest text-slate-500 uppercase dark:text-slate-400">{group.label}</h3>
            <ul className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
              {group.items.map(item => {
                const link = !item.hasFile && safeUrl(item.url);
                const meta = [item.hasFile ? fileType(item) : 'Link', formatSize(item.size), item.updatedAt && `Updated ${formatDate(item.updatedAt, 'short')}`].filter(Boolean).join(' · ');
                return (
                  <li key={item.id} className="flex flex-wrap items-center gap-4 p-4 sm:flex-nowrap sm:px-5">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"><Icon name="file" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900 dark:text-white">{item.title}</p>
                      {item.description && <p className="text-sm text-slate-600 dark:text-slate-400">{item.description}</p>}
                      <p className="mt-0.5 text-xs text-slate-500">{meta}</p>
                      {failedId === item.id && <p className="mt-1 text-sm text-red-600">This file couldn’t be opened. Please try again, or contact the school office.</p>}
                    </div>
                    {link ? (
                      <a href={link} target="_blank" rel="noopener" className="inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-400 hover:text-brand-700 dark:border-slate-700 dark:text-slate-200">
                        Open <Icon name="external" className="size-4" />
                      </a>
                    ) : (
                      <button type="button" onClick={() => open(item)} disabled={loadingId === item.id} className="inline-flex shrink-0 items-center gap-2 rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-70">
                        {loadingId === item.id ? <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <Icon name="eye" className="size-4" />} View
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
      <FileViewer file={file} onClose={() => setFile(null)} />
    </Section>
  );
}
