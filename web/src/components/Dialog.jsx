import { useEffect, useRef } from 'react';

/**
 * Native <dialog>: focus trapping, Escape to close and top-layer stacking for free.
 * variant "drawer" slides in from the right; "center" is a centred modal; "bare" has no panel styling.
 */
export default function Dialog({ open, onClose, label, variant = 'center', className = '', children }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      document.body.style.overflow = 'hidden';
    } else if (!open && dialog.open) {
      dialog.close();
    }
    if (!open) document.body.style.overflow = '';
  }, [open]);

  useEffect(() => () => { document.body.style.overflow = ''; }, []);

  const variants = {
    drawer: 'ml-auto mr-0 h-dvh max-h-dvh w-full max-w-md rounded-none bg-slate-50 dark:bg-slate-950 open:animate-drawer-in',
    center: 'm-auto w-[min(56rem,calc(100vw-2rem))] max-h-[calc(100dvh-2rem)] rounded-2xl bg-white dark:bg-slate-900',
    bare: 'm-0 h-dvh max-h-none w-screen max-w-none bg-transparent',
  };

  return (
    <dialog
      ref={ref}
      aria-label={label}
      onCancel={e => { e.preventDefault(); onClose(); }}
      onClick={e => { if (e.target === ref.current) onClose(); }}
      className={`p-0 text-slate-800 shadow-2xl backdrop:bg-slate-950/70 backdrop:backdrop-blur-sm dark:text-slate-200 ${variants[variant]} ${className}`}
    >
      {open && children}
    </dialog>
  );
}
