import { useMemo, useState } from 'react';
import { friendlyError, invalidateCache, splitLegacyGalleryItem, updateField } from '../api';
import { compressDataUrl, dataUrlBytes, formatBytes } from '../images';
import { Button, Card, useToast } from '../ui';

const FACULTY_LIMIT = 70 * 1024;

/** Finds photos stored the old, heavy way: gallery photos inside the list, oversized faculty photos. */
function findWork(data) {
  const gallery = (data?.gallery || []).filter(g => !g.hasFull && dataUrlBytes(g.src) > 0);
  const faculty = (data?.faculty || []).filter(f => dataUrlBytes(f.photo) > FACULTY_LIMIT);
  const bytes = gallery.reduce((n, g) => n + dataUrlBytes(g.src), 0) + faculty.reduce((n, f) => n + dataUrlBytes(f.photo), 0);
  return { gallery, faculty, bytes };
}

export default function PhotoOptimizer({ data, onDone }) {
  const toast = useToast();
  const work = useMemo(() => findWork(data), [data]);
  const [progress, setProgress] = useState(null);
  const total = work.gallery.length + work.faculty.length;
  if (!data || !total) return null;

  async function run() {
    let done = 0;
    let saved = 0;
    const failures = [];
    setProgress(`0 / ${total}`);
    for (const item of work.gallery) {
      try {
        const { dataUrl: thumb, bytes } = await compressDataUrl(item.src, 'thumb');
        await splitLegacyGalleryItem(item, thumb);
        saved += dataUrlBytes(item.src) - bytes;
      } catch (error) {
        failures.push(`${item.alt || 'Gallery photo'}: ${friendlyError(error)}`);
      }
      setProgress(`${++done} / ${total}`);
    }
    for (const member of work.faculty) {
      try {
        const { dataUrl, bytes } = await compressDataUrl(member.photo, 'photo');
        if (bytes < dataUrlBytes(member.photo)) {
          await updateField('faculty', member.id, 'photo', dataUrl);
          saved += dataUrlBytes(member.photo) - bytes;
        }
      } catch (error) {
        failures.push(`${member.name || 'Faculty photo'}: ${friendlyError(error)}`);
      }
      setProgress(`${++done} / ${total}`);
    }
    if (work.gallery.length) await invalidateCache('gallery');
    if (work.faculty.length) await invalidateCache('faculty');
    setProgress(null);
    failures.forEach(f => toast.error(f));
    if (failures.length < total) toast.success(`Photos optimized. The website now downloads about ${formatBytes(saved)} less.`);
    onDone();
  }

  return (
    <Card title="Speed up the website" className="ring-amber-300 dark:ring-amber-500/40">
      <p className="text-sm text-slate-600 dark:text-slate-400">
        {total} photo{total > 1 ? 's are' : ' is'} stored in a way that makes the homepage download {formatBytes(work.bytes)} of images at once
        ({work.gallery.length} gallery, {work.faculty.length} faculty). Optimizing keeps the full-size gallery photos for the photo viewer
        and only loads small previews on the page.
      </p>
      <Button className="mt-4" icon="sparkles" loading={Boolean(progress)} onClick={run}>
        {progress ? `Optimizing ${progress}` : 'Optimize photos'}
      </Button>
    </Card>
  );
}
