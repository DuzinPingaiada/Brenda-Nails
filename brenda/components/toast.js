let _toastTimer = null;

export function showToast(message, ms = 2800) {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.classList.add('show');
  // Inline fallback in case CSS is stale/not loaded.
  el.style.display = 'block';
  el.style.zIndex = '9999';
  if (_toastTimer) window.clearTimeout(_toastTimer);
  _toastTimer = window.setTimeout(() => {
    el.classList.remove('show');
    el.style.display = '';
  }, ms);
}

