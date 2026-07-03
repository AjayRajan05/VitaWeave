import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
// @ts-ignore
import { User, CalendarClock, ChevronLeft } from 'lucide-react-native';
import { getDoctors, bookAppointment } from '../../lib/api';
import { getStoredUserId } from '../../lib/authGuard';
import { Analytics } from '../../lib/analytics';
import { DateTimeField } from '../../components/DateTimeField';
import type { DoctorProfile } from '../../lib/api';

const VISIT_TYPES = [
    'General Checkup',
    'Follow-up Visit',
    'Prenatal Care',
    'Chronic Care',
    'Vaccination',
    'Telemedicine Consultation',
];

export default function BookAppointmentScreen() {
    const router = useRouter();
    const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
    const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
    const [visitType, setVisitType] = useState(VISIT_TYPES[0]);
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingDoctors, setLoadingDoctors] = useState(true);

    useEffect(() => {
        getDoctors().then((list) => {
            setDoctors(list);
            if (list.length > 0) setSelectedDoctor(list[0].id);
            setLoadingDoctors(false);
        });
    }, []);

    const handleBook = useCallback(async () => {
        if (!selectedDoctor || !date || !time) {
            Alert.alert('Missing Information', 'Please select a doctor, date, and time.');
            return;
        }

        const profileId = await getStoredUserId();
        if (!profileId) {
            Alert.alert('Not signed in', 'Please log in to book an appointment.');
            return;
        }

        const appointmentTime = new Date(`${date}T${time}:00`).toISOString();
        if (Number.isNaN(new Date(appointmentTime).getTime())) {
            Alert.alert('Invalid Date', 'Use date format YYYY-MM-DD and time HH:MM (24h).');
            return;
        }

        setLoading(true);
        const { error } = await bookAppointment({
            patientProfileId: profileId,
            doctorId: selectedDoctor,
            title: visitType,
            description: notes || undefined,
            appointmentTime,
        });
        setLoading(false);

        if (error) {
            Alert.alert('Booking Failed', error.message || 'Could not book appointment.');
            return;
        }

        Analytics.trackAppointment('book');

        Alert.alert('Booked', 'Your appointment has been scheduled.', [
            { text: 'OK', onPress: () => router.back() },
        ]);
    }, [selectedDoctor, date, time, notes, visitType, router]);

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ChevronLeft size={22} color="#059669" />
                </TouchableOpacity>
                <Text style={styles.title}>Book Appointment</Text>
            </View>

            <Text style={styles.label}>Select Doctor</Text>
            {loadingDoctors ? (
                <ActivityIndicator color="#059669" />
            ) : doctors.length === 0 ? (
                <Text style={styles.hint}>No doctors registered yet. Please try again later.</Text>
            ) : (
                doctors.map((doc) => (
                    <TouchableOpacity
                        key={doc.id}
                        style={[styles.doctorCard, selectedDoctor === doc.id && styles.doctorCardActive]}
                        onPress={() => setSelectedDoctor(doc.id)}>
                        <View style={styles.docAvatar}>
                            <User size={18} color="#059669" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.docName}>{doc.name}</Text>
                            {doc.ward ? <Text style={styles.docWard}>Ward {doc.ward}</Text> : null}
                        </View>
                    </TouchableOpacity>
                ))
            )}

            <Text style={styles.label}>Visit Type</Text>
            <View style={styles.chipRow}>
                {VISIT_TYPES.map((type) => (
                    <TouchableOpacity
                        key={type}
                        style={[styles.chip, visitType === type && styles.chipActive]}
                        onPress={() => setVisitType(type)}>
                        <Text style={[styles.chipText, visitType === type && styles.chipTextActive]}>{type}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <DateTimeField date={date} time={time} onDateChange={setDate} onTimeChange={setTime} />

            <Text style={styles.label}>Notes (optional)</Text>
            <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Symptoms or reason for visit..."
                value={notes}
                onChangeText={setNotes}
                multiline
            />

            <TouchableOpacity
                style={[styles.bookBtn, loading && styles.bookBtnDisabled]}
                onPress={handleBook}
                disabled={loading}>
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <>
                        <CalendarClock size={18} color="#fff" />
                        <Text style={styles.bookText}>Confirm Booking</Text>
                    </>
                )}
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    content: { padding: 20, paddingBottom: 40 },
    header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24 },
    backBtn: { padding: 4 },
    title: { fontFamily: 'Inter-Bold', fontSize: 22, color: '#0f172a' },
    label: { fontFamily: 'Inter-SemiBold', fontSize: 14, color: '#334155', marginBottom: 8, marginTop: 16 },
    hint: { fontFamily: 'Inter-Regular', fontSize: 13, color: '#64748b', marginBottom: 12 },
    doctorCard: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8,
        borderWidth: 2, borderColor: '#e2e8f0',
    },
    doctorCardActive: { borderColor: '#059669', backgroundColor: '#f0fdf4' },
    docAvatar: {
        width: 40, height: 40, borderRadius: 12, backgroundColor: '#d1fae5',
        justifyContent: 'center', alignItems: 'center',
    },
    docName: { fontFamily: 'Inter-SemiBold', fontSize: 15, color: '#0f172a' },
    docWard: { fontFamily: 'Inter-Regular', fontSize: 12, color: '#64748b' },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
    chip: {
        paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
        backgroundColor: '#e2e8f0',
    },
    chipActive: { backgroundColor: '#d1fae5' },
    chipText: { fontFamily: 'Inter-Medium', fontSize: 12, color: '#64748b' },
    chipTextActive: { color: '#059669' },
    input: {
        backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0',
        paddingHorizontal: 14, paddingVertical: 12, fontFamily: 'Inter-Regular', fontSize: 14,
    },
    textArea: { minHeight: 80, textAlignVertical: 'top' },
    bookBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: '#059669', borderRadius: 14, height: 52, marginTop: 24,
    },
    bookBtnDisabled: { backgroundColor: '#94a3b8' },
    bookText: { fontFamily: 'Inter-Bold', fontSize: 15, color: '#fff' },
});
