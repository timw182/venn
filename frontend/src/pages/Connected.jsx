import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Button from "../components/shared/Button";
import { useAuth } from "../context/useAuth";
import { ROUTES } from "../lib/constants";
import "./Connected.css";

function createParticles(canvas) {
  const ctx = canvas.getContext("2d");
  const particles = [];
  const colors = ["#d89848", "#E8C4A8", "#D4B878", "#be8536", "#F5DFC8", "#7B9E6F"];

  canvas.width = canvas.offsetWidth * 2;
  canvas.height = canvas.offsetHeight * 2;
  ctx.scale(2, 2);

  for (let i = 0; i < 40; i++) {
    particles.push({
      x: canvas.offsetWidth / 2,
      y: canvas.offsetHeight / 2,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 6 - 2,
      size: Math.random() * 4 + 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1,
      decay: Math.random() * 0.01 + 0.005,
    });
  }

  let frame;
  function animate() {
    ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
    let alive = false;

    for (const p of particles) {
      if (p.alpha <= 0) continue;
      alive = true;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.02;
      p.vx *= 0.99;
      p.alpha -= p.decay;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    if (alive) frame = requestAnimationFrame(animate);
  }

  animate();
  return () => cancelAnimationFrame(frame);
}

export default function Connected() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current) {
      const timer = setTimeout(() => createParticles(canvasRef.current), 400);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <div className="connected">
      <canvas ref={canvasRef} className="connected-particles" />

      <motion.div
        className="connected-content"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
      >
        <motion.div
          className="connected-icon"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.3 }}
        >
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="9" cy="12" r="5" />
            <circle cx="15" cy="12" r="5" />
          </svg>
        </motion.div>

        <motion.h1
          className="connected-title serif"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          You're connected
        </motion.h1>

        <motion.p
          className="connected-names"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <span className="connected-name">{user?.displayName || "You"}</span>
          <span className="connected-ampersand serif">&</span>
          <span className="connected-name">{user?.partnerName || "Your person"}</span>
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}>
          <Button variant="primary" size="lg" onClick={() => navigate(ROUTES.BROWSE)}>
            Start exploring together
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
