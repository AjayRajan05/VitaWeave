import AsyncStorage from '@react-native-async-storage/async-storage';

const CONSENT_KEY = '@vitaweave_consent_accepted';
const CONSENT_VERSION = '1.0';

export type ConsentRecord = {
  version: string;
  acceptedAt: string;
  medicalDisclaimer: boolean;
  privacyPolicy: boolean;
  dataProcessing: boolean;
};

export async function hasAcceptedConsent(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(CONSENT_KEY);
    if (!raw) return false;
    const record = JSON.parse(raw) as ConsentRecord;
    return (
      record.version === CONSENT_VERSION &&
      record.medicalDisclaimer &&
      record.privacyPolicy &&
      record.dataProcessing
    );
  } catch {
    return false;
  }
}

export async function acceptConsent(): Promise<void> {
  const record: ConsentRecord = {
    version: CONSENT_VERSION,
    acceptedAt: new Date().toISOString(),
    medicalDisclaimer: true,
    privacyPolicy: true,
    dataProcessing: true,
  };
  await AsyncStorage.setItem(CONSENT_KEY, JSON.stringify(record));
}

export async function clearConsent(): Promise<void> {
  await AsyncStorage.removeItem(CONSENT_KEY);
}

export const MEDICAL_DISCLAIMER =
  'VitaWeave provides health information and AI-assisted guidance for educational and operational support only. ' +
  'It is not a substitute for professional medical advice, diagnosis, or treatment. ' +
  'Always seek the advice of a qualified healthcare provider for medical emergencies or clinical decisions.';

export const PRIVACY_SUMMARY =
  'We collect account information, health records you enter, and usage data to operate the app. ' +
  'Data is stored securely via Supabase with role-based access. AI features may process de-identified prompts through secured servers. ' +
  'You can request data deletion by contacting your program administrator.';
