import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '../context/AuthContext';

import LoginScreen from '../screens/auth/LoginScreen';

// Support
import SupportDashboard from '../screens/support/SupportDashboard';
import CreateTicketScreen from '../screens/support/CreateTicketScreen';
import TicketDetailScreen from '../screens/support/TicketDetailScreen';

// Branch Manager
import BMDashboard from '../screens/branchmanager/BMDashboard';
import BMTicketDetailScreen from '../screens/branchmanager/BMTicketDetailScreen';

// FSE
import FSEDashboard from '../screens/fse/FSEDashboard';
import FSETicketDetailScreen from '../screens/fse/FSETicketDetailScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user, userRole, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          // Auth screens
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : userRole === 'support' ? (
          // Support screens
          <>
            <Stack.Screen name="SupportDashboard" component={SupportDashboard} />
            <Stack.Screen name="CreateTicket" component={CreateTicketScreen} />
            <Stack.Screen name="TicketDetail" component={TicketDetailScreen} />
          </>
        ) : userRole === 'branch_manager' ? (
          // Branch Manager screens
          <>
            <Stack.Screen name="BMDashboard" component={BMDashboard} />
            <Stack.Screen name="BMTicketDetail" component={BMTicketDetailScreen} />
          </>
        ) : userRole === 'fse' ? (
          // FSE screens — all registered here
          <>
            <Stack.Screen name="FSEDashboard" component={FSEDashboard} />
            <Stack.Screen name="FSETicketDetail" component={FSETicketDetailScreen} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
