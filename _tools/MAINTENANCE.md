# Public HTML snapshots

The GitHub Pages workflow runs this refresh on every push to `main`, before it packages or deploys the website. A failed refresh prevents publication and leaves the previous deployment live. You can also refresh the checked-in snapshots locally:

```sh
node _tools/refresh-public-content.mjs
```

The script reads only the existing unauthenticated public social and certification endpoints. It selects the fields already displayed by the website, validates URLs, and uses the browser renderers to generate the same cards and filters in `index.html`, `bio.html`, and `certifications.html`.

The HTML includes escaped JSON copies for JavaScript initialization. Live refreshes replace these snapshots; failed or malformed refreshes retain them. An intentionally empty successful response still clears the corresponding content.

Review and commit locally generated HTML with the source change. CI-generated snapshots are included in the deployment artifact without writing bot commits back to the repository. Changed snapshots update their sitemap `lastmod` dates automatically. A failed or incomplete fetch aborts generation before writing any pages. Never add private endpoints, account data, or private application details here.

`package-pages.mjs` uses an explicit allowlist for the public artifact, excluding build tools, workflow files and Git metadata. The build needs the two public endpoints; visitors and crawlers receive the generated HTML and do not need them. Use the workflow's manual Run workflow action to publish a new snapshot when only public API data has changed.

## Style maintenance

Shared visual tokens live in public_assets/site/css/tokens.css; loading/error states live in content-states.css. Open _tools/style-reference/index.html through the local website server to review examples. The _tools directory is excluded from the Pages artifact, including this reference. Run node _tools/check-links.mjs for a lightweight local-asset check; the publish workflow runs it too. It checks the main and legal static pages without contacting remote sites or private Worker routes.
