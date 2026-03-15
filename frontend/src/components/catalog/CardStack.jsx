import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, useAnimation } from "framer-motion";
import ItemCard from "./ItemCard";
import "./CardStack.css";

const SWIPE_THRESHOLD = 100;
const SWIPE_UP_THRESHOLD = 80;
const MAX_ROTATION = 12;
const VISIBLE_CARDS = 3;

// ── TopCard: own x/y per card, so each new card starts at origin ──────────────
function TopCard({ item, exitDirection, hintClass, isMaybe, onDragUpdate, onSwipe, isAnimating, locked }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-MAX_ROTATION, 0, MAX_ROTATION]);
  const controls = useAnimation();

  const exitVariants = {
    right: { x: 380,  rotate: 18,  opacity: 0, transition: { duration: 0.28, ease: [0.32, 0, 0.67, 0] } },
    left:  { x: -380, rotate: -18, opacity: 0, transition: { duration: 0.28, ease: [0.32, 0, 0.67, 0] } },
    maybe: { y: -40, scale: 0.92, opacity: 0,  transition: { duration: 0.22 } },
    none:  { opacity: 0, transition: { duration: 0 } },
  };

  function handleDrag(_, info) {
    onDragUpdate(info.offset.x, info.offset.y);
  }

  async function handleDragEnd(_, info) {
    const { offset, velocity } = info;
    const xAbs = Math.abs(offset.x);
    const yUp  = -offset.y;

    if (yUp > SWIPE_UP_THRESHOLD && yUp > xAbs) {
      onSwipe("maybe");
    } else if (offset.x > SWIPE_THRESHOLD || velocity.x > 500) {
      onSwipe("yes");
    } else if (offset.x < -SWIPE_THRESHOLD || velocity.x < -500) {
      onSwipe("no");
    } else {
      onDragUpdate(0, 0);
      controls.start({ x: 0, y: 0, transition: { type: "spring", stiffness: 400, damping: 28 } });
    }
  }

  return (
    <motion.div
      className="card-stack-draggable"
      animate={controls}
      style={{ x, y, rotate, zIndex: VISIBLE_CARDS, userSelect: "none", cursor: isAnimating ? "default" : "grab" }}
      whileDrag={{ cursor: "grabbing" }}
      drag={!isAnimating && !locked}
      dragMomentum={false}
      dragElastic={0.6}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      exit={exitDirection ? exitVariants[exitDirection] : exitVariants.none}
    >
      <ItemCard item={item} className={`${hintClass}${isMaybe ? " hint-maybe" : ""}`} />
    </motion.div>
  );
}

