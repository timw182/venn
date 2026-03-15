import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { useFonts,
  Comfortaa_400Regular,
  Comfortaa_600SemiBold,
  Comfortaa_700Bold,
} from '@expo-google-fonts/comfortaa';
import {
  DMSans_300Light,
  DMSans_400Regular,
  DMSans_500Medium,
} from '@expo-google-fonts/dm-sans';
import { AuthProvider } from './src/context/AuthContext';
import { MatchProvider } from './src/context/MatchContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  const [fontsLoaded] = useFonts({
    Comfortaa_400Regular,
    Comfortaa_600SemiBold,
    Comfortaa_700Bold,
    DMSans_300Light,
    DMSans_400Regular,
    DMSans_500Medium,
  });

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <AuthProvider>
        <MatchProvider>
        <AppNavigator />
        </MatchProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
