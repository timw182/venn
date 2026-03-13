import { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import client from '../api/client';
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

const TABS = [
  { name: SCREENS.BROWSE,   label: 'Browse',  icon: 'grid'   },
  { name: SCREENS.MATCHES,  label: 'Matches', icon: 'link-2' },
  { name: SCREENS.MOOD,     label: 'Mood',    icon: 'smile'  },
  { name: SCREENS.SETTINGS, label: 'Settings',icon: 'sun'    },
];

function CustomTabBar({ state, descriptors, navigation, matchCount }) {
  return (
    <View style={styles.tabBar}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const tab = TABS.find((t) => t.name === route.name);
        const color = focused ? colors.accent : colors.textLight;
        const badge = route.name === SCREENS.MATCHES ? matchCount : 0;

        return (
          <TouchableOpacity
            key={route.key}
            style={styles.tabItem}
            onPress={() => {
              if (!focused) navigation.navigate(route.name);
            }}
            activeOpacity={0.7}
          >
            <View style={styles.iconWrap}>
              <Feather name={tab.icon} size={22} color={color} />
              {badge > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{tab.label}</Text>
            {focused && <View style={styles.activeDot} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function MainTabs({ matchCount = 0 }) {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} matchCount={matchCount} />}
    >
      <Tab.Screen name={SCREENS.BROWSE}   component={BrowseScreen}   />
      <Tab.Screen name={SCREENS.MATCHES}  component={MatchesScreen}  />
      <Tab.Screen name={SCREENS.MOOD}     component={MoodScreen}     />
      <Tab.Screen name={SCREENS.SETTINGS} component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, isSolo, loading } = useAuth();
  const [unseenCount, setUnseenCount] = useState(0);

  useEffect(() => {
    if (!user?.coupleId) { setUnseenCount(0); return; }
    client.get('/matches')
      .then((matches) => setUnseenCount(matches.filter((m) => !m.seen).length))
      .catch(() => {});
  }, [user?.coupleId]);

  if (loading) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        {!user ? (
          <Stack.Screen name={SCREENS.LANDING} component={LandingScreen} />
        ) : !user.coupleId && !isSolo ? (
          <>
            <Stack.Screen name={SCREENS.PAIRING}   component={PairingScreen}   />
            <Stack.Screen name={SCREENS.CONNECTED} component={ConnectedScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Main">{() => <MainTabs matchCount={unseenCount} />}</Stack.Screen>
            <Stack.Screen name={SCREENS.PAIRING}   component={PairingScreen}   />
            <Stack.Screen name={SCREENS.CONNECTED} component={ConnectedScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    height: 72,
    paddingBottom: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingTop: 8,
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
