# Zervi Asia — Laboratory Management System (LMS)

A comprehensive Laboratory Management System built for **Zervi Asia**, specializing in automotive textile and material testing. The system manages the full test lifecycle — from sample intake through result entry, judgment automation, and report generation — aligned with ISO 17025 practices and OEM specification compliance (Nissan, Mitsubishi, ARB).

![React](https://img.shields.io/badge/React-18-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-8-purple?logo=vite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-blue?logo=tailwindcss)
![Lovable Cloud](https://img.shields.io/badge/Backend-Lovable_Cloud-orange)

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Business Logic](#business-logic)
- [Tech Stack](#tech-stack)
- [Contributing](#contributing)
- [License](#license)

---

## Features

### Core Workflow
- **Test Job Management** — Create, track, and complete test jobs with unique IDs (`ZV-TR-2026-0001`)
- **Result Entry** — Enter specimen values (X1–X6) per test item with directional support (MD/CD)
- **Auto-Judgment** — Database trigger automatically calculates OK/NG/Pending based on OEM requirements
- **Status Workflow** — Pending → In Progress → Completed → Approved with validation gates

### Reference Data
- **Test Methods** — Catalog of test items with standards, units, equipment, and sample counts
- **Test Programs** — Reusable bundles of test items linked to OEM specifications
- **OEM Specifications** — Versioned specs (e.g., Nissan NES M0154, Mitsubishi ES-X83220)
- **Standards Library** — ISO, JIS, ASTM standards with version tracking

### Lab Resources
- **Equipment Registry** — Lab machines with status, calibration certificates, and maintenance logs
- **Materials Database** — Fabric/material specifications with supplier links and default test programs
- **Conditioning Profiles** — Pre-configured environmental conditions (temperature, humidity, duration)

### Entity Management
- **Suppliers** — Material suppliers with contact information
- **Customers** — OEMs and clients with type classification
- **SOPs** — Standard Operating Procedures with version control

### Traceability
- **Calibration Traceability** — Link test results to specific calibration records
- **SOP Version Linking** — Results reference the exact SOP version used during testing
- **Equipment Tracking** — Record which equipment performed each test
- **Failure Mode Capture** — Document failure types (cohesive, adhesive, substrate) for adhesion tests

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  Frontend (SPA)                  │
│  React 18 + TypeScript + Vite + Tailwind CSS    │
│  shadcn/ui components + TanStack React Query    │
├─────────────────────────────────────────────────┤
│               Lovable Cloud Backend              │
│  PostgreSQL + Row-Level Security + Edge Functions│
│  Auth + Storage + Realtime                       │
└─────────────────────────────────────────────────┘
```

---

## Database Schema

### Core Tables

| Table | Purpose |
|-------|---------|
| `samples` | Test jobs (the primary work unit) |
| `test_items` | Catalog of test methods |
| `test_requirements` | OEM-specific pass/fail criteria per test item |
| `test_results` | Actual measured values (X1–X6, average, judgment) |
| `sample_test_items` | Which test items are assigned to a test job |

### Reference Tables

| Table | Purpose |
|-------|---------|
| `test_programs` | Reusable bundles of test items |
| `test_program_items` | Items within a program (with conditioning profiles) |
| `oem_specifications` | Versioned OEM specs (Nissan NES, Mitsubishi ES) |
| `standards` | ISO/JIS/ASTM standards with versions |
| `conditioning_profiles` | Environmental conditioning parameters |

### Lab Resources

| Table | Purpose |
|-------|---------|
| `equipment` | Lab machines and instruments |
| `calibration_records` | Calibration certificates per equipment |
| `maintenance_logs` | Equipment maintenance history |
| `materials` | Material/fabric specifications |
| `material_suppliers` | Supplier-material relationships |
| `equipment_test_items` | Equipment-to-test-method capabilities |

### Entity Tables

| Table | Purpose |
|-------|---------|
| `suppliers` | Material suppliers |
| `customers` | OEMs and client companies |
| `sops` | Standard Operating Procedures |
| `sop_versions` | Versioned SOP content |

### Key Enums

| Enum | Values |
|------|--------|
| `sample_status` | Pending, In Progress, Completed, Approved |
| `judgment` | OK, NG, Pending |
| `priority_level` | Normal, Urgent, Critical |
| `base_type` | Solvent, Water-Based |

### Database Triggers

- **`recalculate_sample_judgment`** — Fires on `test_results` INSERT/UPDATE/DELETE; auto-sets `samples.overall_judgment` based on all linked results
- **`update_updated_at_column`** — Maintains `updated_at` timestamps on core tables

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or bun

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd zervi-lms

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`.

### Environment Variables

The following environment variables are automatically configured:

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Backend API URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Public API key |
| `VITE_SUPABASE_PROJECT_ID` | Project identifier |

---

## Project Structure

```
src/
├── components/
│   ├── lms/                    # LMS-specific components
│   │   ├── Dashboard.tsx       # Test overview dashboard
│   │   ├── SampleDetail.tsx    # Test job detail & result entry
│   │   ├── SampleIntakeForm.tsx# New test job creation
│   │   ├── SampleRow.tsx       # Test list row component
│   │   ├── PrintableReport.tsx # Print-optimized report view
│   │   ├── SpecBar.tsx         # Visual min/max/value bar
│   │   ├── StatusBadge.tsx     # Status/priority badges
│   │   ├── JudgmentDot.tsx     # OK/NG/Pending indicator
│   │   └── DeleteSampleDialog.tsx
│   ├── ui/                     # shadcn/ui primitives
│   ├── AppSidebar.tsx          # Navigation sidebar
│   ├── Layout.tsx              # App shell
│   └── NavLink.tsx             # Active-aware nav link
├── hooks/
│   ├── useSamples.ts           # Test job CRUD + ID generation
│   ├── useTestData.ts          # Test items, requirements, results
│   ├── useTestPrograms.ts      # Test program management
│   ├── useEquipment.ts         # Equipment + calibration + maintenance
│   ├── useMaterials.ts         # Materials + supplier links
│   ├── useReferenceData.ts     # Standards, OEM specs, conditioning
│   ├── useSuppliers.ts         # Supplier CRUD
│   ├── useCustomers.ts         # Customer CRUD
│   └── useSOPs.ts              # SOP + version management
├── pages/
│   ├── DashboardPage.tsx       # Main dashboard
│   ├── SamplesPage.tsx         # Test list + detail routing
│   ├── TestMethodsPage.tsx     # Test item catalog
│   ├── TestProgramsPage.tsx    # Test program management
│   ├── EquipmentPage.tsx       # Equipment registry
│   ├── MaterialsPage.tsx       # Materials database
│   ├── StandardsPage.tsx       # Standards + OEM specs
│   ├── SuppliersPage.tsx       # Supplier management
│   ├── CustomersPage.tsx       # Customer management
│   └── SOPsPage.tsx            # SOP management
├── types/
│   └── lms.ts                  # TypeScript type definitions
├── integrations/
│   └── supabase/
│       ├── client.ts           # Auto-generated client
│       └── types.ts            # Auto-generated DB types
└── data/
    └── mockData.ts             # Legacy mock data (deprecated)
```

---

## Business Logic

### Test ID Generation
- Format: `ZV-TR-{YEAR}-{SEQUENTIAL_4_DIGIT}` (e.g., `ZV-TR-2026-0001`)
- Queries the latest ID for the current year and increments

### Judgment Auto-Calculation
- **NG**: Any test result has judgment = NG
- **OK**: All results are OK AND count matches assigned test items
- **Pending**: Default / incomplete results

### Status Transitions
1. **Pending** — Test created, no results entered
2. **In Progress** — First result saved (auto-advanced)
3. **Completed** — All results entered (manual or future auto)
4. **Approved** — Final sign-off

### Result Entry
- Supports up to 6 specimens per test item (X1–X6)
- Average auto-calculated from non-null values
- Judgment auto-determined by comparing average against `test_requirements` min/max
- Directional results (MD/CD) stored as separate rows

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| Build | Vite 8 |
| Styling | Tailwind CSS 3 + shadcn/ui |
| State | TanStack React Query v5 |
| Routing | React Router v6 |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Backend | Lovable Cloud (PostgreSQL + Edge Functions) |
| Auth | Lovable Cloud Auth (planned) |

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines.

---

## License

Proprietary — Zervi Asia. All rights reserved.
