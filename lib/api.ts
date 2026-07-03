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
} from '../app/constants/data';

const SYNC_QUEUE_STORAGE_KEY = '@vitaweave_sync_queue';
const SYNC_SUBSCRIPTION_TABLES = ['patients', 'community_alerts', 'symptom_reports'];

type SyncAction = 'insert' | 'update' | 'delete';

type SyncOperation = {
    id: string;
    table: string;
    action: SyncAction;
    recordId?: number | string;
    payload: any;
    timestamp: number;
    conflictKey: string;
};

function generateQueueId() {
    return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

async function getSyncQueue(): Promise<SyncOperation[]> {
    try {
        const raw = await AsyncStorage.getItem(SYNC_QUEUE_STORAGE_KEY);
        if (!raw) return [];
        return JSON.parse(raw) as SyncOperation[];
    } catch (error) {
        console.warn('Failed to read sync queue:', error);
        return [];
    }
}

async function setSyncQueue(queue: SyncOperation[]) {
    try {
        await AsyncStorage.setItem(SYNC_QUEUE_STORAGE_KEY, JSON.stringify(queue));
    } catch (error) {
        console.warn('Failed to persist sync queue:', error);
    }
}

async function enqueueSyncOperation(operation: Omit<SyncOperation, 'id'>) {
    const queue = await getSyncQueue();
    queue.push({ id: generateQueueId(), ...operation });
    await setSyncQueue(queue);
}

function getRowTimestamp(row: any): number {
    if (!row) return 0;
    const timestamp = row.updated_at || row.created_at;
    return timestamp ? Date.parse(timestamp) : 0;
}

function mergeRemoteWithLocal(remote: any, localPayload: any, opTimestamp: number) {
    const remoteTimestamp = getRowTimestamp(remote);
    const merged = { ...remote };

    for (const key of Object.keys(localPayload)) {
        const localValue = localPayload[key];

        if (remoteTimestamp > opTimestamp && remote[key] !== undefined && remote[key] !== localValue) {
            continue;
        }

        merged[key] = localValue;
    }

    merged.updated_at = new Date(Math.max(remoteTimestamp, opTimestamp)).toISOString();
    return merged;
}

async function processSyncOperation(operation: SyncOperation): Promise<boolean> {
    try {
        if (operation.action === 'insert') {
            await supabase.from(operation.table).insert([operation.payload]);
            return true;
        }

        if (operation.action === 'delete') {
            if (operation.recordId === undefined) return true;
            await supabase.from(operation.table).delete().eq('id', operation.recordId);
            return true;
        }

        if (operation.action === 'update') {
            if (operation.recordId === undefined) return true;

            const { data: remoteRow, error: fetchError } = await supabase
                .from(operation.table)
                .select('*')
                .eq('id', operation.recordId)
                .single();

            if (fetchError || !remoteRow) {
                await supabase.from(operation.table).insert([{ id: operation.recordId, ...operation.payload }]);
                return true;
            }

            const mergedPayload = mergeRemoteWithLocal(remoteRow, operation.payload, operation.timestamp);
            await supabase.from(operation.table).upsert([mergedPayload], { onConflict: 'id' });
            return true;
        }

        return false;
    } catch (error) {
        console.warn('Sync operation failed, will retry later:', operation, error);
        return false;
    }
}

export async function syncQueue(): Promise<void> {
    const queue = await getSyncQueue();
    if (!queue.length) return;

    const nextQueue: SyncOperation[] = [];

    for (const operation of queue) {
        const success = await processSyncOperation(operation);
        if (!success) {
            nextQueue.push(operation);
        }
    }

    await setSyncQueue(nextQueue);
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

export async function queueTableUpdate(table: string, recordId: number | string, payload: any) {
    await enqueueSyncOperation({
        table,
        action: 'update',
        recordId,
        payload,
        timestamp: Date.now(),
        conflictKey: `${table}:${recordId}`,
    });

    await syncQueue();
}

export async function updatePatientRecord(patientId: string, updates: Partial<Patient>) {
    return queueTableUpdate('patients', patientId, updates);
}

export async function updatePatientVitals(patientId: string, vitals: Partial<Patient>) {
    return queueTableUpdate('patients', patientId, vitals);
}

export async function updatePatientRisk(patientId: string, riskLevel: RiskLevel) {
    const { error } = await supabase
        .from('patients')
        .update({ risk_level: riskLevel, updated_at: new Date().toISOString() })
        .eq('id', patientId);
    return { error };
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

export async function addPatient(patient: Omit<Patient, 'id'>) {
    try {
        const { data, error } = await supabase
            .from('patients')
            .insert([patient])
            .select();

        if (error) throw error;
        return { data, error };
    } catch (error) {
        await enqueueSyncOperation({
            table: 'patients',
            action: 'insert',
            payload: patient,
            timestamp: Date.now(),
            conflictKey: `patients:pending_${generateQueueId()}`,
        });
        return { data: null, error };
    }
}

export async function updateProfile(userId: string, updates: any) {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId);

        if (error) throw error;
        return { data, error };
    } catch (error) {
        await enqueueSyncOperation({
            table: 'profiles',
            action: 'update',
            recordId: userId,
            payload: updates,
            timestamp: Date.now(),
            conflictKey: `profiles:${userId}`,
        });
        return { data: null, error };
    }
}

export async function addDashboardTask(task: Omit<DashboardTask, 'id'>) {
    const payload: Record<string, unknown> = {
        title: task.title,
        subtitle: task.subtitle,
        priority: task.priority,
        icon: task.icon,
    };
    if (task.assignedTo) payload.assigned_to = task.assignedTo;

    try {
        const { data, error } = await supabase
            .from('dashboard_tasks')
            .insert([payload])
            .select();

        if (error) throw error;
        return { data, error };
    } catch (error) {
        await enqueueSyncOperation({
            table: 'dashboard_tasks',
            action: 'insert',
            payload,
            timestamp: Date.now(),
            conflictKey: `dashboard_tasks:pending_${generateQueueId()}`,
        });
        return { data: null, error };
    }
}

export async function addWeeklyAlert(alert: Omit<WeeklyAlert, 'id'>) {
    try {
        const { data, error } = await supabase
            .from('weekly_alerts')
            .insert([alert])
            .select();

        if (error) throw error;
        return { data, error };
    } catch (error) {
        await enqueueSyncOperation({
            table: 'weekly_alerts',
            action: 'insert',
            payload: alert,
            timestamp: Date.now(),
            conflictKey: `weekly_alerts:pending_${generateQueueId()}`,
        });
        return { data: null, error };
    }
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
    };
}

