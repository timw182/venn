import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { colors, radii } from '../theme/tokens';

const { width } = Dimensions.get('window');
export const CARD_WIDTH = Math.min(width - 48, 360);
export const CARD_HEIGHT = CARD_WIDTH * 1.32;

export default function ItemCard({ item, hintLabel, hintColor }) {
  if (!item) return null;

  return (
    <View style={styles.card}>
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
    height: CARD_HEIGHT,
    borderRadius: radii.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    shadowColor: '#2C2520',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 20,
    elevation: 8,
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
    fontFamily: 'serif',
    fontStyle: 'italic',
    fontSize: 22,
    fontWeight: '500',
    color: colors.text,
    letterSpacing: -0.3,
  },
  desc: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
    fontWeight: '300',
  },
  hint: {
    position: 'absolute',
    top: 20,
    right: 20,
    borderWidth: 2.5,
    borderRadius: radii.md,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  hintText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
