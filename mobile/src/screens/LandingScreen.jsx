import { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, ScrollView, StyleSheet,
  KeyboardAvoidingView, Platform, TouchableOpacity,
  Animated, Dimensions, Image,
} from 'react-native';

const { width: SW, height: SH } = Dimensions.get('window');

const HEART_COLORS = ['#F07A6A', '#9B80D4', '#C4547A', '#9B80D4', '#F07A6A', '#C4547A', '#9B80D4', '#F07A6A'];

const HEARTS = [
  { id: 0, x: SW * 0.05, size: 12, duration: 11000, start: 0.1, opacity: 0.18 },
  { id: 1, x: SW * 0.18, size: 20, duration: 14000, start: 0.55, opacity: 0.14 },
  { id: 2, x: SW * 0.30, size: 10, duration: 9500,  start: 0.35, opacity: 0.20 },
  { id: 3, x: SW * 0.45, size: 16, duration: 13000, start: 0.75, opacity: 0.16 },
  { id: 4, x: SW * 0.58, size: 22, duration: 10500, start: 0.20, opacity: 0.12 },
  { id: 5, x: SW * 0.68, size: 14, duration: 12000, start: 0.60, opacity: 0.18 },
  { id: 6, x: SW * 0.80, size: 18, duration: 15000, start: 0.40, opacity: 0.15 },
  { id: 7, x: SW * 0.90, size: 11, duration: 10000, start: 0.85, opacity: 0.20 },
];

function FloatingHeart({ x, size, duration, start, opacity: maxOpacity, color }) {
  const prog = useRef(new Animated.Value(start)).current;

  useEffect(() => {
    const first = Animated.timing(prog, {
      toValue: 1,
      duration: duration * (1 - start),
      useNativeDriver: true,
    });
    const loop = Animated.loop(
      Animated.timing(prog, { toValue: 1, duration, useNativeDriver: true })
    );
    first.start(() => { prog.setValue(0); loop.start(); });
    return () => { first.stop(); loop.stop(); };
  }, []);

  return (
    <Animated.Text
      style={{
        position: 'absolute',
        left: x,
        bottom: -20,
        fontSize: size,
        color: color || colors.accent,
        opacity: prog.interpolate({ inputRange: [0, 0.06, 0.88, 1], outputRange: [0, maxOpacity, maxOpacity, 0] }),
        transform: [{ translateY: prog.interpolate({ inputRange: [0, 1], outputRange: [0, -(SH + 60)] }) }],
      }}
    >
      ♥
    </Animated.Text>
  );
}

function FloatingHearts() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {HEARTS.map((h, i) => <FloatingHeart key={h.id} {...h} color={HEART_COLORS[i]} />)}
    </View>
  );
}
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/useAuth';
import * as Haptics from 'expo-haptics';
import { colors, fonts, space, radii } from '../theme/tokens';
import Button from '../components/Button';
import LogoMark from '../components/LogoMark';
import VennAnimatedLogo from '../components/VennAnimatedLogo';
import { LockKeyIcon, MoonStarsIcon, UsersIcon } from '../components/FeatureIcons';

const FEATURE_ICONS = [LockKeyIcon, MoonStarsIcon, UsersIcon];

const features = [
  { title: 'No rejection', body: "Neither of you ever sees what the other said no to. Only matches surface." },
  { title: 'Blind matching', body: "Both swipe independently. A match only appears when you both say yes." },
  { title: 'Just you two', body: "Fully private, self-hosted. No ads, no strangers, no data harvesting." },
];

function GlitterIcon({ Icon }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    const glitter = () => {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale,   { toValue: 1.18, duration: 180, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1,    duration: 180, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scale,   { toValue: 1,    duration: 250, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.85, duration: 250, useNativeDriver: true }),
        ]),
      ]).start();
    };
    const initial = setTimeout(glitter, Math.random() * 3000);
    const interval = setInterval(glitter, 3500 + Math.random() * 1500);
    return () => { clearTimeout(initial); clearInterval(interval); };
  }, []);

  return (
    <Animated.View style={{ transform: [{ scale }], opacity }}>
      <Icon size={36} />
    </Animated.View>
  );
}

