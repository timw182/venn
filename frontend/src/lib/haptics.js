// Haptic feedback via Vibration API (mobile only, no-ops on desktop)
const can = typeof navigator !== 'undefined' && 'vibrate' in navigator;

const haptic = {
  /** Light tap — button press, tab switch, mood pick */
  light()  { can && navigator.vibrate(8); },
  /** Medium tap — card swipe response, confirm action */
  medium() { can && navigator.vibrate(15); },
  /** Strong pulse — match found, important event */
  heavy()  { can && navigator.vibrate([20, 30, 20]); },
  /** Double tap — undo */
  double() { can && navigator.vibrate([10, 40, 10]); },
  /** Success pattern — match celebration */
  success() { can && navigator.vibrate([15, 50, 15, 50, 30]); },
};

export default haptic;
