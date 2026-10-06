import { useEffect, useState } from 'react';
import Icon from './Icon';

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Back to top"
      className={`fixed right-5 bottom-5 z-30 rounded-full bg-brand-600 p-3 text-white shadow-lg shadow-brand-600/30 transition hover:bg-brand-700 ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
      }`}
      tabIndex={visible ? 0 : -1}
    >
      <Icon name="arrowUp" />
    </button>
  );
}
