import { useRef } from "react";
import "./FloatingHearts.css";

const HEART_COUNT = 12;
const HEART_COLORS = ["#F07A6A", "#9B80D4", "#C4547A", "#9B80D4", "#F07A6A"];

export default function FloatingHearts() {
  const hearts = useRef(
    Array.from({ length: HEART_COUNT }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: 40 + Math.random() * 60,
      delay: Math.random() * 12,
      duration: 14 + Math.random() * 10,
      drift: (Math.random() - 0.5) * 120,
      color: HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)],
    })),
  ).current;

  return (
    <div className="hearts-bg" aria-hidden="true">
      {hearts.map((h) => (
        <span
          key={h.id}
          className="heart-float"
          style={{
            left: `${h.left}%`,
            fontSize: `${h.size}px`,
            animationDelay: `${h.delay}s`,
            animationDuration: `${h.duration}s`,
            "--drift": `${h.drift}px`,
            color: h.color,
          }}
        >
          ♥
        </span>
      ))}
    </div>
  );
}
