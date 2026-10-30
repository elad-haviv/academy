export function formatMinutes(minutes: number): string {
  if (!minutes) return '—';
  if (minutes < 60) return `${minutes} דק׳`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const hourWord = hours === 1 ? 'שעה' : 'שעות';
  return rest ? `${hours} ${hourWord} ${rest} דק׳` : `${hours} ${hourWord}`;
}

export function formatDate(value: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

/** Hebrew counting: 1 takes the singular, 0 and 2+ take the plural. */
export function countLabel(n: number, singular: string, plural: string): string {
  if (n === 1) return `1 ${singular}`;
  return `${n} ${plural}`;
}
