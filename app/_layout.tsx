import { Tabs } from 'expo-router';
import { Chrome as Home, Users, Bot, Briefcase, User } from 'lucide-react-native';
import { Platform, StyleSheet, useWindowDimensions } from 'react-native';

export default function TabLayout() {
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarStyle: [
          styles.tabBar,
          Platform.OS === 'web' && styles.tabBarWeb,
          isLargeScreen && styles.tabBarLarge,
        ],
        tabBarActiveTintColor: '#0891b2',
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
    height: Platform.OS === 'ios' ? 85 : 60,
    paddingBottom: Platform.OS === 'ios' ? 30 : 10,
    paddingTop: 10,
  },
  tabBarWeb: {
    boxShadow: '0px -2px 10px rgba(0, 0, 0, 0.05)',
  },
  tabBarLarge: {
    height: 70,
    paddingBottom: 12,
    paddingTop: 12,
  },
  tabBarLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    marginTop: -5,
  },
  header: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    height: Platform.OS === 'ios' ? 90 : 60,
    paddingTop: Platform.OS === 'ios' ? 40 : 0,
  },
  headerTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#0f172a',
  },
});