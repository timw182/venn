import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';
import ItemCard, { CARD_WIDTH, getCardHeight } from './ItemCard';
import MatchEffect from './MatchEffect';
import { colors, fonts, radii, space } from '../theme/tokens';

const SWIPE_X = 100;
const SWIPE_Y = 80;
const MAX_ROT = 10;
const VISIBLE = 3;

export default function CardStack({ items = [], onRespond, matchItem, onUndo, availableHeight = 0 }) {
  const [localItems, setLocalItems] = useState(items);
  const [hint, setHint] = useState(null);
  const [exiting, setExiting] = useState(false);
  const [lastTag, setLastTag] = useState(null); // { label, color }
  const tagTimer = useRef(null);
  const itemsRef = useRef(items);
  const respondingRef = useRef(false);

  const tx = useSharedValue(0);
  const ty = useSharedValue(0);

  useEffect(() => { itemsRef.current = items; }, [items]);
  useEffect(() => {
    if (!respondingRef.current) setLocalItems(items);
  }, [items]);

  function showTag(response) {
    clearTimeout(tagTimer.current);
    const label = response === 'yes' ? '✓  Yes' : response === 'no' ? '✕  No' : '~  Maybe';
    const color = response === 'yes' ? colors.yes : response === 'no' ? colors.no : colors.maybe;
    setLastTag({ label, color });
    tagTimer.current = setTimeout(() => setLastTag(null), 1400);
  }

  function updateHint(x, y) {
    if (y < -SWIPE_Y && Math.abs(y) > Math.abs(x)) setHint('maybe');
    else if (x > SWIPE_X * 0.6) setHint('yes');
    else if (x < -SWIPE_X * 0.6) setHint('no');
    else setHint(null);
  }

  function doRespond(response) {
    if (respondingRef.current || localItems.length === 0) return;
    respondingRef.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setExiting(true);
    setHint(null);
    onRespond?.(localItems[0]?.id, response);
    showTag(response);

    const targetX = response === 'yes' ? 500 : response === 'no' ? -500 : 0;
    const targetY = response === 'maybe' ? -500 : 0;

    tx.value = withTiming(targetX, { duration: 300 });
    ty.value = withTiming(targetY, { duration: 300 }, () => {
      runOnJS(finishExit)();
    });
  }

  const exitTimer = useRef(null);

  function finishExit() {
    // Update items first to avoid blink (old card jumping back to center)
    setLocalItems([...itemsRef.current]);
    clearTimeout(exitTimer.current);
    exitTimer.current = setTimeout(() => {
      tx.value = 0;
      ty.value = 0;
      respondingRef.current = false;
      setExiting(false);
    }, 16);
  }

  // Safety: if respondingRef stays stuck for >2s, force-unlock
  useEffect(() => {
    const id = setInterval(() => {
      if (respondingRef.current && !exiting) respondingRef.current = false;
    }, 2000);
    return () => { clearInterval(id); clearTimeout(exitTimer.current); };
  }, [exiting]);

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      tx.value = e.translationX;
      ty.value = e.translationY;
      runOnJS(updateHint)(e.translationX, e.translationY);
    })
    .onEnd((e) => {
      const { translationX: x, translationY: y, velocityX } = e;
      const yUp = -y;
      if (yUp > SWIPE_Y && yUp > Math.abs(x)) runOnJS(doRespond)('maybe');
      else if (x > SWIPE_X || velocityX > 500) runOnJS(doRespond)('yes');
      else if (x < -SWIPE_X || velocityX < -500) runOnJS(doRespond)('no');
      else {
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

  if (localItems.length === 0 && !exiting) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>✓</Text>
        <Text style={styles.emptyTitle}>You've seen everything</Text>
        <Text style={styles.emptySub}>Try another category or check your matches</Text>
      </View>
    );
  }

  const cardH = getCardHeight(availableHeight);

  return (
    <View style={styles.wrapper}>
      {matchItem && <MatchEffect item={matchItem} />}

      {/* Swipe tag */}
      {lastTag && (
        <View style={[styles.swipeTag, { backgroundColor: lastTag.color }]}>
          <Text style={styles.swipeTagText}>{lastTag.label}</Text>
        </View>
      )}

      {/* Card stack — behind cards rendered first (bottom), top card last */}
      <View style={[styles.stack, { width: CARD_WIDTH, height: cardH }]}>
        {localItems.slice(1, VISIBLE).map((item, i) => {
          const idx = i + 1;
          const offset = idx * 8;
          const narrower = CARD_WIDTH - idx * 16;
          return (
            <View key={item.id} style={[styles.behindCard, {
              zIndex: VISIBLE - idx,
              width: narrower,
              left: (CARD_WIDTH - narrower) / 2,
              bottom: -offset,
              height: 24,
              borderBottomLeftRadius: 14,
              borderBottomRightRadius: 14,
            }]} />
          );
        })}
        {localItems.length > 0 && (
          <GestureDetector key={localItems[0].id} gesture={panGesture}>
            <Animated.View style={[styles.cardPos, { zIndex: VISIBLE }, topCardStyle]}>
              <ItemCard item={localItems[0]}
                hintLabel={hint === 'yes' ? 'YES' : hint === 'no' ? 'NOPE' : hint === 'maybe' ? 'MAYBE' : null}
                hintColor={hint === 'yes' ? colors.yes : hint === 'no' ? colors.no : colors.maybe}
                cardHeight={availableHeight}
              />
            </Animated.View>
          </GestureDetector>
        )}
      </View>

      {/* Buttons — flex-end pushes them toward tab bar */}
      <View style={styles.buttons}>
        <TouchableOpacity
          style={[styles.btn, styles.btnUndo, !onUndo && styles.btnDisabled]}
          onPress={onUndo}
          disabled={!onUndo}
        >
          <Text style={styles.btnIcon}>↩</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.btnNo]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); doRespond('no'); }}>
          <Text style={[styles.btnIcon, { color: colors.no, fontSize: 22 }]}>✕</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.btnMaybe]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); doRespond('maybe'); }}>
          <Text style={[styles.btnIcon, { color: colors.maybe, fontSize: 18 }]}>~</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.btnYes]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); doRespond('yes'); }}>
          <Text style={[styles.btnIcon, { color: colors.yes, fontSize: 22 }]}>✓</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', justifyContent: 'center', gap: space[4] },

  stack: { position: 'relative' },
  cardPos: { position: 'absolute', top: 0, left: 0 },
  behindCard: {
    position: 'absolute',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: colors.border,
  },

  swipeTag: {
    position: 'absolute',
    top: -8,
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: radii.full,
    zIndex: 200,
  },
  swipeTagText: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: '#fff',
    letterSpacing: 0.5,
  },

  buttons: {
    flexDirection: 'row',
    gap: space[3],
    alignItems: 'center',
    paddingTop: space[4],
    paddingBottom: space[2],
  },
  btn: {
    borderRadius: radii.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  btnUndo:  { width: 44, height: 44 },
  btnNo:    { width: 56, height: 56 },
  btnMaybe: { width: 52, height: 52 },
  btnYes:   { width: 64, height: 64 },
  btnDisabled: { opacity: 0.3 },
  btnIcon: { fontSize: 20, color: colors.textMuted },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space[3] },
  emptyIcon: { fontSize: 40, color: colors.accent },
  emptyTitle: { fontFamily: fonts.serif, fontSize: 20, color: colors.text },
  emptySub: { fontFamily: fonts.sans, fontSize: 14, color: colors.textMuted, textAlign: 'center' },

});