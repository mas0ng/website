# Site branding (SVG)

Favicons, share images, and nav branding for mas0ng.com and workers.

## Spec (all SVGs)

| Property | Value |
| --- | --- |
| Format | SVG |
| Style | Simple mark readable at 16px; no fine text |
| Colours | Align with site palette: dark blues `#061224`–`#07111f`, accents `#38bdf8`, `#14b8a6` |

## Files

| Filename | Size (viewBox) | Where used | What to draw |
| --- | --- | --- | --- |
| `favicon.svg` | `32×32` | Public site, auth login OG fallback | Primary mas0ng.com mark |
| `favicon-error.svg` | `32×32` | `404.html` | Same mark with error accent (e.g. amber/red dot or stroke) |
| `favicon-warning.svg` | `32×32` | Warning states (reserved) | Mark + warning accent |
| `favicon-auth.svg` | `32×32` | Apps, dash, AI worker pages | Mark tuned for auth/private apps context |
| `favicon-music.svg` | `32×32` | Music worker | Mark + music motif |
| `apple-touch-icon.svg` | `180×180` | Add-to-home-screen, privacy page | Full-bleed icon; more detail than favicon |
| `social-card.svg` | `1200×630` | Auth OG / Twitter card | Wide card: mark, `mas0ng.com`, short tagline, dark gradient background |
| `brand-nav.svg` | `128×32` or `160×40` | Shared navbar (if used) | Horizontal wordmark or mark + `mas0ng.com` |

## Missing / to create

These are referenced in HTML/workers but may not exist yet:

- `apple-touch-icon.svg`
- `social-card.svg`

Create them before the next branding deploy.

## Workers referencing this folder

- `workers/auth` — favicon, apple-touch, `social-card` OG image
- `workers/apps`, `workers/dash`, `workers/ai` — `favicon-auth.svg`, `apple-touch-icon.svg`
- `workers/music` — `favicon-music.svg`, `apple-touch-icon.svg`
- Public `website/` pages — `favicon.svg`, `favicon-error.svg`