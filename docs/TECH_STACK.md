# Technology Stack - Rationale

Why VitaWeave is built the way it is, and what trade-offs were accepted.

---

## Mobile: Expo 54 + React Native

**Chosen for:**
- Single TypeScript codebase targeting Android, iOS, and web
- Expo Router for file-based navigation matching product’s role-separated UX
- EAS Build for store-ready binaries without maintaining native projects day-one
- Large ecosystem (camera, notifications, fonts) aligned with healthcare UX needs

**Trade-offs:**
- Native modules (Agora RTC) require **custom dev client**, not Expo Go
- Web build lacks full telemedicine parity
- Bundle size larger than native Kotlin/Swift apps

**Alternatives considered:**
- Flutter - strong UI but smaller Supabase/RN hiring pool in India
- Native dual codebase - higher cost for pilot-stage team

---

## Routing: Expo Router v6

**Chosen for:**
- Route groups `(asha)`, `(doctor)`, `(patient)` map 1:1 to product roles
- Deep linking for telemedicine (`appointmentId` params)
- Typed routes experiment enabled in `app.json`

---

## Backend: Supabase (PostgreSQL + Auth + RLS + Edge Functions)

**Chosen for:**
- **Postgres** - relational model fits patients, appointments, records, campaigns
- **Row Level Security** - multi-tenant healthcare without custom middleware
- **Supabase Auth** - email/password with JWT; profile row linked by `id`
- **Edge Functions (Deno)** - hide Gemini API key and Agora certificate
- Fast pilot setup vs self-hosted Django/FastAPI

**Trade-offs:**
- Vendor coupling - migration path is standard Postgres export
- Complex RLS policies can be hard to debug - mitigated by `complete_schema.sql` as single source of truth
- Real-time subscriptions used selectively (not everywhere)

**Not in repo (despite older README):**
- Django, Hyperledger, PySyft - removed from architecture; see ROADMAP for future integrations

---

## AI: Google Gemini

**Chosen for:**
- Strong multilingual performance (Hindi + English ASHA workflows)
- MedGemma-style prompting for primary-care Q&A
- Available via simple REST; easy to proxy through edge function

**Production pattern:**
```
Client → EXPO_PUBLIC_USE_EDGE_PROXY=true → gemini-proxy edge function → Gemini API
```

**Never in production APK:** raw `GEMINI_API_KEY` - only `EXPO_PUBLIC_GEMINI_API_KEY` for local dev when proxy is off.

**Also used for:**
- `generateAITaskSuggestions()` on ASHA dashboard
- Telemedicine screen auxiliary Q&A (doctor sidebar)

---

## Video: Agora

**Chosen for:**
- Proven RTC latency in emerging markets
- Token-based channel security
- `react-native-agora` for native builds

**Pattern:**
- Client holds `EXPO_PUBLIC_AGORA_APP_ID` (public)
- `agora-token` edge function signs tokens with **App Certificate** (secret)

**Limitation in repo:** Remote video rendering (`RtcSurfaceView`) needs EAS build validation; local `CameraView` preview works in development.

---

## State & storage

| Concern | Solution |
|---------|----------|
| Server state | Supabase queries in `lib/api.ts`; refetch on `useFocusEffect` |
| Session | Supabase Auth session + AsyncStorage mirrors (`user_id`, `user_role`) |
| Consent / notification dedupe | AsyncStorage keys |
| Global UI state | React `useState` / `useCallback` - no Redux (YAGNI for pilot) |

---

## UI & design

- **lucide-react-native** - consistent iconography
- **Inter font** via `@expo-google-fonts/inter`
- **react-native-reanimated** - dashboard animations
- Role-specific color accents (ASHA teal, doctor cyan, patient green)

---

## Observability: Sentry

**Chosen for:**
- React Native crash reporting
- Expo plugin in `app.json`
- Initialized in `ProductionInitializer` with environment-based sample rates

`lib/phiSecurity.ts` scrubs names/phones before breadcrumbs.

---

## CI/CD

**GitHub Actions** (`.github/workflows/ci-cd.yml`):
- `npm run lint`
- `npm run typecheck`
- `npm test` (unit only)

**EAS** (`eas.json`): development, preview, production profiles  
**Vercel** (`vercel.json`): static web export for marketing / demo

---

## Voice input

`@react-native-voice/voice` in `lib/voiceRecognition.ts` - experimental hands-free data entry for ASHA. Package is deprecated; roadmap includes migration to Expo Speech or platform APIs.

---

## Web research: Firecrawl

`EXPO_PUBLIC_FIRECRAWL_API_KEY` - optional scraping for health scheme content (limited use in current screens). Kept for future Benefits Navigator module.

---

## Security-related libraries

| Library | Purpose |
|---------|---------|
| `@supabase/supabase-js` | Auth + PostgREST client |
| `react-native-url-polyfill` | Supabase compatibility on RN |
| `@react-native-async-storage/async-storage` | Local persistence |

---

## Version policy

- Pin Expo SDK packages to compatible versions (`expo doctor`)
- TypeScript strict checking via `npm run typecheck`
- `npm install --legacy-peer-deps` may be required due to Jest/React 19 peer conflicts

---

## When to reconsider the stack

| Trigger | Action |
|---------|--------|
| >100k MAU | Read replicas, connection pooling (Supavisor), CDN for assets |
| Government mandate for on-prem | Export schema; self-host Postgres + Keycloak |
| Full offline-first | **Done** - WatermelonDB + SyncService (`lib/db`, `lib/sync`) |
| FHIR required | Add HAPI FHIR sidecar or Google Healthcare API bridge |
