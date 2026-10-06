import { collection, doc, getDoc, getDocs } from 'firebase/firestore/lite';
import { getDb } from './firebase';

// Collections hold lists; settings documents hold single objects.
export const COLLECTION_TYPES = ['faculty', 'testimonials', 'gallery', 'events', 'faq'];
export const SETTINGS_TYPES = ['hero', 'logo', 'about', 'academics', 'school-info', 'contact'];

const STORAGE_PREFIX = 'vps:content:';
const MAX_CACHE_AGE = 24 * 60 * 60 * 1000;

function readCache(type) {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + type);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeCache(type, data) {
  try {
    localStorage.setItem(STORAGE_PREFIX + type, JSON.stringify({ data, savedAt: Date.now() }));
  } catch {
    // Quota exceeded (base64 images are large) or storage blocked: skip caching this type
  }
}

/** Cached content for an instant first paint, keyed by type. */
export function loadCachedContent() {
  const content = {};
  for (const type of [...COLLECTION_TYPES, ...SETTINGS_TYPES]) {
    const entry = readCache(type);
    if (entry) content[type] = entry.data;
  }
  return content;
}

async function fetchType(db, type) {
  if (COLLECTION_TYPES.includes(type)) {
    const snapshot = await getDocs(collection(db, type));
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  }
  const snapshot = await getDoc(doc(db, 'settings', type));
  return snapshot.exists() ? snapshot.data() : null;
}

/**
 * Fetches only the content types the admin changed since they were cached
 * (admin.html writes cache/{type}.lastUpdated on every save), or that are
 * missing or older than a day. Calls onUpdate(type, data) as each one arrives.
 * A failure in one type never blocks the others.
 */
export async function refreshContent(onUpdate) {
  const db = getDb();

  let lastUpdated = {};
  try {
    const snapshot = await getDocs(collection(db, 'cache'));
    snapshot.forEach(d => { lastUpdated[d.id] = Number(d.data().lastUpdated) || 0; });
  } catch {
    lastUpdated = null; // Can't tell what changed, so refetch everything
  }

  const now = Date.now();
  const refreshType = async type => {
    const cached = readCache(type);
    const isFresh = cached && lastUpdated
      && now - cached.savedAt < MAX_CACHE_AGE
      && (lastUpdated[type] || 0) <= cached.savedAt;
    if (isFresh) return;

    try {
      const data = await fetchType(db, type);
      writeCache(type, data);
      onUpdate(type, data);
    } catch (error) {
      console.warn(`Could not load ${type} from Firestore, keeping current content`, error);
    }
  };

  // Photos are stored inside these documents (hundreds of KB), so fetch the small,
  // above-the-fold content first and let the heavy collections follow
  const heavy = ['faculty', 'gallery'];
  const light = [...SETTINGS_TYPES, ...COLLECTION_TYPES].filter(type => !heavy.includes(type));
  await Promise.all(light.map(refreshType));
  await Promise.all(heavy.map(refreshType));
}

/** Drops every cached type so the next refresh refetches all content. */
export function clearCachedContent() {
  for (const type of [...COLLECTION_TYPES, ...SETTINGS_TYPES]) {
    try { localStorage.removeItem(STORAGE_PREFIX + type); } catch { /* storage blocked */ }
  }
}

const fullPhotos = new Map();

/** Full-size gallery photo, fetched only when opened in the lightbox. */
export async function fetchGalleryFull(id) {
  if (!fullPhotos.has(id)) {
    fullPhotos.set(id, getDoc(doc(getDb(), 'gallery_full', id)).then(s => (s.exists() ? s.data().src : '')));
  }
  return fullPhotos.get(id);
}

/** The disclosure document is large (embedded PDFs), so it is fetched fresh, not cached. */
export async function fetchDisclosureSections() {
  const db = getDb();
  // The first read can come back empty while Firestore is still connecting; retry briefly
  for (let attempt = 0; attempt < 3; attempt++) {
    const snapshot = await getDoc(doc(db, 'settings', 'disclosure'));
    const sections = snapshot.exists() && Array.isArray(snapshot.data().sections)
      ? snapshot.data().sections
      : [];
    if (sections.length || attempt === 2) return sections;
    await new Promise(resolve => setTimeout(resolve, 700));
  }
  return [];
}
