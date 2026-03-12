# Browse Screen Layout Fix

**Date:** 2026-03-13
**Status:** Approved

## Problem

On iPhone 12 (native), the Browse screen layout is broken: the card stack overflows or has no breathing room, and the category chips appear oversized. The root cause is that the native tab bar consumes 106pt (72pt explicit + 34pt home indicator safe area) versus 72pt on web. The card height uses a hardcoded aspect ratio (`CARD_WIDTH × 1.32`) that doesn't account for the actual available vertical space after the tab bar, safe areas, and other chrome.

## Goal

Make the Browse screen render the same proportions on native iPhone 12 as it does in the browser — card fills available vertical space, category strip is compact.

## Changes

### 1. `BrowseScreen.jsx` — measure available height

Add `onLayout` to the `stackArea` View. When the view lays out, capture its `height` in local state and pass it as `availableHeight` to `CardStack`.

```jsx
const [stackHeight, setStackHeight] = useState(0);

<View
  style={styles.stackArea}
  onLayout={(e) => setStackHeight(e.nativeEvent.layout.height)}
>
  <CardStack
    items={categoryItems}
    onRespond={handleRespond}
    matchItem={matchItem}
    onUndo={lastResponse ? handleUndo : null}
    availableHeight={stackHeight}
  />
</View>
```

While `stackHeight === 0` (first render before layout), `CardStack` renders nothing (returns null or a placeholder) to avoid a flash of wrong-sized content.

### 2. `CardStack.jsx` — forward `availableHeight` to `ItemCard`

Accept `availableHeight` prop. Forward it to `ItemCard` as `cardHeight`. No other changes to CardStack logic.

```jsx
export default function CardStack({ items, onRespond, matchItem, onUndo, availableHeight }) {
  // ... existing code unchanged ...
  // pass cardHeight to ItemCard:
  <ItemCard item={item} hintLabel={hintLabel} hintColor={hintColor} cardHeight={availableHeight} />
}
```

### 3. `ItemCard.jsx` — derive card height from available space

Accept `cardHeight` prop. When provided and non-zero, subtract fixed chrome heights (hints row, buttons row, gaps) to get the card's actual height. Fall back to `CARD_WIDTH * 1.32` when `cardHeight` is 0 (e.g. on web or before layout).

Constants (internal to ItemCard):
- `HINTS_H = 20` — height of the hints label row
- `BUTTONS_H = 64` — height of the largest action button
- `GAPS_H = 40` — two gaps of `space[5]` (20pt each) between card/hints/buttons
- `PADDING_H = 16` — bottom padding in stackArea

```jsx
export function getCardHeight(availableHeight) {
  if (!availableHeight) return CARD_WIDTH * 1.32;
  return Math.max(200, availableHeight - HINTS_H - BUTTONS_H - GAPS_H - PADDING_H);
}
```

`CARD_WIDTH` and `CARD_HEIGHT` exports are preserved for backward compatibility (other consumers may import them). `CARD_HEIGHT` continues to export the fallback value.

### 4. `CategoryPicker.jsx` — shrink chips

Reduce visual weight of the category strip so it doesn't dominate the screen:

| Property | Before | After |
|---|---|---|
| `paddingVertical` (chip) | 8pt | 5pt |
| `paddingHorizontal` (chip) | 12pt | 10pt |
| `chipLabel` fontSize | 13 | 12 |
| `chipEmoji` fontSize | 14 | 12 |
| `chipCount` fontSize | 11 | 10 |

The strip height reduces from ~52pt to ~38pt.

## What Does Not Change

- Swipe gesture logic, animation values, response handling
- The `CARD_WIDTH` calculation (`Math.min(width - 48, 360)`)
- All other screens
- Navigation structure
- Theme tokens

## Verification

On iPhone 12 (native):
- Category strip is compact — not dominating
- Card fills the vertical space without overflow or excessive empty space below buttons
- Buttons are not cut off by tab bar
- Layout matches visual proportions of the Expo web version
