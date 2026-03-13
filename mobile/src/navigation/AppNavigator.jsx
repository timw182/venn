import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/useAuth';
import { SCREENS } from '../lib/constants';
import { colors, fonts } from '../theme/tokens';

import LandingScreen from '../screens/LandingScreen';
import PairingScreen from '../screens/PairingScreen';
import ConnectedScreen from '../screens/ConnectedScreen';
import BrowseScreen from '../screens/BrowseScreen';
import MatchesScreen from '../screens/MatchesScreen';
import MoodScreen from '../screens/MoodScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  [SCREENS.BROWSE]: 'grid',
  [SCREENS.MATCHES]: 'link-2',
  [SCREENS.MOOD]: 'smile',
  [SCREENS.SETTINGS]: 'sun',
};

function TabButton({ label, iconName, focused, badge }) {
  const color = focused ? colors.accent : colors.textLight;
  return (
    <View style={styles.tabItem}>
      <View style={styles.iconWrap}>
        <Feather name={iconName} size={22} color={color} />
        {badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
      {focused && <View style={styles.activeDot} />}
    </View>
  );
}

function MainTabs({ matchCount = 0 }) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name={SCREENS.BROWSE}
        component={BrowseScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabButton label="Browse" iconName={TAB_ICONS[SCREENS.BROWSE]} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name={SCREENS.MATCHES}
        component={MatchesScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabButton label="Matches" iconName={TAB_ICONS[SCREENS.MATCHES]} focused={focused} badge={matchCount} />
          ),
        }}
      />
      <Tab.Screen
        name={SCREENS.MOOD}
        component={MoodScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabButton label="Mood" iconName={TAB_ICONS[SCREENS.MOOD]} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name={SCREENS.SETTINGS}
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabButton label="Settings" iconName={TAB_ICONS[SCREENS.SETTINGS]} focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, isSolo, loading } = useAuth();

  if (loading) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        {!user ? (
          <Stack.Screen name={SCREENS.LANDING} component={LandingScreen} />
        ) : !user.coupleId && !isSolo ? (
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

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    height: 64,
    paddingBottom: 0,
    paddingTop: 0,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingTop: 6,
  },
  iconWrap: {
    position: 'relative',
  },
  tabLabel: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.textLight,
    letterSpacing: 0.3,
  },
  tabLabelActive: {
    color: colors.accent,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.accent,
    marginTop: 1,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -10,
    backgroundColor: '#E05A3A',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    fontFamily: fonts.sansMedium,
    fontSize: 10,
    color: '#fff',
    lineHeight: 14,
  },
});
