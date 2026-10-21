import { useState } from 'react';
import Icon from './Icon';
import Section, { buttonStyles } from './Section';
import { useSiteContent } from '../lib/SiteContent';
import { contactDetails, emailParts, safeUrl, telHref } from '../lib/normalize';
import { whatsappHref } from '../lib/schoolData';

const inputClass =
  'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white';

const CLASSES = ['Nursery', 'LKG', 'UKG', ...Array.from({ length: 10 }, (_, i) => `Class ${i + 1}`)];

function ContactForm({ email }) {
  const [type, setType] = useState('admission');
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null); // null | 'sending' | { sent: name } | { fallback: true }

  async function handleSubmit(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const get = key => String(form.get(key) || '').trim();
    const fields = {
      type,
      parentName: get('name').slice(0, 100),
      phone: get('phone').slice(0, 20),
      email: get('email').slice(0, 120),
      studentName: type === 'admission' ? get('studentName').slice(0, 100) : '',
      classApplying: type === 'admission' ? get('classApplying').slice(0, 40) : '',
      message: get('message').slice(0, 2000),
    };

    const nextErrors = {};
    if (!fields.parentName) nextErrors.name = 'Please enter your name.';
    if (fields.phone && fields.phone.replace(/\D/g, '').length < 10) nextErrors.phone = 'Please enter a 10-digit mobile number.';
    if (fields.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(fields.email)) nextErrors.email = 'Please enter a valid email address.';
    if (!fields.phone && !fields.email) nextErrors.phone = 'Please give a phone number or email so we can reply.';
    if (type === 'general' && !fields.message) nextErrors.message = 'Please write your question.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    // Hidden field only bots fill in: pretend it worked and drop it
    if (get('website')) { setStatus({ sent: fields.parentName }); formElement.reset(); return; }

    setStatus('sending');
    try {
      const { submitEnquiry } = await import('../lib/content');
      await submitEnquiry(fields);
      setStatus({ sent: fields.parentName });
      formElement.reset();
    } catch {
      // Database unreachable: hand the message to the visitor's email app instead
      const lines = [
        `Name: ${fields.parentName}`, fields.phone && `Phone: ${fields.phone}`, fields.email && `Email: ${fields.email}`,
        fields.studentName && `Student: ${fields.studentName}`, fields.classApplying && `Class: ${fields.classApplying}`, '', fields.message,
      ].filter(line => line !== '' && line !== undefined && line !== false);
      const subject = encodeURIComponent(`${type === 'admission' ? 'Admission enquiry' : 'Website enquiry'} from ${fields.parentName}`);
      window.location.href = `mailto:${email}?subject=${subject}&body=${encodeURIComponent(lines.join('\n'))}`;
      setStatus({ fallback: true });
    }
  }

  const describedBy = name => (errors[name] ? `contact-${name}-error` : undefined);
  const label = (name, text, optional) => (
    <label htmlFor={`contact-${name}`} className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
      {text}{optional && <span className="font-normal text-slate-400"> (optional)</span>}
    </label>
  );
  const error = name => errors[name] && <p id={`contact-${name}-error`} className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors[name]}</p>;
  const field = (name, text, props, optional) => (
    <div>
      {label(name, text, optional)}
      {props.rows
        ? <textarea id={`contact-${name}`} name={name} className={inputClass} aria-invalid={Boolean(errors[name])} aria-describedby={describedBy(name)} {...props} />
        : <input id={`contact-${name}`} name={name} className={inputClass} aria-invalid={Boolean(errors[name])} aria-describedby={describedBy(name)} {...props} />}
      {error(name)}
    </div>
  );

  if (status?.sent) {
    return (
      <div role="status" className="grid h-full place-items-center rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
        <div>
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400"><Icon name="check" className="size-7" /></span>
          <h3 className="mt-5 text-xl font-bold text-slate-900 dark:text-white">Thank you, {status.sent}</h3>
          <p className="mx-auto mt-2 max-w-sm text-slate-600 dark:text-slate-400">We’ve received your enquiry. The school office will get back to you soon.</p>
          <button type="button" onClick={() => setStatus(null)} className={`${buttonStyles.secondary} mt-6`}>Send another enquiry</button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="relative space-y-5 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8 dark:bg-slate-900 dark:ring-slate-800">
      <div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Send an enquiry</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">The school office will call or email you back.</p>
      </div>
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">I’m asking about</legend>
        <div className="grid grid-cols-2 gap-2">
          {[['admission', 'Admission'], ['general', 'Something else']].map(([value, text]) => (
            <label key={value} className={`flex cursor-pointer items-center justify-center rounded-xl border px-4 py-2.5 text-sm font-semibold transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-500 ${type === value ? 'border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300' : 'border-slate-300 text-slate-600 hover:border-slate-400 dark:border-slate-700 dark:text-slate-300'}`}>
              <input type="radio" name="type" value={value} checked={type === value} onChange={() => setType(value)} className="sr-only" />
              {text}
            </label>
          ))}
        </div>
      </fieldset>
      {field('name', type === 'admission' ? 'Parent / guardian name' : 'Your name', { type: 'text', autoComplete: 'name', maxLength: 100 })}
      <div className="grid gap-5 sm:grid-cols-2">
        {field('phone', 'Mobile number', { type: 'tel', autoComplete: 'tel', inputMode: 'tel', maxLength: 20, placeholder: '10-digit mobile' })}
        {field('email', 'Email', { type: 'email', autoComplete: 'email', maxLength: 120 }, true)}
      </div>
      {type === 'admission' && (
        <div className="grid gap-5 sm:grid-cols-2">
          {field('studentName', 'Child’s name', { type: 'text', maxLength: 100 }, true)}
          <div>
            {label('classApplying', 'Class applying for', true)}
            <select id="contact-classApplying" name="classApplying" className={inputClass} defaultValue="">
              <option value="">Select a class</option>
              {CLASSES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
      )}
      {field('message', type === 'admission' ? 'Anything you’d like to ask' : 'Your question', { rows: 4, maxLength: 2000 }, type === 'admission')}
      {/* Honeypot: hidden from people, filled in by spam bots */}
      <div aria-hidden="true" className="absolute -left-[9999px]">
        <label htmlFor="contact-website">Website</label>
        <input id="contact-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <button type="submit" disabled={status === 'sending'} className={`${buttonStyles.primary} w-full disabled:opacity-70 sm:w-auto`}>
        {status === 'sending' ? <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <Icon name="mail" className="size-4" />}
        {status === 'sending' ? 'Sending…' : 'Send enquiry'}
      </button>
      {status?.fallback && (
        <p role="status" className="text-sm text-slate-600 dark:text-slate-400">
          Your email app should now open with the message ready to send. If it didn’t, email us at {email}.
        </p>
      )}
    </form>
  );
}

export default function Contact() {
  const { content } = useSiteContent();
  const { address, email, phones, hours } = contactDetails(content);
  const site = content.site || {};
  const mapUrl = safeUrl(site.mapUrl) || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  const whatsapp = whatsappHref(site.whatsapp);

  const card = 'flex gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800';
  const iconWrap = 'grid size-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400';

  return (
    <Section id="contact" eyebrow="Contact" title="We'd love to hear from you" intro="Visit us, call the office, or send a message.">
      <div className="grid gap-8 lg:grid-cols-5">
        <address className="space-y-4 not-italic lg:col-span-2">
          {address && (
            <div className={card}>
              <span className={iconWrap}><Icon name="mapPin" /></span>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Address</h3>
                <p className="mt-1 text-slate-600 dark:text-slate-400">{address}</p>
                <a href={mapUrl} target="_blank" rel="noopener" className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-800 dark:text-brand-400">
                  Get directions <Icon name="external" className="size-3.5" />
                </a>
              </div>
            </div>
          )}
          {phones.length > 0 && (
            <div className={card}>
              <span className={iconWrap}><Icon name="phone" /></span>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Phone</h3>
                <ul className="mt-1 space-y-0.5">
                  {phones.map(phone => (
                    <li key={phone}><a href={telHref(phone)} className="text-slate-600 hover:text-brand-700 dark:text-slate-400 dark:hover:text-brand-300">{phone}</a></li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          {email && (
            <div className={card}>
              <span className={iconWrap}><Icon name="mail" /></span>
              <div className="min-w-0">
                <h3 className="font-semibold text-slate-900 dark:text-white">Email</h3>
                <a href={`mailto:${email}`} className="mt-1 block text-slate-600 hover:text-brand-700 dark:text-slate-400 dark:hover:text-brand-300">{emailParts(email)[0]}<wbr />{emailParts(email)[1]}</a>
              </div>
            </div>
          )}
          {hours && (
            <div className={card}>
              <span className={iconWrap}><Icon name="clock" /></span>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Office hours</h3>
                <p className="mt-1 text-slate-600 dark:text-slate-400">{hours}</p>
              </div>
            </div>
          )}
          {whatsapp && (
            <a href={whatsapp} target="_blank" rel="noopener" className={`${card} transition hover:ring-emerald-400`}>
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"><Icon name="message" /></span>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">WhatsApp</h3>
                <p className="mt-1 text-slate-600 dark:text-slate-400">Message the school office</p>
              </div>
            </a>
          )}
        </address>
        <div className="lg:col-span-3">
          <ContactForm email={email} />
        </div>
      </div>
    </Section>
  );
}
