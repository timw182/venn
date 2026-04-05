import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, Pressable, useWindowDimensions,
} from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CATEGORIES } from '../lib/constants';
import { colors, fonts, space, radii } from '../theme/tokens';
import client from '../api/client';
import { useMatches } from '../context/MatchContext';
import { useAuth } from '../context/useAuth';
import SlideView from '../components/SlideView';

// Per-category tint for match cards — aligned with desktop ItemCard.css
const CATEGORY_TINTS = {
  foreplay:    { bg: '#F8EEF3', border: '#F0C8D8' },
  positions:   { bg: '#EEE9F6', border: '#D8C8F0' },
  settings:    { bg: '#EAEff6', border: '#C8D4F0' },
  roleplay:    { bg: '#F6F0E8', border: '#F0DCC8' },
  'toys-gear': { bg: '#EAF4EE', border: '#C8E8D0' },
  adventurous: { bg: '#F6EDEA', border: '#F0D4C8' },
};

function CardGradient({ category, width, height }) {
  const [inner, outer] = CATEGORY_GRADIENTS[category] || ['#D4C0F0', '#F4EFF8'];
  if (!width || !height) return null;
  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
      <Defs>
        <RadialGradient id={`cg_${category}`} cx="50%" cy="40%" rx="65%" ry="65%">
          <Stop offset="0%" stopColor={inner} stopOpacity="1" />
          <Stop offset="100%" stopColor={outer} stopOpacity="1" />
        </RadialGradient>
      </Defs>
      <Rect x="0" y="0" width={width} height={height} fill={`url(#cg_${category})`} />
    </Svg>
  );
}

// Same gradient palette as browse cards (ItemCard)
const CATEGORY_GRADIENTS = {
  foreplay:    ['#F2B8CC', '#F8EEF3'],
  positions:   ['#C4B0E8', '#EEE9F6'],
  settings:    ['#B0C4E8', '#EAEff6'],
  roleplay:    ['#E8C8A0', '#F6F0E8'],
  'toys-gear': ['#B0D4C0', '#EAF4EE'],
  adventurous: ['#F0C0A0', '#F6EDEA'],
};

function FilterPicker({ filter, onChange, matches }) {
  const activeCategories = [
    { key: 'all', label: 'All', emoji: '\u2726', count: matches.length },
    ...CATEGORIES
      .filter((cat) => matches.some((m) => m.category === cat.key))
      .map((cat) => ({ ...cat, count: matches.filter((m) => m.category === cat.key).length })),
  ];

  const activeIdx = Math.max(0, activeCategories.findIndex((c) => c.key === filter));
  const current = activeCategories[activeIdx];

  function prev() {
    const idx = (activeIdx - 1 + activeCategories.length) % activeCategories.length;
    onChange(activeCategories[idx].key);
  }
  function next() {
    const idx = (activeIdx + 1) % activeCategories.length;
    onChange(activeCategories[idx].key);
  }

  if (activeCategories.length <= 1) return null;

  return (
    <View style={fpStyles.row}>
      <TouchableOpacity onPress={prev} style={fpStyles.arrow} activeOpacity={0.6}>
        <Text style={fpStyles.arrowText}>‹</Text>
      </TouchableOpacity>
      <View style={fpStyles.center}>
        <Text style={fpStyles.emoji}>{current.emoji}</Text>
        <Text style={fpStyles.label}>{current.label}</Text>
        <Text style={fpStyles.count}>{current.count}</Text>
      </View>
      <TouchableOpacity onPress={next} style={fpStyles.arrow} activeOpacity={0.6}>
        <Text style={fpStyles.arrowText}>›</Text>
      </TouchableOpacity>
    </View>
  );
}

const fpStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space[4],
    paddingVertical: space[3],
  },
  arrow: {
    width: 44, height: 44,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
  },
  arrowText: { fontSize: 22, color: colors.textMuted, lineHeight: 26 },
  center: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  emoji: { fontSize: 16 },
  label: { fontFamily: fonts.serifBold, fontSize: 16, color: colors.text },
  count: {
    fontFamily: fonts.sans, fontSize: 12, color: colors.textLight,
    backgroundColor: colors.surfaceAlt, borderRadius: radii.full,
    paddingHorizontal: 8, paddingVertical: 2,
  },
});

function MatchCard({ match, onSeen, onRemove, cardWidth }) {
  const [expanded, setExpanded] = useState(false);
  const [cardSize, setCardSize] = useState({ w: 0, h: 0 });
  const cat = CATEGORIES.find((c) => c.key === match.category);

  function handleOpen() {
    setExpanded(true);
    if (!match.seen) onSeen(match.id);
  }

  const tint = CATEGORY_TINTS[match.category] || {};

  return (
    <>
      <TouchableOpacity
        style={[styles.card, { width: cardWidth, backgroundColor: (CATEGORY_GRADIENTS[match.category] || [])[1] || colors.surfaceAlt, borderColor: tint.border || colors.border }]}
        onPress={handleOpen}
        activeOpacity={0.78}
        onLayout={(e) => { const { width: w, height: h } = e.nativeEvent.layout; setCardSize({ w, h }); }}
      >
        <CardGradient category={match.category} width={cardSize.w} height={cardSize.h} />
        {!match.seen && (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>NEW</Text>
          </View>
        )}
        <Text style={styles.cardEmoji}>{match.emoji}</Text>
        <Text style={styles.cardTitle} numberOfLines={2}>{match.title}</Text>
        <Text style={styles.cardCat}>{cat?.emoji}  {cat?.label}</Text>
      </TouchableOpacity>

      <Modal visible={expanded} transparent animationType="fade" onRequestClose={() => setExpanded(false)}>
        <Pressable style={styles.overlay} onPress={() => setExpanded(false)}>
          <Pressable style={styles.detail} onPress={() => {}}>
            <View style={[styles.detailHero, { backgroundColor: (CATEGORY_GRADIENTS[match.category] || [])[1] || colors.surfaceAlt }]}>
              <CardGradient category={match.category} width={320} height={110} />
              <Text style={styles.detailEmoji}>{match.emoji}</Text>
            </View>
            <View style={styles.detailBody}>
              <Text style={styles.detailTitle}>{match.title}</Text>
              <Text style={styles.detailDesc}>{match.description}</Text>
              <View style={styles.detailMeta}>
                <Text style={styles.detailCat}>{cat?.emoji}  {cat?.label}</Text>
                <Text style={styles.detailDate}>
                  Matched {new Date(match.matched_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
              </View>
              <View style={styles.detailActions}>
                <TouchableOpacity style={styles.closeBtn} onPress={() => setExpanded(false)}>
                  <Text style={styles.closeBtnText}>Close</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => { setExpanded(false); onRemove(match.id); }}
                >
                  <Text style={styles.removeBtnText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

export default function MatchesScreen() {
  const [filter, setFilter] = useState('all');
  const { width } = useWindowDimensions();
  const columns = width >= 768 ? 4 : 2;
  const totalGaps = (columns - 1) * space[3];
  const cardWidth = Math.floor((width - space[4] * 2 - totalGaps) / columns);
  const { user } = useAuth();
  const { matches: allMatches, setMatches, refetch } = useMatches();

  function handleSeen(id) {
    client.post(`/matches/${id}/seen`).catch(() => {});
    setMatches((prev) => prev.map((m) => m.id === id ? { ...m, seen: true } : m));
  }

  function handleRemove(id) {
    setMatches((prev) => prev.filter((m) => m.id !== id));
    client.delete(`/matches/${id}`).catch(() => refetch());
  }

  const filtered = filter === 'all' ? allMatches : allMatches.filter((m) => m.category === filter);

  return (
    <SlideView>
      <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Matches</Text>
        <Text style={styles.subtitle}>{allMatches.length} thing{allMatches.length !== 1 ? 's' : ''} you both want</Text>
      </View>

      {!user?.coupleId && (
        <View style={styles.soloPrompt}>
          <Text style={styles.soloPromptText}>Pair up with a partner to see your matches</Text>
        </View>
      )}

      <FilterPicker filter={filter} onChange={setFilter} matches={allMatches} />

      {filtered.length > 0 ? (
        <ScrollView contentContainerStyle={styles.grid}>
          {filtered.map((match) => (
            <MatchCard key={match.id} match={match} onSeen={handleSeen} onRemove={handleRemove} cardWidth={cardWidth} />
          ))}
        </ScrollView>
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🤞</Text>
          <Text style={styles.emptyTitle}>No matches yet</Text>
          <Text style={styles.emptySub}>Keep browsing — when you both say yes, it'll show up here</Text>
        </View>
      )}
    </SafeAreaView>
    </SlideView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  header: { padding: space[5], paddingBottom: space[3] },
  title: { fontFamily: fonts.serif, fontSize: 26, color: colors.text },
  subtitle: { fontFamily: fonts.sansLight, fontSize: 13, color: colors.textMuted, marginTop: 2 },

  filters: { flexDirection: 'row', gap: space[2], paddingHorizontal: space[5], paddingBottom: space[3], alignItems: 'center' },
  filterChip: {
    paddingVertical: 6, paddingHorizontal: 12,
    borderRadius: radii.full, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  filterActive: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  filterText: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.textMuted },
  filterTextActive: { color: colors.accent },

  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    padding: space[4], gap: space[3],
  },
  card: {
    borderRadius: radii.xl,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingVertical: space[5],
    paddingHorizontal: space[3],
    gap: 8,
    position: 'relative',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#2D1F3D',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  newBadge: {
    position: 'absolute', top: 9, right: 9,
    backgroundColor: colors.accent,
    borderRadius: radii.full,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  newBadgeText: {
    fontFamily: fonts.sansMedium,
    fontSize: 9,
    color: '#fff',
    letterSpacing: 0.8,
  },
  cardEmoji: { fontSize: 38 },
  cardTitle: { fontFamily: fonts.serifBold, fontSize: 13, color: colors.text, lineHeight: 18, textAlign: 'center' },
  cardCat: { fontFamily: fonts.sans, fontSize: 11, color: colors.textLight, letterSpacing: 0.3, textAlign: 'center' },

  overlay: {
    flex: 1, backgroundColor: 'rgba(45,31,61,0.7)',
    alignItems: 'center', justifyContent: 'center', padding: space[6],
  },
  detail: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    width: '100%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  detailHero: {
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  detailEmoji: { fontSize: 56 },
  detailBody: {
    padding: space[5],
    gap: space[4],
    alignItems: 'center',
  },
  detailTitle: { fontFamily: fonts.serifBold, fontSize: 22, color: colors.text, textAlign: 'center' },
  detailDesc: { fontFamily: fonts.sansLight, fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 21 },
  detailMeta: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  detailCat: { fontFamily: fonts.sans, fontSize: 13, color: colors.textMuted },
  detailDate: { fontFamily: fonts.sans, fontSize: 13, color: colors.textLight },
  detailActions: { flexDirection: 'row', gap: space[3], width: '100%' },
  closeBtn: {
    flex: 1, paddingVertical: 12, borderRadius: radii.full,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center',
  },
  closeBtnText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.textMuted },
  removeBtn: {
    flex: 1, paddingVertical: 12, borderRadius: radii.full,
    backgroundColor: colors.noSoft, alignItems: 'center',
  },
  removeBtnText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.no },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space[3], padding: space[8] },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontFamily: fonts.serif, fontSize: 20, color: colors.text },
  emptySub: { fontFamily: fonts.sansLight, fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },

  soloPrompt: {
    marginHorizontal: space[5],
    marginBottom: space[3],
    padding: space[4],
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  soloPromptText: { fontFamily: fonts.sansLight, fontSize: 14, color: colors.textMuted, textAlign: 'center' },
});