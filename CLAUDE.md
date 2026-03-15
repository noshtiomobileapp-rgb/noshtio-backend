# NOSHTIO — Claude Project Brief
> *Fair Food. Fair Pay. Fair Platform.*
> Single source of truth for Claude sessions in VS Code.

---

## 1. Platform Summary

Noshtio is a **subscription-based SaaS for the food industry** (India-first).
- **Revenue model**: Vendor subscriptions ONLY — zero commission per order
- **Stakeholders**: Vendors | Customers | Delivery Partners
- **Target market**: Street food stalls → Enterprise chains (India)
- **Legal position**: Technology Service Provider — NOT a food business or marketplace

---

## 2. Tech Stack

### Frontend
- `React` — Vendor web panel + Admin dashboard
- `React Native` — Customer mobile app + Delivery partner app
- `PWA` — Customer ordering interface (Phase 1)

### Backend
- `Node.js` — Microservices architecture
- Services: `orders` | `payments` | `subscriptions` | `analytics` | `notifications` | `kyc` | `delivery`
- `API Gateway` — routing, rate limiting, authentication
- `Kafka` or `RabbitMQ` — order processing & notification queues
- Background workers for async jobs

### Database & Storage
- `PostgreSQL` — transactional data, schema-per-tenant multi-tenancy
- `Redis` — real-time order state & session management
- `S3-compatible` — menu images, documents, generated reports

### Infrastructure
- Hosting: `AWS` or `GCP` — Mumbai region (DPDP Act 2023 compliance)
- CDN for media assets
- Auto-scaling, load balancer, WAF, encryption at rest & in transit
- JWT with refresh token rotation, RBAC

---

## 3. Project Directory Structure

```
/noshtio
├── /frontend              → React vendor panel + admin dashboard
│   └── /src
│       ├── /pages
│       ├── /components
│       └── /hooks
├── /mobile                → React Native customer + delivery app
├── /services
│   ├── /orders            → Node.js order microservice
│   ├── /payments          → Node.js payments microservice
│   ├── /subscriptions     → Node.js subscription & billing
│   ├── /analytics         → Node.js analytics service
│   ├── /notifications     → Node.js notification engine
│   ├── /kyc               → Node.js KYC & partner verification
│   └── /delivery          → Node.js delivery tracking service
├── /gateway               → API Gateway (rate limiting, auth routing)
├── /workers               → Background job workers
├── /db
│   ├── /migrations        → PostgreSQL migrations
│   └── /seeds
├── /infra                 → Docker, K8s, CI/CD configs
└── CLAUDE.md              ← YOU ARE HERE
```

---

## 4. Third-Party Integrations

| Integration | Purpose | Phase |
|---|---|---|
| Google Vision API | Menu image OCR | Phase 1 |
| Razorpay / Cashfree | Subscription billing + vendor settlement | Phase 1 |
| Firebase Cloud Messaging | Push notifications | Phase 1 |
| OpenTelemetry | Distributed tracing | Phase 1 |
| UIDAI Aadhaar API | Delivery partner KYC | Phase 2 |
| Dunzo / Porter / Shiprocket | Live GPS delivery tracking | Phase 2 |
| ESC/POS thermal protocol | KOT printing (Tier 3+) | Phase 2 |
| WhatsApp Business API | Order notifications | Phase 2 |

---

## 5. Subscription Tiers (Feature Scope Reference)

| Tier | Target | Key Additions |
|---|---|---|
| **Tier 1 — Starter** | Solo stalls, kiosks, tiffin centres | Image OCR menu, 1 QR, basic ordering, direct settlement |
| **Tier 2 — Growth** | Single-outlet restaurants, cloud kitchens | Delivery module, GPS tracking, Store Incharge role, basic analytics |
| **Tier 3 — Pro** | Chains, multi-branch, high-volume | KOT terminal (screen + thermal), Manager role, intermediate analytics, multi-menu |
| **Tier 4 — Enterprise** | Large chains, QSR, hotel F&B | Multiple managers, full analytics suite, GSTR-1 reports, dedicated account manager |

