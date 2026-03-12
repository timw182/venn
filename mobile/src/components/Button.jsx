import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, radii, space } from '../theme/tokens';

const variants = {
  primary: {
    bg: colors.accent,
    text: '#FAF6F1',
    border: colors.accent,
  },
  secondary: {
    bg: colors.surfaceAlt,
    text: colors.text,
    border: colors.border,
  },
  ghost: {
    bg: 'transparent',
    text: colors.textMuted,
    border: 'transparent',
  },
};

const sizes = {
  sm: { py: space[2], px: space[3], fontSize: 13 },
  md: { py: space[3], px: space[4], fontSize: 15 },
  lg: { py: 14, px: space[6], fontSize: 16 },
};

export default function Button({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  style,
}) {
  const v = variants[variant];
  const s = sizes[size];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
      style={[
        styles.base,
        {
          backgroundColor: v.bg,
          borderColor: v.border,
          paddingVertical: s.py,
          paddingHorizontal: s.px,
          alignSelf: fullWidth ? 'stretch' : 'auto',
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.text} size="small" />
      ) : (
        <Text style={[styles.label, { color: v.text, fontSize: s.fontSize }]}>{children}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  label: {
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
