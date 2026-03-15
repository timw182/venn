import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, G, Path, Text as SvgText } from 'react-native-svg';

const AnimatedG    = Animated.createAnimatedComponent(G);
const AnimatedText = Animated.createAnimatedComponent(SvgText);

const LEFT_PATH  = "M82.08,196.37c-37.7,0-68.37-30.67-68.37-68.37S44.38,59.63,82.08,59.63c27.54,0,52.26,16.39,62.99,41.75.62,1.47-.07,3.17-1.54,3.8s-3.17-.07-3.8-1.54c-9.82-23.22-32.45-38.22-57.66-38.22-34.5,0-62.57,28.07-62.57,62.57s28.07,62.57,62.57,62.57c23.77,0,45.19-13.19,55.9-34.43.72-1.43,2.46-2,3.89-1.28,1.43.72,2,2.46,1.28,3.89-5.62,11.13-14.17,20.53-24.74,27.17-10.87,6.83-23.43,10.44-36.33,10.44Z";
const RIGHT_PATH = "M173.92,196.37c-12.9,0-25.46-3.61-36.33-10.44-10.57-6.64-19.13-16.04-24.74-27.17-.72-1.43-.15-3.17,1.28-3.89,1.43-.72,3.17-.15,3.89,1.28,10.71,21.24,32.13,34.43,55.9,34.43,34.5,0,62.57-28.07,62.57-62.57s-28.07-62.57-62.57-62.57c-25.21,0-47.84,15-57.66,38.22-.62,1.47-2.32,2.16-3.8,1.54-1.47-.62-2.16-2.32-1.54-3.8,10.73-25.36,35.45-41.75,62.99-41.75,37.7,0,68.37,30.67,68.37,68.37s-30.67,68.37-68.37,68.37Z";

export default function VennAnimatedLogo({ size = 200 }) {
  const slideLeftX  = useRef(new Animated.Value(-120)).current;
  const slideRightX = useRef(new Animated.Value(120)).current;
  const slideOpacity = useRef(new Animated.Value(0)).current;
  const spinLeft    = useRef(new Animated.Value(-180)).current;
  const spinRight   = useRef(new Animated.Value(-180)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(200),
      // Slide in both circles
      Animated.parallel([
        Animated.timing(slideLeftX,   { toValue: 0, duration: 1200, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
        Animated.timing(slideRightX,  { toValue: 0, duration: 1200, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
        Animated.timing(slideOpacity, { toValue: 1, duration: 420,  easing: Easing.out(Easing.ease),  useNativeDriver: false }),
      ]),
      // Spin both circles into final position
      Animated.parallel([
        Animated.timing(spinLeft,  { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.cubic), useNativeDriver: false }),
        Animated.timing(spinRight, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.cubic), useNativeDriver: false }),
      ]),
      Animated.delay(100),
      // Fade in text
      Animated.timing(textOpacity, { toValue: 1, duration: 800, easing: Easing.out(Easing.ease), useNativeDriver: false }),
    ]).start();
  }, []);

  return (
    <Svg width={size} height={size} viewBox="0 0 256 256">
      <Defs>
        <LinearGradient id="vl1" x1="13.71" y1="128" x2="145.3" y2="128" gradientUnits="userSpaceOnUse">
          <Stop offset="0.15" stopColor="#f07a6a" />
          <Stop offset="0.34" stopColor="#f3807a" />
          <Stop offset="0.79" stopColor="#fa8e9e" />
        </LinearGradient>
        <LinearGradient id="vl2" x1="110.7" y1="128" x2="242.29" y2="128" gradientUnits="userSpaceOnUse">
          <Stop offset="0.11" stopColor="#fa8e9e" />
          <Stop offset="0.71" stopColor="#9b80d4" />
        </LinearGradient>
      </Defs>

      {/* Left circle — slides in, then spins */}
      <AnimatedG translateX={slideLeftX} opacity={slideOpacity}>
        <AnimatedG rotation={spinLeft} originX={82} originY={128}>
          <Path fill="url(#vl1)" d={LEFT_PATH} />
        </AnimatedG>
      </AnimatedG>

      {/* Right circle — slides in from right, then spins */}
      <AnimatedG translateX={slideRightX} opacity={slideOpacity}>
        <AnimatedG rotation={spinRight} originX={174} originY={128}>
          <Path fill="url(#vl2)" d={RIGHT_PATH} />
        </AnimatedG>
      </AnimatedG>

      {/* "venn" text fades in last */}
      <AnimatedText
        x="128"
        y="142"
        fontFamily="Comfortaa_700Bold"
        fontSize="38"
        fill="#3a3a3a"
        textAnchor="middle"
        opacity={textOpacity}
      >
        venn
      </AnimatedText>
    </Svg>
  );
}
