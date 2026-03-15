import { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/useAuth';
import { useMatches } from '../context/MatchContext';
import { colors, fonts, space, radii } from '../theme/tokens';
import Button from '../components/Button';
import client from '../api/client';
import SlideView from '../components/SlideView';

export default function SettingsScreen({ navigation }) {
  const { user, logout, updateProfile } = useAuth();
  const { resetState, setResetState } = useMatches();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [resetConfirm, setResetConfirm] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [disconnectError, setDisconnectError] = useState(null);

  async function handleSave() {
    setSaveError('');
    try {
      await updateProfile(displayName);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setSaveError(err.message || 'Could not save');
    }
  }

  async function handleLogout() {
    await logout();
  }

  async function handleDisconnect() {
    Alert.alert(
      'Disconnect partner',
      'Disconnect from your partner? You can reconnect with a new pairing code.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect', style: 'destructive',
          onPress: async () => {
            setDisconnecting(true);
            setDisconnectError(null);
            try {
              await client.post('/auth/disconnect');
              await logout();
            } catch (e) {
              setDisconnectError(e?.message || "Couldn't disconnect. Try again.");
            }
            setDisconnecting(false);
          },
        },
      ]
    );
  }

  async function handleRequestReset() {
    await client.post('/reset/request');
    setResetState('pending_mine');
    setResetConfirm(false);
  }

  async function handleConfirmReset() { await client.post('/reset/confirm'); }
  async function handleDeclineReset()  { await client.post('/reset/decline');  setResetState('none'); }
  async function handleCancelReset()   { await client.post('/reset/cancel');   setResetState('none'); }

  return (
    <SlideView>
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll}>

          <View style={styles.headerRow}>
            <Text style={styles.title}>Settings</Text>
            <Button variant="secondary" size="sm" onPress={handleLogout}>Sign out</Button>
          </View>

          {/* Profile */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Profile</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Display Name</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="Your name"
                  placeholderTextColor={colors.textLight}
                />
                <Button variant="secondary" size="sm" onPress={handleSave}>
                  {saved ? 'Saved!' : 'Save'}
                </Button>
              </View>
              {!!saveError && <Text style={styles.errorText}>{saveError}</Text>}
            </View>

            {user?.coupleId ? (
              <View style={styles.field}>
                <Text style={styles.label}>Connected to</Text>
                <View style={styles.inputRow}>
                  <View style={[styles.input, styles.inputReadonly]}>
                    <Text style={styles.inputReadonlyText}>{user.partnerName}</Text>
                  </View>
                  <Button
                    variant="secondary"
                    size="sm"
                    onPress={handleDisconnect}
                    disabled={disconnecting}
                    loading={disconnecting}
                  >
                    Disconnect
                  </Button>
                </View>
                {!!disconnectError && <Text style={styles.errorText}>{disconnectError}</Text>}
              </View>
            ) : (
              <View style={styles.pairPrompt}>
                <Text style={styles.pairText}>
                  {'You\'re exploring solo. Connect with a partner to see your matches.'}
                </Text>
                <Button variant="primary" size="sm" onPress={() => navigation.navigate('Pairing')}>
                  Create or enter a code
                </Button>
              </View>
            )}

            {user?.coupleId && (
              <View style={styles.field}>
                <Text style={styles.label}>Reset</Text>

                {resetState === 'none' && !resetConfirm && (
                  <View style={styles.resetRow}>
                    <Button variant="secondary" size="sm" onPress={() => setResetConfirm(true)}>
                      Request reset
                    </Button>
                    <Text style={styles.resetHint}>
                      Clears all swipes and matches. Both partners must confirm.
                    </Text>
                  </View>
                )}

                {resetState === 'none' && resetConfirm && (
                  <View style={styles.resetConfirmBox}>
                    <Text style={styles.resetWarning}>
                      Are you sure? Your partner will also need to confirm before anything is deleted.
                    </Text>
                    <View style={styles.resetActions}>
                      <Button variant="danger" size="sm" onPress={handleRequestReset}>Yes, send request</Button>
                      <Button variant="ghost"  size="sm" onPress={() => setResetConfirm(false)}>Cancel</Button>
                    </View>
                  </View>
                )}

                {resetState === 'pending_mine' && (
                  <View>
                    <Text style={styles.resetPending}>⏳ Waiting for your partner to confirm…</Text>
                    <Button variant="ghost" size="sm" onPress={handleCancelReset}>Cancel request</Button>
                  </View>
                )}

                {resetState === 'pending_partner' && (
                  <View>
                    <Text style={styles.resetWarning}>⚠️ Your partner wants to reset all swipes and matches.</Text>
                    <View style={styles.resetActions}>
                      <Button variant="danger" size="sm" onPress={handleConfirmReset}>Confirm reset</Button>
                      <Button variant="ghost"  size="sm" onPress={handleDeclineReset}>Decline</Button>
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* About */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About Venn</Text>
            <Text style={styles.aboutDesc}>
              Discover what you both want — without the awkwardness. Your responses are never shared unless you both say yes.
            </Text>
            <Text style={styles.aboutDesc}>Learn more about our motivations and expert opinions:</Text>
            <View style={styles.aboutLinks}>
              <Button variant="secondary" size="sm" onPress={() => Linking.openURL('https://venn.amoreapp.net/privacy')}>
                Privacy Policy
              </Button>
              <Button variant="secondary" size="sm" onPress={() => Linking.openURL('https://venn.amoreapp.net/experts')}>
                What Experts say
              </Button>
            </View>
          </View>

        </ScrollView>
      </SafeAreaView>
    </SlideView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: space[5], gap: space[5] },

  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: fonts.serifBold, fontSize: 26, color: colors.text },

  section: {
    backgroundColor: colors.surface, borderRadius: radii.lg,
    borderWidth: 1, borderColor: colors.border,
    padding: space[5], gap: space[4],
  },
  sectionTitle: {
    fontFamily: fonts.sansMedium, fontSize: 11,
    letterSpacing: 1, textTransform: 'uppercase', color: colors.textLight,
  },

  field: { gap: space[2] },
  label: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.textMuted },

  inputRow: { flexDirection: 'row', gap: space[3], alignItems: 'center' },
  input: {
    flex: 1, backgroundColor: colors.surfaceAlt,
    borderWidth: 1, borderColor: colors.borderStrong,
    borderRadius: radii.md,
    paddingVertical: space[2], paddingHorizontal: space[3],
    fontFamily: fonts.sans, fontSize: 15, color: colors.text,
  },
  inputReadonly: { justifyContent: 'center' },
  inputReadonlyText: { fontFamily: fonts.sansMedium, fontSize: 15, color: colors.text },

  pairPrompt: { gap: space[3] },
  pairText: { fontFamily: fonts.sans, fontSize: 14, color: colors.textMuted },

  resetRow: { gap: space[2] },
  resetHint: { fontFamily: fonts.sans, fontSize: 12, color: colors.textLight, lineHeight: 17 },
  resetConfirmBox: { gap: space[3] },
  resetActions: { flexDirection: 'row', gap: space[3], alignItems: 'center', flexWrap: 'wrap' },
  resetWarning: { fontFamily: fonts.sans, fontSize: 13, color: colors.no, lineHeight: 18, marginBottom: space[3] },
  resetPending: { fontFamily: fonts.sans, fontSize: 13, color: colors.textMuted, marginBottom: space[3] },

  errorText: { fontFamily: fonts.sans, fontSize: 12, color: colors.no },

  aboutDesc: { fontFamily: fonts.sans, fontSize: 13, color: colors.textMuted, lineHeight: 19 },
  aboutLinks: { flexDirection: 'row', gap: space[3], flexWrap: 'wrap' },
});
