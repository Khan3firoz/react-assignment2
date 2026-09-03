# SELF_REVIEW

Three realistic issues that could block acceptance, honestly assessed.

---

## 1. No automated test suite is committed

**What.** All verification during development was done with throwaway Node
scripts (bundled with esbuild): the mock-service fault matrix, the
16-case config-validation matrix, storage/revision/restore/conflict
semantics, and boot + per-widget render paths. Every one passed, but none of
it is in the repo, and `package.json` has no `test` script or test runner.

**Why it could block.** A reviewer cannot run `npm test` to confirm the
resilience and revision behaviour that the brief centres on. "Trust me, I ran
scripts" is not verifiable. For a take-home whose headline requirement is
*resilience*, the absence of regression tests is a legitimate red flag.

**Mitigation / fix.** Add Vitest + a jsdom environment and port the throwaway
scripts into `*.test.ts`:
`validateDashboardConfig` over `HOSTILE_CONFIGS`, `fetchDataSource` +
`validatePayload` across every fault toggle, `dashboardStorage` version and
restore invariants, and a React Testing Library test that renders a widget
through each of the four states. Roughly half a day.

---

## 2. The persisted format (v2) is richer than the UI actually uses

**What.** `dashboard/schema.ts` models `filters[]` with six operators and a
per-widget `layout { x, y, w, h }`, and both are strictly validated
(including the "negative layout" / "huge layout" hostile cases). But the
running app only ever produces `eq` filters for `region` / `status`, and
`DashboardGrid` ignores `layout` entirely — it uses a fixed responsive grid.
The `adapter.ts` round-trip **drops** any richer filter or custom layout that
a hand-written or migrated config contained.

**Why it could block.** A reviewer who loads a valid v2 config with, say, a
`contains` filter or a custom `layout` will see it validate, render, and then
get flattened on the next save. That looks like silent data loss, which sits
awkwardly next to the "never silently repair" principle the project
otherwise holds to.

**Mitigation / fix.** Either (a) narrow the schema to exactly what the UI
supports (`operator: z.literal("eq")`, drop `layout`) so the format can't
over-promise, or (b) preserve unknown filters/layout through the adapter
round-trip even though the UI can't edit them. (a) is ~1 hour and is the
honest choice for the current scope; (b) is the right call if layout/DnD is
coming next.

---

## 3. `Dialog` focus management is minimal and not fully trapped

**What.** The hand-rolled `Dialog` moves focus into the panel on open,
closes on Escape and on backdrop click, and locks body scroll. It does
**not** trap Tab focus inside the dialog, and it does not restore focus to
the trigger element on close. `role="dialog"` / `aria-modal` are set but
there is no `aria-labelledby` wiring to the title.

**Why it could block.** A keyboard or screen-reader user can Tab out of the
Widget Editor / Revisions / Share / Conflict dialogs into the page behind
them, and lands somewhere arbitrary after closing. For an assessment that
explicitly lists "accessibility issues" as a review target, an incomplete
modal is a plausible objection.

**Mitigation / fix.** Small, contained change in `components/ui/dialog.tsx`:
add a `keydown` handler that cycles Tab/Shift+Tab between the first and last
focusable elements, store `document.activeElement` on open and
`.focus()` it on unmount, and add `aria-labelledby` by giving `DialogTitle`
a generated id. ~1–2 hours, no API change for callers. (Swapping in Radix
`Dialog` would also solve it but adds a dependency.)
