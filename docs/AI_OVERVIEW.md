# AI Overview

## Purpose

This project is a design and engineering workspace for a dynamic product card intended for Shopify storefront placements.

The current app is used to:

- shape the visual system of the card
- test responsive behavior across multiple layouts
- review content density, motion, and media handling
- prepare the component for a later split into storefront rendering and settings management

## Current Product Direction

The product card is not a product detail page.

It is designed for:

- collection grids
- carousels and swipeable product rails
- featured product placements
- quick-view and quick-add use cases

## Working Principles

- Keep storefront-facing UI clean and merchant-friendly.
- Keep internal process notes in docs, not in the visible interface.
- Prefer stable defaults over maximum configurability.
- Treat responsive behavior and container safety as first-class requirements.

## Main Areas In The Repo

- `src/app/App.tsx`: current application shell, controls, preview surfaces, and card renderer
- `src/styles/`: global styling and theme files
- `src/app/components/`: shared UI building blocks
- `docs/`: project documentation for workflow, engineering, and product direction

## Near-Term Goals

- keep the card publishable across widths and placements
- refine merchant-facing settings language
- cover real commerce edge states
- prepare the codebase for a future separation of preview, admin, and storefront runtime
