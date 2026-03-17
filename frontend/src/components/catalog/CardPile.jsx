// depth 0 = top card (newest), depth 1 = one below, etc.
const PILE_OFFSETS = [
  { rotate:  1, x:  0, y: 0 },
  { rotate: -4, x:  1, y: 3 },
  { rotate:  3, x: -1, y: 5 },
  { rotate: -5, x:  1, y: 7 },
  { rotate:  5, x: -1, y: 9 },
];

export default function CardPile({ items, side, totalCount }) {
  const capped = items.slice(0, 5);

  return (
    <div className={`catalog-pile catalog-pile-${side}`}>
      <div className="catalog-pile-stack">
        {[...capped].reverse().map((item, revI) => {
          const depth = capped.length - 1 - revI;
          const isTop = depth === 0;
          const off   = PILE_OFFSETS[depth] ?? PILE_OFFSETS[PILE_OFFSETS.length - 1];
          return (
            <div
              key={item.id}
              className={`catalog-pile-card-wrap pile-${side}`}
              style={{
                transform:  `rotate(${off.rotate}deg) translate(${off.x}px, ${off.y}px) translateZ(0)`,
                boxShadow:  isTop ? '0 2px 10px rgba(0,0,0,0.12)' : 'none',
                zIndex:     capped.length - depth,
                isolation:  'isolate',
              }}
            >
              {isTop && (
                <>
                  <span className="catalog-pile-emoji">{item.emoji}</span>
                  <p className="catalog-pile-title">{item.title}</p>
                </>
              )}
            </div>
          );
        })}
      </div>

      {(totalCount ?? items.length) > 0 && (
        <span className="catalog-pile-count">
          {side === 'yes' ? '\u2713' : '\u2715'} {totalCount ?? items.length}
        </span>
      )}
    </div>
  );
}
