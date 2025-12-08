import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialCommunityIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import GameModesScreen from '../screens/GameModesScreen';
import UsersScreen from '../screens/UsersScreen';
import CoachDetailScreen from '../screens/CoachDetailScreen';
import MemberDetailScreen from '../screens/MemberDetailScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ReservationScreen from '../screens/ReservationScreen';
import CourtDetailScreen from '../screens/CourtDetailScreen';
import ReservationsListScreen from '../screens/ReservationsListScreen';
import MatchHistoryScreen from '../screens/MatchHistoryScreen';
import DefiLigScreen from '../screens/DefiLigScreen';
import LigSiralamaScreen from '../screens/LigSiralamaScreen';
import LigAyarlariScreen from '../screens/LigAyarlariScreen';
import NotificationsScreen from '../screens/NotificationsScreen';

export type MainTabParamList = {
  Home: undefined;
  GameModes: undefined;
  Users: undefined;
  Profile: undefined;
  Reservation: { opponentId?: string; opponentName?: string; matchChallengeId?: number } | undefined;
  ReservationsList: undefined;
  MatchHistory: { leagueId?: number; leagueName?: string } | undefined;
  Notifications: undefined;
};

export type ReservationStackParamList = {
  ReservationList: undefined;
  CourtDetail: { courtId: number };
};

export type UsersStackParamList = {
  UsersList: undefined;
  CoachDetail: { coachId: number };
  MemberDetail: { memberId: string };
};

export type GameModesStackParamList = {
  GameModesList: undefined;
  DefiLig: undefined;
  LigSiralama: { lig: any; openMatchResultModal?: boolean; challengeId?: number };
  LigAyarlari: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const GameModesStack = createStackNavigator<GameModesStackParamList>();
const UsersStack = createStackNavigator<UsersStackParamList>();
const ReservationStack = createStackNavigator<ReservationStackParamList>();

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

// Users Stack Navigator
const UsersStackNavigator = () => {
  return (
    <UsersStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <UsersStack.Screen 
        name="UsersList" 
        component={UsersScreen}
      />
      <UsersStack.Screen 
        name="CoachDetail" 
        component={CoachDetailScreen}
      />
      <UsersStack.Screen 
        name="MemberDetail" 
        component={MemberDetailScreen}
      />
    </UsersStack.Navigator>
  );
};

// Reservation Stack Navigator
const ReservationStackNavigator = () => {
  return (
    <ReservationStack.Navigator
      initialRouteName="ReservationList"
      screenOptions={{
        headerShown: false,
      }}
    >
      <ReservationStack.Screen 
        name="ReservationList" 
        component={ReservationScreen}
      />
      <ReservationStack.Screen 
        name="CourtDetail" 
        component={CourtDetailScreen}
      />
    </ReservationStack.Navigator>
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
          paddingBottom: 8,
          paddingTop: 8,
          height: 65,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabBarActiveTintColor: '#2E7D32',
        tabBarInactiveTintColor: '#9E9E9E',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Ana Sayfa',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons 
              name={focused ? "home" : "home-outline"} 
              color={color} 
              size={focused ? 28 : 26} 
            />
          ),
        }}
      />
      <Tab.Screen
        name="GameModes"
        component={GameModesStackNavigator}
        options={{
          title: 'Defi Lig',
          tabBarIcon: ({ color, focused, size }) => (
            <MaterialCommunityIcons 
              name={focused ? "trophy-variant" : "trophy-outline"} 
              color={color} 
              size={focused ? 28 : 26} 
            />
          ),
        }}
      />
      <Tab.Screen
        name="Users"
        component={UsersStackNavigator}
        options={{
          title: 'Kullanıcılar',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons 
              name={focused ? "people" : "people-outline"} 
              color={color} 
              size={focused ? 28 : 26} 
            />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons 
              name={focused ? "person-circle" : "person-circle-outline"} 
              color={color} 
              size={focused ? 28 : 26} 
            />
          ),
        }}
      />
      <Tab.Screen
        name="Reservation"
        component={ReservationStackNavigator}
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
