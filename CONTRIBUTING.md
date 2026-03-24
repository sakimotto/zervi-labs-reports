# Contributing to Zervi Asia LMS

Thank you for contributing to the Zervi Asia Laboratory Management System.

## Development Setup

```bash
npm install
npm run dev
```

## Code Conventions

### TypeScript
- Strict mode enabled
- Use `type` imports for type-only imports
- Prefer interfaces for object shapes, types for unions/intersections

### Components
- Functional components only (no class components)
- Use `shadcn/ui` primitives — do not build custom low-level UI
- Use semantic Tailwind tokens from `index.css` — never hardcode colors

### Hooks
- All data fetching via TanStack React Query hooks in `src/hooks/`
- Mutations must invalidate related queries on success
- Use the auto-generated Supabase types from `src/integrations/supabase/types.ts`

### Database Changes
- All schema changes via migration files in `supabase/migrations/`
- Never modify `src/integrations/supabase/client.ts` or `types.ts` (auto-generated)
- Never modify the `.env` file (auto-managed)

### Naming
| Item | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `SampleDetail.tsx` |
| Hooks | camelCase with `use` prefix | `useSamples.ts` |
| Pages | PascalCase with `Page` suffix | `DashboardPage.tsx` |
| DB columns | snake_case | `test_item_id` |
| TS types | PascalCase | `DbSample` |

### File Organization
- **Pages**: Route-level components in `src/pages/`
- **Components**: Reusable UI in `src/components/lms/` (domain) or `src/components/ui/` (primitives)
- **Hooks**: Data access in `src/hooks/`
- **Types**: Shared types in `src/types/`

## Git Workflow

1. Create a feature branch from `main`
2. Make focused, atomic commits
3. Open a Pull Request with a clear description
4. Ensure the build passes (`npm run build`)

## Testing

```bash
npm run test        # Unit tests (Vitest)
npm run test:e2e    # E2E tests (Playwright)
```

## Architecture Decisions

- **No backend code in the repo** — all server-side logic lives in Lovable Cloud (Edge Functions)
- **RLS policies** are public for now; authentication will be added later
- **Database triggers** handle judgment recalculation — do not duplicate this logic client-side
- **Test IDs** use format `ZV-TR-{YEAR}-{NNNN}` — never modify the ID generation logic without updating both client and database
