# Site code assets

Shared CSS and JavaScript for the public website (not images). Served from `/public_assets/site/…`.

## Layout

```
site/
  css/
    site.css      — Global layout, nav, footer, home masthead, social tiles
    legal.css     — Legal hub and policy pages
  js/
    config/site-data.js   — Nav, legal links, asset URLs (socials loaded from configs/)
    lib/cache.js          — Font/image preload helpers
    layout/loader.js      — Conditional page loader
    layout/shell.js       — Nav, footer, scroll morph, hash routing
```

## Index-only code

Home page logic lives separately in `/index_assets/js/home.js` (social grid render).

## Do not put images here

Upload SVGs and fonts to the other `public_assets` subfolders listed in [../README.md](../README.md).