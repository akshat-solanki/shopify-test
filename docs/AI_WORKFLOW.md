# AI Workflow

## Default Workflow

When continuing work on this project, follow this order:

1. Read the current UI and card behavior before changing direction.
2. Check whether the request affects:
   - storefront rendering
   - settings UX
   - responsive behavior
   - content states
3. Make the smallest coherent change that solves the request end to end.
4. Run `npm run build` after every meaningful edit.
5. Keep visible UI copy customer-facing.
6. Move implementation notes, rationale, and internal process details into docs.

## UI Copy Rules

- Do not expose internal wording such as lab, sandbox, QA, stress test, shipping scope, engineering checklist, or similar development language in the visible UI.
- Use short, merchant-friendly labels.
- Keep helper text focused on outcomes, not implementation detail.

## Editing Rules

- Preserve the existing visual direction unless a redesign is requested.
- Prefer improving current structures over creating parallel systems.
- Keep responsive fixes tied to actual layout behavior, not cosmetic guesswork.
- Avoid introducing new controls unless they clearly support the product direction.

## Validation Routine

After edits:

1. Build the app.
2. Review grid, carousel, spotlight, and compare surfaces.
3. Check desktop, tablet, and mobile.
4. Pay special attention to:
   - media fit
   - CTA visibility
   - text clamping
   - badge collisions
   - icon positioning

## When Adding Features

Any new addition should answer:

- Is it merchant-facing or internal-only?
- Does it improve the storefront card itself?
- Can it survive narrow containers?
- Does it need a fallback on touch devices?
- Does it belong in UI, docs, or both?
