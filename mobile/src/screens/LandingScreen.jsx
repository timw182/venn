import { useState } from 'react';
import {
  View, Text, TextInput, ScrollView, StyleSheet,
  KeyboardAvoidingView, Platform, TouchableOpacity, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/useAuth';
import { SCREENS } from '../lib/constants';
import { colors, space, radii } from '../theme/tokens';
import Button from '../components/Button';

const features = [
  { icon: '🔒', title: 'No rejection', body: "Neither of you ever sees what the other said no to. Only matches surface." },
  { icon: '✨', title: 'Blind matching', body: "Both swipe independently. A match only appears when you both say yes." },
  { icon: '🫂', title: 'Just you two', body: "Fully private, self-hosted. No ads, no strangers, no data harvesting." },
];

export default function LandingScreen({ navigation }) {
  const [mode, setMode] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const { login, register, loading } = useAuth();

  async function handleSubmit() {
    setError('');
    try {
      if (mode === 'login') {
        const user = await login(username, password);
        navigation.replace(user.coupleId ? 'Main' : SCREENS.PAIRING);
      } else {
        await register(username, password, displayName);
        navigation.replace(SCREENS.PAIRING);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong');
    }
  }

  function openForm(m) {
    setMode(m);
    setError('');
    setUsername('');
    setPassword('');
    setDisplayName('');
  }

  if (mode === null) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.heroScroll} keyboardShouldPersistTaps="handled">
          <View style={styles.brand}>
            <Text style={styles.wordmark}>kinklink</Text>
            <Text style={styles.tagline}>discover what you <Text style={styles.taglineEm}>both</Text> want</Text>
          </View>

          <View style={styles.features}>
            {features.map((f) => (
              <View key={f.title} style={styles.featureCard}>
                <Text style={styles.featureIcon}>{f.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.featureTitle}>{f.title}</Text>
                  <Text style={styles.featureBody}>{f.body}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.cta}>
            <Button variant="primary" size="lg" fullWidth onPress={() => openForm('register')}>
              Get started
            </Button>
            <TouchableOpacity onPress={() => openForm('login')} style={styles.toggleBtn}>
              <Text style={styles.toggleText}>Already have an account? <Text style={styles.toggleLink}>Sign in</Text></Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footer}>Private · Self-hosted · Just you two</Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => setMode(null)} style={styles.backBtn}>
            <Text style={styles.backText}>← back</Text>
          </TouchableOpacity>

          <View style={styles.formBrand}>
            <Text style={styles.wordmark}>kinklink</Text>
            <Text style={styles.subtitle}>
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </Text>
          </View>

          <View style={styles.form}>
            {mode === 'register' && (
              <View style={styles.field}>
                <Text style={styles.label}>Your Name</Text>
                <TextInput
                  style={styles.input}
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="What should they call you?"
                  placeholderTextColor={colors.textLight}
                  autoCapitalize="words"
                  textContentType="name"
                />
              </View>
            )}

            <View style={styles.field}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="Pick something just for you"
                placeholderTextColor={colors.textLight}
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="username"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Keep it secret"
                placeholderTextColor={colors.textLight}
                secureTextEntry
                textContentType={mode === 'login' ? 'password' : 'newPassword'}
              />
            </View>

            {!!error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Button variant="primary" size="lg" fullWidth onPress={handleSubmit} loading={loading}>
              {mode === 'login' ? 'Sign in' : 'Create account'}
            </Button>
          </View>

          <TouchableOpacity
            onPress={() => openForm(mode === 'login' ? 'register' : 'login')}
            style={styles.toggleBtn}
          >
            <Text style={styles.toggleText}>
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <Text style={styles.toggleLink}>{mode === 'login' ? 'Create one' : 'Sign in'}</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  heroScroll: {
    flexGrow: 1,
    paddingHorizontal: space[6],
    paddingTop: space[8],
    paddingBottom: space[12],
    gap: space[8],
  },

  brand: { alignItems: 'center', gap: space[2] },
  wordmark: {
    fontFamily: 'serif',
    fontSize: 48,
    fontStyle: 'italic',
    fontWeight: '500',
    color: colors.accent,
    letterSpacing: -1,
  },
  tagline: { fontSize: 15, color: colors.textMuted, letterSpacing: 0.3, fontWeight: '300' },
  taglineEm: { color: colors.accent, fontStyle: 'italic' },

  features: { gap: space[3] },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space[4],
    padding: space[4],
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  featureIcon: { fontSize: 22, lineHeight: 28 },
  featureTitle: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 3, letterSpacing: 0.2 },
  featureBody: { fontSize: 13, color: colors.textMuted, lineHeight: 19, fontWeight: '300' },

  cta: { gap: space[4], alignItems: 'center' },
  toggleBtn: { padding: space[2] },
  toggleText: { fontSize: 14, color: colors.textMuted, letterSpacing: 0.2, textAlign: 'center' },
  toggleLink: { color: colors.accent },

  footer: { fontSize: 11, color: colors.textLight, letterSpacing: 1, textTransform: 'uppercase', textAlign: 'center' },

  formScroll: {
    flexGrow: 1,
    paddingHorizontal: space[6],
    paddingTop: space[6],
    paddingBottom: space[12],
    gap: space[7],
  },

  backBtn: { alignSelf: 'flex-start', paddingVertical: space[1] },
  backText: { fontSize: 14, color: colors.textMuted, letterSpacing: 0.3 },

  formBrand: { alignItems: 'center', gap: space[2] },
  subtitle: { fontSize: 14, color: colors.textMuted, letterSpacing: 0.3 },

  form: { gap: space[5] },
  field: { gap: space[2] },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingVertical: 13,
    paddingHorizontal: space[4],
    fontSize: 16,
    color: colors.text,
  },

  errorBox: {
    backgroundColor: colors.noSoft,
    borderRadius: radii.sm,
    padding: space[3],
  },
  errorText: { fontSize: 13, color: colors.no, textAlign: 'center' },
});
