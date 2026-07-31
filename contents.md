# VitaWeave Pitch Deck - Contents

Master checklist of every required component for each slide.  
Use with: `government_app_pitch_deck.md` (full blueprint) · `government_app_pitch_slides.md` (slide copy only)

**Standard components per slide**
1. Slide Title & Objective  
2. Core Copy & Bullet Points  
3. Visual Layout Instructions  
4. Diagram / Visual Element (Mermaid where specified)

---

## Deck meta

| Component | Content |
|-----------|---------|
| Product | VitaWeave |
| Tagline | Rural Health. Connected. |
| One-liner | Every village already has a health worker. VitaWeave gives her a brain to think with. |
| Sector | Digital Public Health / HealthTech (B2G · G2C · G2B) |
| Stage | Functional MVP · Pilot - India rural PHC networks |
| Org | Pragati AI for Impact · Healthcare Domain |
| Alignment | SDG 3 · ABDM · DPDP Act 2023 |
| Audience | State / district health depts · NHM · NGOs · hospitals · investors |

---

## Slide 1 - Cover Page

| # | Component | Required contents |
|---|-----------|-------------------|
| 1 | Title & Objective | Title: *VitaWeave - Rural Health. Connected.* · Goal: brand authority + value-loop memory |
| 2 | Core Copy | Brand · Headline (*From data collection to decision intelligence*) · One-liner · Sector · Stage · Org line · Footer (`[DATE]` · Confidential · `[CITY / EVENT]`) |
| 3 | Visual Layout | Full-bleed teal→forest gradient · Hero brand · One-liner under brand · Mermaid centered · High-contrast text |
| 4 | Diagram | Mermaid **flowchart** - value proposition loop: Citizen/ASHA need → Triage → Gov action → Faster care → loop |

---

## Slide 2 - The Problem

| # | Component | Required contents |
|---|-----------|-------------------|
| 1 | Title & Objective | Title: *The Problem - Data Without Decisions* · Goal: urgency on citizen + government pain |
| 2 | Core Copy | **Citizen friction:** 1M+ ASHA paper triage · risk invisible · lost referrals · fragmented records · **Gov friction:** reporting ≠ priority · ward signals missing · form counts not care gaps · telemedicine without triage · **Punchline** · Metric placeholders `[X]` `[Y%]` `[cite]` |
| 3 | Visual Layout | Two columns (Citizen \| Government) · Punchline bar · Minimal icons |
| 4 | Diagram | Mermaid **flowchart** - citizen pains + gov silos → Gap: Decision intelligence → Cost |

---

## Slide 3 - The Solution

| # | Component | Required contents |
|---|-----------|-------------------|
| 1 | Title & Objective | Title: *The Solution - Care Orchestration in One App* · Goal: interface vs value split |
| 2 | Core Copy | **Roles:** ASHA · Doctor · Patient · District supervisor · **Value:** urgency scoring · closed-loop referrals · offline-first · ABDM-ready · **USP:** eSanjeevani connects; VitaWeave decides who needs the call first |
| 3 | Visual Layout | 50/50 split (phone mock \| value bullets) · Teal accent on scoring + closed-loop |
| 4 | Diagram | Mermaid **flowchart** - App roles → Shared Intelligence (Score · Referrals · Telemedicine · Offline) |

---

## Slide 4 - Market Size

| # | Component | Required contents |
|---|-----------|-------------------|
| 1 | Title & Objective | Title: *Market Size - A Government-Funded Market Missing Its Brain* · Goal: TAM → SAM → SOM |
| 2 | Core Copy | TAM `$[TAM_Bn]` · SAM (~1M ASHA + NHM budgets) · SOM (`[N]` districts · `[W]` seats · `$[SOM_Mn]`) · Catchment 3,000–5,000 · Y1 pilot 50 ASHA · Export note |
| 3 | Visual Layout | Nested rings/subgraphs · Brightest fill on SOM · Caption under diagram |
| 4 | Diagram | Mermaid **nested flowchart** - TAM ⊃ SAM ⊃ SOM ⊃ VitaWeave beachhead |

---

## Slide 5 - Product & Core Features

