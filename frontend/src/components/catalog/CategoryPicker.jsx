import { motion } from 'framer-motion';
import { CATEGORIES } from '../../lib/constants';
import './CategoryPicker.css';

export default function CategoryPicker({ active, onChange, progress = {} }) {
  const activeCat = CATEGORIES.find((c) => c.key === active);

  return (
    <>
      {/* Dropdown — shown below 375px */}
      <div className="category-dropdown-wrap">
        <select
          className="category-dropdown"
          value={active}
          onChange={(e) => onChange(e.target.value)}
        >
          {CATEGORIES.map((cat) => {
            const prog = progress[cat.key];
            return (
              <option key={cat.key} value={cat.key}>
                {cat.emoji} {cat.label}{prog ? ` (${prog.done}/${prog.total})` : ''}
              </option>
            );
          })}
        </select>
        <span className="category-dropdown-arrow">▾</span>
      </div>

      {/* Chips — shown above 375px */}
      <div className="category-picker hide-scrollbar">
        {CATEGORIES.map((cat) => {
          const isActive = active === cat.key;
          const prog = progress[cat.key];
          return (
            <motion.button
              key={cat.key}
              className={`category-chip ${isActive ? 'active' : ''}`}
              onClick={() => onChange(cat.key)}
              whileTap={{ scale: 0.95 }}
            >
              <span className="category-chip-emoji">{cat.emoji}</span>
              <span className="category-chip-label">{cat.label}</span>
              {prog && (
                <span className="category-chip-count">
                  {prog.done}/{prog.total}
                </span>
              )}
              {isActive && (
                <motion.span
                  className="category-chip-bg"
                  layoutId="category-active"
                  transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </>
  );
}
