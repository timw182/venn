import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/useAuth';
import { colors, fonts, space } from '../theme/tokens';
import Button from '../components/Button';

export default function ConnectedScreen({ navigation }) {
  const { user } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>🔗</Text>
        <Text style={styles.title}>You're connected</Text>
        <Text style={styles.names}>
          <Text style={styles.name}>{user?.displayName || 'You'}</Text>
          <Text style={styles.amp}> & </Text>
          <Text style={styles.name}>{user?.partnerName || 'Your person'}</Text>
        </Text>
        <Button variant="primary" size="lg" onPress={() => navigation.replace('Main')}>
          Start exploring together
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space[6],
    gap: space[5],
  },
  icon: { fontSize: 64 },
  title: {
    fontFamily: fonts.serifItalic,
    fontSize: 32,
    color: colors.text,
    textAlign: 'center',
  },
  names: { fontFamily: fonts.sans, fontSize: 20, textAlign: 'center', color: colors.textMuted },
  name: { fontFamily: fonts.sansMedium, color: colors.text },
  amp: { fontFamily: fonts.serifItalic, color: colors.accent },
});
