import { ScrollView, TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { CATEGORIES } from '../lib/constants';
import { colors, fonts, radii, space } from '../theme/tokens';

export default function CategoryPicker({ active, onChange, progress = {} }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      style={styles.scroll}
    >
      {CATEGORIES.map((cat) => {
        const isActive = active === cat.key;
        const prog = progress[cat.key];

        return (
          <TouchableOpacity
            key={cat.key}
            style={[styles.chip, isActive && styles.chipActive]}
            onPress={() => onChange(cat.key)}
            activeOpacity={0.7}
          >
            <Text style={styles.chipEmoji}>{cat.emoji}</Text>
            <Text style={[styles.chipLabel, isActive && styles.chipLabelActive]}>{cat.label}</Text>
            {prog && prog.total > 0 && (
              <Text style={[styles.chipCount, isActive && styles.chipCountActive]}>
                {prog.done}/{prog.total}
              </Text>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 0 },
  row: {
    flexDirection: 'row',
    gap: space[2],
    paddingHorizontal: space[5],
    paddingVertical: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  chipEmoji: { fontSize: 12 },
  chipLabel: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.textMuted },
  chipLabelActive: { color: colors.accent },
  chipCount: {
    fontFamily: fonts.sans,
    fontSize: 10,
    color: colors.textLight,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.full,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  chipCountActive: { color: colors.accent, backgroundColor: colors.accentBg },
});
