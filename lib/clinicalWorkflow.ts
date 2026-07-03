import { calculateRisk, prioritizePatients } from './logic';
import { addDashboardTask, updatePatientRisk } from './api';
import type { Patient } from '../app/constants/data';
import { getStoredUserId } from './authGuard';
import { logger } from './logger';

/**
 * Re-score patients, persist risk levels, and return prioritized list for UI.
 */
export async function runPatientTriage(patients: Patient[]): Promise<Patient[]> {
  const triaged = prioritizePatients(
    patients.map((patient) => ({
      ...patient,
      riskLevel: calculateRisk(patient),
    }))
  );

  await Promise.all(
    triaged.map((patient) =>
      updatePatientRisk(patient.id, patient.riskLevel).catch((error) => {
        logger.warn('Failed to persist triage risk', { patientId: patient.id, error });
      })
    )
  );

  return triaged;
}

/**
 * After a clinical visit, optionally queue a follow-up task for high-risk patients.
 */
export async function queueFollowUpTaskAfterVisit(patient: Patient, reason: string): Promise<void> {
  if (patient.riskLevel !== 'High' && !patient.followUpUrgent) return;

  const ashaId = await getStoredUserId();
  await addDashboardTask({
    title: `Follow up: ${patient.name}`,
    subtitle: reason,
    priority: patient.riskLevel === 'High' ? 'urgent' : 'today',
    icon: 'activity',
    assignedTo: ashaId ?? undefined,
  });
}
