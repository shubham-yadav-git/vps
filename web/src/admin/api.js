import {
  addDoc, collection, deleteDoc, doc, getDoc, getDocs, setDoc, writeBatch,
} from 'firebase/firestore/lite';
import { getDb } from '../lib/firebase';

// Firestore rejects documents over 1 MiB; leave headroom for field names and metadata
export const MAX_DOC_BYTES = 1_000_000;

export function docSize(data) {
  return new Blob([JSON.stringify(data)]).size;
}

function assertSize(data, what) {
  const size = docSize(data);
  if (size > MAX_DOC_BYTES) {
    throw new Error(`${what} is ${(size / 1024 / 1024).toFixed(2)} MB, over Firestore's 1 MB limit. Use smaller images or link large files instead.`);
  }
}

/** Tells the public site this content changed (it compares against its cached copy). */
async function invalidateCache(type) {
  try {
    await setDoc(doc(getDb(), 'cache', type), { lastUpdated: Date.now(), collection: type });
  } catch (error) {
    console.warn(`Saved, but could not refresh the public cache for ${type}`, error);
  }
}

export function friendlyError(error) {
  const code = error?.code || '';
  if (code.includes('permission-denied')) {
    return 'Permission denied. Only the school admin account can make changes.';
  }
  if (code.includes('unavailable')) return 'Could not reach the database. Check your internet connection and try again.';
  if (code.includes('invalid-argument') && /bytes|size/i.test(error.message)) {
    return 'This is too large to save. Use smaller images or link large files instead.';
  }
  return error?.message || 'Something went wrong. Please try again.';
}

// ---- List collections (faculty, gallery, testimonials, events) ----

export async function listCollection(name) {
  const snapshot = await getDocs(collection(getDb(), name));
  return snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
}

/** Creates or replaces one item; returns its id. */
export async function saveItem(name, item) {
  const { id, ...data } = item;
  assertSize(data, 'This item');
  let savedId = id;
  if (id) await setDoc(doc(getDb(), name, id), data);
  else savedId = (await addDoc(collection(getDb(), name), data)).id;
  await invalidateCache(name);
  return savedId;
}

export async function deleteItem(name, id) {
  await deleteDoc(doc(getDb(), name, id));
  await invalidateCache(name);
}

// ---- Settings documents (hero, about, academics, logo, school-info, contact, disclosure) ----

export async function getSettings(name) {
  const snapshot = await getDoc(doc(getDb(), 'settings', name));
  return snapshot.exists() ? snapshot.data() : null;
}

/** Merges so fields this form doesn't manage are kept. */
export async function saveSettings(name, data) {
  assertSize(data, 'This page');
  await setDoc(doc(getDb(), 'settings', name), data, { merge: true });
  if (name !== 'disclosure') await invalidateCache(name);
}

// ---- FAQ: an ordered collection, saved as a whole ----

export async function listFaq() {
  const items = await listCollection('faq');
  return items
    .map((item, index) => ({ ...item, order: Number(item.order ?? index) }))
    .sort((a, b) => a.order - b.order);
}

/** Writes every FAQ with its position and removes deleted ones, in one atomic batch. */
export async function saveFaq(items) {
  const db = getDb();
  const existing = await getDocs(collection(db, 'faq'));
  const keep = new Set(items.map(item => item.id).filter(Boolean));
  const batch = writeBatch(db);
  existing.docs.forEach(d => { if (!keep.has(d.id)) batch.delete(d.ref); });
  const saved = items.map((item, order) => {
    const ref = item.id ? doc(db, 'faq', item.id) : doc(collection(db, 'faq'));
    const data = { question: item.question.trim(), answer: item.answer.trim(), order };
    batch.set(ref, data);
    return { ...data, id: ref.id };
  });
  await batch.commit();
  await invalidateCache('faq');
  return saved;
}

/** Counts for the dashboard; each failure is isolated. */
export async function loadCounts() {
  const names = ['faculty', 'gallery', 'testimonials', 'events', 'faq'];
  const entries = await Promise.all(names.map(async name => {
    try { return [name, await listCollection(name)]; } catch { return [name, null]; }
  }));
  return Object.fromEntries(entries);
}
