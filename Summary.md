# VitaWeave Project Summary

> **Updated documentation:** For the current Supabase-based stack, pitch materials, and deployment steps, start with [README.md](README.md) and the [docs/](docs/) folder. This file is a legacy developer overview and may reference older screen paths.

## Overview
`VitaWeave` is a rural healthcare application built with Expo React Native that targets three user roles: ASHA/ANM community health workers, doctors, and patients. The app is designed for low-connectivity environments and combines AI-assisted guidance, voice interaction, Supabase persistence, and telemedicine-like workflows.

## Key Goals
- Empower rural health workers with digital tools for patient management.
- Provide AI-driven medical assistance and summary generation.
- Support health monitoring for patients through personal dashboards.
- Enable doctor review, appointments, and telemedicine-style consultations.
- Build a mobile-first experience with offline/demo fallback.

## Core Architecture
- Frontend: Expo, React Native, Expo Router.
- Backend: Supabase for authentication, data storage, and app persistence.
- AI: Google Gemini via `@google/generative-ai` with a custom MedGemma persona.
- Voice: Cross-platform voice recognition abstraction for web and mobile.
- Navigation: folder-based tab routing with role-specific layouts.

## App Structure
### Root
- `app/_layout.tsx` — app entry point, font loading, splash screen handling, stack navigation.
- `app/login.tsx` — role selector screen for Doctor, ASHA/ANM, and Patient.
- `app/doctor-login.tsx`, `app/asha-login.tsx`, `app/patient-login.tsx` — login and signup screens with Supabase auth and offline/demo fallback.

### ASHA / ANM Worker
- `app/(asha)/_layout.tsx` — ASHA role tab navigator.
- `app/(asha)/index.tsx` — ASHA dashboard with tasks, alerts, and community risk overview.
- `app/(asha)/patients.tsx` — patient list and management.
- `app/(asha)/ai-assistant.tsx` — AI chat assistant with Gemini and voice input.
- `app/(asha)/community-signals.tsx` — community health signals view.
- `app/(asha)/services.tsx` — service cards for campaigns, telemedicine, schemes, emergency hub.
- `app/(asha)/vaccinations.tsx` — vaccination tracking.
- `app/(asha)/add-patient.tsx`, `app/(asha)/add-alert.tsx`, `app/(asha)/add-task.tsx` — create new records.
- `app/(asha)/profile.tsx` — ASHA user profile.

### Doctor
- `app/(doctor)/_layout.tsx` — doctor tab navigator.
- `app/(doctor)/index.tsx` — doctor dashboard with stats, AI insights, and patient queue.
- `app/(doctor)/appointments.tsx` — appointment list and telemedicine entry.
- `app/(doctor)/ai-diagnostics.tsx` — AI diagnostics assistant.
- `app/(doctor)/telemedicine.tsx` — simulated video call interface with audio/video controls.
- `app/(doctor)/campaigns.tsx` — campaign management and outreach.
- `app/(doctor)/insights.tsx` — health analytics and trends.
- `app/(doctor)/profile.tsx` — doctor profile.
- `app/(doctor)/add-patient.tsx` — add a patient from doctor view.

### Patient
- `app/(patient)/_layout.tsx` — patient tab navigator.
- `app/(patient)/index.tsx` — patient dashboard with vitals, medications, appointments, and sleep summary.
- `app/(patient)/appointments.tsx` — upcoming visit list.
- `app/(patient)/health-chat.tsx` — AI health chat powered by Gemini.
- `app/(patient)/profile.tsx` — patient profile.

## Data and Services
### Supabase API
- `lib/api.ts` provides data fetching and mutation functions:
  - `getPatients()`, `getCommunityAlerts()`, `getPharmacyTrends()`, `getSymptomReports()`, `getWeeklyTrends()`, `getAIInsights()`, `getDashboardTasks()`, `getWeeklyAlerts()`
  - `addPatient()`, `updateProfile()`, `addDashboardTask()`, `addWeeklyAlert()`
- Caching strategy is used to allow faster UI updates and fallback when Supabase fetch fails.

### Authentication
- `lib/auth.ts` manages sign in, sign up, sign out, session retrieval, and profile lookup.
- On sign-up, it stores role metadata in Supabase profiles.
- Role state is also saved locally in AsyncStorage for routing.

### AI Integration
- `lib/gemini.ts` integrates with Google Gemini using a custom MedGemma prompt.
- Supports storing an API key in local storage and generating health responses.
- AI is used in ASHA assistant, patient health chat, and doctor diagnostic support.

### Voice Recognition
- `lib/voiceRecognition.ts` provides a cross-platform voice service.
- Web uses the browser speech API; mobile currently uses a simulated placeholder.
- Includes medical intent detection for commands such as emergency, vitals, medication, appointment, and symptoms.

### Telemedicine
- `app/(doctor)/telemedicine.tsx` uses an Agora-style video service abstraction.
- Provides the interface for connecting, toggling audio/video, switching camera, and ending calls.
- Includes a live AI notes panel during consultation.

## Mock and Sample Data
- `app/constants/data.ts` contains sample content for:
  - patients
  - dashboard tasks
  - weekly alerts
  - community alerts and risk summary
  - pharmacy trends
  - symptom reports
  - AI insights
- This file powers the app’s UI with realistic demo data.

## User Roles and Use Cases
### ASHA / ANM Worker Use Cases
- register and maintain patient records in the field
- track vaccination schedules and follow-ups
- monitor community health alerts and disease clusters
- generate daily task lists and follow-up reminders
- ask AI questions through text and voice
- access emergency and government scheme information
- manage campaigns and local health services
- maintain offline records and sync later

### Doctor Use Cases
- review daily patient queue and appointment schedule
- receive AI-assisted diagnostic suggestions
- monitor flagged alerts from ASHA workers
- join telemedicine-style consultations
- track campaign performance and health analytics
- access patient history and treatment notes
- respond quickly to high-risk cases

### Patient Use Cases
- view personal vitals and medication schedule
- track upcoming doctor visits
- chat with AI for health guidance
- ask questions about symptoms and wellness
- access personal health records and reminders

## Notable Implementation Details
- Role-based tab navigation and access control using AsyncStorage.
- Login screens include fallback demo mode when Supabase is unreachable.
- AI assistant prompts are tailored to rural healthcare and community health support.
- Voice recognition supports local language detection patterns and medical intents.
- Expo Router folder mapping simplifies screen navigation structure.
- The app is built for Expo 54, React Native 0.81.5, and TypeScript.

## Testing
- The repository includes tests for:
  - Supabase integration
  - Gemini AI integration
  - voice recognition behavior
  - image upload flow
  - integration end-to-end verification

## Summary
`VitaWeave` is a role-driven healthcare app built to support rural healthcare delivery through AI, voice, and mobile-first workflows. It connects ASHA/ANM workers, doctors, and patients with a shared platform for patient management, community signals, telemedicine, and AI guidance.
