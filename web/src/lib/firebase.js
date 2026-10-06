import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore/lite';

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

let db;

// Lazily created so nothing touches Firebase during the build-time prerender.
// Uses the Lite SDK (one-off reads only, much smaller); caching is done in content.js
// (multi-tab IndexedDB persistence caused spurious empty reads on the old site).
export function getDb() {
  if (!db) {
    const app = getApps()[0] || initializeApp(firebaseConfig);
    db = getFirestore(app);
  }
  return db;
}
