'use client';

import { useEffect } from 'react';

/**
 * Mobile pricing is a swipe rail. Open it focused on the recommended plan
 * instead of the first card.
 *
 * Only acts when the rail actually overflows (phone layout) — the desktop
 * three-column grid does not scroll, so nothing moves there.
 *
 * Hydration replaces the server markup after this component mounts, which can
 * silently reset `scrollLeft` right after we set it, so the alignment is
 * re-applied on the next frame and once more shortly after, and it backs off
 * as soon as the visitor touches or scrolls the rail themselves.
 */
export function PricingRailFocus() {
  useEffect(() => {
    const rail = document.querySelector<HTMLElement>('.plans');
    if (!rail || rail.scrollWidth <= rail.clientWidth + 1) return;
    const hi = rail.querySelector<HTMLElement>('.plan-hi');
    if (!hi) return;

    let cancelled = false;
    const cancel = () => {
      cancelled = true;
    };
    for (const evt of ['pointerdown', 'touchstart', 'wheel', 'keydown'] as const) {
      rail.addEventListener(evt, cancel, { passive: true, once: true });
    }

    const align = () => {
      if (cancelled || rail.scrollWidth <= rail.clientWidth + 1) return;
      const s = getComputedStyle(rail);
      const rtl = s.direction === 'rtl';
      const pad = parseFloat(s.paddingInlineStart) || 0;
      const c = rail.getBoundingClientRect();
      const r = hi.getBoundingClientRect();
      // scrollLeft delta that puts the card on the inline-start edge; the same
      // relation holds in RTL, where Chromium reports a negative scrollLeft
      const delta = rtl ? r.right - (c.right - pad) : r.left - (c.left + pad);
      if (Math.abs(delta) < 1) return;
      rail.scrollBy({ left: delta, behavior: 'auto' });
    };

    align();
    const raf = requestAnimationFrame(align);
    const timer = window.setTimeout(align, 250);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      for (const evt of ['pointerdown', 'touchstart', 'wheel', 'keydown'] as const) {
        rail.removeEventListener(evt, cancel);
      }
    };
  }, []);

  return null;
}
