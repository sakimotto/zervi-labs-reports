
# Reverse-Engineer the Yibao SBR 1215 Report

Goal: turn the supplier's PDF into a reusable, governed setup so any future neoprene/SBR batch produces an equivalent report automatically. I've already inspected the database — none of the 7 standards exist, no Yibao supplier, no rubber-specific methods (only 3 textile-style methods with wrong units). So this is a clean seed.

---

## What gets created

### 1. Standards (Standards Hub) — 7 new entries
ASTM D2240 (Hardness) · ASTM D412 (Tensile/Elongation) · ASTM D624 (Tear) · ASTM D1817 (Density) · ASTM D395 (Compression Set) · ISO 188 (Heat Aging) · ASTM D1149 (Ozone) — all marked **Active**, with title, organization, summary.

### 2. Test Methods (Library) — 10 new methods
Mapped exactly to the rows in your PDF, with the right units, directions and sample counts:

```text
Method                            Unit       Zones     Samples  Standard
────────────────────────────────────────────────────────────────────────
Hardness (Shore AC)               Shore AC   —          2       ASTM D2240
Tensile Strength (Rubber)         kg/cm²     Skin/Mid   2 each  ASTM D412
Elongation at Break (Rubber)      %          Skin/Mid   2 each  ASTM D412
Tear Strength (Rubber)            kg/cm      Skin/Mid   2 each  ASTM D624
Density (Specific Gravity)        g/cm³      Skin/Mid   2 each  ASTM D1817
Compression Set 30 min Recovery   %          —          2       ASTM D395
Compression Set 24 h Recovery     %          —          2       ASTM D395
Heat Shrinkage                    %          X / Y      2 each  ISO 188
Vulcanize Test                    %          X / Y      2 each  in-house
Ozone Aging                       pass/fail  —          1       ASTM D1149
```
Each method gets its `method_standards` row (the canonical link per your architecture rule).

### 3. Supplier
**Yibao (Fujian) Polymer Material Stock Co., Ltd** — Manufacturer, China, Approved.

### 4. Material
**SBR 1215 / N30** (code `SBR-1215-N30`) — SBR Foam, Closed-Cell Neoprene, Black, China. Linked to the program via `material_test_programs` (intake match score 100).

### 5. Test Program (Draft, will auto-code as TPG-2026-NNNN)
```text
Name:        Neoprene/SBR Foam — Standard QC
Category:    Rubber/Foam
Status:      Draft (you approve it from the UI to lock + snapshot v1)
Tags:        rubber, foam, neoprene, sbr, bilingual
Report title:        Test Report / 检测报告表
Header notes:        Bilingual EN/CN — Material, Color, Customer, Production Date, Test Date, Lab
Footer notes:        本报告中的测试结果只对来样负责… (bilingual disclaimer)
Signatures:          Tester + Reviewer
Methods linked:      all 10 above, in print order
Supplier link:       Yibao  (intake +50)
SKU patterns:        SBR-*, N30-*, N20-*, N40-* (intake +45)
Material-type tag:   SBR Foam (intake +30)
Material link:       SBR 1215 / N30 (intake +100)
```

After the seed, you open `/test-programs`, find it, hit **Approve** — the existing trigger locks it and snapshots `v1` into `program_versions`.

---

## Print template upgrade

`src/components/lms/PrintableReport.tsx` already renders method/value/judgment rows. Two small additions to mirror the supplier PDF:

1. **Bilingual headers** — when the program's `report_title` contains `/`, split on `/` and render the two halves stacked (EN over CN). Same for footer notes.
2. **Zone sub-rows** — when a method has direction values like `Skin/Middle` or `X/Y`, render one row per zone under the method name (already supported by the directional-result model — just needs the renderer to group `direction != null` results under the method header). No schema change.

A 6-column print layout matching the Yibao format:
```text
| Test Item | Reference Std | Test Condition | Result 1 | Result 2 | Average |
```
This becomes the default when the program's `category = Rubber/Foam`. Existing textile reports keep their current layout.

---

## After approval

1. You go to `/test-programs/<new>` → click **Approve** → v1 snapshot created.
2. You go to `/samples` → **New Sample** → pick material `SBR 1215 / N30` → program auto-attaches → test grid shows exactly the 10 methods with the right zones.
3. Enter the values from the PDF, hit **Print Report** → output mirrors the Yibao layout in EN/CN.

---

## Files / DB changes

- **DB inserts** (no schema change): `standards`, `test_items`, `method_standards`, `suppliers`, `materials`, `test_programs`, `test_program_items`, `material_test_programs`, `program_supplier_links`, `program_sku_patterns`, `program_material_type_tags`.
- **Code edit**: `src/components/lms/PrintableReport.tsx` — add bilingual title/footer split + zone sub-row grouping + 6-column rubber layout variant.

---

Approve and I'll execute it end-to-end. Once you confirm v1 in the UI, I can also import the actual numbers from your PDF as a sample so you can compare side-by-side with the original.
