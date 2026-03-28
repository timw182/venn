import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Line, Polyline, Rect } from 'react-native-svg';
import { colors, fonts, space, radii } from '../theme/tokens';

function IconWrap({ children }) {
  return <View style={s.iconWrap}>{children}</View>;
}

const SECTIONS = [
  {
    key: 'person',
    title: 'Responsible Person',
    icon: (c) => <Svg width={18} height={18} viewBox="0 0 24 24" fill="none"><Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /><Circle cx="12" cy="7" r="4" stroke={c} strokeWidth={1.8} /></Svg>,
    lines: ['Tim Weirig', '14, Kr\u00e4izhiel', '8390 Nospelt', 'Luxembourg'],
  },
  {
    key: 'contact',
    title: 'Contact',
    icon: (c) => <Svg width={18} height={18} viewBox="0 0 24 24" fill="none"><Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /><Polyline points="22,6 12,13 2,6" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /></Svg>,
    lines: ['Email: hello@kernstudio.dev', 'Phone: +352 621 400 654'],
    links: { 0: 'mailto:hello@kernstudio.dev', 1: 'tel:+352621400654' },
  },
  {
    key: 'business',
    title: 'Business Information',
    icon: (c) => <Svg width={18} height={18} viewBox="0 0 24 24" fill="none"><Rect x="2" y="7" width="20" height="14" rx="2" ry="2" stroke={c} strokeWidth={1.8} /><Path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /></Svg>,
    lines: ['Operated by Kern Studio', 'Luxembourg Trade Register pending'],
  },
  {
    key: 'dispute',
    title: 'Dispute Resolution',
    icon: (c) => <Svg width={18} height={18} viewBox="0 0 24 24" fill="none"><Circle cx="12" cy="12" r="10" stroke={c} strokeWidth={1.8} /><Path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /><Line x1="12" y1="17" x2="12.01" y2="17" stroke={c} strokeWidth={1.8} strokeLinecap="round" /></Svg>,
    body: 'The European Commission provides a platform for online dispute resolution (ODR): ec.europa.eu/consumers/odr',
    footer: 'We are not obliged to participate in dispute resolution proceedings before a consumer arbitration board.',
    odrLink: 'https://ec.europa.eu/consumers/odr',
  },
  {
    key: 'liability',
    title: 'Liability for Content',
    icon: (c) => <Svg width={18} height={18} viewBox="0 0 24 24" fill="none"><Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /></Svg>,
    body: 'As a service provider, we are responsible for our own content in accordance with applicable Luxembourg and EU law. However, we are not obligated to monitor transmitted or stored third-party information or to investigate circumstances indicating illegal activity.',
  },
];

export default function ImpressumScreen({ navigation }) {
  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.7}>
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Polyline points="15 18 9 12 15 6" stroke={colors.textMuted} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
          <Text style={s.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Impressum</Text>
        <Text style={s.subtitle}>Legal Notice</Text>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {SECTIONS.map((sec) => (
          <View key={sec.key} style={s.card}>
            <IconWrap>{sec.icon(colors.accent)}</IconWrap>
            <Text style={s.cardTitle}>{sec.title}</Text>
            {sec.lines && sec.lines.map((line, i) => {
              const link = sec.links?.[i];
              return link ? (
                <TouchableOpacity key={i} onPress={() => Linking.openURL(link).catch(() => Alert.alert('Error', 'Could not open link'))} activeOpacity={0.7}>
                  <Text style={[s.cardBody, s.link]}>{line}</Text>
                </TouchableOpacity>
              ) : (
                <Text key={i} style={s.cardBody}>{line}</Text>
              );
            })}
            {sec.body && (
              <Text style={s.cardBody}>
                {sec.odrLink ? (
                  <>
                    {'The European Commission provides a platform for online dispute resolution (ODR): '}
                    <Text style={s.link} onPress={() => Linking.openURL(sec.odrLink).catch(() => Alert.alert('Error', 'Could not open link'))}>
                      ec.europa.eu/consumers/odr
                    </Text>
                  </>
                ) : sec.body}
              </Text>
            )}
            {sec.footer && <Text style={s.cardBody}>{sec.footer}</Text>}
          </View>
        ))}
        <Text style={s.footerNote}>Last updated: March 2026</Text>
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
    gap: space[2],
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space[1],
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
  link: { color: colors.accent },
  footerNote: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.textLight,
    textAlign: 'center',
    letterSpacing: 0.5,
    paddingTop: space[4],
  },
});
