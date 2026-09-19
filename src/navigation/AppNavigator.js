import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

import LoginScreen from '../screens/auth/LoginScreen';

// Shared tab screens
import HomeScreen from '../screens/tabs/HomeScreen';
import FSEHomeScreen from '../screens/tabs/FSEHomeScreen';
import RoutesScreen from '../screens/tabs/RoutesScreen';
import TicketsScreen from '../screens/tabs/TicketsScreen';
import NotificationsScreen from '../screens/tabs/NotificationsScreen';
import ProfileScreen from '../screens/tabs/ProfileScreen';

// Detail / create screens (per role)
import CreateTicketScreen from '../screens/support/CreateTicketScreen';
import TicketDetailScreen from '../screens/support/TicketDetailScreen';
import BMTicketDetailScreen from '../screens/branchmanager/BMTicketDetailScreen';
import FSETicketDetailScreen from '../screens/fse/FSETicketDetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Detail screens available per role, registered inside the Tickets stack
const DETAIL_SCREENS = {
  support: [
    { name: 'TicketDetail', component: TicketDetailScreen },
    { name: 'CreateTicket', component: CreateTicketScreen },
  ],
  branch_manager: [
    { name: 'BMTicketDetail', component: BMTicketDetailScreen },
  ],
  fse: [
    { name: 'FSETicketDetail', component: FSETicketDetailScreen },
  ],
};

// The Tickets tab is a stack: list + detail (+ create for support)
function makeTicketsStack(role) {
  return function TicketsStack() {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="TicketsList" component={TicketsScreen} />
        {(DETAIL_SCREENS[role] || []).map(s => (
          <Stack.Screen key={s.name} name={s.name} component={s.component} />
        ))}
      </Stack.Navigator>
    );
  };
}

// The Home tab is a stack too. For FSE it holds the ticket detail (no separate
// Tickets tab); for support it can push CreateTicket.
function makeHomeStack(role) {
  const Home = role === 'fse' ? FSEHomeScreen : HomeScreen;
  return function HomeStack() {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="HomeMain" component={Home} />
        {role === 'support' && <Stack.Screen name="CreateTicket" component={CreateTicketScreen} />}
        {role === 'fse' && <Stack.Screen name="FSETicketDetail" component={FSETicketDetailScreen} />}
      </Stack.Navigator>
    );
  };
}

const TAB_ICONS = {
  Home: ['home', 'home-outline'],
  Routes: ['map', 'map-outline'],
  Tickets: ['reader', 'reader-outline'],
  Notifications: ['notifications', 'notifications-outline'],
  Profile: ['person', 'person-outline'],
};

function RoleTabs() {
  const { userRole } = useAuth();
  const { colors } = useTheme();

  const isFSE = userRole === 'fse';
  const accent = userRole === 'branch_manager' ? colors.manager : isFSE ? colors.fse : colors.support;

  const TicketsStack = React.useMemo(() => makeTicketsStack(userRole), [userRole]);
  const HomeStack = React.useMemo(() => makeHomeStack(userRole), [userRole]);
  const RoutesTab = React.useMemo(() => RoutesScreen, []);

  // FSE uses the field-service dark palette for its tab bar; others follow theme
  const tabBg = isFSE ? '#0B1120' : colors.bgElevated;
  const tabBorder = isFSE ? 'rgba(255,255,255,0.08)' : colors.border;
  const tabInactive = isFSE ? '#64748B' : colors.textLight;
  const tabActive = isFSE ? '#60A5FA' : accent;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: tabActive,
        tabBarInactiveTintColor: tabInactive,
        tabBarStyle: {
          backgroundColor: tabBg,
          borderTopColor: tabBorder,
          borderTopWidth: 1,
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ focused, color, size }) => {
          const [on, off] = TAB_ICONS[route.name] || ['ellipse', 'ellipse-outline'];
          return <Ionicons name={focused ? on : off} size={size - 2} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      {isFSE ? (
        <Tab.Screen name="Routes" component={RoutesTab} />
      ) : (
        <>
          <Tab.Screen name="Tickets" component={TicketsStack} />
          <Tab.Screen name="Notifications" component={NotificationsScreen} />
        </>
      )}
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();
  const { colors, isDark } = useTheme();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const navTheme = {
    dark: isDark,
    colors: {
      primary: colors.primary,
      background: colors.bg,
      card: colors.bgElevated,
      text: colors.text,
      border: colors.border,
      notification: colors.danger,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <Stack.Screen name="Main" component={RoleTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