export default function LandingScreen() {
  const [mode, setMode] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login, register } = useAuth();

  async function handleSubmit() {
    setError('');
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login(username, password);
      } else {
        await register(username, password, displayName);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
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
        <FloatingHearts />
        <ScrollView contentContainerStyle={styles.heroScroll} keyboardShouldPersistTaps="handled">
          <View style={styles.brand}>
            <VennAnimatedLogo size={220} />
            <Text style={styles.tagline}>Find your overlap.</Text>
          </View>

          <View style={styles.features}>
            {features.map((f) => (
              <View key={f.title} style={styles.featureCard}>
                <GlitterIcon Icon={FEATURE_ICONS[features.indexOf(f)]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.featureTitle}>{f.title}</Text>
                  <Text style={styles.featureBody}>{f.body}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.cta}>
            <Button variant="primary" size="lg" fullWidth onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); openForm('register'); }}>
              Get started
            </Button>
            <TouchableOpacity onPress={() => openForm('login')} style={styles.toggleBtn}>
              <Text style={styles.toggleText}>Already have an account? <Text style={styles.toggleLink}>Sign in</Text></Text>
            </TouchableOpacity>
          </View>

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
            <LogoMark size="md" />
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
                placeholder={mode === 'login' ? 'Enter your username' : 'Pick something just for you'}
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

            <Button variant="primary" size="lg" fullWidth onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); handleSubmit(); }} loading={submitting}>
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
    paddingTop: space[4],
    paddingBottom: space[6],
    gap: space[8],
  },

  brand: { alignItems: 'center', gap: space[3] },
  tagline: { fontFamily: fonts.sansLight, fontSize: 18, color: colors.textMuted, letterSpacing: 0.3 },
  taglineEm: { fontFamily: fonts.serifItalic, color: colors.accent },

  features: { gap: space[3] },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space[4],
    padding: space[4],
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  featureIcon: { fontSize: 22, lineHeight: 28 },
  featureTitle: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.text, marginBottom: 3, letterSpacing: 0.2 },
  featureBody: { fontFamily: fonts.sansLight, fontSize: 13, color: colors.textMuted, lineHeight: 19 },

  cta: { gap: space[4], alignItems: 'center' },
  toggleBtn: { padding: space[2] },
  toggleText: { fontFamily: fonts.sans, fontSize: 14, color: colors.textMuted, letterSpacing: 0.2, textAlign: 'center' },
  toggleLink: { color: colors.accent },

  footer: { fontFamily: fonts.sansMedium, fontSize: 11, color: colors.textLight, letterSpacing: 1, textTransform: 'uppercase', textAlign: 'center' },

  formScroll: {
    flexGrow: 1,
    paddingHorizontal: space[6],
    paddingTop: space[6],
    paddingBottom: space[6],
    gap: space[7],
  },

  backBtn: { alignSelf: 'flex-start', paddingVertical: space[1] },
  backText: { fontFamily: fonts.sans, fontSize: 14, color: colors.textMuted, letterSpacing: 0.3 },

  formBrand: { alignItems: 'center', gap: space[2] },
  subtitle: { fontFamily: fonts.sans, fontSize: 14, color: colors.textMuted, letterSpacing: 0.3 },

  form: { gap: space[5] },
  field: { gap: space[2] },
  label: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingVertical: 13,
    paddingHorizontal: space[4],
    fontFamily: fonts.sans,
    fontSize: 16,
    color: colors.text,
  },

  errorBox: {
    backgroundColor: colors.noSoft,
    borderRadius: radii.sm,
    padding: space[3],
  },
  errorText: { fontFamily: fonts.sans, fontSize: 13, color: colors.no, textAlign: 'center' },
});
