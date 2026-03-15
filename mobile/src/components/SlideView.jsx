import { useRef, useCallback } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

/**
 * Wrap your screen's root view with <SlideView> to get a
 * smooth slide-in + fade animation each time the tab is focused.
 */
export default function SlideView({ children, style, direction = 'right' }) {
  const translateX = useRef(new Animated.Value(direction === 'right' ? 24 : -24)).current;
  const opacity    = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      translateX.setValue(direction === 'right' ? 24 : -24);
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
