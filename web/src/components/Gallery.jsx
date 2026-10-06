import { useEffect, useRef, useState } from 'react';
import Dialog from './Dialog';
import Icon from './Icon';
import FadeImage from './FadeImage';
import Section from './Section';
import { useSiteContent } from '../lib/SiteContent';
import { galleryItems } from '../lib/normalize';

// Full-size photos live in their own documents; fetch them only when viewed
function useFullPhoto(item) {
  const [full, setFull] = useState({ id: null, src: '' });
  const id = item?.id;
  const needsFetch = Boolean(item && !item.full);
  useEffect(() => {
    if (!needsFetch) return;
    let cancelled = false;
    import('../lib/content')
      .then(({ fetchGalleryFull }) => fetchGalleryFull(id))
      .then(src => { if (!cancelled && src) setFull({ id, src }); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [id, needsFetch]);
  if (!item) return '';
  if (item.full) return item.full;
  return full.id === item.id ? full.src : '';
}

function Lightbox({ items, index, onChange, onClose }) {
  const touchStart = useRef(null);
  const item = items[index];
  const hasPrev = index > 0;
  const hasNext = index < items.length - 1;
  const fullSrc = useFullPhoto(item);
  // Warm up the next photo so arrowing through feels instant
  useFullPhoto(items[index + 1]);

  useEffect(() => {
    const onKey = e => {
      if (e.key === 'ArrowLeft' && hasPrev) onChange(index - 1);
      if (e.key === 'ArrowRight' && hasNext) onChange(index + 1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [index, hasPrev, hasNext, onChange]);

  const navButton = 'absolute top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white backdrop-blur transition hover:bg-white/25';

  return (
    <div
      className="flex h-full w-full items-center justify-center p-4 sm:p-12"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      onTouchStart={e => { touchStart.current = e.touches[0].clientX; }}
      onTouchEnd={e => {
        if (touchStart.current === null) return;
        const delta = e.changedTouches[0].clientX - touchStart.current;
        if (delta > 50 && hasPrev) onChange(index - 1);
        if (delta < -50 && hasNext) onChange(index + 1);
        touchStart.current = null;
      }}
    >
      <figure className="max-h-full max-w-5xl">
        {/* The preview shows immediately; the full-size photo replaces it once loaded */}
        <img src={fullSrc || item.src} alt={item.alt} className={`max-h-[80dvh] min-w-[min(40rem,80vw)] w-auto rounded-xl object-contain shadow-2xl transition ${fullSrc ? '' : 'blur-[1px]'}`} />
        <figcaption className="mt-3 text-center text-sm text-white/80">
          {item.alt} · {index + 1} / {items.length}
        </figcaption>
      </figure>
      <button type="button" onClick={onClose} className="absolute top-4 right-4 rounded-full bg-white/10 p-3 text-white backdrop-blur hover:bg-white/25" aria-label="Close">
        <Icon name="x" />
      </button>
      {hasPrev && (
        <button type="button" onClick={() => onChange(index - 1)} className={`${navButton} left-3 sm:left-6`} aria-label="Previous photo">
          <Icon name="chevronLeft" className="size-6" />
        </button>
      )}
      {hasNext && (
        <button type="button" onClick={() => onChange(index + 1)} className={`${navButton} right-3 sm:right-6`} aria-label="Next photo">
          <Icon name="chevronRight" className="size-6" />
        </button>
      )}
    </div>
  );
}

export default function Gallery() {
  const { content, isResolved } = useSiteContent();
  const ready = isResolved('gallery');
  const items = galleryItems(content.gallery);
  const [openIndex, setOpenIndex] = useState(null);

  if (ready && !items.length) return null;

  return (
    <Section id="gallery" eyebrow="Gallery" title="Life at Vikas Public School" intro="Moments from our classrooms, labs, events and celebrations.">
      {/* Fixed 4:3 tiles: photos fade into place without moving anything (a masonry
          layout reflowed as each photo arrived, which looked like photos being added) */}
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4" aria-busy={!ready}>
        {!ready
          ? [0, 1, 2, 3, 4, 5].map(i => <li key={i} className="aspect-[4/3] animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />)
          : items.map((item, index) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => setOpenIndex(index)}
                className="group block aspect-[4/3] w-full overflow-hidden rounded-2xl bg-slate-200 dark:bg-slate-800"
                aria-label={`View photo: ${item.alt}`}
              >
                <FadeImage src={item.src} alt={item.alt} loading="lazy" className="size-full object-cover !transition duration-500 group-hover:scale-105" />
              </button>
            </li>
          ))}
      </ul>
      <Dialog open={openIndex !== null} onClose={() => setOpenIndex(null)} label="Photo viewer" variant="bare">
        {openIndex !== null && <Lightbox items={items} index={openIndex} onChange={setOpenIndex} onClose={() => setOpenIndex(null)} />}
      </Dialog>
    </Section>
  );
}
