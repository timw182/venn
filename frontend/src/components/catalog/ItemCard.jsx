import { forwardRef } from 'react';
import './ItemCard.css';

const tierLabels = {
  quick: 'Quick',
  standard: 'Standard',
  splurge: 'Splurge',
};

const ItemCard = forwardRef(function ItemCard({ item, style, className = '' }, ref) {
  if (!item) return null;

  return (
    <div
      ref={ref}
      className={`item-card ${className}`}
      style={style}
    >
      <div className="item-card-inner">
        <span className="item-card-tier">{tierLabels[item.tier] || item.tier}</span>
        <div className="item-card-hero">
          <span className="item-card-emoji">{item.emoji}</span>
        </div>
        <h3 className="item-card-title serif">{item.title}</h3>
        <p className="item-card-desc">{item.description}</p>
      </div>
      <div className="item-card-gradient" />
    </div>
  );
});

export default ItemCard;
