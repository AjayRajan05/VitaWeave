# VitaWeave

**AI-powered community health platform for rural India** - connecting ASHA workers, doctors, and patients through one mobile app backed by Supabase, Gemini AI, and telemedicine.

[![Expo](https://img.shields.io/badge/Expo-57-000020?logo=expo)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.81-61DAFB?logo=react)](https://reactnative.dev)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?logo=supabase)](https://supabase.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)](https://www.typescriptlang.org)

---

## What is VitaWeave?

VitaWeave digitizes frontline healthcare workflows for **ASHA workers**, **doctors**, and **patients** in low-connectivity settings. Workers triage patients in the field, doctors run telemedicine consultations and record visits, and patients book appointments and view their health data - all from a single Expo app with role-based navigation.

**Core value proposition**

| Stakeholder | Problem | VitaWeave solution |
|-------------|---------|-------------------|
| ASHA worker | Paper registers, no ward-level visibility | Patient registry, triage, vaccinations, community alerts, AI task suggestions |
| Doctor | Fragmented records, travel to villages | Dashboard queue, telemedicine (Agora), visit notes, campaigns |
| Patient | Limited access to specialists | Book appointments, vitals, medications, consent-aware records |
| Program / NGO | No real-time community signals | Ward risk aggregation, alert digests, campaign tracking |

---

## Features (shipped)

### ASHA (`/(asha)`)
- Dashboard with tasks, weekly alerts, community risk banner, field route map
- Patient list with triage persistence and **priority score** (rule-based vitals scoring)
- Referrals (send to doctor / receive)
- Vaccination tracking (due / completed)
- Community health signals screen
- MedGemma AI assistant with chat history (en/hi/ta)
- Profile wired to `profiles` table with live stats
- Offline-first writes with sync status indicator

### Doctor (`/(doctor)`)
- Today’s appointment queue sorted by **priority score** (long-press override)
- Patient risk alerts and referrals inbox
- Appointments with **Scheduled → Active → Completed** status linked to telemedicine
- Telemedicine screen (Agora + local camera preview)
- Record visit workflow with follow-up task creation
- Health campaigns, add patient, medical records

### Patient (`/(patient)`)
- Home dashboard with medication reminders (tap to mark dose taken)
- Book appointment, view appointments
- Profile with vitals / records summary; ABHA ID card (M1 placeholder)
- Language picker (English, Hindi, Tamil)

### Supervisor (`/(admin)`)
- District metrics, program summary stats
- Access audit log and priority scoring audit trail
- Login via **District supervisor login** on main login screen

### Platform
- Supabase Auth + Row Level Security (RLS)
- Gemini via client or **Supabase Edge Function** proxy (`gemini-proxy`)
- Agora token generation via **edge function** (`agora-token`)
- **Server push** via `send-push` edge function + Expo Push tokens
- Local push notifications for care-team digests and appointment reminders
- **Offline write queue** with background sync (`syncEngine`)
- Daily task generation edge function (`daily-task-generation`)
- Sentry error monitoring, consent screen, PHI redaction utilities
- CI pipeline (lint, typecheck, unit tests)

See [docs/URGENCY_SCORING.md](docs/URGENCY_SCORING.md) for priority score methodology.

---

## Tech stack (actual)

| Layer | Technology | Why |
|-------|------------|-----|
| Mobile / Web | **Expo 57**, React Native, Expo Router | One codebase for Android, iOS, and web; fast iteration for field pilots |
| Backend | **Supabase** (PostgreSQL, Auth, RLS, Edge Functions) | Managed Postgres with built-in auth; RLS for multi-tenant healthcare data |
| AI | **Google Gemini** (MedGemma-style prompts) | Clinical Q&A, task generation; keys kept server-side via edge proxy |
| Video | **Agora** + `react-native-agora` | Low-latency telemedicine; tokens issued server-side |
| Observability | **Sentry** | Crash and error tracking in production builds |
| Storage | AsyncStorage + **WatermelonDB** (local-first SQLite) | Session prefs + offline clinical DB with sync |
| Offline | `lib/sync/SyncService` + SQLite | Airplane-mode field work; conflict merge on reconnect |

> **Note:** Older README references to Django, Hyperledger, wearables, and MedRide describe a **future roadmap**, not the current repository. See [docs/ROADMAP.md](docs/ROADMAP.md).

---

## Quick start

### Prerequisites

- Node.js 18+
- npm or yarn
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (`npx expo`)
- Supabase project (free tier works for development)
- API keys: Gemini, Agora App ID, optional Firecrawl & Sentry

### 1. Clone and install

```bash
git clone https://github.com/your-org/vitaweave.git
cd vitaweave
npm install --legacy-peer-deps
```

### 2. Environment

```bash
cp .env.example .env
```

Fill in at minimum:

```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
EXPO_PUBLIC_GEMINI_API_KEY=...
EXPO_PUBLIC_AGORA_APP_ID=...
EXPO_PUBLIC_USE_EDGE_PROXY=true
EXPO_PUBLIC_DEV_MODE=false
```

### 3. Database

In Supabase SQL Editor, run the full schema, then apply migrations in order:

```
supabase/complete_schema.sql
supabase/migrations/002_core_features.sql
supabase/migrations/003_tier3_compliance.sql
supabase/migrations/004_anc_pnc.sql
supabase/migrations/005_referral_ladder.sql
supabase/migrations/006_consent_data_rights.sql
supabase/migrations/007_surveillance_campaigns.sql
```

Deploy edge functions including `data-rights`:

```
supabase functions deploy gemini-proxy
supabase functions deploy agora-token
supabase functions deploy daily-task-generation
supabase functions deploy send-push
supabase functions deploy data-rights
```

Set secrets in Supabase Dashboard: `GEMINI_API_KEY`, `AGORA_APP_ID`, `AGORA_APP_CERTIFICATE`.

### 4. Run the app

```bash
npm run dev          # Expo dev server
npm run typecheck    # TypeScript
npm test             # Unit tests (no live Supabase)
npm run lint         # ESLint
```

- **Web:** press `w` in Expo CLI or open the web URL
- **Device:** **EAS development build** required for offline WatermelonDB + telemedicine (Agora). Expo Go is insufficient for these native modules.
  - `npm run build:dev:android` then `npm run dev:client`

---

## Project structure

```
app/                    # Expo Router screens (role-based route groups)
  (asha)/               # ASHA worker flows
  (doctor)/             # Doctor flows + telemedicine
  (patient)/            # Patient flows
  (admin)/              # District supervisor console
  login.tsx, admin-login.tsx, consent.tsx
components/             # Shared UI (PatientPicker, EmptyState, SyncStatusDot, …)
hooks/                  # useUserProfile, useTranslation, useAIChat
lib/                    # API, auth, workflows, notifications, urgency scoring
  api.ts                # Supabase data access + offline write queue
  urgencyScoring.ts     # Rule-based priority score (NEWS2 + maternal refs)
  syncEngine.ts         # Background sync for queued writes
supabase/
  complete_schema.sql     # Canonical DB schema + RLS
  migrations/           # 002_core_features, 003_tier3_compliance
  functions/            # gemini-proxy, agora-token, daily-task-generation, send-push
tests/                    # Jest unit tests
docs/                     # Architecture, pitch, deployment guides
```

---

## Key workflows

### Appointment → telemedicine

1. Doctor opens **Appointments** and taps **Join Telemedicine Call**
2. `startTelemedicineSession()` sets status `Scheduled` → `Active` and logs `video_calls`
3. Doctor joins Agora channel; on end, `completeTelemedicineSession()` sets `Completed`

### ASHA triage

1. Worker updates patient risk on **Patients** screen
2. Vitals feed **priority score** via `lib/urgencyScoring.ts` (rule-based, not ML at runtime)
3. `updatePatientRisk()` persists to `patients` table; scoring audit logged
4. Community signals aggregate ward-level risk from `community_alerts`

### Notifications

On dashboard load, `syncRoleNotifications()` schedules local notifications and may invoke `send-push` for registered device tokens.

---

## Documentation

| Document | Description |
|----------|-------------|
| [docs/PITCH.md](docs/PITCH.md) | Investor / partner pitch narrative |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design and data flow |
| [docs/INTERNAL_LOGIC.md](docs/INTERNAL_LOGIC.md) | Business logic and code paths |
| [docs/TECH_STACK.md](docs/TECH_STACK.md) | Technology choices explained |
| [docs/DATA_MODEL.md](docs/DATA_MODEL.md) | Tables, relationships, RLS |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Supabase, EAS, Vercel, CI/CD |
| [docs/SECURITY_AND_COMPLIANCE.md](docs/SECURITY_AND_COMPLIANCE.md) | PHI, consent, security model |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Shipped vs planned features |
| [docs/GETTING_STARTED.md](docs/GETTING_STARTED.md) | Detailed developer onboarding |
| [asha_user_guide.md](asha_user_guide.md) | End-user guide for ASHA workers |

---

## Deployment overview

| Target | Tool | Notes |
|--------|------|-------|
| Mobile (store) | [EAS Build](https://docs.expo.dev/build/introduction/) | Configure `eas.json`, replace Sentry/EAS placeholders in `app.json` |
| Web landing | Vercel (`vercel.json`) | `npm run build:web` |
| Backend | Supabase | Schema + edge functions + RLS |
| CI | GitHub Actions | `.github/workflows/ci-cd.yml` |

Full steps: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

---

## Security

- **Never commit** `.env` or service role keys
- Gemini and Agora **certificates** live in Supabase Edge secrets, not the client
- RLS policies scope data by authenticated `profile_id`
- Consent gate on first launch (`app/consent.tsx`)
- PHI redaction helpers in `lib/phiSecurity.ts`

See [docs/SECURITY_AND_COMPLIANCE.md](docs/SECURITY_AND_COMPLIANCE.md).

---

## Testing

```bash
npm test              # Unit tests (mocks; no live API)
npm run test:live     # Live integration (requires .env)
npm run typecheck
npm run lint
```

Integration tests are intentionally excluded from default CI until environment secrets are configured.

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Run `npm run typecheck` and `npm test`
4. Open a pull request with a clear description

---

## License

See [LICENSE](LICENSE) in the repository root.

---

## Contact

For pilots, partnerships, or demos, see [docs/PITCH.md](docs/PITCH.md) for the recommended narrative and demo script.

**VitaWeave** - *Pragati AI for Impact · Healthcare Domain*
