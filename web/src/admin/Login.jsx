import { useState } from 'react';
import Icon from '../components/Icon';
import { authErrorMessage, createStaffAccount, resetPassword, signIn } from './auth';
import { Button, TextInput } from './ui';

export default function Login() {
  const [mode, setMode] = useState('signin'); // 'signin' | 'setup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const setup = mode === 'setup';

  async function submit(event) {
    event.preventDefault();
    setMessage(null);
    if (setup) {
      if (password.length < 8) return setMessage({ kind: 'error', text: 'Choose a password of at least 8 characters.' });
      if (password !== confirmPassword) return setMessage({ kind: 'error', text: 'The two passwords don’t match.' });
    }
    setBusy(true);
    try {
      if (setup) await createStaffAccount(email, password);
      else await signIn(email, password);
    } catch (error) {
      setMessage({ kind: 'error', text: authErrorMessage(error) });
      setBusy(false);
    }
  }

  async function forgot() {
    if (!email.trim()) {
      setMessage({ kind: 'error', text: 'Enter your email address first, then click “Forgot password”.' });
      return;
    }
    try {
      await resetPassword(email);
      setMessage({ kind: 'info', text: `If an account exists for ${email.trim()}, a password reset email is on its way.` });
    } catch (error) {
      setMessage({ kind: 'error', text: authErrorMessage(error) });
    }
  }

  function switchMode(next) {
    setMode(next);
    setMessage(null);
    setPassword('');
    setConfirmPassword('');
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-brand-800 lg:block">
        <img src="/campus.jpg" alt="" className="absolute inset-0 size-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-950 via-brand-900/70 to-brand-800/40" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="" width="44" height="44" className="size-11 rounded-full bg-white p-0.5" />
            <span className="font-semibold">Vikas Public School</span>
          </div>
          <div className="max-w-md">
            <h2 className="text-4xl leading-tight font-bold tracking-tight">Admin console</h2>
            <p className="mt-3 text-brand-100">Manage notices, admissions enquiries, events, downloads and every page of the school website.</p>
            <ul className="mt-8 grid gap-3 text-sm text-brand-50">
              {['Admission enquiries in one inbox', 'Notices, calendar and popups', 'Staff accounts with roles and an activity log'].map(text => (
                <li key={text} className="flex items-center gap-3"><Icon name="check" className="size-4 text-accent-500" /> {text}</li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-brand-200">Estd. 2004 · Jaunpur, Uttar Pradesh</p>
        </div>
      </div>

      <div className="grid place-items-center bg-slate-50 px-4 py-12 dark:bg-slate-950">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <img src="/logo.png" alt="" width="48" height="48" className="mb-6 size-12 rounded-full lg:hidden" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{setup ? 'Set up your account' : 'Sign in'}</h1>
            <p className="mt-1.5 text-sm text-slate-500">
              {setup ? 'For staff the administrator has added. Use the email they added for you.' : 'Welcome back. Sign in to manage the website.'}
            </p>
          </div>
          <form onSubmit={submit} className="grid gap-4" noValidate>
            <TextInput label="Email" type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} />
            <TextInput label={setup ? 'Choose a password' : 'Password'} type="password" autoComplete={setup ? 'new-password' : 'current-password'} required value={password} onChange={e => setPassword(e.target.value)} hint={setup ? 'At least 8 characters.' : undefined} />
            {setup && <TextInput label="Confirm password" type="password" autoComplete="new-password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />}
            {!setup && (
              <div className="-mt-2 text-right">
                <button type="button" onClick={forgot} className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">Forgot password?</button>
              </div>
            )}
            {message && (
              <p role={message.kind === 'error' ? 'alert' : 'status'} className={`rounded-lg px-3 py-2 text-sm ${message.kind === 'error' ? 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'}`}>
                {message.text}
              </p>
            )}
            <Button type="submit" loading={busy} disabled={!email || !password} className="w-full">{setup ? 'Create account' : 'Sign in'}</Button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
            {setup ? (
              <>Already have a password? <button type="button" onClick={() => switchMode('signin')} className="font-semibold text-brand-600 hover:underline dark:text-brand-400">Sign in</button></>
            ) : (
              <>First time here? <button type="button" onClick={() => switchMode('setup')} className="font-semibold text-brand-600 hover:underline dark:text-brand-400">Set your password</button></>
            )}
          </p>
          <p className="mt-8 text-center text-sm"><a href="/" className="text-slate-500 hover:text-brand-600">← Back to website</a></p>
        </div>
      </div>
    </div>
  );
}
