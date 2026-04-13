import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Home, Heart, BookOpen, HandCoins, User } from 'lucide-react-native';

import HomeScreen from '../screens/HomeScreen';
import Theme from '../theme/Theme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let IconComponent;
          if (route.name === 'Home') IconComponent = Home;
          else if (route.name === 'Promise') IconComponent = Heart;
          else if (route.name === 'Prayer') IconComponent = BookOpen;
          else if (route.name === 'Give') IconComponent = HandCoins;
          else if (route.name === 'Profile') IconComponent = User;

          return <IconComponent color={color} size={size} />;
        },
        tabBarActiveTintColor: Theme.Colors.primary,
        tabBarInactiveTintColor: Theme.Colors.textSecondary,
        headerStyle: { backgroundColor: Theme.Colors.primary },
        headerTintColor: '#fff',
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ headerTitle: 'Church of God' }} 
      />
      <Tab.Screen name="Promise" component={HomeScreen} /> 
      <Tab.Screen name="Prayer" component={HomeScreen} />
      <Tab.Screen name="Give" component={HomeScreen} />
      <Tab.Screen name="Profile" component={HomeScreen} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={TabNavigator} />
    </Stack.Navigator>
  );
}
