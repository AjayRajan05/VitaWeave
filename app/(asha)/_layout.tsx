import { Tabs } from 'expo-router';
// @ts-ignore
import {
  House as Home,
  UsersRound as Users,
  BotMessageSquare as Bot,
  BriefcaseMedical as Briefcase,
  UserRound as User,
  RadioTower as Radio
} from 'lucide-react-native';
import { Platform, StyleSheet, useWindowDimensions, View, ActivityIndicator } from 'react-native';
import { useRoleGuard } from '../../lib/authGuard';

export default function AshaTabLayout() {
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;
  const { isReady } = useRoleGuard('asha');

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#d97706" />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarStyle: [
          styles.tabBar,
          Platform.OS === 'web' && styles.tabBarWeb,
          isLargeScreen && styles.tabBarLarge,
        ],
        tabBarActiveTintColor: '#d97706',
        tabBarInactiveTintColor: '#64748b',
        tabBarLabelStyle: styles.tabBarLabel,
        headerStyle: styles.header,
        headerTitleStyle: styles.headerTitle,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Home size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="patients"
        options={{
          title: 'Patients',
          tabBarIcon: ({ color }) => <Users size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="ai-assistant"
        options={{
          title: 'AI',
          tabBarIcon: ({ color }) => <Bot size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="community-signals"
        options={{
          title: 'Signals',
          tabBarIcon: ({ color }) => <Radio size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          title: 'Services',
          tabBarIcon: ({ color }) => <Briefcase size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <User size={20} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    height: Platform.OS === 'ios' ? 85 : 62,
    paddingBottom: Platform.OS === 'ios' ? 28 : 8,
    paddingTop: 8,
  },
  tabBarWeb: {
    boxShadow: '0px -2px 10px rgba(0, 0, 0, 0.05)',
  } as any,
  tabBarLarge: {
    height: 70,
    paddingBottom: 12,
    paddingTop: 12,
  },
  tabBarLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    marginTop: -4,
  },
  header: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    height: Platform.OS === 'ios' ? 90 : 60,
  },
  headerTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#0f172a',
  },
});
