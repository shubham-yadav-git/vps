import { useEffect, useState } from 'react';

const STORAGE_KEY = 'vps:theme';

// The initial class is set by an inline script in each page's <head> to avoid a flash
export function useTheme() {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
  }, []);

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.classList.toggle('dark', next === 'dark');
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* storage blocked */ }
    setTheme(next);
  }

  return { theme, toggleTheme };
}
