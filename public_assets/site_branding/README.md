# Site branding (SVG)

Single favicon for mas0ng.com and all workers.

## File

| Filename | Size (viewBox) | Where used | What to draw |
| --- | --- | --- | --- |
| `favicon.svg` | `32×32` | Public site, workers, auth OG/Twitter fallback | Primary mas0ng.com mark |
| `profile.svg` | `256×256` | Bio page fallback avatar | Circular branded monogram |
| `profile.webp` | `256×256` or larger | Bio page (optional) | Square photo; shown when present |

## Spec

| Property | Value |
| --- | --- |
| Format | SVG |
| Style | Simple mark readable at 16px; no fine text |
| Colours | Align with site palette: dark blues `#061224`–`#07111f`, accents `#38bdf8`, `#14b8a6` |

## HTML

```html
<link rel="icon" type="image/svg+xml" href="/public_assets/site_branding/favicon.svg" />
```

Workers on subdomains may use the absolute URL: `https://mas0ng.com/public_assets/site_branding/favicon.svg`.

## Referenced by

- Public `website/` pages (`index.html`, `bio.html`, `404.html`, legal)

## Bio profile photo

Drop a square `profile.webp` into this folder to replace the default SVG on `/bio`. The page uses `<picture>` so the WebP is preferred when the file exists; otherwise `profile.svg` is shown.
- `workers/auth`, `workers/apps`, `workers/dash`, `workers/ai`, `workers/music`
- `website/public_assets/site/js/config/site-data.js` (`assets.favicon`)