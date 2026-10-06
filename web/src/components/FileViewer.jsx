import { useEffect, useState } from 'react';
import Dialog from './Dialog';
import Icon from './Icon';

// Browsers block navigating to data: URLs, so embedded files are shown via blob: URLs
function dataUrlToBlobUrl(dataUrl) {
  const [header, base64] = dataUrl.split(',');
  const mime = (header.match(/^data:([^;]+)/) || [])[1] || 'application/octet-stream';
  const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  return URL.createObjectURL(new Blob([bytes], { type: mime }));
}

export default function FileViewer({ file, onClose }) {
  const [blobUrl, setBlobUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!file) return;
    let url = '';
    try {
      url = file.url.startsWith('data:') ? dataUrlToBlobUrl(file.url) : file.url;
      setBlobUrl(url);
      setError('');
    } catch {
      setError('This file could not be opened. It may be damaged.');
    }
    return () => { if (url.startsWith('blob:')) URL.revokeObjectURL(url); };
  }, [file]);

  const isPdf = file && (/^data:application\/pdf/i.test(file.url) || /\.pdf($|\?)/i.test(file.url));
  const isImage = file && /^data:image\//i.test(file.url);
  const downloadName = file ? `${file.title.replace(/[^\w -]+/g, '').trim() || 'document'}${isPdf ? '.pdf' : ''}` : '';

  return (
    <Dialog open={Boolean(file)} onClose={onClose} label={file?.title || 'File viewer'}>
      {file && (
        <div className="flex max-h-[calc(100dvh-2rem)] flex-col">
          <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
            <h2 className="truncate font-semibold text-slate-900 dark:text-white">{file.title}</h2>
            <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Close">
              <Icon name="x" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-auto bg-slate-100 dark:bg-slate-950">
            {error ? (
              <p className="p-10 text-center text-red-600">{error}</p>
            ) : isImage ? (
              <img src={blobUrl} alt={file.title} className="mx-auto max-h-[70dvh] object-contain p-4" />
            ) : isPdf && blobUrl ? (
              <iframe src={blobUrl} title={file.title} className="h-[70dvh] w-full" />
            ) : (
              <p className="p-10 text-center text-slate-600 dark:text-slate-400">Preview isn't available for this file type.</p>
            )}
          </div>
          {!error && blobUrl && (
            <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 px-5 py-4 dark:border-slate-800">
              <a href={blobUrl} target="_blank" rel="noopener" className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold hover:border-brand-400 dark:border-slate-700">
                <Icon name="external" className="size-4" /> Open in new tab
              </a>
              <a href={blobUrl} download={downloadName} className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
                <Icon name="download" className="size-4" /> Download
              </a>
            </div>
          )}
        </div>
      )}
    </Dialog>
  );
}
