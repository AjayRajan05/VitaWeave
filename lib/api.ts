import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { getCached, setCached } from './cache';
import { mapDbPatient } from './patientMapper';
import type { UserRole } from './roles';
import type {
    Patient,
    VaccinationRecord,
    CommunityAlert,
    PharmacyTrend,
    SymptomReport,
    WeeklyTrend,
    AIInsight,
    DashboardTask,
    WeeklyAlert,
    AppointmentRecord,
    CampaignRecord,
    PatientVital,
    PatientMedication,
    RiskLevel,
} from '../app/_constants/data';

import {
  syncQueue,
  queueTableUpdate,
  writeThroughQueue,
} from './syncEngine';
import { addPatientVitals } from './referralsApi';
export { getPendingSyncCount, subscribeSyncStatus } from './syncEngine';

const SYNC_SUBSCRIPTION_TABLES = [
    'patients',
    'community_alerts',
    'symptom_reports',
    'referrals',
    'medication_reminders',
    'vaccinations',
    'medical_records',
    'dashboard_tasks',
];

function generateQueueId() {
    return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function newRecordId(): string {
    if (typeof globalThis.crypto?.randomUUID === 'function') {
        return globalThis.crypto.randomUUID();
    }
    return generateQueueId();
}

async function subscribeRealtimeTable(table: string) {
    try {
        const channel = supabase.channel(`realtime:${table}`);

        channel.on(
            'postgres_changes',
            { event: '*', schema: 'public', table },
            async (payload) => {
                const newRow = payload.new as { id?: string | number } | null;
                const oldRow = payload.old as { id?: string | number } | null;

                const currentCache = (await getCached<any[]>(table, 3600 * 1000)) || [];
                let updatedCache = currentCache;

                if (payload.eventType === 'DELETE' && oldRow) {
                    updatedCache = currentCache.filter((item) => item.id !== oldRow.id);
                } else if (newRow) {
                    updatedCache = currentCache.filter((item) => item.id !== newRow.id).concat(newRow);
                }

                await setCached(table, updatedCache);
            }
        );

        await channel.subscribe();
    } catch (error) {
        console.warn('Realtime subscription failed for table', table, error);
    }
}

export async function initializeSync() {
    try {
        await syncQueue();
        SYNC_SUBSCRIPTION_TABLES.forEach((table) => subscribeRealtimeTable(table));
    } catch (error) {
        console.warn('Failed to initialize sync engine:', error);
    }
}

export { queueTableUpdate } from './syncEngine';

export async function updatePatientRecord(patientId: string, updates: Partial<Patient>) {
    return queueTableUpdate('patients', patientId, updates);
}

export async function updatePatientVitals(patientId: string, vitals: Partial<Patient>) {
    return queueTableUpdate('patients', patientId, vitals);
}

export async function updatePatientRisk(patientId: string, riskLevel: RiskLevel) {
    return writeThroughQueue({
        table: 'patients',
        action: 'update',
        recordId: patientId,
        payload: { risk_level: riskLevel, updated_at: new Date().toISOString() },
        conflictKey: `patients:risk:${patientId}`,
        online: async () => {
            const { data, error } = await supabase
                .from('patients')
                .update({ risk_level: riskLevel, updated_at: new Date().toISOString() })
                .eq('id', patientId)
                .select()
                .maybeSingle();
            return { data, error };
        },
    });
}

/**
 * Generic fetcher with offline cache support
 */
async function fetchWithCache<T>(
    key: string,
    supabaseQuery: () => Promise<{ data: T[] | null; error: any }>,
    maxAge?: number
): Promise<T[]> {
    // 1. Try cache first for immediate UI update (optimistic)
    const cached = await getCached<T[]>(key, maxAge);

    // 2. Fetch fresh data from Supabase
    try {
        const { data, error } = await supabaseQuery();
        if (error) throw error;
        if (data) {
            // 3. Update cache
            await setCached(key, data);
            return data;
        }
    } catch (e) {
        console.warn(`Supabase fetch failed for ${key}, using cache:`, e);
    }

    // 4. Return cache if available, or empty array
    return cached || [];
}

// --- API Functions ---

export async function getPatients(): Promise<Patient[]> {
    return fetchWithCache<Patient>('patients', async () => {
        const { data, error } = await supabase
            .from('patients')
            .select('*')
            .order('name', { ascending: true });

        return {
            data: (data ?? []).map((row) => mapDbPatient(row)),
            error,
        };
    });
}

export async function getPatientsForCaregiver(
    userId: string,
    role: UserRole
): Promise<Patient[]> {
    let query = supabase.from('patients').select('*').order('name', { ascending: true });

    if (role === 'asha') {
        query = query.eq('assigned_asha_id', userId);
    } else if (role === 'doctor') {
        query = query.eq('assigned_doctor_id', userId);
    }

    const cacheKey = `patients_${role}_${userId}`;

    return fetchWithCache<Patient>(cacheKey, async () => {
        const { data, error } = await query;
        return {
            data: (data ?? []).map((row) => mapDbPatient(row)),
            error,
        };
    });
}

export async function getCommunityAlerts(): Promise<CommunityAlert[]> {
    return fetchWithCache<CommunityAlert>('community_alerts', async () =>
        supabase
            .from('community_alerts')
            .select('*')
            .order('date', { ascending: false })
    );
}

export async function getPharmacyTrends(): Promise<PharmacyTrend[]> {
    return fetchWithCache<PharmacyTrend>('pharmacy_trends', async () => {
        const { data, error } = await supabase
            .from('pharmacy_trends')
            .select('*')
            .order('count', { ascending: false });
        
        if (data) {
            return {
                data: data.map(t => ({
                    ...t,
                    maxCount: t.max_count
                })),
                error
            };
        }
        return { data, error };
    });
}

export async function getSymptomReports(): Promise<SymptomReport[]> {
    return fetchWithCache<SymptomReport>('symptom_reports', async () =>
        supabase
            .from('symptom_reports')
            .select('*')
            .order('count', { ascending: false })
    );
}

export async function getWeeklyTrends(): Promise<WeeklyTrend[]> {
    return fetchWithCache<WeeklyTrend>('weekly_trends', async () => {
        const { data, error } = await supabase
            .from('weekly_trends')
            .select('*')
            .order('id', { ascending: true });
        
        if (data) {
            return {
                data: data.map(t => ({
                    ...t,
                    maxValue: t.max_value
                })),
                error
            };
        }
        return { data, error };
    });
}

export async function getAIInsights(): Promise<AIInsight[]> {
    return fetchWithCache<AIInsight>('ai_insights', async () =>
        supabase
            .from('ai_insights')
            .select('*')
            .order('created_at', { ascending: false })
    );
}

export async function getDashboardTasks(): Promise<DashboardTask[]> {
    return fetchWithCache<DashboardTask>('dashboard_tasks', async () =>
        supabase
            .from('dashboard_tasks')
            .select('*')
            .order('id', { ascending: true })
    );
}

export async function getWeeklyAlerts(): Promise<WeeklyAlert[]> {
    return fetchWithCache<WeeklyAlert>('weekly_alerts', async () =>
        supabase
            .from('weekly_alerts')
            .select('*')
            .order('created_at', { ascending: false })
    );
}

// --- Mutation Functions ---

export async function addPatient(payload: Record<string, unknown>) {
    const recordId = (payload.id as string) ?? newRecordId();
    const fullPayload = { ...payload, id: recordId };

    return writeThroughQueue({
        table: 'patients',
        action: 'insert',
        payload: fullPayload,
        conflictKey: `patients:${recordId}`,
        online: async () => {
            const { data, error } = await supabase.from('patients').insert([fullPayload]).select().single();
            return { data, error };
        },
    });
}

export async function updateProfile(userId: string, updates: Record<string, unknown>) {
    return writeThroughQueue({
        table: 'profiles',
        action: 'update',
        recordId: userId,
        payload: updates,
        conflictKey: `profiles:${userId}`,
        online: async () => {
            const { data, error } = await supabase.from('profiles').update(updates).eq('id', userId).select().maybeSingle();
            return { data, error };
        },
    });
}

export async function addDashboardTask(task: Omit<DashboardTask, 'id'>) {
    const payload: Record<string, unknown> = {
        title: task.title,
        subtitle: task.subtitle,
        priority: task.priority,
        icon: task.icon,
    };
    if (task.assignedTo) payload.assigned_to = task.assignedTo;

    const conflictKey = `dashboard_tasks:pending_${generateQueueId()}`;
    return writeThroughQueue({
        table: 'dashboard_tasks',
        action: 'insert',
        payload,
        conflictKey,
        online: async () => {
            const { data, error } = await supabase.from('dashboard_tasks').insert([payload]).select().single();
            return { data, error };
        },
    });
}

export async function addWeeklyAlert(alert: Omit<WeeklyAlert, 'id'>) {
    const conflictKey = `weekly_alerts:pending_${generateQueueId()}`;
    return writeThroughQueue({
        table: 'weekly_alerts',
        action: 'insert',
        payload: alert as Record<string, unknown>,
        conflictKey,
        online: async () => {
            const { data, error } = await supabase.from('weekly_alerts').insert([alert]).select().single();
            return { data, error };
        },
    });
}

// --- Appointments ---

function mapAppointment(row: any): AppointmentRecord {
    return {
        id: row.id,
        title: row.title,
        description: row.description,
        appointmentTime: row.appointment_time,
        status: row.status,
        duration: row.duration ?? 30,
        patientName: row.patients?.name,
        doctorName: row.profiles?.name,
        patientRiskLevel: row.patients?.risk_level,
        patientUrgencyScore: row.patients?.urgency_score != null ? Number(row.patients.urgency_score) : undefined,
    };
}

export async function getDoctorAppointments(doctorId: string): Promise<AppointmentRecord[]> {
    return fetchWithCache<AppointmentRecord>(`appointments_doctor_${doctorId}`, async () => {
        const { data, error } = await supabase
            .from('appointments')
            .select(`
                *,
                patients:patient_id (name, risk_level, urgency_score),
                profiles:doctor_id (name)
            `)
            .eq('doctor_id', doctorId)
            .order('appointment_time', { ascending: true });

        return {
            data: (data ?? []).map(mapAppointment),
            error,
        };
    });
}

export async function getPatientAppointments(profileId: string): Promise<AppointmentRecord[]> {
    const { data: patientRow } = await supabase
        .from('patients')
        .select('id')
        .eq('profile_id', profileId)
        .maybeSingle();

    if (!patientRow?.id) return [];

    return fetchWithCache<AppointmentRecord>(`appointments_patient_${profileId}`, async () => {
        const { data, error } = await supabase
            .from('appointments')
            .select(`
                *,
                patients:patient_id (name, risk_level, urgency_score),
                profiles:doctor_id (name)
            `)
            .eq('patient_id', patientRow.id)
            .order('appointment_time', { ascending: true });

        return {
            data: (data ?? []).map(mapAppointment),
            error,
        };
    });
}

// --- Patient health data ---

export async function getPatientVitals(profileId: string): Promise<PatientVital | null> {
    const { data, error } = await supabase
        .from('patient_vitals')
        .select('*')
        .eq('profile_id', profileId)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error || !data) return null;

    return {
        heartRate: data.heart_rate ?? undefined,
        bloodPressure: data.blood_pressure ?? undefined,
        bloodSugar: data.blood_sugar ?? undefined,
        temperature: data.temperature ? Number(data.temperature) : undefined,
        recordedAt: data.recorded_at,
    };
}

