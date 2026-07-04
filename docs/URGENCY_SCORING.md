# Priority scoring (urgency)

VitaWeave uses a **transparent rule-based priority score** (0–100), not a black-box ML model. In the UI this is labeled **priority score**.

## Reference repositories (project root)

| Folder | Role in VitaWeave |
|--------|-------------------|
| `NEWS2-master/` | Royal College of Physicians **NEWS2 2017** thresholds (`chart.js`, sample `data.json`) |
| `maternal-health-risk-main/` | Kaggle maternal dataset feature set and validation ranges (`predict.py`: Age, SystolicBP, DiastolicBP, BS mmol/L, BodyTemp °F, HeartRate) |
| `Maternal-Health-Risk-Prediction-main/` | UCI research / feature-selection notebook — informs maternal modifier weights only |

We **do not** run the Flask/Kaggle model in production. Rules are ported to TypeScript in `lib/urgencyScoring.ts`.

## Algorithm

1. **NEWS2 base** — Points from respiration, SpO2, supplemental O₂, systolic BP, heart rate, consciousness, temperature (RCP 2017 bands from `NEWS2-master/chart.js`).
2. **Maternal modifier** — Extra points when patient context suggests pregnancy/maternal care and vitals fall outside ranges derived from the maternal repos (e.g. elevated BP, fever, tachycardia).
3. **Visit modifier** — Overdue or urgent follow-up adds points from `visitSummaryFromPatient()`.
4. **Normalization** — Combined points map to score 0–100 and risk band (`Low` / `Medium` / `High`).

## Persistence

- Column: `patients.urgency_score`, `patients.urgency_score_updated_at`
- Trigger: `recalculate_patient_urgency_from_vitals` on `patient_vitals` insert (migration `002_core_features.sql`)
- App: `recalculateAndPersistUrgency()` in `lib/urgencyWorkflow.ts`

## Usage in app

| Surface | Behavior |
|---------|----------|
| ASHA Patients | Triage button runs `runPatientTriage()` |
| Doctor dashboard queue | Sorted by `patientUrgencyScore` descending |
| Referrals | Urgency field is clinical judgment, separate from priority score |

## Scheduling

`supabase/functions/daily-task-generation` creates ASHA `dashboard_tasks` for patients with score ≥ 50, urgent follow-ups, and due vaccinations. Schedule with Supabase cron or `pg_cron` calling the edge function with the service role.

## Copy guidelines

- Say: **priority score**, **high priority**, **NEWS2-based rules**
- Avoid: “AI urgency engine”, “ML prediction”, “black-box risk model”
