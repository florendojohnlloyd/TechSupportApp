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

// The Home tab is a stack too so it can push CreateTicket (support)
function makeHomeStack(role) {
  return function HomeStack() {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="HomeMain" component={HomeScreen} />
        {role === 'support' && <Stack.Screen name="CreateTicket" component={CreateTicketScreen} />}
      </Stack.Navigator>
    );
  };
}

function RoleTabs() {
  const { userRole } = useAuth();
  const { colors, isDark } = useTheme();

  const accent = userRole === 'branch_manager' ? colors.manager
    : userRole === 'fse' ? colors.fse
    : colors.support;

  const TicketsStack = React.useMemo(() => makeTicketsStack(userRole), [userRole]);
  const HomeStack = React.useMemo(() => makeHomeStack(userRole), [userRole]);

  const icons = {
    Home: ['home', 'home-outline'],
    Tickets: ['reader', 'reader-outline'],
    Notifications: ['notifications', 'notifications-outline'],
    Profile: ['person', 'person-outline'],
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: accent,
        tabBarInactiveTintColor: colors.textLight,
        tabBarStyle: {
          backgroundColor: colors.bgElevated,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ focused, color, size }) => {
          const [on, off] = icons[route.name] || ['ellipse', 'ellipse-outline'];
          return <Ionicons name={focused ? on : off} size={size - 2} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Tickets" component={TicketsStack} options={{ title: userRole === 'fse' ? 'Jobs' : 'Tickets' }} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
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
