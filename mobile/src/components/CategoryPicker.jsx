import { ScrollView, TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { CATEGORIES } from '../lib/constants';
import { colors, radii, space } from '../theme/tokens';

export default function CategoryPicker({ active, onChange, progress = {} }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
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
            {prog && (
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
  row: {
    flexDirection: 'row',
    gap: space[2],
    paddingHorizontal: space[5],
    paddingVertical: space[2],
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: space[2],
    paddingHorizontal: space[3],
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  chipEmoji: { fontSize: 14 },
  chipLabel: { fontSize: 13, fontWeight: '500', color: colors.textMuted },
  chipLabelActive: { color: colors.accent },
  chipCount: {
    fontSize: 11,
    color: colors.textLight,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.full,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  chipCountActive: { color: colors.accent, backgroundColor: colors.accentBg },
});
