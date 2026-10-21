import {
  addDoc, collection, deleteDoc, doc, getDoc, getDocs, limit, orderBy, query, serverTimestamp,
  setDoc, startAfter, updateDoc, where, writeBatch,
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

// ---- Activity log ----

// Who is signed in, set by the admin shell, so every save can be attributed
let actor = null;
export function setActor(value) { actor = value; }

export const AREA_LABELS = {
  faculty: 'Faculty', gallery: 'Gallery', testimonials: 'Testimonials', events: 'Notices', faq: 'FAQ',
  calendar: 'Calendar', achievements: 'Achievements', downloads: 'Downloads', enquiries: 'Enquiries', staff: 'Staff',
  hero: 'Homepage banner', about: 'About', academics: 'Academics', logo: 'Logo & name', 'school-info': 'School info',
  contact: 'Contact details', disclosure: 'Mandatory disclosure', announcement: 'Popup & banner', site: 'Site & SEO',
};

const itemLabel = item => String(item?.title || item?.name || item?.alt || item?.question || item?.parentName || 'an item').slice(0, 120);

/** Records a change. Never blocks or fails the save it describes. */
export async function logActivity(action, area, label) {
  if (!actor?.email) return;
  try {
    await addDoc(collection(getDb(), 'activity'), {
      by: actor.email, byName: String(actor.name || actor.email).slice(0, 80), action, area, label: String(label).slice(0, 200), at: serverTimestamp(),
    });
  } catch (error) {
    console.warn('Could not record activity', error);
  }
}

/** Newest first, in pages. Pass the last entry of the previous page as `after`. */
export async function listActivity({ after = null, pageSize = 40 } = {}) {
  const parts = [collection(getDb(), 'activity'), orderBy('at', 'desc')];
  if (after) parts.push(startAfter(after.at));
  parts.push(limit(pageSize));
  const snapshot = await getDocs(query(...parts));
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
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
  await logActivity(id ? 'update' : 'create', name, itemLabel(item));
  return savedId;
}

export async function deleteItem(name, id, label) {
  await deleteDoc(doc(getDb(), name, id));
  await invalidateCache(name);
  await logActivity('delete', name, label || 'an item');
}

/** Saves a new display order (positions follow the ids' order). */
export async function saveOrder(name, ids) {
  const db = getDb();
  const batch = writeBatch(db);
  ids.forEach((id, order) => batch.set(doc(db, name, id), { order }, { merge: true }));
  await batch.commit();
  await invalidateCache(name);
  await logActivity('update', name, `the order of ${(AREA_LABELS[name] || name).toLowerCase()}`);
}

// ---- Gallery: small preview in gallery/{id}, full photo in gallery_full/{id} ----
// gallery/{id} = { alt, thumb?, hasFull?, src? }  (src is a plain URL/path, or a legacy embedded photo)
// gallery_full/{id} = { src }                    (full-size embedded photo, fetched on demand)

/** Saves a gallery item. Pass `newPhoto` (full-size data URL + preview) when the photo changed. */
export async function saveGalleryItem({ id, alt }, newPhoto) {
  const db = getDb();
  const ref = id ? doc(db, 'gallery', id) : doc(collection(db, 'gallery'));
  if (newPhoto) {
    const { full, thumb } = newPhoto;
    if (full.startsWith('data:')) {
      assertSize({ src: full }, 'This photo');
      await setDoc(doc(db, 'gallery_full', ref.id), { src: full });
      await setDoc(ref, { alt, thumb, hasFull: true });
    } else {
      await setDoc(ref, { alt, src: full });
    }
  } else {
    await setDoc(ref, { alt }, { merge: true });
  }
  await invalidateCache('gallery');
  await logActivity(id ? 'update' : 'create', 'gallery', alt || 'a photo');
  return ref.id;
}

export async function deleteGalleryItem(id, label) {
  const db = getDb();
  await deleteDoc(doc(db, 'gallery', id));
  await deleteDoc(doc(db, 'gallery_full', id)).catch(() => {});
  await invalidateCache('gallery');
  await logActivity('delete', 'gallery', label || 'a photo');
}

// ---- Downloads: details in downloads/{id}, an attached file in downloads_files/{id} ----

/** `file` is a data URL when a new file was attached, '' to remove it, or undefined to keep it. */
export async function saveDownload({ id, ...meta }, file) {
  const db = getDb();
  const ref = id ? doc(db, 'downloads', id) : doc(collection(db, 'downloads'));
  const data = { ...meta, updatedAt: new Date().toISOString().slice(0, 10) };
  if (file) {
    assertSize({ data: file }, 'This file');
    await setDoc(doc(db, 'downloads_files', ref.id), { data: file });
    data.hasFile = true;
  } else if (file === '') {
    await deleteDoc(doc(db, 'downloads_files', ref.id)).catch(() => {});
    data.hasFile = false;
  }
  await setDoc(ref, data, { merge: true });
  await invalidateCache('downloads');
  await logActivity(id ? 'update' : 'create', 'downloads', meta.title || 'a download');
  return { id: ref.id, ...data };
}

export async function deleteDownload(id, label) {
  const db = getDb();
  await deleteDoc(doc(db, 'downloads', id));
  await deleteDoc(doc(db, 'downloads_files', id)).catch(() => {});
  await invalidateCache('downloads');
  await logActivity('delete', 'downloads', label || 'a download');
}

// ---- Enquiries sent from the website ----

export const ENQUIRY_STATUSES = [
  { id: 'new', label: 'New' },
  { id: 'contacted', label: 'Contacted' },
  { id: 'visited', label: 'Visited school' },
  { id: 'admitted', label: 'Admitted' },
  { id: 'closed', label: 'Closed' },
];

export async function listEnquiries() {
  const snapshot = await getDocs(query(collection(getDb(), 'enquiries'), orderBy('createdAt', 'desc'), limit(500)));
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function countNewEnquiries() {
  const snapshot = await getDocs(query(collection(getDb(), 'enquiries'), where('status', '==', 'new'), limit(100)));
  return snapshot.size;
}

/** Only status and notes can change; what the visitor wrote is kept as sent. */
export async function updateEnquiry(enquiry, patch) {
  const data = { ...patch, updatedAt: serverTimestamp(), updatedBy: actor?.email || '' };
  await updateDoc(doc(getDb(), 'enquiries', enquiry.id), data);
  const status = patch.status && patch.status !== enquiry.status ? ` marked ${ENQUIRY_STATUSES.find(s => s.id === patch.status)?.label}` : ' note added';
  await logActivity('update', 'enquiries', `${enquiry.parentName}:${status}`);
}

export async function deleteEnquiry(enquiry) {
  await deleteDoc(doc(getDb(), 'enquiries', enquiry.id));
  await logActivity('delete', 'enquiries', enquiry.parentName);
}

// ---- Staff accounts ----

export async function listStaff() {
  const snapshot = await getDocs(collection(getDb(), 'staff'));
  return snapshot.docs.map(d => ({ email: d.id, ...d.data() }));
}

export async function saveStaff(email, { name, role, active }, isNew) {
  const key = String(email).trim().toLowerCase();
  const data = { name: name.trim(), role, active };
  if (isNew) Object.assign(data, { addedAt: new Date().toISOString(), addedBy: actor?.email || '' });
  await setDoc(doc(getDb(), 'staff', key), data, { merge: !isNew });
  await logActivity(isNew ? 'create' : 'update', 'staff', `${data.name} (${key}), ${role}${active ? '' : ', deactivated'}`);
}

export async function deleteStaff(member) {
  await deleteDoc(doc(getDb(), 'staff', member.email));
  await logActivity('delete', 'staff', `${member.name} (${member.email})`);
}

/** Moves a legacy embedded photo out of the gallery list document. */
export async function splitLegacyGalleryItem(item, thumb) {
  const db = getDb();
  await setDoc(doc(db, 'gallery_full', item.id), { src: item.src });
  await setDoc(doc(db, 'gallery', item.id), { alt: item.alt || '', thumb, hasFull: true });
}

/** Replaces one field of a document without touching the rest (used by photo optimisation). */
export async function updateField(collectionName, id, field, value) {
  await setDoc(doc(getDb(), collectionName, id), { [field]: value }, { merge: true });
}

export { invalidateCache };

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
  await logActivity('update', name, AREA_LABELS[name] || name);
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
  await logActivity('update', 'faq', `the FAQ (${saved.length} question${saved.length === 1 ? '' : 's'})`);
  return saved;
}

/** Counts for the dashboard; each failure is isolated. */
export async function loadCounts() {
  const names = ['faculty', 'gallery', 'testimonials', 'events', 'faq', 'calendar', 'achievements', 'downloads'];
  const entries = await Promise.all(names.map(async name => {
    try { return [name, await listCollection(name)]; } catch { return [name, null]; }
  }));
  return Object.fromEntries(entries);
}