export async function getPatientMedications(profileId: string): Promise<PatientMedication[]> {
    return fetchWithCache<PatientMedication>(`medications_${profileId}`, async () => {
        const { data, error } = await supabase
            .from('patient_medications')
            .select('*')
            .eq('profile_id', profileId)
            .eq('active', true)
            .order('created_at', { ascending: true });

        return {
            data: (data ?? []).map((med) => ({
                id: med.id,
                name: med.name,
                schedule: med.schedule ?? '',
                takenToday: med.taken_today ?? false,
            })),
            error,
        };
    });
}

export async function getPatientDisplayName(profileId: string): Promise<string> {
    const { data } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', profileId)
        .maybeSingle();

    return data?.name ?? 'Patient';
}

// --- Campaigns ---

export async function getCampaigns(): Promise<CampaignRecord[]> {
    return fetchWithCache<CampaignRecord>('campaigns', async () => {
        const { data, error } = await supabase
            .from('campaigns')
            .select('*')
            .order('campaign_date', { ascending: true });

        return {
            data: (data ?? []).map((camp) => ({
                id: camp.id,
                title: camp.title,
                description: camp.description,
                location: camp.location,
                campaignDate: camp.campaign_date,
                status: camp.status,
                targetAudience: camp.target_audience,
                participantsCount: camp.participants_count ?? 0,
                targetCount: camp.target_count ?? 0,
                progress: camp.target_count
                    ? Math.round(((camp.participants_count ?? 0) / camp.target_count) * 100)
                    : 0,
            })),
            error,
        };
    });
}