export async function getDoctorAppointments(doctorId: string): Promise<AppointmentRecord[]> {
    return fetchWithCache<AppointmentRecord>(`appointments_doctor_${doctorId}`, async () => {
        const { data, error } = await supabase
            .from('appointments')
            .select(`
                *,
                patients:patient_id (name, risk_level),
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
                patients:patient_id (name, risk_level),
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

export async function bookAppointment(params: {
    patientProfileId: string;
    doctorId: string;
    title: string;
    description?: string;
    appointmentTime: string;
}): Promise<{ data: any; error: any }> {
    try {
        let patientId = await getPatientIdForProfile(params.patientProfileId);

        if (!patientId) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('name')
                .eq('id', params.patientProfileId)
                .maybeSingle();

            const { data: created, error: createError } = await supabase
                .from('patients')
                .insert({
                    name: profile?.name ?? 'Patient',
                    age: 0,
                    gender: 'Not Specified',
                    condition: 'General',
                    status: 'Stable',
                    risk_level: 'Low',
                    profile_id: params.patientProfileId,
                    assigned_doctor_id: params.doctorId,
                })
                .select('id')
                .single();

            if (createError) throw createError;
            patientId = created.id;
        }

        const { data, error } = await supabase
            .from('appointments')
            .insert({
                patient_id: patientId,
                doctor_id: params.doctorId,
                title: params.title,
                description: params.description ?? null,
                appointment_time: params.appointmentTime,
                status: 'Scheduled',
                duration: 30,
            })
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return { data: null, error };
    }
}

export async function updateAppointmentStatus(
    appointmentId: string,
    status: AppointmentRecord['status']
) {
    const { data, error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', appointmentId)
        .select()
        .single();
    return { data, error };
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
    const { data, error } = await supabase
        .from('medical_records')
        .insert({
            patient_id: record.patientId,
            doctor_id: record.doctorId,
            diagnosis: record.diagnosis,
            prescription: record.prescription,
            notes: record.notes,
            vitals: record.vitals ?? {},
        })
        .select()
        .single();

    return { data, error };
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
    const { data, error } = await supabase
        .from('campaigns')
        .insert({
            title: campaign.title,
            description: campaign.description,
            location: campaign.location,
            campaign_date: campaign.campaignDate,
            target_audience: campaign.targetAudience,
            target_count: campaign.targetCount ?? 0,
            created_by: campaign.createdBy,
            ward: campaign.ward,
            status: 'Planned',
        })
        .select()
        .single();

    return { data, error };
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
): Promise<{ error: any }> {
    const { error } = await supabase
        .from('vaccinations')
        .update({
            status: 'completed',
            administered_at: new Date().toISOString(),
            administered_by: administeredBy,
        })
        .eq('id', vaccinationId);

    return { error };
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
    const { data, error } = await supabase
        .from('vaccinations')
        .insert({
            child_name: record.childName,
            age_label: record.ageLabel,
            vaccine_name: record.vaccineName,
            due_date: record.dueDate,
            patient_id: record.patientId ?? null,
            assigned_asha_id: record.assignedAshaId ?? null,
            ward: record.ward ?? null,
            status: 'due',
        })
        .select()
        .single();

    return { data, error };
}

export async function logVideoCallSession(params: {
    appointmentId?: string;
    channelName: string;
    hostId: string;
    participantId?: string;
    status?: 'Scheduled' | 'Active' | 'Completed' | 'Failed';
}) {
    const { data, error } = await supabase
        .from('video_calls')
        .insert({
            appointment_id: params.appointmentId ?? null,
            channel_name: params.channelName,
            host_id: params.hostId,
            participant_id: params.participantId ?? null,
            status: params.status ?? 'Active',
            start_time: new Date().toISOString(),
        })
        .select()
        .single();

    return { data, error };
}
