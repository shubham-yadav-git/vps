import { initializeApp, getApps } from 'firebase/app';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore/lite';

// Firebase web config is public by design; access is controlled by firestore.rules
const firebaseConfig = {
  apiKey: 'AIzaSyDZH0ZcGAtrILqdRdI5dIhZCUA0eAJzRpE',
  authDomain: 'vpschool-918d6.firebaseapp.com',
  projectId: 'vpschool-918d6',
  storageBucket: 'vpschool-918d6.firebasestorage.app',
  messagingSenderId: '290237090155',
  appId: '1:290237090155:web:90356cb12d25d5a0a8a42e',
  measurementId: 'G-02JK84S8NH',
};

// Set VITE_FIREBASE_EMULATOR=1 (dev only) to use local emulators instead of the live project
export const USE_EMULATOR = import.meta.env.DEV && import.meta.env.VITE_FIREBASE_EMULATOR === '1';

let db;

export function getFirebaseApp() {
  return getApps()[0] || initializeApp(firebaseConfig);
}

// Lazily created so nothing touches Firebase during the build-time prerender.
// Uses the Lite SDK (one-off reads and writes only, much smaller); caching is done in content.js
// (multi-tab IndexedDB persistence caused spurious empty reads on the old site).
export function getDb() {
  if (!db) {
    db = getFirestore(getFirebaseApp());
    if (USE_EMULATOR) connectFirestoreEmulator(db, '127.0.0.1', 8085);
  }
  return db;
}
