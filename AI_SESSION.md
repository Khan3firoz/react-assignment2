# AI_SESSION

## Disclosure

This project was built with AI assistance (Claude, via an agentic coding
tool). The AI wrote the large majority of the source under human direction:
requirements were given in stages, the AI implemented each stage, and the
human reviewed, corrected course, and set priorities. This document
summarises that assistance honestly.

## How the work was structured

The build happened in five prompted stages, each reviewed before moving on:

1. **Scaffold + first working version.** Vite + React + TS + Tailwind +
   shadcn-style primitives, the dashboard layout, the four widgets, the
   widget registry, add/edit/delete, region/status filters, a Save button.
   Hardcoded mock JSON.

2. **Resilience layer.** The async mock data service (delay, random failure,
   timeout, missing field, wrong type, empty), strict per-source Zod
   payload schemas, the `validatePayload` classifier, `useWidgetData` state
   machine (loading / success / error / empty), the exact per-failure error
   copy, the Failure Simulator panel, and a per-widget React error boundary.
   The core invariant — *validated data or a visible reason, never a silent
   fallback* — was set here.

3. **Config validation + hostile configs.** The versioned v2 dashboard
   schema, `validateDashboardConfig` (probe → migrate → validate, never
   repair), the v1 → v2 migration chain, 16 hostile config fixtures, the
   Hostile Configurations panel, and the `InvalidConfigNotice` surface.

4. **Persistence, revisions, concurrency, sharing.** `dashboardStorage.ts`
   (`saveDashboard` / `loadDashboard` / `getRevisions` / `restoreRevision`
   with monotonic versions and non-destructive restore), the centralized
   `filterEngine`, concurrent-edit detection + `ConflictDialog`, and the
   frontend-only `ShareDialog`.

5. **Final review pass (this one).** TypeScript errors, React warnings,
   missing keys, accessibility (dialog roles/focus, slider labels, hover-only
   controls now also focus-visible, `role="alert"` / `role="status"` on
   widget states, `type="button"` default on the Button primitive), an
   app-level error boundary, hardening the boot path, plus these four
   documents.

## What the AI did

- Wrote essentially all component, hook, service, schema, and mock code.
- Designed the two-layer validation split (config vs. payload), the
  discriminated-union state machine, the adapter between the v2 config and
  the runtime shape, and the storage/revision model.
- Verified behaviour at each stage with throwaway Node scripts (bundled with
  esbuild) covering the fault matrix, the 16-case config matrix, the
  storage/restore/conflict invariants, and boot + widget-render paths. These
  scripts were run and passed, then deleted — they are not committed. See
  `SELF_REVIEW.md` item 1.
- Ran `tsc -b` and `vite build` after every stage; both are clean.

## What the human did

- Provided the staged requirements and the priority calls (e.g. "stop adding
  features, get a working demo", "centralize filter logic", "restore must
  create a new revision").
- Reviewed each stage's output and the final result.

## Honest caveats

- The verification scripts are not in the repo, so the test evidence is not
  independently reproducible right now. A committed Vitest suite is the
  planned fix.
- `SELF_REVIEW.md` lists three issues the AI and human agree could block
  acceptance (no committed tests; the v2 schema over-promises vs. the UI;
  minimal dialog focus trapping).
- Knowledge cutoff / library versions: dependency versions were chosen by the
  AI and pinned in `package.json`; `npm install` resolved them successfully
  at build time.
