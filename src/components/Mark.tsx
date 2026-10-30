type MarkProps = {
  size?: number;
  mono?: boolean;
  className?: string;
  title?: string;
};

/**
 * Haviv Academy mark: an H drawn as one continuous ribbon, lime on the left leg and
 * cyan on the right, split at the bridge centreline: the two pigments meet, no gap. Two filled paths
 * rather than one clipped path so the mark can be inlined many times per page.
 */
export function Mark({ size = 32, mono = false, className, title = 'Haviv Academy' }: MarkProps) {
  const left = 'M 11 8 H 17 A 3 3 0 0 1 20 11 V 26 H 32 V 38 H 20 V 53 A 3 3 0 0 1 17 56 H 11 A 3 3 0 0 1 8 53 V 11 A 3 3 0 0 1 11 8 Z';
  const right = 'M 32 26 H 44 V 11 A 3 3 0 0 1 47 8 H 53 A 3 3 0 0 1 56 11 V 53 A 3 3 0 0 1 53 56 H 47 A 3 3 0 0 1 44 53 V 38 H 32 Z';
  const a = mono ? 'currentColor' : '#9de501';
  const b = mono ? 'currentColor' : '#04bde6';
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={title}
      focusable="false"
    >
      <path d={left} fill={a} />
      <path d={right} fill={b} />
    </svg>
  );
}
