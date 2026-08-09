# Thoughtz Studio — Client Photo Delivery

A mobile-first web app for photography clients to browse a private gallery of frames, mark favourites, download the full-quality set, and send their favourite selections straight to the studio.

## Tech

- Plain HTML, CSS, and vanilla JavaScript — no build step, no framework.
- CSS scroll-snap for the swipeable photo carousel.
- Netlify Forms for submitting the client's favourite selection to the studio (no custom backend required).
- Inter typeface via Google Fonts.

## Running locally

This is a static site, so any static server works:

```bash
netlify dev --port 8889
```

Then open `http://localhost:8889/`. Optionally load a specific gallery with a query string, e.g. `?d=profect-memories-jmxdjl` or `?d=wedding-lane-9kfmz`. Unknown or missing `d` values fall back to the default demo gallery.

## Deploying

Deploys as a static site on Netlify — no environment variables or database required. Favourite submissions land in the site's Forms dashboard under the "favourites" form.
