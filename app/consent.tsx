import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
// @ts-ignore
import { ShieldCheck, AlertTriangle, FileText } from 'lucide-react-native';
import { acceptConsent, MEDICAL_DISCLAIMER, PRIVACY_SUMMARY } from '../lib/consent';
import { Analytics } from '../lib/analytics';

export default function ConsentScreen() {
  const router = useRouter();
  const [medical, setMedical] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [dataProcessing, setDataProcessing] = useState(false);

  const canContinue = medical && privacy && dataProcessing;

  const handleAccept = async () => {
    await acceptConsent();
    Analytics.track({ name: 'consent_accepted' });
    router.replace('/login');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <ShieldCheck size={40} color="#0891b2" />
        <Text style={styles.title}>Before You Continue</Text>
        <Text style={styles.subtitle}>
          VitaWeave handles sensitive health information. Please review and accept the following to use the app.
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <AlertTriangle size={18} color="#d97706" />
          <Text style={styles.cardTitle}>Medical Disclaimer</Text>
        </View>
        <Text style={styles.cardBody}>{MEDICAL_DISCLAIMER}</Text>
        <TouchableOpacity style={styles.checkRow} onPress={() => setMedical(!medical)}>
          <View style={[styles.checkbox, medical && styles.checkboxOn]}>
            {medical ? <Text style={styles.checkMark}>✓</Text> : null}
          </View>
          <Text style={styles.checkLabel}>I understand this is not a substitute for professional medical care</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <FileText size={18} color="#0891b2" />
          <Text style={styles.cardTitle}>Privacy & Data Use</Text>
        </View>
        <Text style={styles.cardBody}>{PRIVACY_SUMMARY}</Text>
        <TouchableOpacity onPress={() => router.push('/privacy-policy')}>
          <Text style={styles.link}>Read full Privacy Policy</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.checkRow} onPress={() => setPrivacy(!privacy)}>
          <View style={[styles.checkbox, privacy && styles.checkboxOn]}>
            {privacy ? <Text style={styles.checkMark}>✓</Text> : null}
          </View>
          <Text style={styles.checkLabel}>I have read and accept the Privacy Policy</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Health Data Processing</Text>
        <Text style={styles.cardBody}>
          I consent to VitaWeave storing and processing health data I enter for care coordination,
          including sharing with assigned ASHA workers and doctors per program access rules.
        </Text>
        <TouchableOpacity style={styles.checkRow} onPress={() => setDataProcessing(!dataProcessing)}>
          <View style={[styles.checkbox, dataProcessing && styles.checkboxOn]}>
            {dataProcessing ? <Text style={styles.checkMark}>✓</Text> : null}
          </View>
          <Text style={styles.checkLabel}>I consent to health data processing as described</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.continueBtn, !canContinue && styles.continueBtnDisabled]}
        disabled={!canContinue}
        onPress={handleAccept}>
        <Text style={styles.continueText}>Accept & Continue</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => Linking.openURL('mailto:support@vitaweave.app')}>
        <Text style={styles.supportLink}>Questions? Contact support@vitaweave.app</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 24, paddingTop: 60, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 24 },
  title: { fontFamily: 'Inter-Bold', fontSize: 26, color: '#0f172a', marginTop: 12 },
  subtitle: {
    fontFamily: 'Inter-Regular', fontSize: 14, color: '#64748b',
    textAlign: 'center', marginTop: 8, lineHeight: 22,
  },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 16,
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  cardTitle: { fontFamily: 'Inter-SemiBold', fontSize: 16, color: '#0f172a' },
  cardBody: { fontFamily: 'Inter-Regular', fontSize: 13, color: '#475569', lineHeight: 20, marginBottom: 12 },
  link: { fontFamily: 'Inter-SemiBold', fontSize: 13, color: '#0891b2', marginBottom: 12 },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2,
    borderColor: '#cbd5e1', justifyContent: 'center', alignItems: 'center', marginTop: 2,
  },
  checkboxOn: { backgroundColor: '#0891b2', borderColor: '#0891b2' },
  checkMark: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  checkLabel: { flex: 1, fontFamily: 'Inter-Regular', fontSize: 13, color: '#334155', lineHeight: 20 },
  continueBtn: {
    backgroundColor: '#0891b2', borderRadius: 14, height: 52,
    justifyContent: 'center', alignItems: 'center', marginTop: 8,
  },
  continueBtnDisabled: { backgroundColor: '#94a3b8' },
  continueText: { fontFamily: 'Inter-Bold', fontSize: 16, color: '#fff' },
  supportLink: {
    fontFamily: 'Inter-Medium', fontSize: 13, color: '#64748b',
    textAlign: 'center', marginTop: 20, textDecorationLine: 'underline',
  },
});
