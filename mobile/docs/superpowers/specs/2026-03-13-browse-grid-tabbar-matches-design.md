# Browse Grid + Tab Bar + Matches Layout

**Date:** 2026-03-13
**Status:** Approved

## 1. Browse — Category 2×3 Grid

Replace horizontal `ScrollView` in `CategoryPicker` with a `flexWrap: 'wrap'` grid.
- Each chip: `width: '33%'`, centered content
- 6 categories = 2 rows × 3 columns, no scrolling
- Progress count shows when `total > 0` (existing guard)

`BrowseScreen` layout: header → category grid → card area (fills remaining space via `onLayout`).

## 2. Tab Bar — Horizontal Labels

`TabIcon` changes from vertical stack (emoji over label) to horizontal row (emoji + label side by side).
- `flexDirection: 'row'`, `gap: 6`
- Tab bar height: `72` → `52`, `paddingVertical: 8`

## 3. Matches — Fix Layout

- Filter chips `ScrollView`: add `flexGrow: 0` (same fix as CategoryPicker)
- Match card grid: replace `width: '47%'` with explicit pixel width = `(screenWidth - padding*2 - gap) / 2` using `useWindowDimensions`
