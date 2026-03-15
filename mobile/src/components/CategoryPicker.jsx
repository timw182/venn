import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { CATEGORIES } from '../lib/constants';
import { colors, fonts, radii, space } from '../theme/tokens';

export default function CategoryPicker({ active, onChange, progress = {} }) {
  const activeIdx = CATEGORIES.findIndex((c) => c.key === active);
  const cat = CATEGORIES[activeIdx] || CATEGORIES[0];
  const prog = progress[cat.key] || {};

  function prev() {
    const idx = (activeIdx - 1 + CATEGORIES.length) % CATEGORIES.length;
    onChange(CATEGORIES[idx].key);
  }
  function next() {
    const idx = (activeIdx + 1) % CATEGORIES.length;
    onChange(CATEGORIES[idx].key);
  }

  return (
    <View style={styles.row}>
      <TouchableOpacity onPress={prev} style={styles.arrow} activeOpacity={0.6}>
        <Text style={styles.arrowText}>‹</Text>
      </TouchableOpacity>

      <View style={styles.center}>
        <Text style={styles.emoji}>{cat.emoji}</Text>
        <Text style={styles.label}>{cat.label}</Text>
        {prog.total > 0 && (
          <Text style={styles.count}>{prog.done}/{prog.total}</Text>
        )}
      </View>

      <TouchableOpacity onPress={next} style={styles.arrow} activeOpacity={0.6}>
        <Text style={styles.arrowText}>›</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space[4],
    paddingVertical: space[3],
  },
  arrow: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  arrowText: {
    fontSize: 22,
    color: colors.textMuted,
    lineHeight: 26,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  emoji: { fontSize: 18 },
  label: {
    fontFamily: fonts.serifBold,
    fontSize: 16,
    color: colors.text,
  },
  count: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.textLight,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.full,
  },
});