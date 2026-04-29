import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Home, Heart, BookOpen, HandCoins, User } from 'lucide-react-native';
import { ActivityIndicator, View, Text, StyleSheet, Alert, Platform, TouchableOpacity } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { AuthProvider, useAuth } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import Theme from '../theme/Theme';
import AdminNavigator from './AdminNavigator'; 

// Auth & Onboarding
import AuthNavigator from './AuthNavigator';
import SplashScreen from '../screens/auth/SplashScreen';
import OnboardingScreen from '../screens/auth/OnboardingScreen';

// Member Screens
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PromiseArchiveScreen from '../screens/PromiseArchiveScreen';
import DailyVideoScreen from '../screens/DailyVideoScreen';
import EventsScreen from '../screens/EventsScreen';
import PrayerWallScreen from '../screens/PrayerWallScreen';
import GivingScreen from '../screens/GivingScreen';
import SermonsScreen from '../screens/SermonsScreen';
import SongsScreen from '../screens/SongsScreen';
import EventDetailsScreen from '../screens/EventDetailsScreen';
import UpdatesScreen from '../screens/UpdatesScreen';
import BibleScreen from '../screens/BibleScreen';
import BibleChaptersScreen from '../screens/BibleChaptersScreen';
import BibleReaderScreen from '../screens/BibleReaderScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

import { Mic, Book, User as UserIcon } from 'lucide-react-native';

const CustomTabBarButton = ({ children, onPress }: any) => (
  <TouchableOpacity
    style={{
      top: -15,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 5,
    }}
    onPress={onPress}
  >
    <View style={{
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: '#c0392b',
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      {children}
    </View>
  </TouchableOpacity>
);

function TabNavigator() {
  const { user, signOut } = useAuth();
  const isGuest = user?.isAnonymous;

  const handleGuestInteraction = (e: any) => {
    if (isGuest) {
      e.preventDefault();
      Alert.alert(
        'Sign In Required',
        'Please sign in to access the community features.',
        [
          { text: 'Later', style: 'cancel' },
          { text: 'Sign In', onPress: () => signOut() }
        ]
      );
    }
  };

  const icons: any = {
    Home: Home,
    Promise: Book,
    Sermons: Mic,
    Prayer: Heart,
    Profile: UserIcon
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => {
          const isSermon = route.name === 'Sermons';
          const IconComponent = isSermon ? Mic : icons[route.name];

          if (focused) {
            return (
              <View style={styles.activePill}>
                <IconComponent color="#fff" size={20} strokeWidth={2.5} />
                <Text style={styles.pillText}>{route.name}</Text>
              </View>
            );
          }

          return (
            <View style={styles.inactiveWrapper}>
              <IconComponent color="#1a2d5a" size={20} strokeWidth={2} />
              <Text style={styles.inactiveLabel}>{route.name}</Text>
            </View>
          );
        },
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#cbd5e1', 
          borderTopWidth: 0,
          height: 80,
          paddingHorizontal: 15,
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 45 : 35,
          left: 15,
          right: 15,
          borderRadius: 25,
          elevation: 20,
          shadowColor: '#000',
          shadowOpacity: 0.1,
          shadowRadius: 10,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between'
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Promise" component={PromiseArchiveScreen} /> 
      <Tab.Screen name="Sermons" component={SermonsScreen} />
      <Tab.Screen 
        name="Prayer" 
        component={PrayerWallScreen} 
        listeners={{ tabPress: handleGuestInteraction }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        listeners={{ tabPress: handleGuestInteraction }}
      />
    </Tab.Navigator>
  );
}

function Navigation() {
  const { user, member, loading } = useAuth();
  const [onboardingComplete, setOnboardingComplete] = React.useState<boolean | null>(null);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 4000);
    
    let unsub: any;

    const checkOnboarding = async () => {
      if (!user) {
        setOnboardingComplete(null);
        return;
      }

      // ── Member / Admin: Skip Onboarding ──
      if (!user.isAnonymous) {
        setOnboardingComplete(true);
        return;
      }

      // ── Guest Mode: Show Onboarding (Reactive via Firestore) ──
      unsub = firestore()
        .collection('users')
        .doc(user.uid)
        .onSnapshot((doc) => {
          if (doc.exists()) {
            setOnboardingComplete(doc.data()?.onboardingComplete === true);
          } else {
            setOnboardingComplete(false);
          }
        }, (err) => {
          console.log('Guest Onboarding Check Error:', err);
          setOnboardingComplete(false); 
        });
    };

    checkOnboarding();
    
    return () => {
      if (unsub) unsub();
      clearTimeout(timer);
    };
  }, [user]);

  if (showSplash || loading) {
    return <SplashScreen />;
  }

  const navigationKey = member?.userType?.toLowerCase() === 'admin' ? 'admin-root' : 'member-root';

  return (
    <Stack.Navigator key={navigationKey} screenOptions={{ headerShown: false }}>
      {user ? (
        member?.userType?.toLowerCase() === 'admin' ? (
          <Stack.Screen name="AdminRoot" component={AdminNavigator} />
        ) : onboardingComplete ? (
          <>
            <Stack.Screen name="Tabs" component={TabNavigator} />
            <Stack.Screen name="DailyVideo" component={DailyVideoScreen} />
            <Stack.Screen name="Events" component={EventsScreen} />
            <Stack.Screen name="Give" component={GivingScreen} />
            <Stack.Screen name="Sermons" component={SermonsScreen} />
            <Stack.Screen name="Songs" component={SongsScreen} />
            <Stack.Screen name="EventDetails" component={EventDetailsScreen} />
            <Stack.Screen name="Updates" component={UpdatesScreen} />
            <Stack.Screen name="PrayerWall" component={PrayerWallScreen} />
            <Stack.Screen name="Bible" component={BibleScreen} />
            <Stack.Screen name="BibleChapters" component={BibleChaptersScreen} />
            <Stack.Screen name="BibleReader" component={BibleReaderScreen} />
          </>
        ) : (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        )
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Navigation />
      </AuthProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a2d5a', 
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8
  },
  pillText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  inactiveWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
  },
  inactiveLabel: {
    color: '#1a2d5a',
    fontSize: 9,
    fontWeight: '700',
    marginTop: 4,
    letterSpacing: 0.2
  }
});
