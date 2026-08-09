# AGENTS.md

## Architecture

Single-page static app, no framework, no bundler:

- `index.html` — page structure; contains a hidden static `<form name="favourites">` skeleton so Netlify's build bot can detect the form at deploy time.
- `style.css` — all styling. CSS variables at the top of the file define the dark theme palette.
- `script.js` — all behavior, wrapped in a single IIFE. No modules, no dependencies.
- `netlify.toml` — publishes the repo root as-is (`publish = "."`).

## Data flow

- Gallery data is a hardcoded object (`GALLERIES`) in `script.js`, keyed by the same slug the studio would put in a client link's `?d=` query param (e.g. `?d=profect-memories-jmxdjl`). An unknown or missing `d` falls back to a default demo gallery.
- Photos are placeholder images from `picsum.photos` with deterministic seeds so the same gallery always renders the same images.
- Favourited photo IDs are held in memory only (a `Set`) — there is no persistence across page loads by design; this is a per-session review flow, not an account system.
- Submitting favourites POSTs to Netlify Forms (`form-name=favourites`) with the project title, the list of favourited frame IDs, and the count. Submissions show up in the Netlify Forms dashboard, not in application state.

## Adding a real gallery

To wire up a real client gallery, replace/extend the `GALLERIES` object in `script.js` with real image URLs, or swap `getGalleryFromQuery` to fetch gallery data from an API/CMS instead of a local object. If gallery data ever needs to persist or be authored outside of a code change, introduce Netlify Blobs or Netlify Database at that point rather than hardcoding further slugs.

## Conventions

- No build tooling — edit `index.html` / `style.css` / `script.js` directly and reload.
- Keep the hidden form skeleton in `index.html` in sync with the fields submitted via `fetch` in `script.js` — Netlify's form detection is static-HTML-based, so new fields must be added to both places.
