import { Patient, RiskLevel } from '../app/constants/data';

// ─── 1. Dynamic Care Routing (Triage Engine) ─────────────────────────────────

/**
 * Calculates risk level based on age, condition, and status.
 * This simulates a clinical triage algorithm.
 */
export function calculateRisk(patient: Patient): RiskLevel {
    const { age, condition, status } = patient;
    const lowerCondition = condition.toLowerCase();

    // Critical Status override
    if (status === 'Critical') return 'High';

    // High Risk Factors
    if (
        (age > 65 || age < 5) || // Vulnerable ages
        lowerCondition.includes('heart') ||
        lowerCondition.includes('stroke') ||
        lowerCondition.includes('severe') ||
        lowerCondition.includes('dengue')
    ) {
        return 'High';
    }

    // Medium Risk Factors
    if (
        (age > 50) ||
        lowerCondition.includes('diabetes') ||
        lowerCondition.includes('hypertension') ||
        lowerCondition.includes('pregnant') ||
        lowerCondition.includes('prenatal') ||
        lowerCondition.includes('asthma') ||
        lowerCondition.includes('fever')
    ) {
        return 'Medium';
    }

    // Default Low
    return 'Low';
}

/**
 * Re-sorts a list of patients by urgency (Risk > FollowUp > Name)
 */
export function prioritizePatients(patients: Patient[]): Patient[] {
    return [...patients].sort((a, b) => {
        const riskScore = { High: 3, Medium: 2, Low: 1 };

        // 1. Risk Level
        const riskDiff = riskScore[b.riskLevel] - riskScore[a.riskLevel];
        if (riskDiff !== 0) return riskDiff;

        // 2. Urgent Follow-up
        if (a.followUpUrgent && !b.followUpUrgent) return -1;
        if (!a.followUpUrgent && b.followUpUrgent) return 1;

        // 3. Name alphabetical
        return a.name.localeCompare(b.name);
    });
}

// ─── 2. Smart Referrals (Context-Aware Engine) ───────────────────────────────

type ServiceRecommendation = {
    id: string;
    title: string;
    reason: string;
    icon: string;
};

/**
 * Suggests services based on patient condition keywords.
 */
export function getRecommendedServices(patient: Patient): ServiceRecommendation[] {
    const text = (patient.condition + ' ' + patient.riskLevel).toLowerCase();
    const recommendations: ServiceRecommendation[] = [];

    // Ambulance / Emergency
    if (text.includes('critical') || text.includes('accident') || text.includes('stroke') || text.includes('heart') || text.includes('high risk')) {
        recommendations.push({
            id: 'emergency',
            title: 'Call Ambulance (108)',
            reason: 'High risk condition detected. Immediate transport may be required.',
            icon: 'ambulance'
        });
    }

    // Maternal Care
    if (text.includes('prenatal') || text.includes('pregnant') || text.includes('maternity')) {
        recommendations.push({
            id: 'scheme_jsy',
            title: 'Janani Suraksha Yojana',
            reason: 'Eligible for maternal health benefits under JSY scheme.',
            icon: 'file-text'
        });
        recommendations.push({
            id: 'tele_gynae',
            title: 'Gynaecologist Tele-consult',
            reason: 'Regular screening recommended for prenatal care.',
            icon: 'video'
        });
    }

    // Chronic Disease
    if (text.includes('diabetes') || text.includes('hypertension') || text.includes('sugar') || text.includes('bp')) {
        recommendations.push({
            id: 'ncd_clinic',
            title: 'NCD Clinic Referral',
            reason: 'Requires regular monitoring for chronic condition.',
            icon: 'activity'
        });
    }

    // Child Care
    if (patient.age < 5 || text.includes('vaccin')) {
        recommendations.push({
            id: 'vaccine_camp',
            title: 'Vaccination Tracker',
            reason: 'Child under 5. Check immunization schedule.',
            icon: 'syringe'
        });
    }

    // Fever / Infection
    if (text.includes('fever') || text.includes('flu') || text.includes('dengue') || text.includes('malaria')) {
        recommendations.push({
            id: 'fever_clinic',
            title: 'Fever Clinic Visit',
            reason: 'Symptoms indicate possible infection. Screen for vector-borne diseases.',
            icon: 'thermometer'
        });
    }

    return recommendations;
}

// ─── 3. AI Case Summaries (Narrative Generation) ─────────────────────────────

/**
 * Generates a natural language summary from structured patient data.
 */
export function generateCaseSummary(patient: Patient): string {
    const risk = patient.riskLevel;
    const condition = patient.condition;
    const status = patient.status;
    const daysSinceVisit = getDaysDifference(patient.lastVisit);

    let summary = `${patient.name} is a ${patient.age}-year-old patient `;

    // Risk & Condition
    if (risk === 'High') {
        summary += `diagnosed with ${condition}. They are currently flagged as High Risk`;
    } else {
        summary += `receiving care for ${condition}.`;
    }

    if (status === 'Critical') {
        summary += ` and is in Critical status. `;
    } else {
        summary += `. `;
    }

    // Visit Context
    if (daysSinceVisit > 30) {
        summary += `It has been over a month since their last visit. `;
    } else if (daysSinceVisit < 3) {
        summary += `They were last seen ${daysSinceVisit === 0 ? 'today' : daysSinceVisit + ' days ago'}. `;
    }

    // Recommendation
    if (patient.followUpUrgent) {
        summary += `Urgent follow-up is required due to pending alerts. `;
    } else if (risk === 'Medium' || risk === 'High') {
        summary += `Regular monitoring of vitals is recommended. `;
    } else {
        summary += `Condition appears stable. Routine checks advised.`;
    }

    return summary;
}

function getDaysDifference(dateStr: string): number {
    // Mock diff for simple date strings like "15 Feb 2026"
    // In a real app, parse precisely. Here we roughly estimate or mock.
    // For demo, we'll return a random realistic number if parsing fails, 
    // or try to parse if standard format.
    try {
        const last = new Date(dateStr);
        const now = new Date();
        const diff = Math.abs(now.getTime() - last.getTime());
        return Math.floor(diff / (1000 * 3600 * 24));
    } catch (e) {
        return 5; // fallback
    }
}
