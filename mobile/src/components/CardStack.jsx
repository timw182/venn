import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';
import ItemCard, { CARD_WIDTH, CARD_HEIGHT, getCardHeight } from './ItemCard';
import { colors, fonts, radii, space } from '../theme/tokens';

const SWIPE_X = 100;
const SWIPE_Y = 80;
const MAX_ROT = 10;
const VISIBLE = 3;

export default function CardStack({ items = [], onRespond, matchItem, onUndo, availableHeight = 0 }) {
  const [localItems, setLocalItems] = useState(items);
  const [hint, setHint] = useState(null); // 'yes' | 'no' | 'maybe' | null
  const [exiting, setExiting] = useState(false);
  const itemsRef = useRef(items);
  const respondingRef = useRef(false);

  const tx = useSharedValue(0);
  const ty = useSharedValue(0);

  useEffect(() => { itemsRef.current = items; }, [items]);

  useEffect(() => {
    if (!respondingRef.current) setLocalItems(items);
  }, [items]);

  function updateHint(x, y) {
    if (y < -SWIPE_Y && Math.abs(y) > Math.abs(x)) {
      setHint('maybe');
    } else if (x > SWIPE_X * 0.6) {
      setHint('yes');
    } else if (x < -SWIPE_X * 0.6) {
      setHint('no');
    } else {
      setHint(null);
    }
  }

  function doRespond(response) {
    if (respondingRef.current || localItems.length === 0) return;
    respondingRef.current = true;
    setExiting(true);
    setHint(null);
    onRespond?.(localItems[0]?.id, response);

    const targetX = response === 'yes' ? 500 : response === 'no' ? -500 : 0;
    const targetY = response === 'maybe' ? -500 : 0;

    tx.value = withTiming(targetX, { duration: 300 });
    ty.value = withTiming(targetY, { duration: 300 }, () => {
      runOnJS(finishExit)();
    });
  }

  function finishExit() {
    tx.value = 0;
    ty.value = 0;
    respondingRef.current = false;
    setExiting(false);
    setLocalItems([...itemsRef.current]);
  }

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      tx.value = e.translationX;
      ty.value = e.translationY;
      runOnJS(updateHint)(e.translationX, e.translationY);
    })
    .onEnd((e) => {
      const { translationX: x, translationY: y, velocityX, velocityY } = e;
      const yUp = -y;

      if (yUp > SWIPE_Y && yUp > Math.abs(x)) {
        runOnJS(doRespond)('maybe');
      } else if (x > SWIPE_X || velocityX > 500) {
        runOnJS(doRespond)('yes');
      } else if (x < -SWIPE_X || velocityX < -500) {
        runOnJS(doRespond)('no');
      } else {
        tx.value = withSpring(0);
        ty.value = withSpring(0);
        runOnJS(setHint)(null);
      }
    });

  const topCardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { rotate: `${interpolate(tx.value, [-200, 0, 200], [-MAX_ROT, 0, MAX_ROT])}deg` },
    ],
  }));

  const hintLabel = hint === 'yes' ? 'YES' : hint === 'no' ? 'NOPE' : hint === 'maybe' ? 'MAYBE' : null;
  const hintColor = hint === 'yes' ? colors.yes : hint === 'no' ? colors.no : colors.maybe;

  if (localItems.length === 0 && !exiting) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>✓</Text>
        <Text style={styles.emptyTitle}>You've seen everything</Text>
        <Text style={styles.emptySub}>Try another category or check your matches</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      {matchItem && (
        <View style={styles.matchOverlay}>
          <View style={styles.matchContent}>
            <Text style={styles.matchEmoji}>{matchItem.emoji}</Text>
            <Text style={styles.matchTitle}>It's a match</Text>
            <Text style={styles.matchItem}>{matchItem.title}</Text>
            <Text style={styles.matchSub}>You both want this</Text>
          </View>
        </View>
      )}

      <View style={[styles.stack, { width: CARD_WIDTH, height: getCardHeight(availableHeight) }]}>
        {localItems.slice(0, VISIBLE).map((item, i) => {
          const isTop = i === 0;
          const scale = 1 - i * 0.04;
          const yOff = i * 10;

          if (isTop) {
            return (
              <GestureDetector key={item.id} gesture={panGesture}>
                <Animated.View style={[styles.cardPos, { zIndex: VISIBLE - i }, topCardStyle]}>
                  <ItemCard item={item} hintLabel={hintLabel} hintColor={hintColor} cardHeight={availableHeight} />
                </Animated.View>
              </GestureDetector>
            );
          }

          return (
            <Animated.View
              key={item.id}
              style={[styles.cardPos, {
                zIndex: VISIBLE - i,
                transform: [{ scale }, { translateY: yOff }],
              }]}
            >
              <ItemCard item={item} cardHeight={availableHeight} />
            </Animated.View>
          );
        })}
      </View>

      <View style={styles.hints}>
        <Text style={[styles.hintLabel, { color: colors.no, opacity: hint === 'no' ? 1 : 0 }]}>NOPE</Text>
        <Text style={[styles.hintLabel, { color: colors.maybe, opacity: hint === 'maybe' ? 1 : 0 }]}>MAYBE</Text>
        <Text style={[styles.hintLabel, { color: colors.yes, opacity: hint === 'yes' ? 1 : 0 }]}>YES!</Text>
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity
          style={[styles.btn, styles.btnUndo, !onUndo && styles.btnDisabled]}
          onPress={onUndo}
          disabled={!onUndo}
        >
          <Text style={styles.btnIcon}>↩</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.btn, styles.btnNo]} onPress={() => doRespond('no')}>
          <Text style={[styles.btnIcon, { color: colors.no }]}>✕</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.btn, styles.btnMaybe]} onPress={() => doRespond('maybe')}>
          <Text style={[styles.btnIcon, { color: colors.maybe }]}>🔖</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.btn, styles.btnYes]} onPress={() => doRespond('yes')}>
          <Text style={[styles.btnIcon, { color: colors.yes, fontSize: 22 }]}>✓</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', gap: space[5] },

  stack: { position: 'relative' },
  cardPos: { position: 'absolute', top: 0, left: 0 },

  hints: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: CARD_WIDTH,
    paddingHorizontal: 4,
  },
  hintLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  buttons: {
    flexDirection: 'row',
    gap: space[3],
    alignItems: 'center',
  },
  btn: {
    borderRadius: radii.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnUndo: { width: 44, height: 44 },
  btnNo: { width: 56, height: 56 },
  btnMaybe: { width: 52, height: 52 },
  btnYes: { width: 64, height: 64 },
  btnDisabled: { opacity: 0.3 },
  btnIcon: { fontSize: 20, color: colors.textMuted },

  empty: { alignItems: 'center', gap: space[3], paddingTop: space[10] },
  emptyIcon: { fontSize: 40, color: colors.accent },
  emptyTitle: { fontFamily: fonts.serifItalic, fontSize: 20, color: colors.text },
  emptySub: { fontFamily: fonts.sansLight, fontSize: 14, color: colors.textMuted, textAlign: 'center' },

  matchOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    borderRadius: radii.xl,
  },
  matchContent: { alignItems: 'center', gap: space[3] },
  matchEmoji: { fontSize: 56 },
  matchTitle: { fontFamily: fonts.serifItalic, fontSize: 26, color: colors.text },
  matchItem: { fontFamily: fonts.sansMedium, fontSize: 16, color: colors.accent },
  matchSub: { fontFamily: fonts.sansLight, fontSize: 13, color: colors.textMuted },
});
