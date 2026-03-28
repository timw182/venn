import { useState, useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../context/useAuth';
import { useMatches } from '../context/MatchContext';
import { TabDirectionProvider, useTabDirection } from '../context/TabDirectionContext';
import { SCREENS } from '../lib/constants';
import FloatingParticles from '../components/FloatingParticles';
import { colors, fonts } from '../theme/tokens';

import LandingScreen from '../screens/LandingScreen';
import PairingScreen from '../screens/PairingScreen';
import ConnectedScreen from '../screens/ConnectedScreen';
import BrowseScreen from '../screens/BrowseScreen';
import MatchesScreen from '../screens/MatchesScreen';
import MoodScreen from '../screens/MoodScreen';
import SettingsScreen from '../screens/SettingsScreen';
import PrivacyScreen from '../screens/PrivacyScreen';
import ImpressumScreen from '../screens/ImpressumScreen';
import ExpertsScreen from '../screens/ExpertsScreen';
import TermsScreen from '../screens/TermsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TABS = [
  { name: SCREENS.BROWSE,   label: 'Browse',  icon: 'grid'   },
  { name: SCREENS.MATCHES,  label: 'Matches', icon: 'link-2' },
  { name: SCREENS.MOOD,     label: 'Mood',    icon: 'smile'  },
  { name: SCREENS.SETTINGS, label: 'Settings',icon: 'sun'    },
];

const MOOD_LABELS = {
  passionate: { emoji: '🔥', label: 'Passionate' },
  tender:     { emoji: '🫶', label: 'Tender' },
  playful:    { emoji: '😏', label: 'Playful' },
  dominant:   { emoji: '👑', label: 'Dominant' },
  submissive: { emoji: '🦋', label: 'Submissive' },
  curious:    { emoji: '✨', label: 'Curious' },
  lazy:       { emoji: '😴', label: 'Lazy' },
  wild:       { emoji: '⚡', label: 'Wild' },
  romantic:   { emoji: '🌹', label: 'Romantic' },
  needy:      { emoji: '🥺', label: 'Needy' },
  confident:  { emoji: '😎', label: 'Confident' },
  nervous:    { emoji: '🫣', label: 'Nervous' },
  cuddly:     { emoji: '🧸', label: 'Cuddly' },
  flirty:     { emoji: '😘', label: 'Flirty' },
};

function MoodToast({ mood, partnerName }) {
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    if (!mood) return;
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
    const t = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -20, duration: 300, useNativeDriver: true }),
      ]).start();
    }, 4000);
    return () => clearTimeout(t);
  }, [mood]);

  if (!mood) return null;
  const m = MOOD_LABELS[mood] || { emoji: '💫', label: mood };

  return (
    <Animated.View style={[styles.toast, { top: insets.top + 8, opacity, transform: [{ translateY }] }]}>
      <Text style={styles.toastText}>{partnerName} is feeling {m.emoji} {m.label}</Text>
    </Animated.View>
  );
}

function CustomTabBar({ state, descriptors, navigation, matchCount }) {
  const directionRef = useTabDirection();
  return (
    <View style={styles.tabBar}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const tab = TABS.find((t) => t.name === route.name);
        const iconColor = focused ? colors.accent : colors.textLight;
        const badge = route.name === SCREENS.MATCHES ? matchCount : 0;

        return (
          <TouchableOpacity
            key={route.key}
            style={styles.tabItem}
            onPress={() => {
              Haptics.selectionAsync();
              if (!focused) {
                if (directionRef) directionRef.current = index > state.index ? 'right' : 'left';
                navigation.navigate(route.name);
              }
            }}
            activeOpacity={0.7}
          >
            <View style={styles.iconWrap}>
              <Feather name={tab.icon} size={22} color={iconColor} />
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

function MainTabs() {
  const { newMatchCount, partnerMood } = useMatches();
  const { user } = useAuth();

  return (
    <TabDirectionProvider>
    <View style={{ flex: 1 }}>
      <FloatingParticles />
      <Tab.Navigator
        screenOptions={{ headerShown: false }}
        tabBar={(props) => <CustomTabBar {...props} matchCount={newMatchCount} />}
      >
        <Tab.Screen name={SCREENS.BROWSE}   component={BrowseScreen}   />
        <Tab.Screen name={SCREENS.MATCHES}  component={MatchesScreen}  />
        <Tab.Screen name={SCREENS.MOOD}     component={MoodScreen}     />
        <Tab.Screen name={SCREENS.SETTINGS} component={SettingsScreen} />
      </Tab.Navigator>
      {partnerMood && (
        <MoodToast mood={partnerMood} partnerName={user?.partnerName || 'Your partner'} />
      )}
    </View>
    </TabDirectionProvider>
  );
}

export default function AppNavigator() {
  const { user, isSolo, loading } = useAuth();

  if (loading) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        {!user ? (
          <>
            <Stack.Screen name={SCREENS.LANDING}   component={LandingScreen}   />
            <Stack.Screen name={SCREENS.PRIVACY}   component={PrivacyScreen}   />
            <Stack.Screen name={SCREENS.IMPRESSUM} component={ImpressumScreen} />
            <Stack.Screen name={SCREENS.TERMS}     component={TermsScreen}     />
          </>
        ) : !user.coupleId && !isSolo ? (
          <>
            <Stack.Screen name={SCREENS.PAIRING}   component={PairingScreen}   />
            <Stack.Screen name={SCREENS.CONNECTED} component={ConnectedScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name={SCREENS.PAIRING}   component={PairingScreen}   />
            <Stack.Screen name={SCREENS.CONNECTED} component={ConnectedScreen} />
            <Stack.Screen name={SCREENS.PRIVACY}   component={PrivacyScreen}   />
            <Stack.Screen name={SCREENS.IMPRESSUM} component={ImpressumScreen} />
            <Stack.Screen name={SCREENS.TERMS}     component={TermsScreen}     />
            <Stack.Screen name={SCREENS.EXPERTS}   component={ExpertsScreen}   />
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
  iconWrap: { position: 'relative' },
  tabLabel: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.textLight,
    letterSpacing: 0.3,
  },
  tabLabelActive: { color: colors.accent },
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
    backgroundColor: colors.rose,
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
  toast: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
    backgroundColor: colors.deepViolet,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  toastText: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: '#fff',
  },
});
