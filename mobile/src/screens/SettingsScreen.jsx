import { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/useAuth';
import { SCREENS } from '../lib/constants';
import { colors, space, radii } from '../theme/tokens';
import Button from '../components/Button';

export default function SettingsScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleLogout() {
    await logout();
    navigation.reset({ index: 0, routes: [{ name: SCREENS.LANDING }] });
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Settings</Text>

        <View style={styles.sections}>
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
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Partner</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Connected to</Text>
              <Text style={styles.infoValue}>{user?.partnerName || 'Not paired yet'}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <View style={styles.about}>
              <Text style={styles.aboutName}>kinklink</Text>
              <Text style={styles.aboutDesc}>
                Discover what you both want — without the awkwardness. Your responses are never shared unless you both say yes.
              </Text>
            </View>
          </View>

          <Button variant="ghost" fullWidth onPress={handleLogout}>
            Sign out
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: space[5], gap: space[5] },

  title: { fontFamily: 'serif', fontStyle: 'italic', fontSize: 26, fontWeight: '400', color: colors.text },

  sections: { gap: space[4] },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space[5],
    gap: space[4],
  },
  sectionTitle: {
    fontSize: 11, fontWeight: '700',
    letterSpacing: 1, textTransform: 'uppercase', color: colors.textLight,
  },

  field: { gap: space[2] },
  label: { fontSize: 14, fontWeight: '500', color: colors.textMuted },
  inputRow: { flexDirection: 'row', gap: space[3], alignItems: 'center' },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radii.md,
    paddingVertical: space[2],
    paddingHorizontal: space[3],
    fontSize: 16,
    color: colors.text,
  },

  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel: { fontSize: 14, color: colors.textMuted },
  infoValue: { fontSize: 15, fontWeight: '500', color: colors.text },

  about: { gap: space[2], alignItems: 'center' },
  aboutName: { fontFamily: 'serif', fontStyle: 'italic', fontSize: 18, color: colors.accent, fontWeight: '300' },
  aboutDesc: { fontSize: 13, color: colors.textMuted, lineHeight: 19, textAlign: 'center', fontWeight: '300' },
});
