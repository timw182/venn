import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MOODS } from '../lib/constants';
import { colors, fonts, space, radii } from '../theme/tokens';
import { useAuth } from '../context/useAuth';
import { useMatches } from '../context/MatchContext';
import client from '../api/client';
import SlideView from '../components/SlideView';

export default function MoodScreen() {
  const { user } = useAuth();
  const { partnerMood: wsMood, setPartnerMood } = useMatches();

  const [myMood, setMyMood] = useState(null);
  const [partnerMood, setPartnerMoodLocal] = useState(null);
  const [picking, setPicking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const toastTimer = useRef(null);

  useEffect(() => {
    client.get('/mood')
      .then((data) => {
        setMyMood(data.mine || null);
        setPartnerMoodLocal(data.partner || null);
      })
      .catch(() => {});
  }, []);

  // WS push from partner
  useEffect(() => {
    if (!wsMood) return;
    setPartnerMoodLocal(wsMood);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setPartnerMood(null), 4000);
  }, [wsMood]);

  async function handleSet() {
    if (!picking || loading) return;
    setLoading(true);
    setError(null);
    try {
      const data = await client.put('/mood', { mood: picking, expires_hours: 24 });
      setMyMood(data.mine || null);
      setPartnerMoodLocal(data.partner || null);
      setPicking(null);
    } catch (e) {
      const msg = e?.message || '';
      if (msg.includes('Wait')) setError(msg);
      else if (msg.includes('Not paired')) setError('Pair with a partner to share moods.');
      else setError("Couldn't update mood. Try again.");
    }
    setLoading(false);
  }

  async function handleClear() {
    await client.delete('/mood').catch(() => {});
    setMyMood(null);
    setPicking(null);
  }

  const myMoodObj = MOODS.find((m) => m.key === myMood);
  const partnerMoodObj = MOODS.find((m) => m.key === partnerMood);
  const partnerName = user?.partnerName || 'Partner';

  return (
    <SlideView>
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll}>

          <View style={styles.header}>
            <Text style={styles.title}>Mood</Text>
            <Text style={styles.subtitle}>Let your partner know how you're feeling.</Text>
          </View>

          {/* Your mood */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Your mood</Text>

            {myMood && !picking ? (
              <View style={styles.currentRow}>
                <View style={styles.currentBadge}>
                  <Text style={styles.currentEmoji}>{myMoodObj?.emoji}</Text>
                  <Text style={styles.currentLabel}>{myMoodObj?.label}</Text>
                </View>
                <TouchableOpacity onPress={() => setPicking(myMood)} style={styles.changeBtn}>
                  <Text style={styles.changeBtnText}>Change</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={styles.moodGrid}>
                  {MOODS.map((m) => (
                    <TouchableOpacity
                      key={m.key}
                      style={[styles.moodBtn, picking === m.key && styles.moodBtnActive]}
                      onPress={() => setPicking(m.key)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.moodEmoji}>{m.emoji}</Text>
                      <Text style={[styles.moodLabel, picking === m.key && styles.moodLabelActive]}>
                        {m.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {picking && (
                  <View style={styles.confirmRow}>
                    <TouchableOpacity
                      style={[styles.setBtn, loading && styles.setBtnDisabled]}
                      onPress={handleSet}
                      disabled={loading}
                    >
                      <Text style={styles.setBtnText}>{loading ? 'Sending…' : 'Send to partner'}</Text>
                    </TouchableOpacity>
                    {myMood && (
                      <TouchableOpacity onPress={() => setPicking(null)}>
                        <Text style={styles.cancelText}>Cancel</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {error && <Text style={styles.errorText}>{error}</Text>}
              </>
            )}
          </View>

          {/* Partner mood */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{partnerName}'s mood</Text>
            {partnerMoodObj ? (
              <View style={styles.currentBadge}>
                <Text style={styles.currentEmoji}>{partnerMoodObj.emoji}</Text>
                <Text style={styles.currentLabel}>{partnerMoodObj.label}</Text>
              </View>
            ) : (
              <Text style={styles.emptyText}>Nothing set yet</Text>
            )}
          </View>

        </ScrollView>
      </SafeAreaView>
    </SlideView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: space[5], gap: space[5] },

  header: { gap: space[1] },
  title: { fontFamily: fonts.serifBold, fontSize: 26, color: colors.text },
  subtitle: { fontFamily: fonts.sans, fontSize: 14, color: colors.textMuted },

  section: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space[5],
    gap: space[4],
  },
  sectionLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.textLight,
  },

  moodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] },
  moodBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: radii.full,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceAlt,
  },
  moodBtnActive: {
    backgroundColor: colors.accentBg,
    borderColor: colors.accent,
  },
  moodEmoji: { fontSize: 15 },
  moodLabel: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.textMuted },
  moodLabelActive: { color: colors.accent },

  confirmRow: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
  setBtn: {
    backgroundColor: colors.accent,
    borderRadius: radii.full,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  setBtnDisabled: { opacity: 0.5 },
  setBtnText: { fontFamily: fonts.sansMedium, fontSize: 14, color: '#fff' },
  cancelText: { fontFamily: fonts.sans, fontSize: 13, color: colors.textMuted },

  currentRow: { flexDirection: 'row', alignItems: 'center', gap: space[4] },
  currentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.full,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  currentEmoji: { fontSize: 20 },
  currentLabel: { fontFamily: fonts.sansMedium, fontSize: 15, color: colors.text },

  changeBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  changeBtnText: { fontFamily: fonts.sans, fontSize: 13, color: colors.textMuted },

  emptyText: { fontFamily: fonts.sans, fontSize: 14, color: colors.textMuted, fontStyle: 'italic' },
  errorText: { fontFamily: fonts.sans, fontSize: 13, color: colors.no },
});