import { useEffect, useRef, useState } from 'react';
import Dialog from './Dialog';
import Icon from './Icon';
import Section from './Section';
import { useSiteContent } from '../lib/SiteContent';
import { galleryItems } from '../lib/normalize';

function Lightbox({ items, index, onChange, onClose }) {
  const touchStart = useRef(null);
  const item = items[index];
  const hasPrev = index > 0;
  const hasNext = index < items.length - 1;

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
        <img src={item.src} alt={item.alt} className="max-h-[80dvh] w-auto rounded-xl object-contain shadow-2xl" />
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
  const { content } = useSiteContent();
  const items = galleryItems(content.gallery);
  const [openIndex, setOpenIndex] = useState(null);

  if (!items.length) return null;

  return (
    <Section id="gallery" eyebrow="Gallery" title="Life at Vikas Public School" intro="Moments from our classrooms, labs, events and celebrations.">
      <ul className="columns-2 gap-4 sm:columns-3 lg:columns-4">
        {items.map((item, index) => (
          <li key={item.id} className="mb-4 break-inside-avoid">
            <button
              type="button"
              onClick={() => setOpenIndex(index)}
              className="group block w-full overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800"
              aria-label={`View photo: ${item.alt}`}
            >
              <img src={item.src} alt={item.alt} loading="lazy" className="w-full transition duration-500 group-hover:scale-105" />
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
