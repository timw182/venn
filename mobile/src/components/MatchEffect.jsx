import { useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, Easing } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, fonts, radii, space } from '../theme/tokens';

const { width: SW } = Dimensions.get('window');

const PARTICLE_COUNT = 18;
const PARTICLE_COLORS = [
  colors.violet, colors.accent, colors.coral, colors.rose,
  colors.maybe, '#FFD700', colors.yes, '#FF6B9D',
];

function Particle({ delay, angle, distance, size, color }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 900,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  const rad = (angle * Math.PI) / 180;
  const dx = Math.cos(rad) * distance;
  const dy = Math.sin(rad) * distance;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity: progress.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 0] }),
        transform: [
          { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, dx] }) },
          { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, dy] }) },
          { scale: progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 1.2, 0.3] }) },
        ],
      }}
    />
  );
}

export default function MatchEffect({ item }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const emojiScale = useRef(new Animated.Value(0.3)).current;
  const textY = useRef(new Animated.Value(20)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(0)).current;
  const ringOpacity = useRef(new Animated.Value(0.6)).current;
  const glowPulse = useRef(new Animated.Value(0.4)).current;

  const particles = useMemo(() =>
    Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      id: i,
      angle: (360 / PARTICLE_COUNT) * i + (Math.random() * 20 - 10),
      distance: 80 + Math.random() * 60,
      size: 4 + Math.random() * 8,
      color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
      delay: 100 + Math.random() * 200,
    })),
  []);

  useEffect(() => {
    // Triple haptic burst
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 150);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 300);

    // Backdrop fade in
    Animated.timing(opacityAnim, {
      toValue: 1, duration: 250, useNativeDriver: true,
    }).start();

    // Expanding ring
    Animated.parallel([
      Animated.timing(ringScale, {
        toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }),
      Animated.timing(ringOpacity, {
        toValue: 0, duration: 700, easing: Easing.in(Easing.ease), useNativeDriver: true,
      }),
    ]).start();

    // Emoji pop-in with overshoot
    Animated.spring(emojiScale, {
      toValue: 1, stiffness: 200, damping: 12, useNativeDriver: true,
    }).start();

    // Content scale
    Animated.spring(scaleAnim, {
      toValue: 1, stiffness: 180, damping: 14, useNativeDriver: true,
    }).start();

    // Text slide up
    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.spring(textY, {
          toValue: 0, stiffness: 160, damping: 16, useNativeDriver: true,
        }),
        Animated.timing(textOpacity, {
          toValue: 1, duration: 300, useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Glow pulse loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(glowPulse, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
      {/* Expanding ring */}
      <Animated.View
        style={[styles.ring, {
          opacity: ringOpacity,
          transform: [{ scale: ringScale.interpolate({ inputRange: [0, 1], outputRange: [0.2, 3] }) }],
        }]}
      />

      {/* Glow */}
      <Animated.View style={[styles.glow, { opacity: glowPulse }]} />

      {/* Particles */}
      <View style={styles.particleCenter}>
        {particles.map((p) => <Particle key={p.id} {...p} />)}
      </View>

      {/* Content */}
      <Animated.View style={[styles.content, { transform: [{ scale: scaleAnim }] }]}>
        <Animated.Text style={[styles.emoji, { transform: [{ scale: emojiScale }] }]}>
          {item.emoji}
        </Animated.Text>

        <Animated.View style={{ opacity: textOpacity, transform: [{ translateY: textY }] }}>
          <Text style={styles.label}>It's a match</Text>
          <Text style={styles.title}>{item.title}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>You both want this</Text>
          </View>
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    borderRadius: radii.xl,
    overflow: 'hidden',
    backgroundColor: 'rgba(26, 14, 46, 0.92)',
  },
  ring: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: colors.accent,
  },
  glow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.accent,
    opacity: 0.4,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 60,
  },
  particleCenter: {
    position: 'absolute',
    width: 0,
    height: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    gap: space[4],
  },
  emoji: {
    fontSize: 72,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 12,
  },
  label: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    color: colors.accent,
    letterSpacing: 3,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: space[1],
  },
  title: {
    fontFamily: fonts.serifBold,
    fontSize: 28,
    color: '#fff',
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: space[2],
  },
  badge: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: radii.full,
    paddingHorizontal: space[4],
    paddingVertical: space[2],
  },
  badgeText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 0.3,
  },
});
