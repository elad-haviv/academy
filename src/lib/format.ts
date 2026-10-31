/**
 * Hebrew needs singular/dual/plural forms wherever a number meets a noun —
 * "1 מעבדות" is wrong. Use countLabel, never string concatenation.
 */

export function countLabel(n: number, one: string, two: string, many: string): string {
  if (n === 1) return `${n} ${one}`;
  if (n === 2) return `${n} ${two}`;
  return `${n} ${many}`;
}

export function lessons(n: number) {
  return countLabel(n, 'שיעור', 'שיעורים', 'שיעורים');
}

export function labs(n: number) {
  return countLabel(n, 'מעבדה', 'מעבדות', 'מעבדות');
}

export function tutorials(n: number) {
  return countLabel(n, 'מדריך', 'מדריכים', 'מדריכים');
}

/** Durations in Hebrew units, always with the unit next to the number. */
export function duration(minutes: number): string {
  if (!minutes) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h} ש׳ ${m} דק׳`;
  if (h) return `${h} ש׳`;
  return `${m} דק׳`;
}

export function heDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Prices need bidi isolation inside an RTL line. */
export function ils(amount: number): string {
  return `${amount.toLocaleString('he-IL')} ₪`;
}
