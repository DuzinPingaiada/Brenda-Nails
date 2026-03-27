import { getFirebase } from './firebaseInit.js';
import { getCurrentUser } from './authService.js';

export function getAgendamentosRef() {
  const { db } = getFirebase();
  const user = getCurrentUser();
  if (!db || !user?.uid) return null;
  return db.collection('usuarios').doc(user.uid).collection('agendamentos');
}

export function listenAgendamentos(onData, onError) {
  const ref = getAgendamentosRef();
  if (!ref) return () => {};
  return ref.onSnapshot(
    (snap) => onData(snap.docs.map((d) => d.data())),
    (err) => onError?.(err)
  );
}

export async function upsertAgendamento(agendamento) {
  const ref = getAgendamentosRef();
  if (!ref) return;
  await ref.doc(agendamento.id).set(agendamento, { merge: true });
}

export async function deleteAgendamento(id) {
  const ref = getAgendamentosRef();
  if (!ref) return;
  await ref.doc(id).delete();
}

