export function digitsOnly(value) {
  return (value || '').replace(/\D/g, '');
}

export function formatTelefoneBR(value) {
  const v = digitsOnly(value).slice(0, 11);
  if (!v) return '';
  const ddd = v.slice(0, 2);
  if (v.length <= 2) return `(${ddd}`;
  if (v.length <= 7) return `(${ddd}) ${v.slice(2)}`;
  const p1 = v.slice(2, 7);
  const p2 = v.slice(7, 11);
  return `(${ddd}) ${p1}-${p2}`;
}

export function toWhatsAppE164(value) {
  const phoneNum = digitsOnly(value);
  return phoneNum ? `https://wa.me/55${phoneNum}` : '';
}

