import { firebaseConfig } from './firebaseConfig.js';

let _auth = null;
let _db = null;
let _ready = false;

/**
 * Uses Firebase compat SDK loaded via script tags.
 * Keeps behavior consistent with the legacy single-file version.
 */
export function initFirebase() {
  try {
    if (!window.firebase) throw new Error('Firebase compat SDK not loaded');
    // Avoid double init
    if (window.firebase.apps && window.firebase.apps.length) {
      const app = window.firebase.app();
      _auth = window.firebase.auth(app);
      _db = window.firebase.firestore(app);
    } else {
      const app = window.firebase.initializeApp(firebaseConfig);
      _auth = window.firebase.auth(app);
      _db = window.firebase.firestore(app);
    }
    _ready = Object.values(firebaseConfig).every((v) => !!v);
  } catch (err) {
    console.error(err);
    _ready = false;
  }
  return { auth: _auth, db: _db, ready: _ready };
}

export function getFirebase() {
  return { auth: _auth, db: _db, ready: _ready };
}

