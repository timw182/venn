import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Line, Polyline, Rect } from 'react-native-svg';
import { colors, fonts, space, radii } from '../theme/tokens';

function IconWrap({ color = colors.accent, children }) {
  return (
    <View style={[s.iconWrap, { backgroundColor: color === colors.violet ? 'rgba(155,128,212,0.12)' : colors.surfaceAlt }]}>
      {children}
    </View>
  );
}

const SECTIONS = [
  {
    key: 'basics',
    title: 'The basics',
    highlight: true,
    icon: (c) => <Svg width={18} height={18} viewBox="0 0 24 24" fill="none"><Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /><Polyline points="14 2 14 8 20 8" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /></Svg>,
    body: 'By using Venn you agree to these terms. Venn is a private couples app for exploring shared interests together. Use it respectfully and honestly with your partner.',
  },
  {
    key: 'eligibility',
    title: 'Eligibility',
    icon: (c) => <Svg width={18} height={18} viewBox="0 0 24 24" fill="none"><Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /><Circle cx="9" cy="7" r="4" stroke={c} strokeWidth={1.8} /></Svg>,
    body: 'You must be at least 18 years old to use Venn. By creating an account you confirm that you meet this age requirement.',
  },
  {
    key: 'account',
    title: 'Your account',
    icon: (c) => <Svg width={18} height={18} viewBox="0 0 24 24" fill="none"><Rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke={c} strokeWidth={1.8} /><Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /></Svg>,
    bullets: [
      { label: 'Security', text: 'keep your login credentials secure.' },
      { label: 'One account', text: 'one account per person, do not share it.' },
      { label: 'Pairing', text: 'you may only pair with one partner at a time.' },
      { label: 'Accuracy', text: 'provide accurate information when registering.' },
    ],
  },
  {
    key: 'content',
    title: 'Content guidelines',
    icon: (c) => <Svg width={18} height={18} viewBox="0 0 24 24" fill="none"><Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /></Svg>,
    bullets: [
      { label: 'Consent', text: 'only pair with a partner who has given informed consent.' },
      { label: 'Respect', text: 'do not use the platform to harass, pressure, or coerce anyone.' },
      { label: 'Privacy', text: 'do not attempt to extract or share your partner\u2019s private responses.' },
      { label: 'Matches', text: 'matches represent mutual interest, not obligation.' },
    ],
  },
  {
    key: 'ip',
    title: 'Intellectual property',
    icon: (c) => <Svg width={18} height={18} viewBox="0 0 24 24" fill="none"><Circle cx="12" cy="12" r="10" stroke={c} strokeWidth={1.8} /><Path d="M12 8v4l3 3" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /></Svg>,
    body: 'All content, design, code, and branding of Venn belong to Kern Studio. You may not copy, modify, distribute, or reverse-engineer any part of the app without written permission.',
  },
  {
    key: 'liability',
    title: 'Limitation of liability',
    icon: (c) => <Svg width={18} height={18} viewBox="0 0 24 24" fill="none"><Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /></Svg>,
    body: 'Venn is provided "as is" without warranties. We are not liable for damages arising from your use of the app, including relationship outcomes, data loss, or service interruptions.',
  },
  {
    key: 'termination',
    title: 'Termination',
    icon: (c) => <Svg width={18} height={18} viewBox="0 0 24 24" fill="none"><Polyline points="3 6 5 6 21 6" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /><Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /></Svg>,
    body: 'We may suspend or terminate your account if you violate these terms. You can stop using Venn at any time. To delete your account and data, go to Settings → Delete Account.',
  },
  {
    key: 'law',
    title: 'Governing law',
    icon: (c) => <Svg width={18} height={18} viewBox="0 0 24 24" fill="none"><Circle cx="12" cy="12" r="10" stroke={c} strokeWidth={1.8} /><Line x1="2" y1="12" x2="22" y2="12" stroke={c} strokeWidth={1.8} /><Path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke={c} strokeWidth={1.8} /></Svg>,
    body: 'These terms are governed by the laws of the Grand Duchy of Luxembourg. Disputes will be resolved in the courts of Luxembourg City.',
  },
  {
    key: 'contact',
    title: 'Contact',
    icon: (c) => <Svg width={18} height={18} viewBox="0 0 24 24" fill="none"><Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /><Polyline points="22,6 12,13 2,6" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /></Svg>,
    body: 'Questions about these terms? Reach us at hello@kernstudio.dev.',
  },
];

export default function TermsScreen({ navigation }) {
  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.7}>
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Polyline points="15 18 9 12 15 6" stroke={colors.textMuted} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
          <Text style={s.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Terms of Service</Text>
        <Text style={s.subtitle}>Last updated: March 2026</Text>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {SECTIONS.map((sec) => {
          const iconColor = sec.highlight ? colors.violet : colors.accent;
          return (
            <View key={sec.key} style={[s.card, sec.highlight && s.cardHighlight]}>
              <IconWrap color={iconColor}>{sec.icon(iconColor)}</IconWrap>
              <Text style={s.cardTitle}>{sec.title}</Text>
              {sec.body && <Text style={s.cardBody}>{sec.body}</Text>}
              {sec.bullets && (
                <View style={s.bullets}>
                  {sec.bullets.map((b, i) => (
                    <Text key={i} style={s.cardBody}>
                      <Text style={s.bold}>{b.label}: </Text>{b.text}
                    </Text>
                  ))}
                </View>
              )}
              {sec.footer && <Text style={s.cardBody}>{sec.footer}</Text>}
            </View>
          );
        })}
        <Text style={s.footerNote}>Kern Studio · Luxembourg</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: space[5], paddingTop: space[3], paddingBottom: space[4] },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: space[3] },
  backText: { fontFamily: fonts.sans, fontSize: 14, color: colors.textMuted },
  title: { fontFamily: fonts.serifBold, fontSize: 28, color: colors.text, fontStyle: 'italic', marginBottom: 2 },
  subtitle: { fontFamily: fonts.sans, fontSize: 13, color: colors.textLight, letterSpacing: 0.5 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: space[5], paddingBottom: space[10], gap: space[3] },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xl,
    padding: space[5],
    gap: space[3],
  },
  cardHighlight: {
    backgroundColor: 'rgba(155,128,212,0.04)',
    borderColor: 'rgba(155,128,212,0.2)',
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    color: colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardBody: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 21,
  },
  bold: { fontFamily: fonts.sansMedium, color: colors.text },
  bullets: { gap: space[2] },
  footerNote: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.textLight,
    textAlign: 'center',
    letterSpacing: 0.5,
    paddingTop: space[4],
  },
});
