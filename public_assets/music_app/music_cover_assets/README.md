# Music cover assets

Default artwork for the private music worker player. These stay **raster** (not SVG) because they act as album-style covers.

## Spec

| File | Format | Size | Usage |
| --- | --- | --- | --- |
| `playlist_cover.webp` | WebP | **512×512** minimum (square) | Main playlist / library hero cover |
| `default_cover.jpg` | JPEG | **512×512** minimum (square) | Fallback when a track has no cover |

## Design notes

- Square aspect ratio is required.
- Keep important content centred; edges may be cropped slightly in the UI.
- `playlist_cover` should feel like the default “mas0ng music” brand cover.
- `default_cover` should be neutral and work behind track titles.

## Optional SVG branding

Site favicon lives in `site_branding/favicon.svg` (shared with all apps). Do not add separate favicon files here.

## Code references

- `workers/music/public/app.html` — preload + default `<img>`
- `workers/music/public/js/app.js` — `playlistCoverPath`, `defaultPlaylistCoverPath`