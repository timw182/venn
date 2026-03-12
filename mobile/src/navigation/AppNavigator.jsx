import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View } from 'react-native';
import { useAuth } from '../context/useAuth';
import { SCREENS } from '../lib/constants';
import { colors } from '../theme/tokens';

import LandingScreen from '../screens/LandingScreen';
import PairingScreen from '../screens/PairingScreen';
import ConnectedScreen from '../screens/ConnectedScreen';
import BrowseScreen from '../screens/BrowseScreen';
import MatchesScreen from '../screens/MatchesScreen';
import MoodScreen from '../screens/MoodScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabIcon({ emoji, label, focused }) {
  return (
    <View style={{ alignItems: 'center', gap: 2 }}>
      <Text style={{ fontSize: 20 }}>{emoji}</Text>
      <Text style={{
        fontSize: 9,
        fontWeight: '500',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        color: focused ? colors.accent : colors.textLight,
      }}>
        {label}
      </Text>
    </View>
  );
}

function MainTabs({ matchCount = 0 }) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'rgba(250,246,241,0.96)',
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 72,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name={SCREENS.BROWSE}
        component={BrowseScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🔥" label="Browse" focused={focused} />,
        }}
      />
      <Tab.Screen
        name={SCREENS.MATCHES}
        component={MatchesScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="💛" label={`Matches${matchCount > 0 ? ` · ${matchCount}` : ''}`} focused={focused} />,
        }}
      />
      <Tab.Screen
        name={SCREENS.MOOD}
        component={MoodScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🌙" label="Mood" focused={focused} />,
        }}
      />
      <Tab.Screen
        name={SCREENS.SETTINGS}
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="⚙️" label="Settings" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        {!user ? (
          <Stack.Screen name={SCREENS.LANDING} component={LandingScreen} />
        ) : !user.coupleId ? (
          <>
            <Stack.Screen name={SCREENS.PAIRING} component={PairingScreen} />
            <Stack.Screen name={SCREENS.CONNECTED} component={ConnectedScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name={SCREENS.CONNECTED} component={ConnectedScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
