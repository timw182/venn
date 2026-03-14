import { View, Text, Image, StyleSheet } from 'react-native';
import { colors, fonts } from '../theme/tokens';

const logo = require('../../assets/logo800.png');

export default function LogoMark({ size = 'md', style }) {
  const config = {
    sm: { height: 18, fontSize: 18, gap: 6 },
    md: { height: 24, fontSize: 24, gap: 8 },
    lg: { height: 38, fontSize: 36, gap: 10 },
  }[size] || { height: 24, fontSize: 24, gap: 8 };

  // logo800 is 925x540, aspect ratio ~1.713
  const logoWidth = Math.round(config.height * (925 / 540));

  return (
    <Image
      source={logo}
      style={{ width: logoWidth, height: config.height }}
      resizeMode="contain"
      accessibilityLabel="kinklink"
    />
  );
}
