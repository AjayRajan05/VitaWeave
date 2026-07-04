import { calculateUrgencyScore, visitSummaryFromPatient, type VitalReading } from './urgencyScoring';
import type { Patient } from '../app/_constants/data';
import { getVitalsHistoryForPatient, persistPatientUrgency } from './api';
import { recordScoringAudit } from './scoringAudit';
import { logger } from './logger';

/**
 * Load vitals history, compute priority score, persist to patients.urgency_score.
 */
export async function recalculateAndPersistUrgency(
  patient: Patient,
  vitalsOverride?: VitalReading[]
): Promise<Patient> {
  let vitals = vitalsOverride;
  if (!vitals) {
    vitals = await getVitalsHistoryForPatient(patient.id);
  }

  const result = calculateUrgencyScore(patient, vitals, visitSummaryFromPatient(patient));

  await persistPatientUrgency(patient.id, result.score, result.riskLevel).catch((err) => {
    logger.warn('Failed to persist urgency score', { patientId: patient.id, err });
  });

  recordScoringAudit({
    patientId: patient.id,
    score: result.score,
    riskLevel: result.riskLevel,
    factors: result.factors,
    source: 'triage',
  }).catch(() => undefined);

  return {
    ...patient,
    urgencyScore: result.score,
    riskLevel: result.riskLevel,
  };
}
