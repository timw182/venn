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
    key: 'tldr',
    title: 'The short version',
    highlight: true,
    icon: (c) => <Svg width={18} height={18} viewBox="0 0 24 24" fill="none"><Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /></Svg>,
    body: 'We collect the bare minimum to make Venn work. No real names, no emails, no tracking, no ads. Your swipe data is only ever shared with your paired partner.',
  },
  {
    key: 'who',
    title: 'Who we are',
    icon: (c) => <Svg width={18} height={18} viewBox="0 0 24 24" fill="none"><Circle cx="12" cy="12" r="10" stroke={c} strokeWidth={1.8} /><Line x1="12" y1="16" x2="12" y2="12" stroke={c} strokeWidth={1.8} strokeLinecap="round" /><Line x1="12" y1="8" x2="12.01" y2="8" stroke={c} strokeWidth={1.8} strokeLinecap="round" /></Svg>,
    body: 'Venn is a private couples app operated by Kern Studio from Luxembourg. It helps partners explore shared interests together. We are not affiliated with any third-party advertising or data broker.',
  },
  {
    key: 'data',
    title: 'What data we collect',
    icon: (c) => <Svg width={18} height={18} viewBox="0 0 24 24" fill="none"><Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /></Svg>,
    bullets: [
      { label: 'Account info', text: 'your chosen username and a hashed password.' },
      { label: 'Pairing', text: 'a link between your account and your partner\u2019s account.' },
      { label: 'Swipe responses', text: 'your yes/no/maybe answers, stored to calculate mutual matches.' },
      { label: 'Mood', text: 'the mood you optionally set, visible only to your partner.' },
    ],
    footer: 'We do not collect your real name, email, phone number, location, or device identifiers.',
  },
  {
    key: 'cookies',
    title: 'Cookies',
    icon: (c) => <Svg width={18} height={18} viewBox="0 0 24 24" fill="none"><Rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke={c} strokeWidth={1.8} /><Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /></Svg>,
    body: 'We use a single session cookie (kl_session) strictly to keep you logged in. It contains no tracking data, is never shared, and expires after 7 days. No advertising, analytics, or third-party cookies are used.',
  },
  {
    key: 'visibility',
    title: 'Who can see your data',
    icon: (c) => <Svg width={18} height={18} viewBox="0 0 24 24" fill="none"><Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /><Circle cx="9" cy="7" r="4" stroke={c} strokeWidth={1.8} /></Svg>,
    body: 'Your swipe responses and mood are shared only with your paired partner. No other users can see your data. We do not sell, rent, or share your data with any third party.',
  },
  {
    key: 'deletion',
    title: 'Data deletion',
    icon: (c) => <Svg width={18} height={18} viewBox="0 0 24 24" fill="none"><Polyline points="3 6 5 6 21 6" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /><Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /></Svg>,
    body: 'You can reset all swipe data and matches from Settings (requires confirmation from both partners). To fully delete your account and all associated data, contact us.',
  },
  {
    key: 'gdpr',
    title: 'Your rights (GDPR)',
    icon: (c) => <Svg width={18} height={18} viewBox="0 0 24 24" fill="none"><Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /><Polyline points="14 2 14 8 20 8" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /></Svg>,
    body: 'If you are based in the EU, you have the right to access, correct, export, or delete your personal data at any time. You also have the right to restrict or object to processing. Contact us to exercise these rights.',
  },
  {
    key: 'contact',
    title: 'Contact',
    icon: (c) => <Svg width={18} height={18} viewBox="0 0 24 24" fill="none"><Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /><Polyline points="22,6 12,13 2,6" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /></Svg>,
    body: 'Questions about this policy? Reach us at hello@kernstudio.dev.',
  },
];

export default function PrivacyScreen({ navigation }) {
  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.7}>
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Polyline points="15 18 9 12 15 6" stroke={colors.textMuted} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
          <Text style={s.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Privacy Policy</Text>
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
