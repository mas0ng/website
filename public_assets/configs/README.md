# Site configs

Editable JSON configs shared across the public site. Loaded at runtime by `public_assets/site/js/layout/shell.js`.

## Files

| File | Purpose |
| --- | --- |
| `socials.json` | Social platform links — home grid, footer, icon preload |
| `apps.json` | Public and private app registry — nav dropdowns, home featured apps, secure apps launcher |
| `cache-versions.json` | Cache bust manifest — **must be bumped on every deploy** (see `documentation/CACHE_VERSION_DOCUMENTATION.md`) |

## `cache-versions.json`

Use `major.minor` strings (`1.0`, `1.1`, `1.11`, `2.0`, …). Bump the key for each area you change before deploying.

Full rules — when to use `1.1` vs `2.0`, area keys, and deploy checklist:

```text
documentation/CACHE_VERSION_DOCUMENTATION.md
```

## `socials.json` fields

Each entry in the array:

| Field | Required | Description |
| --- | --- | --- |
| `id` | yes | Slug used for CSS (`social-tile--{id}`). Lowercase, no spaces. |
| `label` | yes | Display name (e.g. `GitHub`) |
| `handle` | yes | Username or handle shown under the label |
| `href` | yes | Full profile URL. Use `#` to hide until the link is ready — pending entries are not shown on the site |
| `icon` | yes | Path to SVG in `public_assets/social_icons/` |

## Example — enable GitHub

```json
{
  "id": "github",
  "label": "GitHub",
  "handle": "mas0ng",
  "href": "https://github.com/mas0ng",
  "icon": "/public_assets/social_icons/github.svg"
}
```

Order in the array = order on the home page and in the footer.

## After editing

Save the file and refresh. No build step. If links do not update, hard-refresh or wait for cache expiry (`/public_assets/*` is long-cached on deploy).