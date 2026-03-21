import { useRef, useCallback } from 'react';
import { Animated, StyleSheet, Dimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTabDirection } from '../context/TabDirectionContext';

const { width: SW } = Dimensions.get('window');

export default function SlideView({ children, style }) {
  const directionRef = useTabDirection();
  const translateX = useRef(new Animated.Value(SW)).current;
  const opacity    = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      const dir = directionRef?.current ?? 'right';
      translateX.setValue(dir === 'right' ? SW * 0.35 : -SW * 0.35);
      opacity.setValue(0);

      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
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
