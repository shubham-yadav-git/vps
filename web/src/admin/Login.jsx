import { useState } from 'react';
import { authErrorMessage, resetPassword, signIn } from './auth';
import { Button, TextInput } from './ui';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      await signIn(email, password);
    } catch (error) {
      setMessage({ kind: 'error', text: authErrorMessage(error) });
      setBusy(false);
    }
  }

  async function forgot() {
    if (!email.trim()) {
      setMessage({ kind: 'error', text: 'Enter your email address first, then click "Forgot password".' });
      return;
    }
    try {
      await resetPassword(email);
      setMessage({ kind: 'info', text: `If an account exists for ${email.trim()}, a password reset email is on its way.` });
    } catch (error) {
      setMessage({ kind: 'error', text: authErrorMessage(error) });
    }
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-gradient-to-br from-brand-50 via-white to-emerald-50 px-4 dark:from-slate-950 dark:via-slate-950 dark:to-brand-950">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <img src="/logo.png" alt="" width="64" height="64" className="mx-auto size-16 rounded-full" />
          <h1 className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">Admin sign in</h1>
          <p className="mt-1 text-sm text-slate-500">Vikas Public School website</p>
        </div>
        <form onSubmit={submit} className="grid gap-4 rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800" noValidate>
          <TextInput label="Email" type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} />
          <TextInput label="Password" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} />
          {message && (
            <p role={message.kind === 'error' ? 'alert' : 'status'} className={`rounded-xl px-3 py-2 text-sm ${message.kind === 'error' ? 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'}`}>
              {message.text}
            </p>
          )}
          <Button type="submit" loading={busy} disabled={!email || !password} className="w-full">Sign in</Button>
          <button type="button" onClick={forgot} className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">Forgot password?</button>
        </form>
        <p className="mt-6 text-center text-sm"><a href="/" className="text-slate-500 hover:text-brand-600">← Back to website</a></p>
      </div>
    </div>
  );
}
