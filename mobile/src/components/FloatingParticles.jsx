import { useRef, useEffect, useMemo } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';

const { width: W, height: H } = Dimensions.get('window');
const COLORS = ['#F07A6A', '#9B80D4', '#C4547A', '#9B80D4', '#F07A6A'];
const COUNT = 10;

function Particle({ left, size, delay, duration, drift, color }) {
  const y = useRef(new Animated.Value(H + 80)).current;
  const x = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    function run() {
      y.setValue(H + 80);
      x.setValue(0);
      opacity.setValue(0);
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(y, { toValue: -120, duration, useNativeDriver: true }),
          Animated.timing(x, { toValue: drift, duration, useNativeDriver: true }),
          Animated.sequence([
            Animated.timing(opacity, { toValue: 0.12, duration: duration * 0.1, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0.12, duration: duration * 0.75, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0,    duration: duration * 0.15, useNativeDriver: true }),
          ]),
        ]),
      ]).start(() => run());
    }
    run();
  }, []);

  return (
    <Animated.Text
      style={[
        styles.particle,
        {
          left,
          fontSize: size,
          color,
          transform: [{ translateY: y }, { translateX: x }],
          opacity,
        },
      ]}
      aria-hidden
    >
      ♥
    </Animated.Text>
  );
}

export default function FloatingParticles() {
  const particles = useMemo(() =>
    Array.from({ length: COUNT }, (_, i) => ({
      id: i,
      left: Math.random() * (W - 40),
      size: 28 + Math.random() * 32,
      delay:    Math.random() * 12000,
      duration: 14000 + Math.random() * 10000,
      drift:    (Math.random() - 0.5) * 120,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    })), []);

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.map((p) => <Particle key={p.id} {...p} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
    overflow: 'hidden',
    pointerEvents: 'none',
  },
  particle: {
    position: 'absolute',
    bottom: 0,
    pointerEvents: 'none',
    userSelect: 'none',
  },
});
