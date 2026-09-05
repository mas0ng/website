# Public HTML snapshots

Before publishing public social or certification changes, run from the website repository:

```sh
node _tools/refresh-public-content.mjs
```

The script reads only the existing unauthenticated public social and certification endpoints. It selects the fields already displayed by the website, validates URLs, and uses the browser renderers to generate the same cards and filters in `index.html`, `bio.html`, and `certifications.html`.

The HTML includes escaped JSON copies for JavaScript initialization. Live refreshes replace these snapshots; failed or malformed refreshes retain them. An intentionally empty successful response still clears the corresponding content.

Review and commit the generated HTML with the source change. Update the relevant sitemap `lastmod` dates when the published content changes. A failed or incomplete fetch aborts generation before writing any pages. Never add private endpoints, account data, or private application details here.

This tooling directory is excluded by GitHub Pages' default underscore-directory handling. The public HTML is committed directly, so deployment and crawlers do not need API access to generate it.
