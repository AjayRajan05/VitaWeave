# Product Roadmap

What is **shipped in this repository** vs **planned / aspirational** (including ideas from earlier project descriptions).

---

## Shipped (v1.0 pilot)

### Platform
- [x] Expo 54 multi-role app (ASHA, doctor, patient)
- [x] Supabase Auth + profiles
- [x] Full schema with RLS (`complete_schema.sql`)
- [x] Gemini AI assistant + edge proxy
- [x] Agora telemedicine integration (native build)
- [x] Appointment lifecycle: Scheduled → Active → Completed
- [x] Sentry, consent, PHI utilities
- [x] CI: lint, typecheck, unit tests
- [x] Local push notifications for care digests
- [x] Profile screens wired to Supabase

### ASHA
- [x] Dashboard (tasks, alerts, patients count)
- [x] Patient registry + triage persistence
- [x] Vaccination tracking
- [x] Community signals
- [x] AI task generation

### Doctor
- [x] Dashboard with dynamic alerts
- [x] Appointments + telemedicine join
- [x] Record visit + clinical workflow
- [x] Campaigns list
- [x] Add patient

### Patient
- [x] Dashboard
- [x] Book appointment
- [x] Appointments list
- [x] Profile with health summary

---

## In progress / needs hardening

| Item | Status | Notes |
|------|--------|-------|
| Remote Agora video render | Partial | Local camera works; `RtcSurfaceView` needs device QA |
| Voice input | Experimental | `@react-native-voice/voice` deprecated |
| Integration test suite | Deferred | User to enable after env setup |
| True push (FCM/APNs server) | Local only | `expo-notifications` local schedule today |
| Offline sync | Not started | Demo fallback only |

---

## Phase 2 — Field pilot readiness

- [ ] Background sync queue for low connectivity
- [ ] SMS OTP auth for workers without email
- [ ] Hindi-first UI pass (partial Hindi in ASHA profile)
- [ ] Admin dashboard for district supervisors
- [ ] Export CSV / DHIS2 adapter
- [ ] Server-triggered push via Supabase Edge + FCM

---

## Phase 3 — Scale & compliance

- [ ] Automated data export / erasure (DPDP rights)
- [ ] Audit log table (who read which record)
- [ ] Session timeout + biometric unlock
- [ ] HIPAA documentation package
- [ ] Load testing on RLS policies
- [ ] Supabase branching for migrations

---

## Future vision (not in repo)

These appeared in legacy README / pitch decks but are **not implemented**:

| Feature | Description |
|---------|-------------|
| **Maternal wearables** | IoT vitals stream into `patient_vitals` |
| **Healthcare Benefits Navigator** | Firecrawl + rules engine for govt schemes |
| **MedRide** | Emergency transport routing |
| **Blockchain records** | Replaced by Postgres + RLS + audit logs |
| **Django backend** | Replaced by Supabase |
| **Federated learning** | Research-stage only |
| **TensorFlow Lite on-device** | Could complement Gemini for offline triage |

---

## How to prioritize

For **government pilot**: offline sync, SMS auth, DHIS2 export, supervisor dashboard.  
For **investor demo**: telemedicine polish, AI governance story, ward risk visualization.  
For **clinical safety**: disclaimers, audit logs, pen test.

---

## Version history

| Version | Milestone |
|---------|-----------|
| 0.x | UI prototypes with mock data |
| 1.0 | Supabase integration Phases 1–5 |
| 1.1 | (planned) Offline + server push |
| 2.0 | (planned) Supervisor + interoperability |

Update `EXPO_PUBLIC_APP_VERSION` and store build numbers per release.
