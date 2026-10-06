import { useEffect, useState } from 'react';

// Set by the admin panel while the admin is signed in, so the public site can show
// a shortcut without loading Firebase Auth for every visitor. It only reveals a link;
// access is still enforced by the admin sign-in and firestore.rules.
const KEY = 'vps:admin-signed-in';

export function setAdminFlag(signedIn) {
  try {
    if (signedIn) localStorage.setItem(KEY, '1');
    else localStorage.removeItem(KEY);
  } catch { /* storage blocked */ }
}

export function useAdminFlag() {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    const read = () => {
      try { setSignedIn(localStorage.getItem(KEY) === '1'); } catch { setSignedIn(false); }
    };
    read();
    // Stay in sync when signing in or out in another tab
    window.addEventListener('storage', read);
    return () => window.removeEventListener('storage', read);
  }, []);
  return signedIn;
}
