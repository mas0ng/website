# Fonts

Display font for public pages (not SVG).

## Files

| Filename | Format | Usage |
| --- | --- | --- |
| `etna.woff2` | WOFF2 | Primary webfont (preload on all public pages) |
| `etna.woff` | WOFF | Fallback for older browsers |

## CSS

Loaded via `@font-face` in `public_assets/site/css/site.css` as family **`Etna`**. Used for headings, nav brand, section titles, and social tile labels.

## Note

If you replace the font files, keep the same filenames or update:

- `public_assets/site/css/site.css` (`@font-face` URLs)
- `public_assets/site/js/config/site-data.js` (`assets.etnaWoff2`, `assets.etnaWoff`)

Body text uses **ABeeZee** from Google Fonts (not stored here).