
# AI-Assisted Test Program Builder

Yes — this is exactly the right thing to automate. Designing a Test Program is the highest-leverage, most error-prone step in your workflow: every future sample matched to that program is judged against the thresholds and standards you set. Getting it wrong silently corrupts months of test data.

You already have most of the building blocks. What's missing is a **focused "Program Builder" agent mode** plus a **draft-and-review UI** so the AI does the typing and you stay the approver.

## How it will work (user-facing flow)

```text
1. You: "Build me a program for Toyota seat fabric, 2026 MY"
        │
        ▼
2. Copilot interviews you (2-4 questions, all optional):
   - Material type? (woven/knit/non-woven/leather/foam)
   - OEM / customer? (Toyota / VW / generic)
   - Use case? (seat surface / headliner / floor / trim)
   - SKU patterns to auto-match? (e.g. TOY-ST-*)
        │
        ▼
3. Copilot searches your library:
   - Standards Hub (Toyota TSL, JIS L 1096, ISO 105, VDA 230...)
   - Test Methods Library (matching tensile, abrasion, lightfastness…)
   - Existing programs for similar OEMs (template harvesting)
        │
        ▼
4. Copilot returns a DRAFT PROGRAM (not yet saved):
   - Suggested name + program code preview
   - 18-25 test items pre-selected with directions
   - Acceptance thresholds per item (with source citation)
   - Each item linked to its primary standard
   - SKU patterns + supplier/material tags for auto-matching
        │
        ▼
5. You see a Review Modal:
   - Every field editable
   - Side-by-side: AI draft │ rationale │ source standard
   - Inline accept/edit/remove per row
   - "Why this threshold?" hover shows the AI's citation
        │
        ▼
6. You click "Create Program" → atomic insert into all tables
   → opens TestProgramDetailPage in Draft state
   → you review once more, then Approve & Lock
```

The AI never writes directly. You always see the full draft before anything hits the database.

## What to build

### 1. New copilot skill mode: `program_builder`
A dedicated mode in `SkillModeChips` that primes the model to:
- Ask short clarifying questions (max 4) before drafting
- Always cite source standard for every threshold it proposes
- Output its final draft as a structured tool call (not free text)

### 2. New copilot tools (in `lab-copilot/index.ts`)
- `search_standards_for_material` — finds applicable standards by material type / OEM / use case
- `search_methods_by_standard` — pulls test methods linked to a list of standards
- `get_similar_programs` — finds existing approved programs for the same OEM/material to use as templates
- `draft_test_program` — the structured-output tool. Takes the AI's full proposal (name, items, thresholds, SKU patterns, supplier links) and returns a `draft_id` stored in a new `program_drafts` table. Does NOT touch `test_programs`.

### 3. New table: `program_drafts`
```text
id, created_by, created_at, status (draft/applied/discarded),
draft_payload jsonb,   -- full proposal: program + items + thresholds + patterns
ai_rationale jsonb,    -- per-item: why chosen, source standard, confidence
conversation_id        -- back-link to the chat that produced it
```

### 4. New UI: `ProgramDraftReviewModal`
Triggered automatically when the copilot emits a `draft_test_program` tool call. Shows:
- **Header**: proposed name, code preview, material type, OEM
- **Items table**: each row = test method + direction + threshold + standard link + AI rationale + edit/remove buttons
- **Auto-match section**: SKU patterns, supplier links, material tags (all editable)
- **Footer actions**: Discard │ Save as Draft │ Create & Open Program

On "Create & Open Program" → calls a single Postgres function `apply_program_draft(draft_id)` that inserts into `test_programs`, `test_program_items`, `test_requirements`, `method_standards`, `program_sku_patterns`, `program_supplier_links`, `program_material_type_tags` in one transaction, marks the draft as `applied`, and returns the new program ID.

### 5. Entry points
- "Build with AI" button on `/test-programs` page (top-right, next to "New Program")
- New copilot starter card: "Design a test program for…"
- Deep-link from a Customer detail page: "Build a program for this customer"

## Technical notes (for the implementation pass)

- Uses existing Lovable AI Gateway (`google/gemini-2.5-pro` for reasoning quality on this task)
- Structured output via tool-calling — no JSON-from-text parsing
- Drafts persist so you can leave and return; nothing is lost mid-session
- `apply_program_draft` runs as `SECURITY DEFINER` to keep all inserts atomic
- All existing audit triggers fire normally on `test_programs` insert → full traceability
- Threshold confidence: AI marks each threshold as `from_standard` (cited), `from_similar_program` (template), or `inferred` (needs human check) — the review UI badges these so you know what to scrutinise

## What I'm explicitly NOT doing

- Auto-approving programs (you stay the approver — required for ISO 17025 traceability)
- Editing existing approved programs (would break version-lock; instead the AI drafts a new version)
- Inventing thresholds with no source — if the AI can't cite a standard or a similar program, it leaves the threshold blank and flags it

## Effort

~1 implementation pass: 1 migration (drafts table + apply RPC), 4 new copilot tools + skill mode addendum, 1 review modal, 2 entry-point buttons. Roughly the same scope as when we built the Lab Copilot itself.

---

Want me to proceed with this exact plan, or would you like to tweak anything — e.g. start with a narrower MVP (just suggest items, no auto-thresholds), or add a specific OEM playbook (Toyota / VW / Honda) as the first templates?
