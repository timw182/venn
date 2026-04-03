import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { colors, fonts, radii } from '../theme/tokens';

const { width, height: screenH } = Dimensions.get('window');
const IS_TABLET = width >= 768;
export const CARD_WIDTH = IS_TABLET ? Math.min(width * 0.35, 280) : Math.min(width - 48, 360);
export const CARD_HEIGHT = CARD_WIDTH * 1.32;

const HINTS_H = 20;
const BUTTONS_H = 64;
const GAPS_H = 40;
const PADDING_H = 16;
const MAX_CARD_H = Math.min(screenH * 0.55, 520);

export function getCardHeight(availableHeight) {
  if (!availableHeight) return Math.min(CARD_HEIGHT, MAX_CARD_H);
  return Math.min(Math.max(200, availableHeight - HINTS_H - BUTTONS_H - GAPS_H - PADDING_H), MAX_CARD_H);
}

// Per-category gradient colors: [inner glow, outer bg]
const CATEGORY_GRADIENTS = {
  foreplay:    ['#F2B8CC', '#F8EEF3'],
  positions:   ['#C4B0E8', '#EEE9F6'],
  settings:    ['#B0C4E8', '#EAEff6'],
  roleplay:    ['#E8C8A0', '#F6F0E8'],
  'toys-gear': ['#B0D4C0', '#EAF4EE'],
  adventurous: ['#F0C0A0', '#F6EDEA'],
};

function HeroGradient({ category }) {
  const [inner, outer] = CATEGORY_GRADIENTS[category] || ['#D4C0F0', '#F4EFF8'];
  return (
    <Svg
      width="100%"
      height="100%"
      style={StyleSheet.absoluteFill}
      preserveAspectRatio="xMidYMid slice"
    >
      <Defs>
        <RadialGradient id="heroGrad" cx="50%" cy="50%" rx="65%" ry="65%">
          <Stop offset="0%" stopColor={inner} stopOpacity="1" />
          <Stop offset="100%" stopColor={outer} stopOpacity="1" />
        </RadialGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#heroGrad)" />
    </Svg>
  );
}

export default function ItemCard({ item, cardHeight }) {
  if (!item) return null;

  const resolvedHeight = cardHeight ? getCardHeight(cardHeight) : CARD_HEIGHT;

  return (
    <View style={[styles.card, { height: resolvedHeight }]}>
      <View style={styles.hero}>
        <HeroGradient category={item.category} />
        <Text style={styles.emoji}>{item.emoji}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.desc} numberOfLines={3}>{item.description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    borderRadius: radii.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    shadowColor: '#2D1F3D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  emoji: {
    fontSize: 80,
    textShadowColor: 'rgba(45,31,61,0.15)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 12,
  },
  info: {
    padding: 20,
    gap: 6,
    backgroundColor: colors.surface,
  },
  title: {
    fontFamily: fonts.serifBold,
    fontSize: 21,
    color: colors.text,
    letterSpacing: -0.3,
  },
  desc: {
    fontFamily: fonts.sansLight,
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
  },
});
