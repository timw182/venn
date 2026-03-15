import { useRef, useCallback } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTabDirection } from '../context/TabDirectionContext';

export default function SlideView({ children, style }) {
  const directionRef = useTabDirection();
  const translateX = useRef(new Animated.Value(24)).current;
  const opacity    = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      const dir = directionRef?.current ?? 'right';
      translateX.setValue(dir === 'right' ? 24 : -24);
      opacity.setValue(0);

      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    }, [])
  );

  return (
    <Animated.View style={[styles.fill, style, { opacity, transform: [{ translateX }] }]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
