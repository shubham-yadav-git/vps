import { useEffect, useState } from 'react';
import {
  connectAuthEmulator, getAuth, onAuthStateChanged, sendPasswordResetEmail,
  signInWithEmailAndPassword, signOut,
} from 'firebase/auth';
import { getFirebaseApp, USE_EMULATOR } from '../lib/firebase';

// Must match isAdmin() in firestore.rules; other accounts can sign in but can't save
export const ADMIN_EMAILS = ['admin@vikaspublicschool.in'];

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

export function isAdminUser(user) {
  return Boolean(user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase()));
}

const AUTH_MESSAGES = {
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/wrong-password': 'Incorrect email or password.',
  'auth/user-not-found': 'Incorrect email or password.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/too-many-requests': 'Too many attempts. Please wait a few minutes and try again.',
  'auth/network-request-failed': 'Could not connect. Check your internet connection.',
  'auth/user-disabled': 'This account has been disabled.',
};

export function authErrorMessage(error) {
  return AUTH_MESSAGES[error?.code] || error?.message || 'Sign-in failed. Please try again.';
}

export const signIn = (email, password) => signInWithEmailAndPassword(getAdminAuth(), email.trim(), password);
export const signOutAdmin = () => signOut(getAdminAuth());
export const resetPassword = email => sendPasswordResetEmail(getAdminAuth(), email.trim());
