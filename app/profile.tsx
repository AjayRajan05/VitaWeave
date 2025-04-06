import { View, Text, ScrollView, StyleSheet, useWindowDimensions, Image, Platform } from 'react-native';
import { Settings, Bell, Shield, Languages, LogOut } from 'lucide-react-native';

export default function ProfileScreen() {
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;

  const menuItems = [
    { id: 1, title: 'Settings', icon: Settings, badge: null },
    { id: 2, title: 'Notifications', icon: Bell, badge: '3' },
    { id: 3, title: 'Privacy & Security', icon: Shield, badge: null },
    { id: 4, title: 'Language', icon: Languages, badge: 'English' },
    { id: 5, title: 'Logout', icon: LogOut, badge: null },
  ];

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={[
        styles.contentContainer,
        isLargeScreen && styles.contentContainerLarge
      ]}>
      <View style={styles.header}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=200&auto=format&fit=crop' }}
          style={styles.profileImage}
        />
        <View style={styles.profileInfo}>
          <Text style={styles.name}>Dr. Anjali Desai</Text>
          <Text style={styles.role}>ASHA Worker</Text>
          <Text style={styles.location}>Mumbai, Maharashtra</Text>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>127</Text>
          <Text style={styles.statLabel}>Patients</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>48</Text>
          <Text style={styles.statLabel}>Campaigns</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>893</Text>
          <Text style={styles.statLabel}>Hours</Text>
        </View>
      </View>

      <View style={styles.menu}>
        {menuItems.map((item) => (
          <View key={item.id} style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <item.icon size={20} color="#64748b" />
              <Text style={styles.menuItemTitle}>{item.title}</Text>
            </View>
            {item.badge && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.badge}</Text>
              </View>
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 100 : 80,
  },
  contentContainerLarge: {
    padding: 24,
    maxWidth: 768,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: Platform.OS === 'ios' ? 20 : 0,
  },
  profileImage: {
    width: Platform.OS === 'web' ? 120 : 140,
    height: Platform.OS === 'web' ? 120 : 140,
    borderRadius: Platform.OS === 'web' ? 60 : 70,
    marginBottom: 16,
  },
  profileInfo: {
    alignItems: 'center',
  },
  name: {
    fontFamily: 'Inter-Bold',
    fontSize: Platform.OS === 'web' ? 24 : 26,
    color: '#0f172a',
    marginBottom: 4,
  },
  role: {
    fontFamily: 'Inter-SemiBold',
    fontSize: Platform.OS === 'web' ? 16 : 18,
    color: '#0891b2',
    marginBottom: 4,
  },
  location: {
    fontFamily: 'Inter-Regular',
    fontSize: Platform.OS === 'web' ? 14 : 16,
    color: '#64748b',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: Platform.OS === 'web' ? 16 : 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e2e8f0',
  },
  statNumber: {
    fontFamily: 'Inter-Bold',
    fontSize: Platform.OS === 'web' ? 24 : 28,
    color: '#0f172a',
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: Platform.OS === 'web' ? 14 : 16,
    color: '#64748b',
  },
  menu: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Platform.OS === 'web' ? 16 : 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemTitle: {
    fontFamily: 'Inter-Regular',
    fontSize: Platform.OS === 'web' ? 16 : 18,
    color: '#0f172a',
  },
  badge: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontFamily: 'Inter-Medium',
    fontSize: Platform.OS === 'web' ? 12 : 14,
    color: '#0891b2',
  },
});