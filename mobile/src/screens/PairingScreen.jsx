import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/useAuth';
import { SCREENS } from '../lib/constants';
import { colors, fonts, space, radii } from '../theme/tokens';
import Button from '../components/Button';
import * as Clipboard from 'expo-clipboard';

export default function PairingScreen({ navigation }) {
  const [mode, setMode] = useState('create');
  const [inviteCode, setInviteCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const { pair, createPairingCode, enterSolo, loading } = useAuth();

  useEffect(() => {
    if (mode === 'create' && !inviteCode) {
      createPairingCode().then(setInviteCode).catch(() => {});
    }
  }, [mode]);

  async function handleCopy() {
    await Clipboard.setStringAsync(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleJoin() {
    setError('');
    try {
      await pair(joinCode);
      navigation.replace(SCREENS.CONNECTED);
    } catch (err) {
      setError(err.message || 'Invalid code');
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.emoji}>🔗</Text>
            <Text style={styles.title}>Find your person</Text>
            <Text style={styles.subtitle}>
              {mode === 'create'
                ? 'Share this code with your partner to connect'
                : 'Enter the code your partner shared with you'}
            </Text>
          </View>

          {mode === 'create' ? (
            <View style={styles.createSection}>
              <View style={styles.codeRow}>
                {inviteCode.split('').map((char, i) => (
                  <View key={i} style={styles.codeChar}>
                    <Text style={styles.codeCharText}>{char}</Text>
                  </View>
                ))}
              </View>
              <Button variant="primary" size="lg" fullWidth onPress={handleCopy}>
                {copied ? 'Copied!' : 'Copy code'}
              </Button>
              <View style={styles.waiting}>
                <View style={styles.pulse} />
                <Text style={styles.waitingText}>Waiting for your person...</Text>
              </View>
            </View>
          ) : (
            <View style={styles.joinSection}>
              <TextInput
                style={styles.joinInput}
                value={joinCode}
                onChangeText={(t) => setJoinCode(t.toUpperCase())}
                placeholder="XXXXXX"
                placeholderTextColor={colors.textLight}
                maxLength={6}
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
            </View>
          )}

          <TouchableOpacity
            onPress={() => { setMode(mode === 'create' ? 'join' : 'create'); setError(''); }}
            style={styles.modeToggle}
          >
            <Text style={styles.modeToggleText}>
              {mode === 'create' ? 'I have a code from my partner' : 'I need to create an invite'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={enterSolo} style={styles.skipBtn}>
            <Text style={styles.skipText}>Skip for now — explore solo</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: space[6],
    paddingTop: space[10],
    paddingBottom: space[12],
    gap: space[8],
    alignItems: 'center',
  },

  header: { alignItems: 'center', gap: space[3] },
  emoji: { fontSize: 48 },
  title: { fontFamily: fonts.serifItalic, fontSize: 28, color: colors.text },
  subtitle: { fontFamily: fonts.sansLight, fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },

  createSection: { width: '100%', gap: space[5], alignItems: 'center' },
  codeRow: { flexDirection: 'row', gap: space[2] },
  codeChar: {
    width: 44,
    height: 56,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeCharText: { fontFamily: fonts.serifBoldItalic, fontSize: 22, color: colors.accent, letterSpacing: 1 },

  waiting: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  pulse: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: colors.accent,
    opacity: 0.7,
  },
  waitingText: { fontFamily: fonts.sansLight, fontSize: 13, color: colors.textMuted },

  joinSection: { width: '100%', gap: space[4] },
  joinInput: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingVertical: 16,
    paddingHorizontal: space[5],
    fontFamily: fonts.serifBoldItalic,
    fontSize: 28,
    letterSpacing: 8,
    color: colors.accent,
    textAlign: 'center',
  },
  errorBox: { backgroundColor: colors.noSoft, borderRadius: radii.sm, padding: space[3] },
  errorText: { fontFamily: fonts.sans, fontSize: 13, color: colors.no, textAlign: 'center' },

  modeToggle: { padding: space[2] },
  modeToggleText: { fontFamily: fonts.sans, fontSize: 14, color: colors.accent, textDecorationLine: 'underline' },

  skipBtn: { padding: space[2] },
  skipText: { fontFamily: fonts.sansLight, fontSize: 13, color: colors.textLight, textAlign: 'center' },
});
