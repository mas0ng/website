# App icons (SVG)

Icons for the private **Apps** launcher API and worker favicons. PNGs in this folder are legacy; replace with SVG using the filenames below.

## Spec

| Property | Value |
| --- | --- |
| Format | SVG |
| Canvas | `128×128` viewBox |
| Display size | Up to `56×56` in UI; also used as link/icon metadata |
| Style | One clear metaphor per app; works on light `#f6f8fb` and tinted `#e8f0fe` tiles |
| Safe area | Keep artwork inside **96×96** centred |

Use a rounded square plate (`16–20px` radius at 128 scale) or a floating glyph — stay consistent across the set.

## Files to add (replace `.png`)

| Filename | App | What to draw |
| --- | --- | --- |
| `dash.svg` | Dash | Control panel / API / dashboard motif |
| `music.svg` | Music | Note, waveform, or headphones |
| `diagnostics.svg` | Web diagnostics | Pulse, heartbeat, or check grid |
| `logout.svg` | Logout action | Door/exit or power-off (neutral, not alarming) |

## Legacy PNGs (remove after SVG upload)

- `dash.png`
- `music.png`
- `diagnostics.png`
- `logout.png`

## Code references

- `workers/apps/src/index.js` — `APP_REGISTRY` icon paths (now `.svg`)
- `workers/web-diagnostics/src/index.js` — page favicon → `diagnostics.svg`
- `workers/apps` API `GET /secure/apps/api/apps` returns `icon` URLs for clients

**AI app** uses `site_branding/favicon-auth.svg` instead of a file here.