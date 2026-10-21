import { useCallback, useEffect, useState } from 'react';
import {
  connectAuthEmulator, createUserWithEmailAndPassword, getAuth, onAuthStateChanged,
  sendEmailVerification, sendPasswordResetEmail, signInWithEmailAndPassword, signOut,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore/lite';
import { getDb, getFirebaseApp, USE_EMULATOR } from '../lib/firebase';

// Must match isOwner() in firestore.rules. The owner is always an admin;
// everyone else is listed in staff/{email} from the Staff page.
export const OWNER_EMAILS = ['admin@vikaspublicschool.in'];

let auth;
function getAdminAuth() {
  if (!auth) {
    auth = getAuth(getFirebaseApp());
    if (USE_EMULATOR) connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  }
  return auth;
}

export function useAuthUser() {
  // undefined while Firebase restores the session, then a user or null
  const [user, setUser] = useState(undefined);
  useEffect(() => onAuthStateChanged(getAdminAuth(), setUser), []);
  return user;
}

export const emailKey = email => String(email || '').trim().toLowerCase();
export const isOwnerEmail = email => OWNER_EMAILS.includes(emailKey(email));

/**
 * What the signed-in account may do, mirroring the rules:
 * { status: 'loading' | 'ok' | 'unverified' | 'none' | 'error', role, name, isAdmin, isOwner }
 */
export function useStaffProfile(user) {
  const [profile, setProfile] = useState({ status: 'loading' });

  const load = useCallback(async () => {
    if (!user) return;
    if (isOwnerEmail(user.email)) {
      setProfile({ status: 'ok', role: 'admin', name: 'School admin', isAdmin: true, isOwner: true });
      return;
    }
    setProfile({ status: 'loading' });
    try {
      const snapshot = await getDoc(doc(getDb(), 'staff', emailKey(user.email)));
      const data = snapshot.exists() ? snapshot.data() : null;
      if (!data || data.active !== true) setProfile({ status: 'none' });
      else if (!user.emailVerified) setProfile({ status: 'unverified', name: data.name });
      else setProfile({ status: 'ok', role: data.role, name: data.name || user.email, isAdmin: data.role === 'admin', isOwner: false });
    } catch (error) {
      setProfile({ status: 'error', error });
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  /** After clicking the email link: refresh the account so the rules see the verified address. */
  const recheck = useCallback(async () => {
    await user.reload();
    await user.getIdToken(true);
    await load();
  }, [user, load]);

  return { ...profile, recheck };
}

const AUTH_MESSAGES = {
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/wrong-password': 'Incorrect email or password.',
  'auth/user-not-found': 'Incorrect email or password.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/too-many-requests': 'Too many attempts. Please wait a few minutes and try again.',
  'auth/network-request-failed': 'Could not connect. Check your internet connection.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/email-already-in-use': 'This email already has a password. Sign in instead, or use "Forgot password".',
  'auth/weak-password': 'Choose a password of at least 8 characters.',
  'auth/admin-restricted-operation': 'New accounts are switched off for this website. Ask the administrator to create your account in Firebase, then sign in here.',
  'auth/operation-not-allowed': 'New accounts are switched off for this website. Ask the administrator to create your account in Firebase, then sign in here.',
};

export function authErrorMessage(error) {
  return AUTH_MESSAGES[error?.code] || error?.message || 'Sign-in failed. Please try again.';
}

export const signIn = (email, password) => signInWithEmailAndPassword(getAdminAuth(), email.trim(), password);
export const signOutAdmin = () => signOut(getAdminAuth());
export const resetPassword = email => sendPasswordResetEmail(getAdminAuth(), email.trim());
/** Sends the confirmation email, linking back to the panel when this domain is allowed to. */
export async function resendVerification(user) {
  try {
    await sendEmailVerification(user, { url: `${window.location.origin}/admin.html` });
  } catch (error) {
    // The return link needs the domain in Firebase Auth's authorized domains; without it, send a plain link
    if (error?.code !== 'auth/unauthorized-continue-uri' && error?.code !== 'auth/invalid-continue-uri') throw error;
    await sendEmailVerification(user);
  }
}

/** First-time setup for staff added on the Staff page. */
export async function createStaffAccount(email, password) {
  const { user } = await createUserWithEmailAndPassword(getAdminAuth(), email.trim(), password);
  await resendVerification(user);
  return user;
}