| # | Component | Required contents |
|---|-----------|-------------------|
| 1 | Title & Objective | Title: *Product - What Ships Today* · Goal: shipped vs roadmap honesty |
| 2 | Core Copy | **Shipped:** multi-role · urgency score + audit · referrals · UIP vaccines · ANC/PNC · telemedicine · Gemini AI · offline · outbreak detector · consent/PHI · ABHA · DPDP · **Roadmap:** live ABDM · DHIS2 · schemes · wearables · MedRide · marketplace · **Pilot KPIs** `[+X%]` `[+Y pp]` `[-Z%]` |
| 3 | Visual Layout | 2×4 shipped grid · Muted roadmap strip · Spine: Urgency Scoring + Closed-Loop Referral |
| 4 | Diagram | Mermaid **mindmap** - VitaWeave → ASHA / Doctor / Patient / Supervisor features |

---

## Slide 6 - System Integration Architecture

| # | Component | Required contents |
|---|-----------|-------------------|
| 1 | Title & Objective | Title: *Architecture - Secure Path from Field to Government Systems* · Goal: trust for technical buyers |
| 2 | Core Copy | Clients · Gateway (Auth JWT + Edge Functions) · Postgres + RLS · Device field encryption · TLS · Edge secrets · Residency `ap-south-1` · ABDM / NHM adjacency · **Encryption callouts** (transit · device · secrets · RLS) |
| 3 | Visual Layout | Left→right pipeline · Lock badges on encryption edges · Gov systems dashed on right |
| 4 | Diagram | Mermaid **flowchart** - Citizen App → Secure API Gateway → Core DB → Government Legacy / ABDM / DHIS2 (roadmap) |

---

## Slide 7 - Regulatory, Security & Compliance

| # | Component | Required contents |
|---|-----------|-------------------|
| 1 | Title & Objective | Title: *Trust - Data Residency, Security & Compliance Map* · Goal: India-first + international pathways without fake badges |
| 2 | Core Copy | Matrix: **DPDP** · **ABDM/ABHA** · **Residency** · **Security controls** · **HIPAA** (foundation) · **SOC 2** (pathway) · **FedRAMP** (not claimed) · **GDPR** (portable) · Hard-truth line on certifications |
| 3 | Visual Layout | Compliance table primary · Green / amber / grey status colors · Counsel callout |
| 4 | Diagram | Mermaid **flowchart** - In Product Today → Certification Pathway |

---

## Slide 8 - Citizen & Government User Flow

| # | Component | Required contents |
|---|-----------|-------------------|
| 1 | Title & Objective | Title: *End-to-End Flow - Request → Process → Approve → Notify* · Goal: visceral closed loop |
| 2 | Core Copy | 6 steps: register → score → escalate → approve/complete → notify → close loop · Referral statuses · Appointment statuses |
| 3 | Visual Layout | Full-width sequence · Accent on Notify + Completed · Minimal side text |
| 4 | Diagram | Mermaid **sequenceDiagram** - Citizen → App → Urgency Engine → Doctor/PHC → District Supervisor |

---

## Slide 9 - Business & Revenue Model

| # | Component | Required contents |
|---|-----------|-------------------|
| 1 | Title & Objective | Title: *Who Pays - B2G / G2C / G2B Cash-Flow Ecosystem* · Goal: who pays vs who uses free |
| 2 | Core Copy | Streams table: B2G licensing · G2B/B2B hospitals · NGO packs · Future marketplace · Telemedicine/insurance share · Free at point of use · Cost-saving placeholders |
| 3 | Visual Layout | Cash-flow diagram center · Pricing table below · Max 3 primary “pays” arrows |
| 4 | Diagram | Mermaid **flowchart** - Payers → VitaWeave → Free users + Value returned to government |

---

## Slide 10 - Procurement & GTM Strategy

| # | Component | Required contents |
|---|-----------|-------------------|
| 1 | Title & Objective | Title: *Go-to-Market - Pilots First, Tenders Second* · Goal: bypass long sales cycles |
| 2 | Core Copy | Path: 90-day pilot → NGO/CSR bridge → GeM/tender → State framework → ABDM narrative · Land / Expand / Defend · Date placeholders |
| 3 | Visual Layout | Horizontal timeline · Single callout: sell outcomes then seats |
| 4 | Diagram | Mermaid **flowchart** - Pilot → Evidence → NGO bridge / Tender → Framework → Scale seats |

---

## Slide 11 - Competitive Landscape