> **Rule**: Each tier includes ALL features from tiers below it.

---

## 6. Roles & Access (RBAC)

```
Tier 1:  Vendor/Owner
Tier 2:  Vendor/Owner → Store Incharge → Delivery Tracker
Tier 3:  Vendor/Owner → Manager → Store Incharge → KOT → Delivery Tracker
Tier 4:  Vendor/Owner → Manager(s) → Store Incharge(s) → KOT → Delivery Tracker
         + Platform Admin (Noshtio internal)
```

---

## 7. Core Modules (Phase 1 MVP)

Build in this order — this is the first complete loop:
**Vendor → Menu Setup → QR → Customer Orders → KOT → Serve**

1. **Multi-Tenant Vendor Onboarding** — signup, profile, GST/FSSAI upload, bank/UPI
2. **Menu Engine** — manual builder + Google Vision OCR, dietary tags
3. **QR Code System** — table / takeaway / delivery QR generation
4. **Customer Digital Menu** — PWA, visual menu, cart, variants, notes
5. **Ordering System** — full order flow, status lifecycle, price validation
6. **KOT Engine (MVP)** — web-based kitchen display, In Progress → Ready
7. **Vendor Dashboard** — order management, menu management, daily summary
8. **Auth & Infrastructure** — JWT, multi-tenant DB, API gateway, logging

---

## 8. Key Business Rules (NEVER violate these in code)

- ✅ Vendor receives 100% of food order value — platform deducts ZERO commission
- ✅ Menu price shown to customer = vendor's real menu price — no inflation
- ✅ Delivery cost is a separate transparent line item (per-km rate)
- ✅ Reviews are post-purchase only — no anonymous ratings
- ✅ Vendor data belongs to the vendor
- ✅ Order revenue and subscription fees are always decoupled
- ✅ Settlement is direct to vendor bank (T+0 or instant)
- ✅ All user data stored on India-region servers (DPDP Act 2023)
- ✅ GST on food = vendor's liability | GST on delivery = partner's liability | GST on subscription = Noshtio's only

---

## 9. Naming & API Conventions

- All APIs follow `/api/v1/*` pattern
- Use TypeScript for all frontend and Node.js backend code
- Database: PostgreSQL with `schema-per-tenant` (tenant = vendor account)
- Microservices communicate via message queue (Kafka/RabbitMQ), not direct HTTP calls
- Auth: JWT access token (15min) + refresh token (7d) with rotation
- All monetary values stored in **paise (integer)**, not rupees (float)
- Order status enum: `PENDING → ACCEPTED → IN_KITCHEN → PREPARING → READY → SERVED → DELIVERED`

---

## 10. Current Build Phase

**PHASE**: [ UPDATE THIS AS YOU WORK ]
**Active Module**: [ e.g., "Vendor Onboarding — signup flow" ]
**Last Completed**: [ e.g., "PostgreSQL schema for tenants and vendors" ]
**Blocked On**: [ e.g., "Razorpay sandbox credentials" ]

---

## 11. How to Use This File with Claude in VS Code

- Start every session with: *"Read CLAUDE.md — we're building Noshtio. Today's task: [describe task]"*
- @-mention specific files when asking for edits: `@services/orders/index.ts — add order cancellation logic`
- Use **Plan Mode** before touching multi-file changes (e.g., new subscription tier logic)
- Use **Auto-accept** only for boilerplate scaffolding (new route files, migrations, etc.)
- Update Section 10 above at the end of each session

---

## 12. Claude Session Rules (MANDATORY — READ BEFORE EVERY TASK)

- NEVER run npm, npx, tsc, node, or ANY terminal commands
- NEVER run git commands
- NEVER run build, compile, or verify commands
- NEVER use the terminal AT ALL — not even to check files
- Edit and create files ONLY using the file editor
- Fix ONE file per message, then STOP and wait for instruction
- After editing, just show me the changed lines — do not verify
- If you feel the urge to run a command — DON'T. Just edit the file.

---

*Version 2.0 | Confidential | Noshtio Platform*