// --- Doctors & appointment booking ---

export type DoctorProfile = {
    id: string;
    name: string;
    ward?: string;
};

export async function getDoctors(): Promise<DoctorProfile[]> {
    const { data, error } = await supabase
        .from('profiles')
        .select('id, name, ward')
        .eq('role', 'doctor')
        .order('name', { ascending: true });

    if (error) {
        console.warn('Failed to load doctors:', error);
        return [];
    }
    return data ?? [];
}

export async function getPatientIdForProfile(profileId: string): Promise<string | null> {
    const { data } = await supabase
        .from('patients')
        .select('id')
        .eq('profile_id', profileId)
        .maybeSingle();
    return data?.id ?? null;
}

export async function getPatientAbhaForProfile(
    profileId: string
): Promise<{ abhaId: string | null; verified: boolean }> {
    const { data } = await supabase
        .from('patients')
        .select('abha_id, abha_verified')
        .eq('profile_id', profileId)
        .maybeSingle();
    return {
        abhaId: data?.abha_id ?? null,
        verified: Boolean(data?.abha_verified),
    };
}

export async function bookAppointment(params: {
    patientProfileId: string;
    doctorId: string;
    title: string;
    description?: string;
    appointmentTime: string;
}): Promise<{ data: unknown; error: unknown }> {
    let patientId = await getPatientIdForProfile(params.patientProfileId);

    if (!patientId) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', params.patientProfileId)
            .maybeSingle();

        const newPatientId = newRecordId();
        const patientPayload = {
            id: newPatientId,
            name: profile?.name ?? 'Patient',
            age: 1,
            gender: 'Not Specified',
            condition: 'General',
            status: 'Stable',
            risk_level: 'Low',
            profile_id: params.patientProfileId,
            assigned_doctor_id: params.doctorId,
        };

        const patientResult = await writeThroughQueue({
            table: 'patients',
            action: 'insert',
            payload: patientPayload,
            conflictKey: `patients:${newPatientId}`,
            online: async () => {
                const { data, error } = await supabase.from('patients').insert(patientPayload).select('id').single();
                return { data, error };
            },
        });

        patientId =
            (patientResult.data as { id?: string } | null)?.id ?? newPatientId;
    }

    const apptPayload = {
        patient_id: patientId,
        doctor_id: params.doctorId,
        title: params.title,
        description: params.description ?? null,
        appointment_time: params.appointmentTime,
        status: 'Scheduled',
        duration: 30,
    };

    return writeThroughQueue({
        table: 'appointments',
        action: 'insert',
        payload: apptPayload,
        conflictKey: `appointments:pending_${generateQueueId()}`,
        online: async () => {
            const { data, error } = await supabase.from('appointments').insert(apptPayload).select().single();
            return { data, error };
        },
    });
}

