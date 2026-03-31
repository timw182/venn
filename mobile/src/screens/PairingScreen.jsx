import { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/useAuth';
import { SCREENS } from '../lib/constants';
import { colors, fonts, space, radii } from '../theme/tokens';
import Button from '../components/Button';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export default function PairingScreen({ navigation, route }) {
  const [mode, setMode] = useState(route?.params?.initialMode ?? null); // null | 'join'
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const { pair, createPairingCode, enterSolo, loading } = useAuth();

  async function handleCreate() {
    setError('');
    setCreating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const code = await createPairingCode();
      navigation.replace(SCREENS.CODE_REVEAL, { code });
    } catch (err) {
      setError(err.message || 'Could not create invite');
    } finally {
      setCreating(false);
    }
  }

  async function handleJoin() {
    setError('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await pair(joinCode);
      navigation.replace(SCREENS.CONNECTED);
    } catch (err) {
      setError(err.message || 'Invalid code');
    }
  }

  async function handleSolo() {
    Haptics.selectionAsync();
    await enterSolo();
    // State update is batched — let React commit isSolo=true before navigating
    setTimeout(() => navigation.reset({ index: 0, routes: [{ name: 'Main' }] }), 50);
  }

  // ── Join mode ──
  if (mode === 'join') {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="always">

            <TouchableOpacity onPress={() => { Keyboard.dismiss(); setMode(null); setError(''); }} style={styles.backBtn}>
              <Feather name="arrow-left" size={20} color={colors.textMuted} />
              <Text style={styles.backText}>back</Text>
            </TouchableOpacity>

            <View style={styles.header}>
              <Text style={styles.title}>Enter the code</Text>
              <Text style={styles.subtitle}>Your partner's 8-character invite code</Text>
            </View>

            <TextInput
              style={styles.codeInput}
              value={joinCode}
              onChangeText={(t) => setJoinCode(t.toUpperCase())}
              placeholder="········"
              placeholderTextColor={colors.textLight}
              maxLength={8}
              autoCapitalize="characters"
              autoCorrect={false}
              autoFocus
            />

            {!!error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Button
              variant="primary"
              size="lg"
              fullWidth
              onPress={handleJoin}
              loading={loading}
              disabled={joinCode.length < 6}
            >
              Connect
            </Button>

            <TouchableOpacity onPress={handleSolo} style={styles.skipBtn}>
              <Text style={styles.skipText}>Connect later →</Text>
            </TouchableOpacity>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── Choice screen ──
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="always">

        <View style={styles.brand}>
          <View style={styles.logoMark}>
            <Feather name="circle" size={14} color={colors.rose} style={{ marginRight: -4 }} />
            <Feather name="circle" size={14} color={colors.violet} style={{ marginLeft: -4 }} />
          </View>
          <Text style={styles.logoName}>venn</Text>
        </View>

        <View style={styles.hero}>
          <Text style={styles.title}>Connect with{'\n'}your person.</Text>
          <Text style={styles.subtitle}>Discover what you both want — together.</Text>
        </View>

        <View style={styles.cards}>

          {/* Create invite */}
          <TouchableOpacity
            style={[styles.card, styles.cardAccent]}
            onPress={handleCreate}
            activeOpacity={0.8}
            disabled={creating}
          >
            <View style={[styles.cardIconBox, styles.cardIconBoxAccent]}>
              {creating
                ? <ActivityIndicator size="small" color={colors.rose} />
                : <Text style={styles.cardEmoji}>💌</Text>
              }
            </View>
            <View style={styles.cardBody}>
              <Text style={[styles.cardTitle, { color: colors.rose }]}>Create an invite</Text>
              <Text style={styles.cardDesc}>Generate a code and share it with your partner</Text>
            </View>
            <View style={styles.priceBadge}>
              <Text style={styles.priceBadgeText}>€9.99</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.orRow}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>or</Text>
            <View style={styles.orLine} />
          </View>

          {/* Enter code */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => { setMode('join'); setError(''); }}
            activeOpacity={0.8}
          >
            <View style={styles.cardIconBox}>
              <Text style={styles.cardEmoji}>🔑</Text>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>I have a code</Text>
              <Text style={styles.cardDesc}>Enter the code your partner shared with you</Text>
            </View>
          </TouchableOpacity>

        </View>

        <View style={{ flex: 1 }} />

        <TouchableOpacity onPress={handleSolo} style={styles.soloBtn}>
          <Text style={styles.soloText}>Explore solo for now →</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: space[6],
    paddingTop: space[8],
    paddingBottom: space[10],
  },

  // Brand
  brand: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: space[10] },
  logoMark: { flexDirection: 'row', alignItems: 'center' },
  logoName: { fontFamily: fonts.serifBold, fontSize: 20, color: colors.text },

  // Hero
  hero: { marginBottom: space[10] },
  title: { fontFamily: fonts.serifBold, fontSize: 28, color: colors.text, lineHeight: 36, letterSpacing: -0.3 },
  subtitle: { fontFamily: fonts.sansLight, fontSize: 14, color: colors.textMuted, marginTop: 6, lineHeight: 20 },

  // Cards
  cards: { gap: space[3] },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[4],
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: space[4],
  },
  cardAccent: {
    borderColor: 'rgba(196,84,122,0.3)',
    backgroundColor: 'rgba(196,84,122,0.04)',
  },
  cardIconBox: {
    width: 40, height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardIconBoxAccent: {
    backgroundColor: 'rgba(196,84,122,0.1)',
    borderColor: 'rgba(196,84,122,0.25)',
  },
  cardEmoji: { fontSize: 18 },
  cardBody: { flex: 1 },
  cardTitle: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.text,
    marginBottom: 3,
    letterSpacing: 0.2,
  },
  cardDesc: {
    fontFamily: fonts.sansLight,
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 17,
  },
  priceBadge: {
    backgroundColor: 'rgba(196,84,122,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(196,84,122,0.25)',
    borderRadius: radii.full,
    paddingHorizontal: 9,
    paddingVertical: 3,
    flexShrink: 0,
  },
  priceBadgeText: { fontFamily: fonts.sansMedium, fontSize: 11, color: colors.rose },

  // Or divider
  orRow: { flexDirection: 'row', alignItems: 'center', gap: space[3], marginVertical: 2 },
  orLine: { flex: 1, height: 1, backgroundColor: colors.border },
  orText: { fontFamily: fonts.sansLight, fontSize: 11, color: colors.textLight, letterSpacing: 0.5 },

  // Solo
  soloBtn: { alignSelf: 'center', paddingVertical: space[3] },
  soloText: { fontFamily: fonts.sansLight, fontSize: 13, color: colors.textLight },

  // Skip in join mode
  skipBtn: { alignSelf: 'center', paddingVertical: space[3], marginTop: space[2] },
  skipText: { fontFamily: fonts.sansLight, fontSize: 13, color: colors.textLight },

  // Join mode
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: space[8] },
  backText: { fontFamily: fonts.sans, fontSize: 14, color: colors.textMuted },
  codeInput: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingVertical: 16,
    paddingHorizontal: space[5],
    fontFamily: fonts.serifBold,
    fontSize: 28,
    letterSpacing: 8,
    color: colors.violet,
    textAlign: 'center',
    marginBottom: space[4],
  },
  errorBox: { backgroundColor: colors.noSoft, borderRadius: radii.sm, padding: space[3], marginBottom: space[3] },
  errorText: { fontFamily: fonts.sans, fontSize: 13, color: colors.no, textAlign: 'center' },
});
