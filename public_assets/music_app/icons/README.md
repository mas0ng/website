# Music App Icon Upload List

Upload the replacement PNG icons into this folder:

`website/public_assets/music_app/icons/`

Keep the filenames exactly as listed below. Use transparent backgrounds, square canvases, and at least 128x128px source artwork so the buttons stay crisp.

## Required Icons

| Filename | Used for | Icon colour | Accent/background colour |
| --- | --- | --- | --- |
| `play.png` | Main play, row play, bottom player play | `#ffffff` | Use on `#1688d8` blue controls |
| `pause.png` | Main pause, row pause, bottom player pause | `#ffffff` | Use on `#1688d8` blue controls |
| `previous.png` | Previous track | `#174ea6` | Transparent |
| `next.png` | Next track | `#174ea6` | Transparent |
| `shuffle.png` | Smart shuffle | `#174ea6` | Transparent |
| `heart-unliked.png` | Like action, not yet liked | `#64748b` | Transparent |
| `heart-liked.png` | Liked state and play liked | `#e11d48` | Transparent |
| `refresh.png` | Refresh library | `#1688d8` | Transparent |
| `trash.png` | Delete song and clear queue | `#dc2626` | Transparent |
| `logout.png` | Sign out | `#64748b` | Transparent |
| `target.png` | Jump to current song | `#1688d8` | Transparent |
| `volume.png` | Volume enabled | `#174ea6` | Transparent |
| `volume-muted.png` | Muted volume | `#64748b` | Transparent |

## Design Notes

- Match the light blue music UI: primary blue `#1688d8`, deep blue `#174ea6`, soft slate `#64748b`, danger red `#dc2626`, liked red `#e11d48`.
- Do not include text in any icon.
- Keep line weights consistent across all icons.
- Avoid built-in circular outlines or boxed backgrounds. The app supplies button shapes itself.
