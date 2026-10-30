import { CATEGORIES, LEVELS, TRACKS } from '@/lib/taxonomy';

export type CourseFilterValues = {
  q?: string;
  level?: string;
  category?: string;
  track?: string;
  access?: string;
  sort?: string;
  tag?: string;
};

const SORTS = [
  { value: '', label: 'סדר לימוד' },
  { value: 'short', label: 'הקצרים קודם' },
  { value: 'long', label: 'הארוכים קודם' },
  { value: 'level', label: 'מהקל לקשה' },
  { value: 'title', label: 'לפי שם' },
];

const ACCESS = [
  { value: '', label: 'כל סוגי הגישה' },
  { value: 'free', label: 'חינם' },
  { value: 'premium', label: 'במנוי' },
];

/**
 * One filter bar for /courses, /tracks/[track] and /categories/[category].
 * Fixed dimensions (a track page always filters by its track) are hidden and
 * carried as hidden inputs so the URL stays canonical.
 */
export function CourseFilterBar({
  action,
  values,
  count,
  fixed = [],
}: {
  action: string;
  values: CourseFilterValues;
  count: number;
  fixed?: ('category' | 'track')[];
}) {
  const showCategory = !fixed.includes('category');
  const showTrack = !fixed.includes('track');

  return (
    <form className="filters" method="get" action={action} role="search">
      <label className="sr-only" htmlFor="q">
        חיפוש קורס
      </label>
      <input id="q" type="search" name="q" defaultValue={values.q ?? ''} placeholder="חיפוש: docker, typescript, חשמל…" />

      <label className="sr-only" htmlFor="level">
        רמה
      </label>
      <select id="level" name="level" defaultValue={values.level ?? ''}>
        <option value="">כל הרמות</option>
        {LEVELS.map((level) => (
          <option key={level.value} value={level.value}>
            {level.label}
          </option>
        ))}
      </select>

      {showCategory ? (
        <>
          <label className="sr-only" htmlFor="category">
            נושא
          </label>
          <select id="category" name="category" defaultValue={values.category ?? ''}>
            <option value="">כל הנושאים</option>
            {CATEGORIES.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.label}
              </option>
            ))}
          </select>
        </>
      ) : (
        <input type="hidden" name="category" value={values.category ?? ''} />
      )}

      {showTrack ? (
        <>
          <label className="sr-only" htmlFor="track">
            מסלול
          </label>
          <select id="track" name="track" defaultValue={values.track ?? ''}>
            <option value="">כל המסלולים</option>
            {TRACKS.map((track) => (
              <option key={track.slug} value={track.slug}>
                {track.label}
              </option>
            ))}
          </select>
        </>
      ) : (
        <input type="hidden" name="track" value={values.track ?? ''} />
      )}

      <label className="sr-only" htmlFor="access">
        גישה
      </label>
      <select id="access" name="access" defaultValue={values.access ?? ''}>
        {ACCESS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <label className="sr-only" htmlFor="sort">
        מיון
      </label>
      <select id="sort" name="sort" defaultValue={values.sort ?? ''}>
        {SORTS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {values.tag ? <input type="hidden" name="tag" value={values.tag} /> : null}

      <button type="submit" className="btn small">
        סינון
      </button>
      <span className="count">{count} קורסים</span>
    </form>
  );
}
