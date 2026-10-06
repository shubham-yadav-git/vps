import { useEffect, useState } from 'react';
import BackToTop from '../components/BackToTop';
import FileViewer from '../components/FileViewer';
import Footer from '../components/Footer';
import Header from '../components/Header';
import Icon from '../components/Icon';
import NoticeDrawer from '../components/NoticeDrawer';
import { safeUrl } from '../lib/normalize';
import { SiteContentProvider } from '../lib/SiteContent';

/** Rows are stored either as arrays (field order) or objects keyed by field label. */
function normaliseSection(section) {
  const fields = (Array.isArray(section.fields) ? section.fields : []).map(f => ({ label: String(f.label || ''), type: f.type }));
  const rows = (Array.isArray(section.rows) ? section.rows : []).map(row =>
    fields.map((field, index) => {
      const value = Array.isArray(row) ? row[index] : row?.[field.label];
      return value === null || value === undefined ? '' : String(value);
    })
  );
  return { id: String(section.id || section.label), label: String(section.label || ''), fields, rows };
}

function Cell({ value, field, rowLabel, onOpenFile }) {
  const url = /^(data:|https?:\/\/)/i.test(value) ? safeUrl(value) : '';
  if (!url) return value || <span className="text-slate-400">—</span>;

  if (url.startsWith('data:')) {
    const isPdf = /^data:application\/pdf/i.test(url);
    return (
      <button
        type="button"
        onClick={() => onOpenFile({ url, title: rowLabel || field.label || 'Document' })}
        className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-700 hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-300"
      >
        <Icon name="file" className="size-4" /> View {isPdf ? 'PDF' : 'file'}
      </button>
    );
  }
  return (
    <a href={url} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 font-semibold text-brand-600 hover:text-brand-800 dark:text-brand-400">
      Open link <Icon name="external" className="size-3.5" />
    </a>
  );
}

function DisclosureTables({ onOpenFile }) {
  const [state, setState] = useState({ status: 'loading', sections: [] });

  useEffect(() => {
    import('../lib/content')
      .then(({ fetchDisclosureSections }) => fetchDisclosureSections())
      .then(sections => setState({
        status: 'ready',
        sections: sections.filter(s => s.enabled !== false).map(normaliseSection).filter(s => s.fields.length),
      }))
      .catch(() => setState({ status: 'error', sections: [] }));
  }, []);

  if (state.status === 'loading') {
    return (
      <div className="space-y-6" aria-busy="true">
        {[0, 1, 2].map(i => <div key={i} className="h-48 animate-pulse rounded-3xl bg-slate-200 dark:bg-slate-800" />)}
      </div>
    );
  }
  if (state.status === 'error' || !state.sections.length) {
    return (
      <p className="rounded-3xl border border-dashed border-slate-300 p-10 text-center text-slate-500 dark:border-slate-700">
        {state.status === 'error' ? 'The disclosure details could not be loaded. Please try again later.' : 'Disclosure details will be published soon.'}
      </p>
    );
  }

  return (
    <>
      <nav aria-label="Disclosure sections" className="sticky top-16 z-20 -mx-4 mb-8 overflow-x-auto border-b border-slate-200 bg-white/90 px-4 py-3 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 backdrop-blur sm:top-18 dark:border-slate-800 dark:bg-slate-950/90">
        <ul className="flex w-max gap-2">
          {state.sections.map(section => (
            <li key={section.id}>
              <a href={`#${section.id}`} className="block rounded-full bg-slate-100 px-3.5 py-1.5 text-sm font-medium whitespace-nowrap text-slate-700 hover:bg-brand-50 hover:text-brand-700 dark:bg-slate-800 dark:text-slate-300">
                {section.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div className="space-y-10">
        {state.sections.map(section => (
          <section key={section.id} id={section.id} aria-labelledby={`${section.id}-heading`} className="scroll-mt-36">
            <h2 id={`${section.id}-heading`} className="mb-4 text-xl font-bold text-slate-900 dark:text-white">{section.label}</h2>
            <div className="overflow-x-auto rounded-2xl ring-1 ring-slate-200 dark:ring-slate-800">
              <table className="w-full min-w-xl text-left text-sm">
                <thead className="bg-slate-50 text-xs tracking-wider text-slate-600 uppercase dark:bg-slate-900 dark:text-slate-400">
                  <tr>{section.fields.map(f => <th key={f.label} scope="col" className="px-4 py-3 font-semibold">{f.label}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-950">
                  {section.rows.map((row, rowIndex) => {
                    // Use the most descriptive text cell as the file's title
                    const rowLabel = row.filter(v => v && !/^(data:|https?:)/.test(v)).sort((a, b) => b.length - a.length)[0];
                    return (
                      <tr key={rowIndex} className="hover:bg-slate-50 dark:hover:bg-slate-900/60">
                        {row.map((value, i) => (
                          <td key={i} className="px-4 py-3 align-top text-slate-700 dark:text-slate-300">
                            <Cell value={value} field={section.fields[i]} rowLabel={rowLabel} onOpenFile={onOpenFile} />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>
    </>
  );
}

export default function Disclosure() {
  const [noticesOpen, setNoticesOpen] = useState(false);
  const [file, setFile] = useState(null);

  return (
    <SiteContentProvider>
      <Header linkPrefix="/" onOpenNotices={() => setNoticesOpen(true)} />
      <main id="main" className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <a href="/" className="mb-6 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-800 dark:text-brand-400">
          <Icon name="chevronLeft" className="size-4" /> Back to home
        </a>
        <header className="mb-10">
          <p className="mb-2 text-sm font-semibold tracking-widest text-accent-600 uppercase">As per CBSE requirements</p>
          <h1 className="font-display text-3xl font-bold text-slate-900 sm:text-4xl dark:text-white">Mandatory Public Disclosure</h1>
        </header>
        <DisclosureTables onOpenFile={setFile} />
      </main>
      <Footer linkPrefix="/" />
      <NoticeDrawer open={noticesOpen} onClose={() => setNoticesOpen(false)} />
      <FileViewer file={file} onClose={() => setFile(null)} />
      <BackToTop />
    </SiteContentProvider>
  );
}
