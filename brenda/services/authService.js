import { getFirebase } from './firebaseInit.js';

export async function signInWithEmailPassword(email, password) {
  const { auth, ready } = getFirebase();
  if (!ready || !auth) throw new Error('FIREBASE_NOT_READY');
  return await auth.signInWithEmailAndPassword(email, password);
}

export async function signOut() {
  const { auth } = getFirebase();
  if (!auth) return;
  return await auth.signOut();
}

export function onAuthStateChanged(cb) {
  const { auth } = getFirebase();
  if (!auth) return () => {};
  return auth.onAuthStateChanged(cb);
}

export function getCurrentUser() {
  const { auth } = getFirebase();
  return auth?.currentUser || null;
}

