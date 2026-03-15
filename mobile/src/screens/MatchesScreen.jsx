import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, Pressable, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CATEGORIES } from '../lib/constants';
import { colors, fonts, space, radii } from '../theme/tokens';
import client from '../api/client';
import { useMatches } from '../context/MatchContext';
import { useAuth } from '../context/useAuth';
import SlideView from '../components/SlideView';

function MatchCard({ match, onSeen, onRemove, cardWidth }) {
  const [expanded, setExpanded] = useState(false);
  const cat = CATEGORIES.find((c) => c.key === match.category);

  function handleOpen() {
    setExpanded(true);
    if (!match.seen) onSeen(match.id);
  }

  return (
    <>
      <TouchableOpacity
        style={[styles.card, { width: cardWidth }, !match.seen && styles.cardNew]}
        onPress={handleOpen}
        activeOpacity={0.75}
      >
        {!match.seen && <View style={styles.newDot} />}
        <Text style={styles.cardEmoji}>{match.emoji}</Text>
        <Text style={styles.cardTitle} numberOfLines={2}>{match.title}</Text>
        <Text style={styles.cardCat}>{cat?.label}</Text>
      </TouchableOpacity>

      <Modal visible={expanded} transparent animationType="fade" onRequestClose={() => setExpanded(false)}>
        <Pressable style={styles.overlay} onPress={() => setExpanded(false)}>
          <Pressable style={styles.detail} onPress={() => {}}>
            <Text style={styles.detailEmoji}>{match.emoji}</Text>
            <Text style={styles.detailTitle}>{match.title}</Text>
            <Text style={styles.detailDesc}>{match.description}</Text>
            <View style={styles.detailMeta}>
              <Text style={styles.detailCat}>{cat?.emoji} {cat?.label}</Text>
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
                <Text style={styles.removeBtnText}>Remove match</Text>
              </TouchableOpacity>
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
  const cardWidth = Math.floor((width - space[4] * 2 - space[3]) / 2);
  const { user } = useAuth();
  const { matches: allMatches, setMatches } = useMatches();

  function handleSeen(id) {
    client.post(`/matches/${id}/seen`).catch(() => {});
    setMatches((prev) => prev.map((m) => m.id === id ? { ...m, seen: true } : m));
  }

  function handleRemove(id) {
    setMatches((prev) => prev.filter((m) => m.id !== id));
    client.delete(`/matches/${id}`).catch(() => {});
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

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={styles.filters}>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'all' && styles.filterActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>All</Text>
        </TouchableOpacity>
        {CATEGORIES.map((cat) => {
          const count = allMatches.filter((m) => m.category === cat.key).length;
          if (count === 0) return null;
          return (
            <TouchableOpacity
              key={cat.key}
              style={[styles.filterChip, filter === cat.key && styles.filterActive]}
              onPress={() => setFilter(cat.key)}
            >
              <Text style={[styles.filterText, filter === cat.key && styles.filterTextActive]}>
                {cat.emoji} {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

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
  container: { flex: 1, backgroundColor: colors.bg },
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
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space[4],
    gap: 6,
    position: 'relative',
    alignItems: 'center',
  },
  cardNew: { borderColor: colors.accent, backgroundColor: colors.accentBg },
  newDot: {
    position: 'absolute', top: 10, right: 10,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: colors.accent,
  },
  cardEmoji: { fontSize: 28 },
  cardTitle: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.text, lineHeight: 19 },
  cardCat: { fontFamily: fonts.sans, fontSize: 11, color: colors.textLight, textTransform: 'uppercase', letterSpacing: 0.5 },

  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', justifyContent: 'center', padding: space[6],
  },
  detail: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space[6],
    width: '100%',
    alignItems: 'center',
    gap: space[4],
  },
  detailEmoji: { fontSize: 52 },
  detailTitle: { fontFamily: fonts.serif, fontSize: 22, color: colors.text, textAlign: 'center' },
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