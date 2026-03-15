import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { colors, fonts, radii } from '../theme/tokens';

const { width } = Dimensions.get('window');
export const CARD_WIDTH = Math.min(width - 48, 360);
export const CARD_HEIGHT = CARD_WIDTH * 1.32;

const HINTS_H = 20;
const BUTTONS_H = 64;
const GAPS_H = 40;   // two gaps of space[5] between stack/hints/buttons
const PADDING_H = 16; // stackArea paddingBottom

export function getCardHeight(availableHeight) {
  if (!availableHeight) return CARD_HEIGHT;
  return Math.max(200, availableHeight - HINTS_H - BUTTONS_H - GAPS_H - PADDING_H);
}

export default function ItemCard({ item, hintLabel, hintColor, cardHeight }) {
  if (!item) return null;

  const resolvedHeight = cardHeight ? getCardHeight(cardHeight) : CARD_HEIGHT;

  return (
    <View style={[styles.card, { height: resolvedHeight }]}>
      <View style={styles.hero}>
        <Text style={styles.emoji}>{item.emoji}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.desc} numberOfLines={3}>{item.description}</Text>
      </View>
      {!!hintLabel && (
        <View style={[styles.hint, { borderColor: hintColor }]}>
          <Text style={[styles.hintText, { color: hintColor }]}>{hintLabel}</Text>
        </View>
      )}
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  emoji: { fontSize: 80 },
  info: {
    padding: 20,
    gap: 6,
    backgroundColor: colors.surface,
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 22,
    color: colors.text,
    letterSpacing: -0.3,
  },
  desc: {
    fontFamily: fonts.sansLight,
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
  },
  hint: {
    position: 'absolute',
    top: 20,
    right: 20,
    borderWidth: 2.5,
    borderRadius: radii.md,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(17,13,26,0.85)',
  },
  hintText: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});