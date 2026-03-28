export const CATEGORIES = [
  { key: 'foreplay',    label: 'Foreplay',    emoji: '🔥' },
  { key: 'positions',   label: 'Positions',   emoji: '🌀' },
  { key: 'settings',    label: 'Settings',    emoji: '🌙' },
  { key: 'roleplay',    label: 'Roleplay',    emoji: '🎭' },
  { key: 'toys-gear',   label: 'Toys & Accessories', emoji: '🎁' },
  { key: 'adventurous', label: 'Adventurous', emoji: '✨' },
];

export const MOODS = [
  { key: 'passionate', label: 'Passionate', emoji: '🔥' },
  { key: 'tender',     label: 'Tender',     emoji: '🫶' },
  { key: 'playful',    label: 'Playful',    emoji: '😏' },
  { key: 'dominant',   label: 'Dominant',   emoji: '👑' },
  { key: 'submissive', label: 'Submissive', emoji: '🦋' },
  { key: 'curious',    label: 'Curious',    emoji: '✨' },
  { key: 'lazy',       label: 'Lazy',       emoji: '😴' },
  { key: 'wild',       label: 'Wild',       emoji: '⚡' },
  { key: 'romantic',   label: 'Romantic',   emoji: '🌹' },
  { key: 'needy',      label: 'Needy',      emoji: '🥺' },
  { key: 'confident',  label: 'Confident',  emoji: '😎' },
  { key: 'nervous',    label: 'Nervous',    emoji: '🫣' },
  { key: 'cuddly',     label: 'Cuddly',     emoji: '🧸' },
  { key: 'flirty',     label: 'Flirty',     emoji: '😘' },
];

export const ROUTES = {
  LOGIN:     '/login',
  PAIR:      '/pair',
  JOIN:      '/join',
  CONNECTED: '/connected',
  BROWSE:    '/browse',
  MATCHES:   '/matches',
  MOOD:      '/mood',
  SETTINGS:  '/settings',
  ADMIN:     '/admin',
};

// localStorage key constants — single source of truth
export const STORAGE_KEYS = {
  RESPONSES: 'kl_responses',
  SOLO:      'kl_solo',
  /** Returns the pile cache key for a given category */
  piles:     (category) => `kl_piles_${category}`,
};
