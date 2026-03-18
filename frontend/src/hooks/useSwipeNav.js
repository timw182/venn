import { useEffect, useRef } from 'react';

/**
 * Attaches horizontal swipe detection to a ref'd element.
 * Callbacks are always up-to-date via refs — no re-attach needed.
 *
 * @param {React.RefObject} ref
 * @param {function} onSwipeLeft  - right-to-left swipe
 * @param {function} onSwipeRight - left-to-right swipe
 * @param {{ threshold?: number, edgeOnly?: boolean, edgeSize?: number, excludeSelector?: string }} opts
 */
export default function useSwipeNav(ref, onSwipeLeft, onSwipeRight, opts = {}) {
  const startRef   = useRef(null);
  const leftRef    = useRef(onSwipeLeft);
  const rightRef   = useRef(onSwipeRight);
  const optsRef    = useRef(opts);

  // Keep callback / opts refs fresh every render
  leftRef.current  = onSwipeLeft;
  rightRef.current = onSwipeRight;
  optsRef.current  = opts;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    function onPointerDown(e) {
      const { edgeOnly = false, edgeSize = 40, excludeSelector } = optsRef.current;
      if (excludeSelector && e.target.closest(excludeSelector)) return;
      if (edgeOnly) {
        const atLeft  = e.clientX < edgeSize;
        const atRight = e.clientX > window.innerWidth - edgeSize;
        if (!atLeft && !atRight) return;
      }
      startRef.current = { x: e.clientX, y: e.clientY };
    }

    function onPointerUp(e) {
      if (!startRef.current) return;
      const { threshold = 60 } = optsRef.current;
      const dx = e.clientX - startRef.current.x;
      const dy = e.clientY - startRef.current.y;
      startRef.current = null;
      // Ignore if primarily vertical
      if (Math.abs(dy) > Math.abs(dx) * 0.75) return;
      if (dx < -threshold) leftRef.current?.();
      else if (dx > threshold) rightRef.current?.();
    }

    el.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      el.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [ref]); // listeners only re-attach if ref changes
}
