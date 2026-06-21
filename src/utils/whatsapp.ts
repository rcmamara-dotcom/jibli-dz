export function waDigits(num: string): string {
  let d = String(num || '').replace(/[^\d+]/g, '');
  if (d.startsWith('+')) d = d.slice(1);
  else if (d.startsWith('00')) d = d.slice(2);
  return d;
}

export function waValid(num: string): boolean {
  const raw = String(num || '').trim().replace(/\s/g, '');
  const intl = raw.startsWith('+') || raw.startsWith('00');
  const d = waDigits(num);
  return intl && d.length >= 8 && d.length <= 15 && !d.startsWith('0');
}

export function formatWA(num: string, msg: string): string {
  return `https://wa.me/${waDigits(num)}?text=${encodeURIComponent(msg)}`;
}
