import { Platform } from 'react-native';
import { isDevModeEnabled } from './devMode';
import { logger } from './logger';

export interface VoiceRecognitionResult {
  transcript: string;
  confidence?: number;
  error?: string;
}

type VoiceModule = {
  isAvailable: () => Promise<boolean>;
  start: (locale: string) => Promise<void>;
  stop: () => Promise<void>;
  destroy: () => Promise<void>;
  removeAllListeners: () => void;
  onSpeechResults: ((event: { value?: string[] }) => void) | null;
  onSpeechError: ((event: { error?: { message?: string } }) => void) | null;
  onSpeechEnd: (() => void) | null;
};

let Voice: VoiceModule | null = null;

function loadVoiceModule(): VoiceModule | null {
  if (Platform.OS === 'web') return null;
  if (Voice) return Voice;

  try {
    Voice = require('@react-native-voice/voice').default;
    return Voice;
  } catch {
    logger.warn('@react-native-voice/voice not available — use an EAS dev build for native voice');
    return null;
  }
}

export class VoiceRecognitionService {
  private static instance: VoiceRecognitionService;
  private recognition: any = null;
  private isListening = false;
  private resultCallback?: (result: VoiceRecognitionResult) => void;
  private errorCallback?: (error: string) => void;

  static getInstance(): VoiceRecognitionService {
    if (!VoiceRecognitionService.instance) {
      VoiceRecognitionService.instance = new VoiceRecognitionService();
    }
    return VoiceRecognitionService.instance;
  }

  isSupported(): boolean {
    if (Platform.OS === 'web') {
      return 'webkitSpeechRecognition' in globalThis || 'SpeechRecognition' in globalThis;
    }
    return Boolean(loadVoiceModule()) || isDevModeEnabled();
  }

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') return true;

    const voice = loadVoiceModule();
    if (!voice) return isDevModeEnabled();

    try {
      return await voice.isAvailable();
    } catch {
      return false;
    }
  }

  async startListening(
    onResult: (result: VoiceRecognitionResult) => void,
    onError?: (error: string) => void
  ): Promise<boolean> {
    if (this.isListening) return false;

    if (!this.isSupported()) {
      onError?.('Voice recognition is not supported on this device');
      return false;
    }

    const hasPermissions = await this.requestPermissions();
    if (!hasPermissions) {
      onError?.('Microphone permission denied');
      return false;
    }

    this.resultCallback = onResult;
    this.errorCallback = onError;

    if (Platform.OS === 'web') {
      return this.startWebListening(onResult, onError);
    }

    const voice = loadVoiceModule();
    if (voice) {
      return this.startNativeListening(voice, onResult, onError);
    }

    return this.startSimulatedListening(onResult, onError);
  }

  stopListening(): void {
    if (Platform.OS === 'web' && this.recognition) {
      try {
        this.recognition.stop();
      } catch (error) {
        logger.error('Error stopping web recognition:', error);
      }
      this.recognition = null;
    }

    const voice = loadVoiceModule();
    if (voice && this.isListening) {
      voice.stop().catch(() => undefined);
      voice.removeAllListeners();
    }

    this.isListening = false;
  }

  private startWebListening(
    onResult: (result: VoiceRecognitionResult) => void,
    onError?: (error: string) => void
  ): boolean {
    try {
      const SpeechRecognition =
        (globalThis as any).webkitSpeechRecognition || (globalThis as any).SpeechRecognition;

      if (!SpeechRecognition) {
        onError?.('Speech recognition not supported in this browser');
        return false;
      }

      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-IN';

      this.recognition.onstart = () => {
        this.isListening = true;
      };

      this.recognition.onresult = (event: any) => {
        const result = event.results[0][0];
        if (result) {
          onResult({ transcript: result.transcript, confidence: result.confidence });
        }
      };

      this.recognition.onerror = (event: any) => {
        this.isListening = false;
        onError?.(event.error || 'Speech recognition error');
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.recognition = null;
      };

      this.recognition.start();
      return true;
    } catch (error) {
      onError?.('Failed to initialize speech recognition');
      return false;
    }
  }

  private startNativeListening(
    voice: VoiceModule,
    onResult: (result: VoiceRecognitionResult) => void,
    onError?: (error: string) => void
  ): boolean {
    try {
      voice.removeAllListeners();

      voice.onSpeechResults = (event) => {
        const transcript = event.value?.[0];
        if (transcript) {
          onResult({ transcript, confidence: 0.9 });
        }
        this.isListening = false;
      };

      voice.onSpeechError = (event) => {
        this.isListening = false;
        onError?.(event.error?.message || 'Voice recognition failed');
      };

      voice.onSpeechEnd = () => {
        this.isListening = false;
      };

      this.isListening = true;
      voice.start('en-IN');
      return true;
    } catch (error) {
      onError?.('Failed to start native voice recognition');
      return false;
    }
  }

  private startSimulatedListening(
    onResult: (result: VoiceRecognitionResult) => void,
    onError?: (error: string) => void
  ): boolean {
    if (!isDevModeEnabled()) {
      onError?.('Native voice module unavailable. Build with EAS dev client.');
      return false;
    }

    this.isListening = true;
    setTimeout(() => {
      if (this.isListening) {
        onResult({ transcript: 'patient needs follow up visit', confidence: 0.88 });
        this.isListening = false;
      }
    }, 2000);
    return true;
  }

  isActive(): boolean {
    return this.isListening;
  }

  getSupportedLanguages(): string[] {
    return ['en-IN', 'hi-IN', 'bn-IN', 'te-IN', 'ta-IN', 'mr-IN', 'gu-IN', 'kn-IN', 'ml-IN'];
  }

  setLanguage(language: string): void {
    if (this.recognition && Platform.OS === 'web') {
      this.recognition.lang = language;
    }
  }

  cleanup(): void {
    this.stopListening();
    loadVoiceModule()?.destroy().catch(() => undefined);
  }
}

