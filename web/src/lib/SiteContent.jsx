import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { DEFAULT_CONTENT } from '../data/defaults';

// Firebase is loaded on demand so it never delays the prerendered page becoming interactive
const loadContentModule = () => import('./content');

const SiteContentContext = createContext(null);

// Merge one fetched type over the current content. Empty lists keep the existing
// content (matching the old site), except notices, where "none" is meaningful.
function mergeType(content, type, data) {
  if (data === null || data === undefined) return content;
  if (Array.isArray(data)) {
    if (!data.length && type !== 'events') return content;
    return { ...content, [type]: data };
  }
  return { ...content, [type]: { ...(content[type] || {}), ...data } };
}

export function SiteContentProvider({ children }) {
  // First render must match the prerendered HTML, so it always starts from defaults
  const [content, setContent] = useState(DEFAULT_CONTENT);
  const [hydrated, setHydrated] = useState(false);
  const [noticesLoaded, setNoticesLoaded] = useState(false);

  const applyUpdate = useCallback((type, data) => {
    setContent(current => mergeType(current, type, data));
    if (type === 'events') setNoticesLoaded(true);
  }, []);

  const load = useCallback(async () => {
    try {
      const { refreshContent } = await loadContentModule();
      await refreshContent(applyUpdate);
    } catch (error) {
      console.warn('Could not refresh site content', error);
    } finally {
      setNoticesLoaded(true);
    }
  }, [applyUpdate]);

  useEffect(() => {
    setHydrated(true);
    loadContentModule().then(({ loadCachedContent }) => {
      const cached = loadCachedContent();
      setContent(current => Object.entries(cached).reduce((acc, [type, data]) => mergeType(acc, type, data), current));
      if (cached.events) setNoticesLoaded(true);
      load();
    }).catch(() => setNoticesLoaded(true));
  }, [load]);

  const forceRefresh = useCallback(async () => {
    const { clearCachedContent } = await loadContentModule();
    clearCachedContent();
    return load();
  }, [load]);

  return (
    <SiteContentContext.Provider value={{ content, hydrated, noticesLoaded, forceRefresh }}>
      {children}
    </SiteContentContext.Provider>
  );
}

export function useSiteContent() {
  const value = useContext(SiteContentContext);
  if (!value) throw new Error('useSiteContent must be used inside SiteContentProvider');
  return value;
}
