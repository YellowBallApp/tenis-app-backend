import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import GameModesScreen from '../screens/GameModesScreen';
import CoachesScreen from '../screens/CoachesScreen';
import MembersScreen from '../screens/MembersScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ReservationScreen from '../screens/ReservationScreen';
import ReservationsListScreen from '../screens/ReservationsListScreen';
import MatchHistoryScreen from '../screens/MatchHistoryScreen';
import DefiLigScreen from '../screens/DefiLigScreen';
import LigSiralamaScreen from '../screens/LigSiralamaScreen';
import LigAyarlariScreen from '../screens/LigAyarlariScreen';
import NotificationsScreen from '../screens/NotificationsScreen';

export type MainTabParamList = {
  Home: undefined;
  GameModes: undefined;
  Coaches: undefined;
  Members: undefined;
  Profile: undefined;
  Reservation: { opponentId?: string; opponentName?: string; matchChallengeId?: number } | undefined;
  ReservationsList: undefined;
  MatchHistory: { leagueId?: number; leagueName?: string } | undefined;
  Notifications: undefined;
};

export type GameModesStackParamList = {
  GameModesList: undefined;
  DefiLig: undefined;
  LigSiralama: { lig: any; openMatchResultModal?: boolean; challengeId?: number };
  LigAyarlari: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const GameModesStack = createStackNavigator<GameModesStackParamList>();

// GameModes Stack Navigator
const GameModesStackNavigator = () => {
  return (
    <GameModesStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <GameModesStack.Screen 
        name="GameModesList" 
        component={GameModesScreen}
      />
      <GameModesStack.Screen 
        name="DefiLig" 
        component={DefiLigScreen}
      />
      <GameModesStack.Screen 
        name="LigSiralama" 
        component={LigSiralamaScreen}
      />
      <GameModesStack.Screen 
        name="LigAyarlari" 
        component={LigAyarlariScreen}
      />
    </GameModesStack.Navigator>
  );
};

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false, // Tüm sayfalarda header'ı gizle
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E9ECEF',
          borderTopWidth: 1,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarActiveTintColor: '#2E7D32',
        tabBarInactiveTintColor: '#6C757D',
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Ana Sayfa',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="GameModes"
        component={GameModesStackNavigator}
        options={{
          title: 'Defi Lig',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="trophy" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Coaches"
        component={CoachesScreen}
        options={{
          title: 'Antrenörler',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-tie" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Members"
        component={MembersScreen}
        options={{
          title: 'Üyeler',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-group" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Reservation"
        component={ReservationScreen}
        options={{
          title: 'Rezervasyon',
          tabBarButton: () => null, // Hide from tab bar but keep in navigator
        }}
      />
      <Tab.Screen
        name="ReservationsList"
        component={ReservationsListScreen}
        options={{
          title: 'Rezervasyonlar',
          tabBarButton: () => null, // Hide from tab bar but keep in navigator
        }}
      />
      <Tab.Screen
        name="MatchHistory"
        component={MatchHistoryScreen}
        options={{
          title: 'Maç Geçmişi',
          tabBarButton: () => null, // Hide from tab bar but keep in navigator
        }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          title: 'Bildirimler',
          tabBarButton: () => null, // Hide from tab bar but keep in navigator
        }}
      />
    </Tab.Navigator>
  );
};

const MainTabNavigator = () => {
  return <TabNavigator />;
};

export default MainTabNavigator;