export async function updateAppointmentStatus(
    appointmentId: string,
    status: AppointmentRecord['status']
) {
    return writeThroughQueue({
        table: 'appointments',
        action: 'update',
        recordId: appointmentId,
        payload: { status },
        conflictKey: `appointments:${appointmentId}`,
        online: async () => {
            const { data, error } = await supabase
                .from('appointments')
                .update({ status })
                .eq('id', appointmentId)
                .select()
                .single();
            return { data, error };
        },
    });
}

// --- Medical records ---

export type MedicalRecord = {
    id: string;
    patientId: string;
    doctorId: string;
    diagnosis: string;
    prescription?: string;
    notes?: string;
    vitals?: Record<string, unknown>;
    createdAt: string;
    patientName?: string;
};

export async function getMedicalRecordsForPatient(patientId: string): Promise<MedicalRecord[]> {
    const { data, error } = await supabase
        .from('medical_records')
        .select(`*, patients:patient_id (name)`)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

    if (error) {
        console.warn('Failed to load medical records:', error);
        return [];
    }

    return (data ?? []).map((row) => ({
        id: row.id,
        patientId: row.patient_id,
        doctorId: row.doctor_id,
        diagnosis: row.diagnosis,
        prescription: row.prescription,
        notes: row.notes,
        vitals: row.vitals,
        createdAt: row.created_at,
        patientName: row.patients?.name,
    }));
}

