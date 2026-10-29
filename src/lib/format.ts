export function formatMinutes(minutes: number): string {
  if (!minutes) return '—';
  if (minutes < 60) return `${minutes} דק׳`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} ש׳ ${rest} דק׳` : `${hours} ש׳`;
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
