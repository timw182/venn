import { TouchableOpacity, Text, View, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { CATEGORIES } from '../lib/constants';
import { colors, fonts, radii, space } from '../theme/tokens';

const { width } = Dimensions.get('window');
const IS_TABLET = width >= 768;

export default function CategoryPicker({ active, onChange, progress = {} }) {
  if (IS_TABLET) return <TabletPicker active={active} onChange={onChange} progress={progress} />;
  return <PhonePicker active={active} onChange={onChange} progress={progress} />;
}

/* ── Tablet: all categories visible as horizontal pills ──────── */
function TabletPicker({ active, onChange, progress }) {
  return (
    <View style={tabletStyles.row}>
      {CATEGORIES.map((cat) => {
        const isActive = cat.key === active;
        const prog = progress[cat.key] || {};
        return (
          <TouchableOpacity
            key={cat.key}
            style={[tabletStyles.pill, isActive && tabletStyles.pillActive]}
            onPress={() => onChange(cat.key)}
            activeOpacity={0.7}
          >
            <Text style={tabletStyles.emoji}>{cat.emoji}</Text>
            <Text style={[tabletStyles.label, isActive && tabletStyles.labelActive]}>{cat.label}</Text>
            {prog.total > 0 && (
              <Text style={[tabletStyles.count, isActive && tabletStyles.countActive]}>
                {prog.done}/{prog.total}
              </Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const tabletStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: space[6],
    paddingVertical: space[3],
    flexWrap: 'wrap',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  pillActive: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  emoji: { fontSize: 16 },
  label: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.textMuted,
  },
  labelActive: {
    color: colors.accent,
  },
  count: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.textLight,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  countActive: {
    backgroundColor: 'rgba(196,84,122,0.1)',
    color: colors.accent,
  },
});

/* ── Phone: arrow carousel (original) ────────────────────────── */
function PhonePicker({ active, onChange, progress }) {
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
    <View style={phoneStyles.row}>
      <TouchableOpacity onPress={prev} style={phoneStyles.arrow} activeOpacity={0.6}>
        <Text style={phoneStyles.arrowText}>‹</Text>
      </TouchableOpacity>

      <View style={phoneStyles.center}>
        <Text style={phoneStyles.emoji}>{cat.emoji}</Text>
        <Text style={phoneStyles.label}>{cat.label}</Text>
        {prog.total > 0 && (
          <Text style={phoneStyles.count}>{prog.done}/{prog.total}</Text>
        )}
      </View>

      <TouchableOpacity onPress={next} style={phoneStyles.arrow} activeOpacity={0.6}>
        <Text style={phoneStyles.arrowText}>›</Text>
      </TouchableOpacity>
    </View>
  );
}

const phoneStyles = StyleSheet.create({
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
