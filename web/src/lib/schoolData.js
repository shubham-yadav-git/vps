/** Today's date as YYYY-MM-DD in the visitor's own time zone (toISOString would give UTC). */
export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// Fixed choices shared by the admin editors and the public sections

export const CALENDAR_KINDS = [
  { id: 'event', label: 'Event', tone: 'blue', chip: 'bg-brand-100 text-brand-800 hover:bg-brand-200 dark:bg-brand-500/20 dark:text-brand-200' },
  { id: 'exam', label: 'Exam', tone: 'red', chip: 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-500/20 dark:text-red-200' },
  { id: 'holiday', label: 'Holiday', tone: 'green', chip: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-200' },
  { id: 'meeting', label: 'Meeting', tone: 'amber', chip: 'bg-amber-100 text-amber-900 hover:bg-amber-200 dark:bg-amber-500/20 dark:text-amber-200' },
];

export const ACHIEVEMENT_KINDS = [
  { id: 'board-result', label: 'Board result' },
  { id: 'topper', label: 'Topper' },
  { id: 'award', label: 'Award' },
  { id: 'sports', label: 'Sports' },
  { id: 'competition', label: 'Competition' },
  { id: 'other', label: 'Other' },
];

export const DOWNLOAD_CATEGORIES = [
  { id: 'admissions', label: 'Admissions' },
  { id: 'fees', label: 'Fee structure' },
  { id: 'syllabus', label: 'Syllabus & book lists' },
  { id: 'circulars', label: 'Circulars' },
  { id: 'calendar', label: 'Calendar & holidays' },
  { id: 'forms', label: 'Forms' },
  { id: 'other', label: 'Other' },
];

// The homepage's built-in search text, used whenever Site & SEO leaves a field empty
export const SEO_DEFAULTS = {
  title: 'Vikas Public School, Jaunpur | CBSE School – Excellence in Education',
  description: 'Vikas Public School in Jaunpur, Uttar Pradesh offers CBSE-pattern education with experienced teachers, a modern campus and holistic development. Admissions open.',
};

/** Whether the homepage popup/banner shows today: 'off' | 'scheduled' | 'live' | 'expired'. */
export function announcementState(announcement, today = localDate()) {
  const a = announcement || {};
  if (!a.enabled || !String(a.title || '').trim()) return 'off';
  if (a.start && today < a.start) return 'scheduled';
  if (a.end && today > a.end) return 'expired';
  return 'live';
}

/** wa.me link for a WhatsApp number; bare 10-digit Indian numbers get the country code. */
export function whatsappHref(number) {
  const digits = String(number || '').replace(/\D/g, '');
  if (digits.length < 10) return '';
  return `https://wa.me/${digits.length === 10 ? `91${digits}` : digits}`;
}
