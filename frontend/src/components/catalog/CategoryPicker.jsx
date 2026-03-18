import { motion, AnimatePresence } from 'framer-motion';
import { CATEGORIES } from '../../lib/constants';
import haptic from '../../lib/haptics';
import './CategoryPicker.css';

export default function CategoryPicker({ active, onChange, progress = {} }) {
  const activeIdx = CATEGORIES.findIndex((c) => c.key === active);
  const activeCat = CATEGORIES[activeIdx];
  const prog = progress[active];

  function go(dir) {
    const next = (activeIdx + dir + CATEGORIES.length) % CATEGORIES.length;
    haptic.light();
    onChange(CATEGORIES[next].key);
  }

  return (
    <div className="category-carousel">
      <button className="carousel-arrow carousel-arrow-left" onClick={() => go(-1)} aria-label="Previous category">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
      </button>

      <div className="carousel-slide-wrap">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            className="carousel-slide"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.18 }}
          >
            <span className="carousel-emoji">{activeCat?.emoji}</span>
            <span className="carousel-label">{activeCat?.label}</span>
            {prog && (
              <span className="carousel-count">{prog.done}/{prog.total}</span>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <button className="carousel-arrow carousel-arrow-right" onClick={() => go(1)} aria-label="Next category">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
      </button>

      <div className="carousel-dots">
        {CATEGORIES.map((cat, i) => (
          <span
            key={cat.key}
            className={`carousel-dot${i === activeIdx ? ' active' : ''}`}
            onClick={() => { haptic.light(); onChange(cat.key); }}
          />
        ))}
      </div>
    </div>
  );
}
