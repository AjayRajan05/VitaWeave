import { View, Text, ScrollView, StyleSheet, useWindowDimensions, Image, Platform } from 'react-native';
import { Calendar, Ambulance, FileText } from 'lucide-react-native';

export default function ServicesScreen() {
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;

  const services = [
    {
      id: 1,
      title: 'Health Campaigns',
      description: 'Create and manage health awareness campaigns',
      icon: Calendar,
      image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=200&auto=format&fit=crop',
    },
    {
      id: 2,
      title: 'Emergency Services',
      description: 'Book emergency medical transportation',
      icon: Ambulance,
      image: 'https://images.unsplash.com/photo-1587745416684-47953f16f02f?q=80&w=200&auto=format&fit=crop',
    },
    {
      id: 3,
      title: 'Government Schemes',
      description: 'Apply for health-related government schemes',
      icon: FileText,
      image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=200&auto=format&fit=crop',
    },
  ];

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}>
      <View style={[styles.grid, isLargeScreen && styles.gridLarge]}>
        {services.map((service) => (
          <View 
            key={service.id} 
            style={[
              styles.card,
              isLargeScreen ? styles.cardLarge : styles.cardMobile
            ]}>
            <Image
              source={{ uri: service.image }}
              style={styles.cardImage}
            />
            <View style={styles.cardContent}>
              <View style={styles.iconContainer}>
                <service.icon size={24} color="#0891b2" />
              </View>
              <Text style={styles.cardTitle}>{service.title}</Text>
              <Text style={styles.cardDescription}>{service.description}</Text>
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
    paddingVertical: 16,
  },
  grid: {
    paddingHorizontal: 16,
    gap: 16,
  },
  gridLarge: {
    paddingHorizontal: 24,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 16,
  },
  cardMobile: {
    width: '100%',
  },
  cardLarge: {
    width: 'calc(33.33% - 16px)',
    marginBottom: 0,
  },
  cardImage: {
    width: '100%',
    height: Platform.OS === 'web' ? 160 : 200,
  },
  cardContent: {
    padding: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#0f172a',
    marginBottom: 8,
  },
  cardDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
});