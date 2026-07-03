# Security & Compliance

VitaWeave handles health-related data. This document describes the **technical controls in the repository** and what remains **organizational / legal** for production healthcare deployment.

> **Disclaimer:** This is not legal advice. Engage qualified counsel for HIPAA, India's DPDP Act 2023, CLAUDE, or state NHM data agreements.

---

## Data classification

| Data type | Examples | Storage |
|-----------|----------|---------|
| PHI | Name, phone, conditions, vitals, visit notes | Supabase PostgreSQL |
| Credentials | Passwords | Supabase Auth (hashed) |
| API secrets | Gemini key, Agora certificate | Supabase Edge secrets only |
| Telemetry | Crash stacks | Sentry (scrubbed) |
| Local prefs | Consent flag, notification dedupe | AsyncStorage |

---

## Controls implemented in code

### 1. Authentication & authorization

- Supabase Auth JWT for all API calls
- `completeRoleLogin()` enforces role match at login
- `useRoleGuard()` prevents cross-role route access
- Row Level Security on clinical tables (see `complete_schema.sql`)

### 2. Secret management

| Secret | Location |
|--------|----------|
| `GEMINI_API_KEY` | Supabase Edge Function secret |
| `AGORA_APP_CERTIFICATE` | Supabase Edge Function secret |
| `SUPABASE_ANON_KEY` | Client (public by design; RLS protects data) |
| Service role key | **Never** in client |

Production should set `EXPO_PUBLIC_USE_EDGE_PROXY=true`.

### 3. PHI redaction

`lib/phiSecurity.ts`:

- `redactPhi(text)` — masks phone, email patterns
- `scrubObject(obj)` — recursive redaction for logs
- Used before Sentry breadcrumbs and analytics events

### 4. Consent

- `app/consent.tsx` — explicit accept before app use
- `lib/consent.ts` — persists acceptance locally
- `app/privacy-policy.tsx` — linked from consent flow
- `app.json` → `extra.privacyPolicyUrl` for store listings

### 5. Transport security

- Supabase client uses HTTPS
- Agora RTC encrypted channels (vendor default)

### 6. Error monitoring

- Sentry DSN is public client key (standard pattern)
- `beforeSend` hooks should strip PHI (extend in `lib/sentry.ts` as needed)

---

## Row Level Security model

Principles:

1. **Default deny** — RLS enabled; policies grant minimum access
2. **ASHA** — CRUD on assigned `patients`; read ward alerts/tasks
3. **Doctor** — appointments where `doctor_id = auth.uid()`; patients in caseload
4. **Patient** — rows where `profile_id = auth.uid()` or linked patient id

Audit: periodically run policy tests with three test JWTs.

---

## Compliance pathways

### India DPDP Act 2023

| Requirement | VitaWeave support |
|-------------|-------------------|
| Notice & consent | Consent screen + privacy policy |
| Purpose limitation | Role-scoped data access |
| Data minimization | Only required fields in schema |
| Security safeguards | RLS, encryption in transit, secret proxy |
| Data principal rights | Manual export/delete via Supabase admin (automate in roadmap) |

### HIPAA (US pilots)

Would require:

- BAA with Supabase (Teams/Enterprise)
- Audit logging
- Access controls documentation
- Breach notification procedures

Architecture (RLS, consent, PHI scrubbing) is a **foundation**, not certification.

---

## Threat model (simplified)

| Threat | Mitigation |
|--------|------------|
| Stolen phone | OS screen lock; session timeout (add in roadmap) |
| Anon key abuse | RLS; rate limiting via Supabase |
| API key in APK | Edge proxy for Gemini/Agora cert |
| Insider ASHA views wrong ward | RLS `asha_id` filter |
| Log leakage | phiSecurity scrubbing |

---

## Secure development practices

1. Never commit `.env`
2. Rotate keys if exposed
3. Use separate Supabase projects per environment
4. Run `npm audit` periodically (known transitive issues in dev deps)
5. Code review for direct `supabase` calls bypassing `api.ts`

---

## Incident response (recommended org process)

1. Revoke compromised API keys in Supabase/Google/Agora consoles
2. Force password reset via Supabase Auth
3. Review `video_calls` and `medical_records` audit tables for anomalous access
4. Notify DPO / legal per jurisdictional requirements

---

## Children's data

If registering minors, parental consent flows are **not yet implemented** — required before pediatric pilots.

---

## AI governance

- Gemini outputs are **assistive**, not diagnostic
- UI should display disclaimers on AI screens
- Chat stored in `ai_chat_history` — include in data retention policy
- Review prompts in `lib/gemini.ts` for safety bias

---

## Checklist before public launch

- [ ] `EXPO_PUBLIC_DEV_MODE=false` in production
- [ ] Edge proxy enabled
- [ ] RLS policies tested per role
- [ ] Privacy policy URL live
- [ ] Sentry PHI scrubbing verified
- [ ] Penetration test or third-party security review
- [ ] Data processing agreement with Supabase
- [ ] App store privacy nutrition labels completed
