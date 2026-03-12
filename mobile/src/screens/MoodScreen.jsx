import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MOODS } from '../lib/constants';
import { colors, space, radii } from '../theme/tokens';
import client from '../api/client';

export default function MoodScreen() {
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [matched, setMatched] = useState(null);
  const pollRef = useRef(null);

  useEffect(() => {
    client.get('/mood').then((data) => {
      if (data.mine) {
        setSelected(data.mine.mood);
        setSubmitted(true);
        if (data.partner) {
          setMatched(MOODS.find((m) => m.key === data.mine.mood) ?? null);
        } else {
          startPolling();
        }
      }
    }).catch(() => {});
    return () => stopPolling();
  }, []);

  function startPolling() {
    if (pollRef.current) return;
    pollRef.current = setInterval(() => {
      client.get('/mood').then((data) => {
        if (data.partner) {
          stopPolling();
          setMatched(MOODS.find((m) => m.key === data.mine?.mood) ?? null);
        }
      }).catch(() => {});
    }, 10000);
  }

  function stopPolling() {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }

  async function handleSubmit() {
    try {
      const data = await client.put('/mood', { mood: selected, expires_hours: 8 });
      setSubmitted(true);
      if (data.partner) {
        setMatched(MOODS.find((m) => m.key === selected) ?? null);
      } else {
        startPolling();
      }
    } catch {}
  }

  async function handleReset() {
    stopPolling();
    await client.delete('/mood').catch(() => {});
    setSelected(null);
    setSubmitted(false);
    setMatched(null);
  }

  const currentMood = MOODS.find((m) => m.key === selected);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>How are you feeling?</Text>
          <Text style={styles.subtitle}>
            {submitted
              ? 'Your mood is set. You\'ll see if you match.'
              : "What are you in the mood for? You'll only see theirs if it matches."}
          </Text>
        </View>

        {matched ? (
          <View style={styles.matchedView}>
            <Text style={styles.matchedEmoji}>{matched.emoji}</Text>
            <Text style={styles.matchedTitle}>You're both feeling {matched.label.toLowerCase()}</Text>
            <Text style={styles.matchedSub}>Sounds like a plan</Text>
            <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
              <Text style={styles.resetText}>Set a new mood</Text>
            </TouchableOpacity>
          </View>
        ) : submitted ? (
          <View style={styles.submittedView}>
            <View style={styles.submittedBadge}>
              <Text style={styles.submittedEmoji}>{currentMood?.emoji}</Text>
              <Text style={styles.submittedLabel}>{currentMood?.label}</Text>
            </View>
            <View style={styles.waiting}>
              <View style={styles.pulse} />
              <Text style={styles.waitingText}>Waiting for a match...</Text>
            </View>
            <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
              <Text style={styles.resetText}>Change mood</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <View style={styles.grid}>
              {MOODS.map((mood) => (
                <TouchableOpacity
                  key={mood.key}
                  style={[styles.moodOption, selected === mood.key && styles.moodActive]}
                  onPress={() => setSelected(selected === mood.key ? null : mood.key)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                  <Text style={[styles.moodLabel, selected === mood.key && styles.moodLabelActive]}>
                    {mood.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {selected && (
              <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} activeOpacity={0.8}>
                <Text style={styles.submitText}>Set my mood</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, padding: space[5], gap: space[6] },

  header: { gap: space[2] },
  title: { fontFamily: 'serif', fontStyle: 'italic', fontSize: 26, fontWeight: '400', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textMuted, lineHeight: 20, fontWeight: '300' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space[3] },
  moodOption: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space[4],
    alignItems: 'center',
    gap: 6,
  },
  moodActive: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  moodEmoji: { fontSize: 30 },
  moodLabel: { fontSize: 13, fontWeight: '500', color: colors.textMuted },
  moodLabelActive: { color: colors.accent },

  submitBtn: {
    marginTop: space[5],
    backgroundColor: colors.accent,
    borderRadius: radii.full,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitText: { color: '#FAF6F1', fontSize: 16, fontWeight: '600', letterSpacing: 0.3 },

  matchedView: { alignItems: 'center', gap: space[4], paddingVertical: space[8] },
  matchedEmoji: { fontSize: 64 },
  matchedTitle: { fontFamily: 'serif', fontStyle: 'italic', fontSize: 22, fontWeight: '400', color: colors.text, textAlign: 'center' },
  matchedSub: { fontSize: 14, color: colors.textMuted },

  submittedView: { alignItems: 'center', gap: space[5], paddingVertical: space[8] },
  submittedBadge: {
    backgroundColor: colors.accentSoft,
    borderRadius: radii.full,
    paddingVertical: space[3],
    paddingHorizontal: space[6],
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
  },
  submittedEmoji: { fontSize: 28 },
  submittedLabel: { fontSize: 18, fontWeight: '600', color: colors.accent },

  waiting: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  pulse: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent, opacity: 0.7 },
  waitingText: { fontSize: 14, color: colors.textMuted },

  resetBtn: { padding: space[2] },
  resetText: { fontSize: 14, color: colors.accent, textDecorationLine: 'underline' },
});
