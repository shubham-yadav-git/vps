// Turn raw Firestore documents into the shapes the UI renders.
// React escapes text automatically; URLs still need checking before use in src/href.

export const NOTICE_CATEGORIES = ['urgent', 'academic', 'events', 'general'];

/** Allows http(s), image/PDF data URLs and same-site paths; anything else gets the fallback. */
export function safeUrl(value, fallback = '') {
  if (typeof value !== 'string' || !value.trim()) return fallback;
  const url = value.trim();
  if (/^data:(image\/|application\/pdf)/i.test(url)) return url;
  if (/^https?:\/\//i.test(url)) return url;
  if (/^[a-z][a-z0-9+.-]*:/i.test(url)) return fallback;
  return url.startsWith('/') ? url : '/' + url;
}

export function splitPhones(value) {
  return String(value || '')
    .split(/[,/;]+/)
    .map(p => p.trim())
    .filter(Boolean);
}

export function telHref(phone) {
  const digits = phone.replace(/[^\d+]/g, '');
  // Bare 10-digit Indian mobile numbers get the country code
  return 'tel:' + (/^\d{10}$/.test(digits) ? '+91' + digits : digits);
}

export function formatDate(value, month = 'long') {
  if (!value) return '';
  const date = new Date(value);
  return isNaN(date) ? '' : date.toLocaleDateString('en-IN', { year: 'numeric', month, day: 'numeric' });
}

/** Email split so it can wrap at the "@" (render with <wbr />) instead of mid-word. */
export function emailParts(email) {
  const at = String(email).indexOf('@');
  return at > 0 ? [email.slice(0, at), email.slice(at)] : [email, ''];
}

export function initials(name) {
  return String(name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0].toUpperCase())
    .join('');
}

/** Active (not expired) notices, newest first, with a known category. */
export function activeNotices(events, today = new Date()) {
  const startOfToday = new Date(today);
  startOfToday.setHours(0, 0, 0, 0);
  return (Array.isArray(events) ? events : [])
    .map(event => ({
      id: String(event.id),
      title: String(event.title || 'Notice'),
      description: String(event.description || ''),
      date: event.date || '',
      validUntil: event.validUntil ? String(event.validUntil) : '',
      category: NOTICE_CATEGORIES.includes(event.category) ? event.category : 'general',
    }))
    .filter(event => {
      if (!event.validUntil) return true;
      const validUntil = new Date(event.validUntil);
      if (isNaN(validUntil)) return true;
      validUntil.setHours(23, 59, 59, 999);
      return validUntil >= startOfToday;
    })
    .sort((a, b) => (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0));
}

/** Gallery items with safe sources, without exact duplicates. */
export function galleryItems(items) {
  const seen = new Set();
  return (Array.isArray(items) ? items : [])
    .map(item => ({ id: String(item.id), src: safeUrl(item.src), alt: item.alt || 'Vikas Public School gallery photo' }))
    .filter(item => item.src && !seen.has(item.src) && seen.add(item.src));
}

export function sortedFaq(items) {
  return (Array.isArray(items) ? items : [])
    .filter(item => item.question)
    .map((item, index) => ({ ...item, order: Number(item.order ?? index) }))
    .sort((a, b) => a.order - b.order);
}

/** Contact details: the contact doc wins over school-info, which wins over defaults. */
export function contactDetails(content) {
  const info = content['school-info'] || {};
  const contact = content.contact || {};
  const pick = key => contact[key] || info[key] || '';
  return {
    address: pick('address'),
    email: pick('email'),
    phones: splitPhones(pick('phone')),
    hours: contact.hours || '',
  };
}
