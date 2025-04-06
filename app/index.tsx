import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Bell, Calendar, Activity } from 'lucide-react-native';

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome, ASHA Worker</Text>
        <Bell size={24} color="#0f172a" />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Tasks</Text>
        <View style={styles.card}>
          <Calendar size={20} color="#0891b2" />
          <Text style={styles.taskText}>5 patient visits scheduled</Text>
        </View>
        <View style={styles.card}>
          <Activity size={20} color="#0891b2" />
          <Text style={styles.taskText}>2 health campaigns active</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Updates</Text>
        <View style={styles.updateCard}>
          <Text style={styles.updateTitle}>New Health Advisory</Text>
          <Text style={styles.updateText}>Updated guidelines for maternal care...</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Health Tips</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tipsContainer}>
          {['Pregnancy Care', 'Child Vaccination', 'Nutrition'].map((tip, index) => (
            <View key={index} style={styles.tipCard}>
              <Text style={styles.tipTitle}>{tip}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  greeting: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#0f172a',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: '#0f172a',
    marginBottom: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  taskText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#334155',
    marginLeft: 12,
  },
  updateCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  updateTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#0f172a',
    marginBottom: 4,
  },
  updateText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#64748b',
  },
  tipsContainer: {
    flexDirection: 'row',
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  tipCard: {
    backgroundColor: '#0891b2',
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    minWidth: 150,
  },
  tipTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#ffffff',
  },
});