export const voiceRecognitionService = VoiceRecognitionService.getInstance();

export const startVoiceInput = async (
  onResult: (text: string) => void,
  onError?: (error: string) => void
): Promise<boolean> => {
  return voiceRecognitionService.startListening(
    (result) => {
      if (result.transcript) onResult(result.transcript);
    },
    onError
  );
};

export const isVoiceRecognitionAvailable = (): boolean => {
  return voiceRecognitionService.isSupported();
};

export const MEDICAL_VOICE_COMMANDS = {
  EMERGENCY: ['emergency', 'help', 'urgent', 'critical', '911'],
  VITALS: ['blood pressure', 'heart rate', 'temperature', 'oxygen', 'vitals'],
  MEDICATION: ['medicine', 'medication', 'drug', 'dose', 'prescription'],
  APPOINTMENT: ['appointment', 'schedule', 'visit', 'follow up'],
  SYMPTOMS: ['pain', 'fever', 'cough', 'headache', 'nausea', 'symptom'],
};

export const detectMedicalIntent = (transcript: string): string | null => {
  const lowerTranscript = transcript.toLowerCase();
  for (const [intent, keywords] of Object.entries(MEDICAL_VOICE_COMMANDS)) {
    if (keywords.some((keyword) => lowerTranscript.includes(keyword))) {
      return intent;
    }
  }
  return null;
};

export type VoicePayload = {
  transcript: string;
  intent: string | null;
  confidence?: number;
  summary: string;
};

export async function transcribeLocalAudio(uri: string): Promise<VoicePayload> {
  const transcript = `Audio recorded at ${uri}. Use voice input for live transcription.`;
  const intent = detectMedicalIntent(transcript);
  return {
    transcript,
    intent,
    confidence: 0.9,
    summary: compactVoiceTranscript(transcript),
  };
}

export function compactVoiceTranscript(transcript: string): string {
  const reduced = transcript
    .replace(/\b(please|kindly|just|actually|really)\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return reduced.length > 280 ? reduced.slice(0, 280) : reduced;
}

export function buildVoicePayload(transcript: string, confidence?: number): VoicePayload {
  const intent = detectMedicalIntent(transcript);
  return {
    transcript,
    intent,
    confidence,
    summary: compactVoiceTranscript(transcript),
  };
}
