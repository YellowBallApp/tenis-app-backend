import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
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
import NotificationsScreen from '../screens/NotificationsScreen';
import BookingConfirmScreen from '../screens/BookingConfirmScreen';

export type MainTabParamList = {
  Home: undefined;
  DefiLig: undefined;
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
  BookingConfirm: {
    courtId: number;
    selectedDate: string;
    selectedTime: string;
    playerType: 'single' | 'double';
    selectedPartner: any;
    selectedOpponents: any[];
    court: any;
  };
};

export type UsersStackParamList = {
  UsersList: undefined;
  CoachDetail: { coachId: number };
  MemberDetail: { memberId: string };
};

export type DefiLigStackParamList = {
  DefiLig: undefined;
  LigSiralama: { lig: any; openMatchResultModal?: boolean; challengeId?: number };
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const DefiLigStack = createStackNavigator<DefiLigStackParamList>();
const UsersStack = createStackNavigator<UsersStackParamList>();
const ReservationStack = createStackNavigator<ReservationStackParamList>();

// DefiLig Stack Navigator
const DefiLigStackNavigator = () => {
  return (
    <DefiLigStack.Navigator
      initialRouteName="DefiLig"
      screenOptions={{
        headerShown: false,
      }}
    >
      <DefiLigStack.Screen 
        name="DefiLig" 
        component={DefiLigScreen}
      />
      <DefiLigStack.Screen 
        name="LigSiralama" 
        component={LigSiralamaScreen}
      />
    </DefiLigStack.Navigator>
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
      <ReservationStack.Screen 
        name="BookingConfirm" 
        component={BookingConfirmScreen}
      />
    </ReservationStack.Navigator>
  );
};

const TabNavigator = () => {
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false, // Tüm sayfalarda header'ı gizle
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E5E7EB', // gray-200 from design
          borderTopWidth: 1,
          paddingBottom: Math.max(insets.bottom, 8), // Safe area bottom or minimum 8
          paddingTop: 6, // Reduced top padding
          paddingHorizontal: 8, // px-2 equivalent
          height: Platform.OS === 'ios' 
            ? 49 + Math.max(insets.bottom, 8) // iOS default + safe area
            : 56 + Math.max(insets.bottom, 8), // Android default + safe area
          elevation: 0,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 0,
          },
          shadowOpacity: 0,
          shadowRadius: 0,
        },
        tabBarActiveTintColor: '#54CE8F', // Primary green from design
        tabBarInactiveTintColor: '#9CA3AF', // gray-400 from design
        tabBarLabelStyle: {
          fontSize: 12, // text-xs
          fontWeight: '400',
          marginTop: 4, // gap-1 equivalent (4px between icon and label)
          marginBottom: 0,
          paddingBottom: 0,
          lineHeight: 14,
          paddingTop: 0,
          includeFontPadding: false, // Android specific - removes extra padding
        },
        tabBarIconStyle: {
          marginTop: 0,
          marginBottom: 0,
          width: 24,
          height: 24,
        },
        tabBarItemStyle: {
          paddingVertical: 0, // No vertical padding to prevent overflow
          paddingHorizontal: 16, // px-4
          justifyContent: 'center',
          alignItems: 'center',
          flex: 1,
          height: '100%',
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
              size={24} 
            />
          ),
        }}
      />
      <Tab.Screen
        name="DefiLig"
        component={DefiLigStackNavigator}
        options={{
          title: 'Defi Lig',
          tabBarIcon: ({ color, focused, size }) => (
            <MaterialCommunityIcons 
              name={focused ? "trophy" : "trophy-outline"} 
              color={color} 
              size={24} 
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
              size={24} 
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
              size={24} 
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
