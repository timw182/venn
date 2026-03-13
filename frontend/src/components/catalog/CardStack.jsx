import { useState, useRef, useEffect } from "react";
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import ItemCard from "./ItemCard";
import "./CardStack.css";

const SWIPE_THRESHOLD = 100;
const SWIPE_UP_THRESHOLD = 80;
const MAX_ROTATION = 10;
const VISIBLE_CARDS = 3;

export default function CardStack({ items = [], onRespond, matchItem, onMatchDismiss, onUndo }) {
  const [localItems, setLocalItems] = useState(items);
  const [exitDirection, setExitDirection] = useState(null);
  const [hintClass, setHintClass] = useState("");
  const responding = useRef(false);
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-MAX_ROTATION, 0, MAX_ROTATION]);
  const hintNoOpacity = useTransform(x, [-150, -60, 0], [1, 0.5, 0]);
  const hintMaybeOpacity = useTransform(y, [0, -40, -80], [0, 0.5, 1]);
  const hintYesOpacity = useTransform(x, [0, 60, 150], [0, 0.5, 1]);

  // Sync items from parent whenever not mid-animation
  useEffect(() => {
    if (responding.current) return;
    setLocalItems(items);
  }, [items]);

  function getHintClass() {
    const xVal = x.get();
    const yVal = y.get();
    if (yVal < -SWIPE_UP_THRESHOLD) return "hint-maybe";
    if (xVal > SWIPE_THRESHOLD * 0.6) return "hint-yes";
    if (xVal < -SWIPE_THRESHOLD * 0.6) return "hint-no";
    return "";
  }

  function handleDrag() {
    setHintClass(getHintClass());
  }

  function triggerResponse(response) {
    if (responding.current || localItems.length === 0) return;
    responding.current = true;
    setHintClass("");

    const dir = response === "yes" ? "right" : response === "no" ? "left" : "up";
    setExitDirection(dir);
    onRespond?.(localItems[0]?.id, response);

    // Step 1: Remove item after a tick so exitDirection is committed before removal.
    // AnimatePresence will then play the correct exit animation.
    setTimeout(() => {
      x.set(0);
      y.set(0);
      setLocalItems(itemsRef.current);

      // Step 2: Clear exit state after animation finishes
      setTimeout(() => {
        responding.current = false;
        setExitDirection(null);
      }, 400);
    }, 30);
  }

  function handleDragEnd(_, info) {
    const { offset, velocity } = info;
    const xAbs = Math.abs(offset.x);
    const yUp = -offset.y;

    if (yUp > SWIPE_UP_THRESHOLD && yUp > xAbs) {
      triggerResponse("maybe");
    } else if (offset.x > SWIPE_THRESHOLD || velocity.x > 500) {
      triggerResponse("yes");
    } else if (offset.x < -SWIPE_THRESHOLD || velocity.x < -500) {
      triggerResponse("no");
    }

    setHintClass("");
  }

  const exitVariants = {
    right: { x: 400, rotate: 15, opacity: 0 },
    left: { x: -400, rotate: -15, opacity: 0 },
    up: { y: -350, opacity: 0, scale: 0.9 },
  };

  // Show empty state only when no local items AND not mid-exit
  if (localItems.length === 0 && !exitDirection) {
    return (
      <div className="card-stack-empty">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card-stack-empty-inner"
        >
          <span className="card-stack-empty-icon">✓</span>
          <p className="card-stack-empty-text serif">You've seen everything</p>
          <p className="card-stack-empty-sub text-muted">Try another category or check your matches</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="card-stack-wrapper">
      {/* Match celebration overlay */}
      <AnimatePresence>
        {matchItem && (
          <motion.div
            className="card-stack-match-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onMatchDismiss}
          >
            <motion.div
              className="card-stack-match-content"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
            >
              <span className="card-stack-match-emoji">{matchItem.emoji}</span>
              <h3 className="card-stack-match-title serif">It's a match</h3>
              <p className="card-stack-match-item">{matchItem.title}</p>
              <p className="card-stack-match-sub text-muted">You both want this</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="card-stack">
        <AnimatePresence mode="popLayout">
          {localItems.slice(0, VISIBLE_CARDS).map((item, i) => {
            const isTop = i === 0;
            const scale = 1 - i * 0.04;
            const yOffset = i * 10;

            if (isTop) {
              return (
                <motion.div
                  key={item.id}
                  className="card-stack-draggable"
                  style={{ x, y, rotate, zIndex: VISIBLE_CARDS - i }}
                  drag
                  dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                  dragElastic={0.9}
                  onDrag={handleDrag}
                  onDragEnd={handleDragEnd}
                  exit={exitDirection ? exitVariants[exitDirection] : { opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                >
                  <ItemCard item={item} className={hintClass} />
                </motion.div>
              );
            }

            return (
              <motion.div
                key={item.id}
                className="card-stack-behind"
                style={{ zIndex: VISIBLE_CARDS - i }}
                initial={{ scale: scale - 0.02, y: yOffset + 5 }}
                animate={{ scale, y: yOffset }}
                transition={{ duration: 0.3 }}
              >
                <ItemCard item={item} />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Swipe hint labels */}
      <div className="card-stack-hints">
        <motion.span className="card-stack-hint hint-no-label" style={{ opacity: hintNoOpacity }}>
          Nope
        </motion.span>
        <motion.span className="card-stack-hint hint-maybe-label" style={{ opacity: hintMaybeOpacity }}>
          Maybe
        </motion.span>
        <motion.span className="card-stack-hint hint-yes-label" style={{ opacity: hintYesOpacity }}>
          Yes
        </motion.span>
      </div>

      {/* Response buttons */}
      <div className="card-stack-buttons">
        <motion.button
          className="response-btn response-undo"
          whileTap={{ scale: 0.88 }}
          onClick={onUndo}
          disabled={!onUndo}
          aria-label="Undo"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 14 4 9 9 4" />
            <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
          </svg>
        </motion.button>
        <motion.button
          className="response-btn response-no"
          whileTap={{ scale: 0.88 }}
          onClick={() => triggerResponse("no")}
          aria-label="No"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </motion.button>

        <motion.button
          className="response-btn response-maybe"
          whileTap={{ scale: 0.88 }}
          onClick={() => triggerResponse("maybe")}
          aria-label="Maybe"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        </motion.button>

        <motion.button
          className="response-btn response-yes"
          whileTap={{ scale: 0.88 }}
          onClick={() => triggerResponse("yes")}
          aria-label="Yes"
        >
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </motion.button>
      </div>
    </div>
  );
}
