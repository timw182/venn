import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { colors, fonts } from '../theme/tokens';

function OvenTrayIcon({ size = 28, color = colors.accent }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17.4933 2.84436H6.50649C4.48389 2.84436 2.84424 4.48401 2.84424 6.50662V17.4934C2.84424 19.516 4.48389 21.1556 6.50649 21.1556H17.4933C19.5159 21.1556 21.1555 19.516 21.1555 17.4934V6.50662C21.1555 4.48401 19.5159 2.84436 17.4933 2.84436Z"
        stroke={color}
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <Circle cx="8.5" cy="8.5" r="1.65" stroke={color} strokeWidth="1.7" />
      <Circle cx="15.5" cy="8.5" r="1.65" stroke={color} strokeWidth="1.7" />
      <Circle cx="8.5" cy="15.5" r="1.65" stroke={color} strokeWidth="1.7" />
      <Circle cx="15.5" cy="15.5" r="1.65" stroke={color} strokeWidth="1.7" />
    </Svg>
  );
}

export default function LogoMark({ size = 'md', style }) {
  const config = {
    sm: { iconSize: 20, fontSize: 18, gap: 8 },
    md: { iconSize: 26, fontSize: 24, gap: 10 },
    lg: { iconSize: 40, fontSize: 36, gap: 12 },
  }[size] || { iconSize: 26, fontSize: 24, gap: 10 };

  return (
    <View style={[styles.row, { gap: config.gap }, style]}>
      <OvenTrayIcon size={config.iconSize} />
      <Text style={[styles.wordmark, { fontSize: config.fontSize }]}>kinklink</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wordmark: {
    fontFamily: fonts.serifBoldItalic,
    color: colors.accent,
    letterSpacing: -0.5,
  },
});
