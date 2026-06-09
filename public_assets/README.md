# public_assets

Static files served from `https://mas0ng.com/public_assets/…`. Used by the public website and Cloudflare Workers (apps, auth, music, dash, AI, diagnostics).

All **new** icons and branding for the redesign should be **SVG**. Drop files into the folders below and keep filenames stable so HTML and worker code keep working.

## Folders

| Folder | Purpose | README |
| --- | --- | --- |
| `site_branding/` | Site favicon | [site_branding/README.md](site_branding/README.md) |
| `social_icons/` | Public social link tiles + footer | [social_icons/README.md](social_icons/README.md) |
| `app_icons/` | Private app launcher + worker favicons | [app_icons/README.md](app_icons/README.md) |
| `fonts/` | Etna display font files | [fonts/README.md](fonts/README.md) |
| `music_app/` | Music player artwork and optional icons | [music_app/music_cover_assets/README.md](music_app/music_cover_assets/README.md) |
| `site/` | Shared site CSS/JS (not images) | [site/README.md](site/README.md) |
| `configs/` | Editable JSON (social links, etc.) | [configs/README.md](configs/README.md) |

## Deploy notes

- Paths are root-absolute (`/public_assets/...`).
- `_headers` sets long cache for everything under `/public_assets/*`.
- Workers load the same URLs from `www.mas0ng.com` (or `mas0ng.com` for auth OG tags).