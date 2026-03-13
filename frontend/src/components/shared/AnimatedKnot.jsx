import { useEffect, useRef } from "react";
import "./AnimatedKnot.css";

/**
 * Two interlocked rings.
 * Geometry: left cx=45 cy=35 r=27, right cx=83 cy=35 r=27, dist=38
 * Intersect at (64, 15.8) and (64, 54.2)
 *
 * Layer order for correct over/under:
 *   z=1  left-BEHIND : small arc through RIGHT side of left ring (0 1 → 90° cw)
 *   z=2  right ring  : full circle (two semicircles)
 *   z=3  left-FRONT  : large arc through LEFT side of left ring (1 0 → 270° ccw)
 *
 * Animation: right ring draws in, then left ring threads through it.
 */
export default function AnimatedKnot({ size = 72 }) {
  const rightRef   = useRef(null);
  const lBehindRef = useRef(null);
  const lFrontRef  = useRef(null);

  useEffect(() => {
    const steps = [
      { ref: rightRef,   delay: 0,    dur: 1.15 },
      { ref: lBehindRef, delay: 0.65, dur: 0.5  },
      { ref: lFrontRef,  delay: 1.15, dur: 1.0  },
    ];
    steps.forEach(({ ref, delay, dur }) => {
      const el = ref.current;
      if (!el) return;
      const len = el.getTotalLength();
      el.style.strokeDasharray  = len;
      el.style.strokeDashoffset = len;
      el.style.animation =
        `knotDraw ${dur}s cubic-bezier(.35,0,.2,1) ${delay}s forwards`;
    });
  }, []);

  return (
    <svg
      className="knot-svg"
      width={size}
      height={size * 0.54}
      viewBox="0 0 128 70"
      fill="none"
    >
      {/* z=1 — left ring, small arc through RIGHT side (goes BEHIND right ring) */}
      <path
        ref={lBehindRef}
        className="knot-ring"
        d="M 64 15.8 A 27 27 0 0 1 64 54.2"
        strokeWidth="5"
        strokeLinecap="round"
      />

      {/* z=2 — right ring, full circle via two semicircles */}
      <path
        ref={rightRef}
        className="knot-ring"
        d="M 83 8 A 27 27 0 1 1 83 62 A 27 27 0 1 1 83 8"
        strokeWidth="5"
        strokeLinecap="round"
      />

      {/* z=3 — left ring, large arc through LEFT side (comes IN FRONT at top crossing) */}
      <path
        ref={lFrontRef}
        className="knot-ring"
        d="M 64 54.2 A 27 27 0 1 0 64 15.8"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}
