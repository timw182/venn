import Svg, { Path, Circle, Rect, G } from 'react-native-svg';
import { colors } from '../theme/tokens';

const coral = colors.coral || '#F07A6A';
const violet = colors.violet || '#9B80D4';
const rose = colors.rose || '#C4547A';

export function LockKeyIcon({ size = 36 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 256 256" fill="none">
      {/* Shackle */}
      <Path
        d="M88 104V80a40 40 0 0 1 80 0v24"
        stroke={coral}
        strokeWidth="16"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.6"
      />
      {/* Body */}
      <Rect x="40" y="104" width="176" height="128" rx="16" fill={violet} opacity="0.85" />
      {/* Keyhole */}
      <Circle cx="128" cy="152" r="16" fill="white" opacity="0.9" />
      <Rect x="120" y="152" width="16" height="24" rx="4" fill="white" opacity="0.9" />
    </Svg>
  );
}

export function MoonStarsIcon({ size = 36 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 256 256" fill="none">
      {/* Moon */}
      <Path
        d="M216 112a92 92 0 1 1-92-92c-6.7 0-13.3.7-19.7 2a88 88 0 1 0 109.7 109.7c1.3-6.4 2-13 2-19.7z"
        fill={violet}
        opacity="0.85"
      />
      {/* Stars */}
      <Path d="M152 32l4 12 12 4-12 4-4 12-4-12-12-4 12-4 4-12z" fill={coral} opacity="0.9" />
      <Path d="M200 72l3 8 8 3-8 3-3 8-3-8-8-3 8-3 3-8z" fill={rose} opacity="0.8" />
      <Path d="M184 16l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z" fill={coral} opacity="0.7" />
    </Svg>
  );
}

export function UsersIcon({ size = 36 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 256 256" fill="none">
      {/* Back person */}
      <Circle cx="96" cy="88" r="40" fill={violet} opacity="0.6" />
      <Path
        d="M16 200c0-44.2 35.8-80 80-80"
        stroke={violet}
        strokeWidth="16"
        strokeLinecap="round"
        fill="none"
        opacity="0.6"
      />
      {/* Front person */}
      <Circle cx="160" cy="88" r="40" fill={rose} opacity="0.9" />
      <Path
        d="M80 200c0-44.2 35.8-80 80-80s80 35.8 80 80"
        stroke={rose}
        strokeWidth="16"
        strokeLinecap="round"
        fill="none"
        opacity="0.9"
      />
    </Svg>
  );
}
