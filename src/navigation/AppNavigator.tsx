import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { APP_COLORS } from '../constants/config';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Main App Screens
import HomeScreen from '../screens/main/HomeScreen';
import WeatherScreen from '../screens/main/WeatherScreen';
import TrophyRoomScreenNew from '../screens/main/TrophyRoomScreenNew';
import SocialScreen from '../screens/main/SocialScreen';
import LogCatchScreenSimple from '../screens/main/LogCatchScreenSimple';
import ProfileScreen from '../screens/main/ProfileScreen';
import SettingsScreen from '../screens/main/SettingsScreen';
import AnalyticsScreen from '../screens/main/AnalyticsScreen';
import PremiumScreen from '../screens/main/PremiumScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

function ProfileStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: APP_COLORS.primary,
        },
        headerTintColor: 'white',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="ProfileMain" 
        component={ProfileScreen} 
        options={{ title: 'Profile', headerShown: false }}
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{ title: 'Settings' }}
      />
      <Stack.Screen 
        name="Premium" 
        component={PremiumScreen} 
        options={{ title: 'Premium' }}
      />
    </Stack.Navigator>
  );
}

function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Weather':
              iconName = focused ? 'partly-sunny' : 'partly-sunny-outline';
              break;
            case 'TrophyRoom':
              iconName = focused ? 'trophy' : 'trophy-outline';
              break;
            case 'Social':
              iconName = focused ? 'people' : 'people-outline';
              break;
            case 'LogCatch':
              iconName = focused ? 'add-circle' : 'add-circle-outline';
              break;
            case 'Analytics':
              iconName = focused ? 'analytics' : 'analytics-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: APP_COLORS.primary,
        tabBarInactiveTintColor: APP_COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: APP_COLORS.surface,
          borderTopColor: '#E0E0E0',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerStyle: {
          backgroundColor: APP_COLORS.primary,
        },
        headerTintColor: 'white',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ title: 'Home' }}
      />
      <Tab.Screen 
        name="Weather" 
        component={WeatherScreen} 
        options={{ title: 'Weather' }}
      />
      <Tab.Screen 
        name="TrophyRoom" 
        component={TrophyRoomScreenNew} 
        options={{ title: 'Trophy Room' }}
      />
      <Tab.Screen 
        name="Social" 
        component={SocialScreen} 
        options={{ title: 'Social' }}
      />
      <Tab.Screen 
        name="LogCatch" 
        component={LogCatchScreenSimple} 
        options={{ title: 'Log Catch' }}
      />
      <Tab.Screen 
        name="Analytics" 
        component={AnalyticsScreen} 
        options={{ title: 'Analytics' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileStackNavigator} 
        options={{ title: 'Profile', headerShown: false }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return null; // You could add a loading screen here
  }

  return (
    <NavigationContainer>
      {user ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