export async function getMedicalRecordsForDoctor(doctorId: string): Promise<MedicalRecord[]> {
    const { data, error } = await supabase
        .from('medical_records')
        .select(`*, patients:patient_id (name)`)
        .eq('doctor_id', doctorId)
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) {
        console.warn('Failed to load medical records:', error);
        return [];
    }

    return (data ?? []).map((row) => ({
        id: row.id,
        patientId: row.patient_id,
        doctorId: row.doctor_id,
        diagnosis: row.diagnosis,
        prescription: row.prescription,
        notes: row.notes,
        vitals: row.vitals,
        createdAt: row.created_at,
        patientName: row.patients?.name,
    }));
}

export async function addMedicalRecord(record: {
    patientId: string;
    doctorId: string;
    diagnosis: string;
    prescription?: string;
    notes?: string;
    vitals?: Record<string, unknown>;
}) {
    const payload = {
        patient_id: record.patientId,
        doctor_id: record.doctorId,
        diagnosis: record.diagnosis,
        prescription: record.prescription,
        notes: record.notes,
        vitals: record.vitals ?? {},
    };

    const result = await writeThroughQueue({
        table: 'medical_records',
        action: 'insert',
        payload,
        conflictKey: `medical_records:pending_${generateQueueId()}`,
        online: async () => {
            const { data, error } = await supabase.from('medical_records').insert(payload).select().single();
            return { data, error };
        },
    });

    if (record.vitals && Object.keys(record.vitals).length > 0) {
        await addPatientVitals({
            patientId: record.patientId,
            recordedBy: record.doctorId,
            vitals: {
                heartRate: record.vitals.heart_rate != null ? Number(record.vitals.heart_rate) : undefined,
                bloodPressure: record.vitals.blood_pressure as string | undefined,
                bloodSugar: record.vitals.blood_sugar != null ? Number(record.vitals.blood_sugar) : undefined,
                temperature: record.vitals.temperature != null ? Number(record.vitals.temperature) : undefined,
            },
        });
    }

    return result;
}

export async function createCampaign(campaign: {
    title: string;
    description?: string;
    location?: string;
    campaignDate?: string;
    targetAudience?: string;
    targetCount?: number;
    createdBy: string;
    ward?: string;
}) {
    const payload = {
        title: campaign.title,
        description: campaign.description,
        location: campaign.location,
        campaign_date: campaign.campaignDate,
        target_audience: campaign.targetAudience,
        target_count: campaign.targetCount ?? 0,
        created_by: campaign.createdBy,
        ward: campaign.ward,
        status: 'Planned',
    };

    return writeThroughQueue({
        table: 'campaigns',
        action: 'insert',
        payload,
        conflictKey: `campaigns:pending_${generateQueueId()}`,
        online: async () => {
            const { data, error } = await supabase.from('campaigns').insert(payload).select().single();
            return { data, error };
        },
    });
}

// --- Vaccinations (Phase 4) ---

