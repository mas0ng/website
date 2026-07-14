# index_assets

Assets used **only** by the public home page (`index.html`).

## Layout

```
index_assets/
  css/
    bio.css   — Bio page layout (no navbar)
  js/
    home.js   — Social grid, hero/footer login href wiring
    bio.js    — Bio page social grid (loads socials.json)
```

## Shared dependencies

The index page also loads shared files from `/public_assets/site/` (CSS, shell, site-data) and images from `/public_assets/social_icons/`.

## Cache

`/index_assets/*` is long-cached via `website/_headers`.