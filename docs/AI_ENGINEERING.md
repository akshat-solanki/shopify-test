# AI Engineering

## Architecture Notes

The project currently lives in a single-page React/Vite prototype, with the main logic in `src/app/App.tsx`.

That file currently contains:

- product data
- settings state
- card rendering logic
- preview surfaces
- responsive width-bucket behavior
- compare-mode rendering

## Recommended Refactor Path

As the project grows, split `App.tsx` into:

- `ProductCard`
- `ProductCardMedia`
- `ProductCardMeta`
- `SettingsPanel`
- `SurfacePreview`
- `ComparePreview`
- shared config and mock data modules

## Responsive Strategy

The card should continue to make decisions from actual card width, not only viewport size.

Important behaviors:

- width buckets drive content reduction
- tight cards remove optional detail first
- image fit can switch between `cover` and `contain`
- motion should soften in smaller layouts

## Engineering Priorities

1. Keep layout stable before adding new features.
2. Prefer deterministic display rules over free-form combinations.
3. Maintain graceful fallbacks for small widths.
4. Keep touch and hover behavior separate where needed.

## Edge States To Cover

- sold out
- unavailable variants
- no rating
- no compare-at price
- single image only
- no swatches
- low stock
- transparent product image
- tall and wide media

## Quality Bar

Before calling a change complete:

- `npm run build` passes
- no visible overflow in supported surfaces
- no interaction depends entirely on hover for core usability
- no developer-facing copy appears in the customer UI
