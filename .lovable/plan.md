# NPI Workflow Module — Plan

Add a new **Projects + Workflow** capability where users create a project (3-question wizard), and the AI generates a fully tailored 8-phase NPI workflow that drives the rest of the app.

## 1. Database (new tables)

- **`projects`** — `id, user_id, name, product_description, industry, gate_standard, status, created_at, updated_at`
- **`project_phases`** — `id, project_id, user_id, phase_index, title, subtitle, badge_color, tasks (jsonb[]), outputs (jsonb[]), gate_criteria (jsonb[]), status (not_started|active|complete|archived), locked, custom, created_at, updated_at`
- **`project_phase_documents`** — links a phase output to a generated artifact/document (`phase_id, output_key, artifact_id|document_id`)

All RLS = `auth.uid() = user_id`.

## 2. Edge function: `generate-workflow`

Input: `{ projectId }`. Reads project row, calls Lovable AI (`google/gemini-3-flash-preview`) with a structured tool-call schema returning the 8 tailored phases (title, subtitle, 4–6 tasks, output deliverables, gate criteria adapted to the gate standard). Inserts the resulting phases into `project_phases`. Idempotent (replaces phases if regenerate=true).

A second function `generate-phase-output` will produce a document for a given phase output pill (reuses existing `generate-artifact` pattern, but writes into `documents` so it shows in the Documents module).

## 3. New pages / components

- **`/projects`** — list of user projects + “New Project” button.
- **New Project Wizard** (modal):
  1. What are you building? (textarea)
  2. Industry (Select — preset list)
  3. Gate standard (Select)
  Submit → insert project → call `generate-workflow` → navigate to `/workflow/:projectId`.
- **`/workflow/:projectId`** — full workflow UI:
  - **Stepper** (`PhaseStepper.tsx`) — numbered dots, color states (grey/teal/green), click to jump, 2-line label.
  - **PhaseCard** — badge, title, subtitle, tasks grid (2–3 cols, light cards), output pills (clickable → opens/generates doc), expandable gate checklist with red flags for incomplete items, "Ask AI about this phase ↗" button (navigates to `/research?prompt=...`).
  - **Bottom nav** — Previous / Next / "Mark Phase Complete ✓" (enabled only when all gate criteria checked). Locks completed phases with an Unlock action.
  - **Customization menu** — rename phase, add custom phase, split phase, archive phase. Persists to `project_phases`.
- **Sidebar** — add **Projects** entry (replaces or sits alongside Dashboard depending on context); active project shown.

## 4. Cross-module integration

- **Documents** — phase output pills create rows in `documents` (category = phase title, source = project).
- **Traceability** — Phase 1 outputs seed `requirements` rows tagged to project.
- **Knowledge Base** — “Ask AI about this phase” pre-fills Research chat with phase + product context.
- **Changes** — change log entries can be tagged with `phase_id`.
- **Dashboard** — surfaces active project, current phase, gate items remaining.

## 5. Design tokens

Add semantic tokens to `index.css`:
- `--phase-pending` (grey 215 20% 75%)
- `--phase-active` (teal — already exists as `--primary`)
- `--phase-complete` (green 142 71% 45%)
- `--gate-warning-bg` (amber 45 100% 96%) / `--gate-warning-fg`
- `--task-card-bg` (slate-50 210 40% 98%)

All colors HSL, used via Tailwind classes — no hex in components.

## 6. Scope of this iteration

Ship in one pass:
1. Migration (tables + RLS).
2. `generate-workflow` edge function.
3. Project list + wizard + workflow page with stepper, phase card, gate checklist, output pills (creating placeholder documents on click), navigation, completion lock.
4. Sidebar entry, route wiring, design tokens.

**Deferred to follow-ups** (mentioned but not built now to keep this shippable): split phase into sub-phases, fork workflow, export as template, automatic traceability seeding, change-log phase tagging. The data model already supports them.

---

Approve to proceed and I’ll run the migration first, then build the UI + edge function in one go.