| # | Component | Required contents |
|---|-----------|-------------------|
| 1 | Title & Objective | Title: *Competitive Landscape - Our Unfair Advantage* · Goal: claim high decision-support + offline quadrant |
| 2 | Core Copy | Comparison grid vs ANMOL/RCH · CommCare · eSanjeevani · Urban apps · Unfair advantage bullets (ASHA-first · scoring+audit · offline · telemedicine after triage) |
| 3 | Visual Layout | Grid on top · 2×2 quadrant below · Complementary framing (not anti-government) |
| 4 | Diagram | Mermaid **quadrantChart** - VitaWeave vs eSanjeevani / ANMOL / CommCare / Practo-class |

---

## Slide 12 - The Team & Governance

| # | Component | Required contents |
|---|-----------|-------------------|
| 1 | Title & Objective | Title: *Team & Governance - Built to Pilot with the Public System* · Goal: government trust |
| 2 | Core Copy | Operating roles (`[NAME]` placeholders) · Advisory (clinical · counsel · NHM liaison) · Cadence: weekly / monthly / quarterly |
| 3 | Visual Layout | Org chart center · Advisory vs Operating subgraphs · Clean slate |
| 4 | Diagram | Mermaid **flowchart** - Advisory → Operating Team → Pilot Governance (DHO · Nodal · M&E) |

---

## Slide 13 - Financial Projections & The Ask

| # | Component | Required contents |
|---|-----------|-------------------|
| 1 | Title & Objective | Title: *Traction Plan, Funding Ask & Use of Funds* · Goal: close with milestones + clear ask |
| 2 | Core Copy | Y1–Y3 table (`$[R1]`–`$[R3]` · seat counts) · Ask: pilot funding · clinical mentorship · regulatory · intros · Use of funds % · Closing line |
| 3 | Visual Layout | Left: milestone bars · Right: ask + allocation · Full-width closing quote |
| 4 | Diagram | Mermaid **pie** (use of funds) + Mermaid **flowchart** (Ask → Y1 → Y2 → Y3) |

---

## Diagram inventory (all slides)

| Slide | Mermaid type | Asset name |
|-------|--------------|------------|
| 1 | `flowchart` (cycle) | Value proposition loop |
| 2 | `flowchart` | Citizen + gov pain → gap |
| 3 | `flowchart` | Roles → shared intelligence |
| 4 | Nested `flowchart` | TAM / SAM / SOM |
| 5 | `mindmap` | Product capabilities |
| 6 | `flowchart` | App → Gateway → Core → Gov systems |
| 7 | `flowchart` | Product controls → certification pathway |
| 8 | `sequenceDiagram` | Request → Process → Approve → Notify |
| 9 | `flowchart` | Cash-flow ecosystem |
| 10 | `flowchart` | Pilot → Tender → Scale |
| 11 | `quadrantChart` | Competitive position |
| 12 | `flowchart` | Team & governance org |
| 13 | `pie` + `flowchart` | Use of funds · revenue path |

---

## Placeholder fill list (before live pitch)

- `[DATE]` · `[CITY / EVENT]`
- `[TAM_Bn]` · `[YEAR]` · `[SOM_Mn]` · `[N]` · `[W]`
- Delay / referral / doctor-gap cites: `[X]` · `[Y%]` · `[cite]`
- Pilot KPIs: `[+X%]` · `[+Y pp]` · `[-Z%]`
- Pricing: `$[PRICE]` · `$[TIER]` · cost `$[A] → $[B]`
- Revenue: `$[R1]` `$[R2]` `$[R3]` · seats `[N1]` `[N2]` `[N3]` · `[H]` · `[S]`
- Ask: `$[ASK_TOTAL]`
- Team / advisory: `[NAME]` · `[NAMES]` · `[FIRM]` · `[ORG]`
- SOC 2 target date: `[TARGET_DATE]`

---

## File map

| File | Purpose |
|------|---------|
| `contents.md` | This checklist - all necessary slide components |
| `government_app_pitch_deck.md` | Full 13-slide blueprint (title, copy, layout, diagrams) |
| `government_app_pitch_slides.md` | Slide-ready copy only |
| `project.md` | Narrative companion pitch |
| `docs/PITCH.md` | Older pitch notes (superseded for live decks) |