function mapVaccination(row: Record<string, unknown>): VaccinationRecord {
    const dueDate = row.due_date as string;
    const due = dueDate ? new Date(dueDate) : null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let dueLabel = dueDate ?? 'TBD';
    if (due && !Number.isNaN(due.getTime())) {
        const dueDay = new Date(due);
        dueDay.setHours(0, 0, 0, 0);
        const diff = Math.round((dueDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diff < 0) dueLabel = `Overdue (${Math.abs(diff)} Days)`;
        else if (diff === 0) dueLabel = 'Today';
        else if (diff === 1) dueLabel = 'Tomorrow';
        else dueLabel = due.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
    }

    return {
        id: String(row.id),
        patientId: row.patient_id ? String(row.patient_id) : undefined,
        childName: String(row.child_name ?? 'Child'),
        ageLabel: String(row.age_label ?? ''),
        vaccineName: String(row.vaccine_name ?? ''),
        dueDate: dueLabel,
        status: (row.status as 'due' | 'completed') ?? 'due',
        administeredAt: row.administered_at as string | undefined,
    };
}

export async function getVaccinations(caregiverId?: string): Promise<VaccinationRecord[]> {
    const cacheKey = caregiverId ? `vaccinations_${caregiverId}` : 'vaccinations_all';

    return fetchWithCache<VaccinationRecord>(cacheKey, async () => {
        let query = supabase
            .from('vaccinations')
            .select('*')
            .order('due_date', { ascending: true });

        if (caregiverId) {
            query = query.eq('assigned_asha_id', caregiverId);
        }

        const { data, error } = await query;
        return {
            data: (data ?? []).map((row) => mapVaccination(row)),
            error,
        };
    });
}

export async function markVaccinationComplete(
    vaccinationId: string,
    administeredBy: string
): Promise<{ error: unknown }> {
    const payload = {
        status: 'completed',
        administered_at: new Date().toISOString(),
        administered_by: administeredBy,
    };

    const result = await writeThroughQueue({
        table: 'vaccinations',
        action: 'update',
        recordId: vaccinationId,
        payload,
        conflictKey: `vaccinations:${vaccinationId}`,
        online: async () => {
            const { data, error } = await supabase
                .from('vaccinations')
                .update(payload)
                .eq('id', vaccinationId)
                .select()
                .maybeSingle();
            return { data, error };
        },
    });
    return { error: result.error };
}

export async function addVaccination(record: {
    childName: string;
    ageLabel: string;
    vaccineName: string;
    dueDate: string;
    patientId?: string;
    assignedAshaId?: string;
    ward?: string;
}) {
    const payload = {
        child_name: record.childName,
        age_label: record.ageLabel,
        vaccine_name: record.vaccineName,
        due_date: record.dueDate,
        patient_id: record.patientId ?? null,
        assigned_asha_id: record.assignedAshaId ?? null,
        ward: record.ward ?? null,
        status: 'due',
    };

    return writeThroughQueue({
        table: 'vaccinations',
        action: 'insert',
        payload,
        conflictKey: `vaccinations:pending_${generateQueueId()}`,
        online: async () => {
            const { data, error } = await supabase.from('vaccinations').insert(payload).select().single();
            return { data, error };
        },
    });
}

export {
  createReferral,
  updateReferralStatus,
  getReferralsForDoctor,
  getReferralsForPatient,
  getVitalsHistoryForPatient,
  addPatientVitals,
  persistPatientUrgency,
} from './referralsApi';

export {
  getMedicationRemindersForPatient,
  getMedicationDosesForProfile,
  markMedicationDoseTaken,
  createMedicationReminder,
} from './medicationRemindersApi';

export async function logVideoCallSession(params: {
    appointmentId?: string;
    channelName: string;
    hostId: string;
    participantId?: string;
    status?: 'Scheduled' | 'Active' | 'Completed' | 'Failed';
}) {
    const payload = {
        appointment_id: params.appointmentId ?? null,
        channel_name: params.channelName,
        host_id: params.hostId,
        participant_id: params.participantId ?? null,
        status: params.status ?? 'Active',
        start_time: new Date().toISOString(),
    };

    return writeThroughQueue({
        table: 'video_calls',
        action: 'insert',
        payload,
        conflictKey: `video_calls:pending_${generateQueueId()}`,
        online: async () => {
            const { data, error } = await supabase.from('video_calls').insert(payload).select().single();
            return { data, error };
        },
    });
}
