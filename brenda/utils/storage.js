import { getCurrentUser } from '../services/authService.js';

export function getCacheKey() {
  const uid = getCurrentUser()?.uid || 'local';
  return `bn_ags_cache_${uid}`;
}

export function loadCachedAgendamentos() {
  try {
    const raw = localStorage.getItem(getCacheKey());
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Falha ao ler cache local:', err);
    return [];
  }
}

export function saveCachedAgendamentos(list) {
  try {
    localStorage.setItem(getCacheKey(), JSON.stringify(list));
  } catch (err) {
    console.error('Falha ao salvar cache local:', err);
  }
}

