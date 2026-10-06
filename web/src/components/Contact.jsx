import { useState } from 'react';
import Icon from './Icon';
import Section, { buttonStyles } from './Section';
import { useSiteContent } from '../lib/SiteContent';
import { contactDetails, emailParts, telHref } from '../lib/normalize';

const inputClass =
  'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white';

function ContactForm({ email }) {
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get('name') || '').trim();
    const from = String(form.get('email') || '').trim();
    const message = String(form.get('message') || '').trim();

    const nextErrors = {};
    if (!name) nextErrors.name = 'Please enter your name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(from)) nextErrors.email = 'Please enter a valid email address.';
    if (!message) nextErrors.message = 'Please write a message.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    // There is no backend, so the message is handed to the visitor's email app
    const subject = encodeURIComponent(`Website enquiry from ${name}`);
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${from}\n\n${message}`);
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    setSent(true);
    event.currentTarget.reset();
  }

  const field = (name, label, props) => (
    <div>
      <label htmlFor={`contact-${name}`} className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
      {props.rows ? (
        <textarea id={`contact-${name}`} name={name} className={inputClass} aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? `contact-${name}-error` : undefined} {...props} />
      ) : (
        <input id={`contact-${name}`} name={name} className={inputClass} aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? `contact-${name}-error` : undefined} {...props} />
      )}
      {errors[name] && <p id={`contact-${name}-error`} className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors[name]}</p>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8 dark:bg-slate-900 dark:ring-slate-800">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white">Send us a message</h3>
      <div className="grid gap-5 sm:grid-cols-2">
        {field('name', 'Your name', { type: 'text', autoComplete: 'name' })}
        {field('email', 'Your email', { type: 'email', autoComplete: 'email' })}
      </div>
      {field('message', 'Message', { rows: 5 })}
      <button type="submit" className={`${buttonStyles.primary} w-full sm:w-auto`}>
        <Icon name="mail" className="size-4" /> Send message
      </button>
      {sent && (
        <p role="status" className="text-sm text-accent-700 dark:text-accent-500">
          Your email app should now open with the message ready to send. If it didn't, email us at {email}.
        </p>
      )}
    </form>
  );
}

export default function Contact() {
  const { content } = useSiteContent();
  const { address, email, phones, hours } = contactDetails(content);
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

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
        </address>
        <div className="lg:col-span-3">
          <ContactForm email={email} />
        </div>
      </div>
    </Section>
  );
}