// ── CardStack ─────────────────────────────────────────────────────────────────
export default function CardStack({ items = [], onRespond, matchItem, onMatchDismiss, onUndo }) {
  const [localItems, setLocalItems]   = useState(items);
  const [exitDirection, setExitDirection] = useState(null);
  const [hintClass, setHintClass]     = useState("");
  const [isAnimating, setIsAnimating] = useState(false);
  const [maybeIds, setMaybeIds]       = useState(new Set());
  const responding = useRef(false);
  const itemsRef   = useRef(items);

  const hintX = useMotionValue(0);
  const hintY = useMotionValue(0);
  const hintNoOpacity    = useTransform(hintX, [-150, -60, 0], [1, 0.5, 0]);
  const hintMaybeOpacity = useTransform(hintY, [0, -40, -80], [0, 0.5, 1]);
  const hintYesOpacity   = useTransform(hintX, [0, 60, 150], [0, 0.5, 1]);

  useEffect(() => { itemsRef.current = items; }, [items]);

  useEffect(() => {
    if (!responding.current) setLocalItems(locked ? items.slice(0,1) : items);
  }, [items]);

  const handleDragUpdate = useCallback((ox, oy) => {
    hintX.set(ox);
    hintY.set(oy);
    const yUp = -oy;
    if (yUp > SWIPE_UP_THRESHOLD * 0.6 && yUp > Math.abs(ox)) setHintClass("hint-maybe");
    else if (ox > SWIPE_THRESHOLD * 0.6) setHintClass("hint-yes");
    else if (ox < -SWIPE_THRESHOLD * 0.6) setHintClass("hint-no");
    else setHintClass("");
  }, [hintX, hintY]);

  const triggerResponse = useCallback((response) => {
    if (responding.current || localItems.length === 0) return;
    responding.current = true;
    setIsAnimating(true);
    setHintClass("");
    hintX.set(0); hintY.set(0);

    if (response === "maybe") {
      const topItem = localItems[0];
      // Add to maybeIds for orange tint
      setMaybeIds(prev => new Set([...prev, topItem.id]));
      setExitDirection("maybe");

      setTimeout(() => {
        // Move top card to back
        setLocalItems(prev => [...prev.slice(1), topItem]);
        setTimeout(() => {
          setExitDirection(null);
          responding.current = false;
          setIsAnimating(false);
        }, 280);
      }, 30);
      return;
    }

    const dir = response === "yes" ? "right" : "left";
    setExitDirection(dir);
    onRespond?.(localItems[0]?.id, response);

    setTimeout(() => {
      setLocalItems(itemsRef.current);
      setTimeout(() => {
        setExitDirection(null);
        responding.current = false;
        setIsAnimating(false);
      }, 380);
    }, 30);
  }, [localItems, hintX, hintY, onRespond]);

  // Empty state
  if (localItems.length === 0 && !exitDirection) {
    return (
      <div className="card-stack-empty">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="card-stack-empty-inner">
          <span className="card-stack-empty-icon">✓</span>
          <p className="card-stack-empty-text serif">You've seen everything</p>
          <p className="card-stack-empty-sub text-muted">Try another category or check your matches</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="card-stack-wrapper">
      {/* Match overlay */}
      <AnimatePresence>
        {matchItem && (
          <motion.div className="card-stack-match-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onMatchDismiss}>
            <motion.div className="card-stack-match-content" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} transition={{ type: "spring", stiffness: 200, damping: 15 }}>
              <span className="card-stack-match-emoji">{matchItem.emoji}</span>
              <h3 className="card-stack-match-title serif">It's a match</h3>
              <p className="card-stack-match-item">{matchItem.title}</p>
              <p className="card-stack-match-sub text-muted">You both want this</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="card-stack">
        <AnimatePresence>
          {localItems.length > 0 && (
            <TopCard
              key={localItems[0].id}
              item={localItems[0]}
              exitDirection={exitDirection}
              hintClass={hintClass}
              isMaybe={maybeIds.has(localItems[0].id)}
              onDragUpdate={handleDragUpdate}
              onSwipe={triggerResponse}
              isAnimating={isAnimating}
                locked={locked}
            />
          )}
        </AnimatePresence>

        {localItems.slice(1, VISIBLE_CARDS).map((item, i) => {
          const idx    = i + 1;
          const scale  = 1 - idx * 0.04;
          const yOffset = idx * 10;
          return (
            <motion.div key={item.id} className="card-stack-behind" style={{ zIndex: VISIBLE_CARDS - idx }}
              initial={{ scale: scale - 0.02, y: yOffset + 5 }} animate={{ scale, y: yOffset }} transition={{ duration: 0.3 }}>
              <ItemCard item={item} className={maybeIds.has(item.id) ? "hint-maybe" : ""} />
            </motion.div>
          );
        })}
      </div>

      {/* Hint labels */}
      <div className="card-stack-hints">
        <motion.span className="card-stack-hint hint-no-label"    style={{ opacity: hintNoOpacity }}>Nope</motion.span>
        <motion.span className="card-stack-hint hint-maybe-label" style={{ opacity: hintMaybeOpacity }}>Maybe</motion.span>
        <motion.span className="card-stack-hint hint-yes-label"   style={{ opacity: hintYesOpacity }}>Yes</motion.span>
      </div>

      {/* Buttons */}
      <div className="card-stack-buttons">
        <motion.button className="response-btn response-undo" whileTap={{ scale: 0.88 }} onClick={onUndo} disabled={!onUndo} aria-label="Undo">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>
        </motion.button>
        <motion.button className="response-btn response-no"   whileTap={{ scale: 0.88 }} onClick={() => triggerResponse("no")}    disabled={isAnimating} aria-label="No">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </motion.button>
        <motion.button className="response-btn response-maybe" whileTap={{ scale: 0.88 }} onClick={() => triggerResponse("maybe")} disabled={isAnimating} aria-label="Maybe">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
        </motion.button>
        <motion.button className="response-btn response-yes"  whileTap={{ scale: 0.88 }} onClick={() => triggerResponse("yes")}   disabled={isAnimating} aria-label="Yes">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
        </motion.button>
      </div>
    </div>
  );
}
