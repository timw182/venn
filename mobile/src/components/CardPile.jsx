import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { colors, fonts, radii } from '../theme/tokens';

const IS_TABLET = Dimensions.get('window').width >= 768;

const CARD_W = IS_TABLET ? 90 : 56;
const CARD_H = IS_TABLET ? 110 : 68;
const STACK_H = IS_TABLET ? 120 : 72;

const PILE_OFFSETS = [
  { rotate: 1,  x: 0,  y: 0 },
  { rotate: -4, x: 1,  y: 3 },
  { rotate: 3,  x: -1, y: 5 },
  { rotate: -5, x: 1,  y: 7 },
  { rotate: 5,  x: -1, y: 9 },
];

export default function CardPile({ items = [], side, totalCount }) {
  const capped = items.slice(0, 5);
  const count = totalCount ?? items.length;
  const isYes = side === 'yes';

  return (
    <View style={styles.container}>
      <View style={styles.stack}>
        {[...capped].reverse().map((item, revI) => {
          const depth = capped.length - 1 - revI;
          const isTop = depth === 0;
          const off = PILE_OFFSETS[depth] ?? PILE_OFFSETS[PILE_OFFSETS.length - 1];

          return (
            <View
              key={item.id}
              style={[
                styles.card,
                isYes ? styles.cardYes : styles.cardNo,
                {
                  transform: [
                    { rotate: `${off.rotate}deg` },
                    { translateX: off.x },
                    { translateY: off.y },
                  ],
                  zIndex: capped.length - depth,
                },
                isTop && styles.cardTop,
              ]}
            >
              {isTop && (
                <>
                  <Text style={styles.emoji}>{item.emoji}</Text>
                  <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
                </>
              )}
            </View>
          );
        })}
      </View>

      {count > 0 && (
        <Text style={[styles.count, isYes ? styles.countYes : styles.countNo]}>
          {isYes ? '\u2713' : '\u2715'} {count}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 6,
  },
  stack: {
    width: CARD_W,
    height: STACK_H,
    position: 'relative',
  },
  card: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: CARD_W,
    height: CARD_H,
    borderRadius: IS_TABLET ? 14 : 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: IS_TABLET ? 6 : 4,
    padding: IS_TABLET ? 10 : 6,
    overflow: 'hidden',
  },
  cardYes: {
    borderColor: colors.yes,
    backgroundColor: colors.yesSoft,
  },
  cardNo: {
    borderColor: colors.no,
    backgroundColor: colors.noSoft,
  },
  cardTop: {
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  emoji: {
    fontSize: IS_TABLET ? 24 : 16,
    lineHeight: IS_TABLET ? 28 : 20,
  },
  title: {
    fontFamily: fonts.sans,
    fontSize: IS_TABLET ? 11 : 8,
    textAlign: 'center',
    lineHeight: IS_TABLET ? 14 : 10,
    color: colors.textMuted,
  },
  count: {
    fontFamily: fonts.serif,
    fontSize: IS_TABLET ? 16 : 14,
    fontStyle: 'italic',
  },
  countYes: { color: colors.yes },
  countNo: { color: colors.no },
});
