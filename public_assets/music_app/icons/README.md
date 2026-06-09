# Music app UI icons

Playback controls in the music worker currently use **Lucide** icons in the browser (see table below). You do **not** need PNGs here for the app to work.

If the redesign adds **custom SVG** controls, use this spec:

## Optional custom SVG spec

| Property | Value |
| --- | --- |
| Format | SVG |
| Canvas | `24×24` viewBox |
| Display | `20–24px` inline in buttons |
| Colour | `currentColor` strokes/fills so CSS can theme hover/active/liked states |

## Lucide icons in use today

| Control | Lucide name |
| --- | --- |
| Play | `play` |
| Pause | `pause` |
| Previous | `skip-back` |
| Next | `skip-forward` |
| Shuffle | `shuffle` |
| Like | `heart` |
| Liked | `heart` (filled) |
| Refresh library | `refresh-cw` |
| Delete / clear queue | `trash-2` |
| Logout | `log-out` |
| Jump to current | `crosshair` |
| Volume | `volume-2` |
| Muted | `volume-x` |

To swap in custom SVGs, replace the Lucide markup in `workers/music/public/` JS/CSS and name files clearly (e.g. `play.svg`, `pause.svg`) in this folder.