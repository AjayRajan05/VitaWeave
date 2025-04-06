import { View, Text, ScrollView, StyleSheet, useWindowDimensions, Image, Platform } from 'react-native';
import { Search, Filter } from 'lucide-react-native';

export default function PatientsScreen() {
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;

  const patients = [
    {
      id: 1,
      name: 'Priya Sharma',
      age: 28,
      condition: 'Prenatal Care',
      lastVisit: '2024-02-15',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&auto=format&fit=crop',
    },
    {
      id: 2,
      name: 'Rajesh Kumar',
      age: 45,
      condition: 'Diabetes Management',
      lastVisit: '2024-02-10',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=100&auto=format&fit=crop',
    },
    {
      id: 3,
      name: 'Meera Patel',
      age: 32,
      condition: 'Postnatal Care',
      lastVisit: '2024-02-18',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=100&auto=format&fit=crop',
    },
  ];

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}>
      <View style={[styles.searchContainer, isLargeScreen && styles.searchContainerLarge]}>
        <View style={styles.searchBox}>
          <Search size={20} color="#64748b" />
          <Text style={styles.searchPlaceholder}>Search patients...</Text>
        </View>
        <Filter size={24} color="#0891b2" />
      </View>

      <View style={[styles.grid, isLargeScreen && styles.gridLarge]}>
        {patients.map((patient) => (
          <View 
            key={patient.id} 
            style={[
              styles.patientCard,
              isLargeScreen ? styles.patientCardLarge : styles.patientCardMobile
            ]}>
            <Image
              source={{ uri: patient.image }}
              style={styles.patientImage}
            />
            <View style={styles.patientInfo}>
              <Text style={styles.patientName}>{patient.name}</Text>
              <Text style={styles.patientDetails}>{patient.age} years • {patient.condition}</Text>
              <Text style={styles.lastVisit}>Last visit: {patient.lastVisit}</Text>
            </View>
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
    paddingBottom: Platform.OS === 'ios' ? 100 : 80,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  searchContainerLarge: {
    padding: 24,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchPlaceholder: {
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    fontSize: 14,
  },
  grid: {
    padding: 16,
    gap: 12,
  },
  gridLarge: {
    padding: 24,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
  },
  patientCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 12,
  },
  patientCardMobile: {
    width: '100%',
  },
  patientCardLarge: {
    width: 'calc(50% - 12px)',
    marginBottom: 0,
  },
  patientImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#0f172a',
    marginBottom: 4,
  },
  patientDetails: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  lastVisit: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#94a3b8',
  },
});