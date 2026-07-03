import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { FileText, ChevronLeft } from 'lucide-react-native';
import { addMedicalRecord } from '../../lib/api';
import { getStoredUserId } from '../../lib/authGuard';
import { queueFollowUpTaskAfterVisit } from '../../lib/clinicalWorkflow';
import { PatientPicker } from '../../components/PatientPicker';
import { useCareTeamPatients } from '../../hooks/useCareTeamPatients';
import type { Patient } from '../constants/data';

export default function RecordVisitScreen() {
    const router = useRouter();
    const { patients, loading: loadingPatients } = useCareTeamPatients('doctor');
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [diagnosis, setDiagnosis] = useState('');
    const [prescription, setPrescription] = useState('');
    const [notes, setNotes] = useState('');
    const [bp, setBp] = useState('');
    const [heartRate, setHeartRate] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!selectedPatient || !diagnosis) {
            Alert.alert('Missing Fields', 'Select a patient and enter a diagnosis.');
            return;
        }

        const doctorId = await getStoredUserId();
        if (!doctorId) {
            Alert.alert('Not signed in', 'Please log in as a doctor.');
            return;
        }

        setLoading(true);
        const vitals: Record<string, unknown> = {};
        if (bp) vitals.blood_pressure = bp;
        if (heartRate) vitals.heart_rate = Number(heartRate);

        const { error } = await addMedicalRecord({
            patientId: selectedPatient.id,
            doctorId,
            diagnosis,
            prescription: prescription || undefined,
            notes: notes || undefined,
            vitals,
        });
        setLoading(false);

        if (error) {
            Alert.alert('Save Failed', error.message || 'Could not save medical record.');
            return;
        }

        await queueFollowUpTaskAfterVisit(
            selectedPatient,
            `Post-visit follow-up after diagnosis: ${diagnosis}`
        );

        Alert.alert('Saved', 'Medical record added and follow-up queued if needed.', [
            { text: 'OK', onPress: () => router.back() },
        ]);
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ChevronLeft size={22} color="#0891b2" />
                </TouchableOpacity>
                <Text style={styles.title}>Record Visit</Text>
            </View>

            <PatientPicker
                patients={patients}
                loading={loadingPatients}
                selectedId={selectedPatient?.id}
                onSelect={setSelectedPatient}
                label="Patient"
                placeholder="Search and select patient"
            />

            <Text style={styles.label}>Diagnosis *</Text>
            <TextInput style={styles.input} value={diagnosis} onChangeText={setDiagnosis} />

            <Text style={styles.label}>Prescription</Text>
            <TextInput style={[styles.input, styles.multiline]} value={prescription} onChangeText={setPrescription} multiline />

            <Text style={styles.label}>Clinical Notes</Text>
            <TextInput style={[styles.input, styles.multiline]} value={notes} onChangeText={setNotes} multiline />

            <Text style={styles.section}>Vitals (optional)</Text>
            <Text style={styles.label}>Blood Pressure</Text>
            <TextInput style={styles.input} placeholder="120/80" value={bp} onChangeText={setBp} />

            <Text style={styles.label}>Heart Rate (bpm)</Text>
            <TextInput style={styles.input} keyboardType="number-pad" value={heartRate} onChangeText={setHeartRate} />

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <>
                        <FileText size={18} color="#fff" />
                        <Text style={styles.saveText}>Save Medical Record</Text>
                    </>
                )}
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    content: { padding: 20, paddingBottom: 48 },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24, marginTop: 48 },
    backBtn: { padding: 4 },
    title: { fontFamily: 'Inter-Bold', fontSize: 22, color: '#0f172a' },
    label: { fontFamily: 'Inter-SemiBold', fontSize: 14, color: '#334155', marginBottom: 8, marginTop: 16 },
    section: { fontFamily: 'Inter-Bold', fontSize: 16, color: '#0f172a', marginTop: 24, marginBottom: 4 },
    input: {
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        padding: 14,
        backgroundColor: '#fff',
        fontFamily: 'Inter-Regular',
        fontSize: 15,
    },
    multiline: { minHeight: 88, textAlignVertical: 'top' },
    saveBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#0891b2',
        borderRadius: 14,
        paddingVertical: 16,
        marginTop: 32,
    },
    saveText: { fontFamily: 'Inter-SemiBold', fontSize: 16, color: '#fff' },
});
