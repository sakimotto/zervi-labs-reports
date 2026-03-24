# Changelog

All notable changes to the Zervi Asia LMS are documented here.

## [Unreleased]

### Added
- **Equipment Registry** — Full CRUD for lab equipment with calibration certificates and maintenance logs
- **Materials Database** — Material specifications with supplier linking and default test program assignment
- **Conditioning Profiles** — Pre-configured environmental conditioning parameters
- **OEM Specifications** — Versioned OEM spec management (Nissan NES, Mitsubishi ES)
- **Standards Library** — ISO/JIS/ASTM standard tracking with versions
- **Auto-Judgment Trigger** — Database trigger recalculates `overall_judgment` on test result changes
- **Updated Timestamps** — `updated_at` triggers on all core tables
- **Test ID Format** — `ZV-TR-{YEAR}-{NNNN}` sequential ID generation
- **Sample Data** — Populated suppliers, customers, equipment, materials, standards, OEM specs, conditioning profiles, and test jobs

### Changed
- **Terminology** — Renamed "Samples" to "Tests" across all UI (sidebar, dashboard, forms, detail views)
- **Navigation** — Reorganized sidebar into Test Management, Lab Resources, and Reference Data groups
- **Dashboard** — Updated stat cards and recent items to use "Tests" terminology and link to `/tests`

### Fixed
- **Date Handling** — Empty date fields no longer cause PostgreSQL errors (now sends `null` instead of `""`)
- **Routing** — All internal links use `/tests` instead of `/samples`

## [0.1.0] — 2026-03-18

### Added
- Initial LMS scaffold with sample management
- Test item catalog and requirement definitions
- Test program builder with item grouping
- Supplier and customer CRUD
- SOP management with version control
- Dashboard with stats, alerts, and recent items
- Printable report view
