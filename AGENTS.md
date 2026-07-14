# Website and browser assets

The website is public and cannot be a security authority. It must not contain an application catalogue or enumerate private apps. The authenticated, master-only Apps Worker owns both catalogue metadata and application security classifications.

Use `window.MAS0NG_APP_ENCRYPTION.secureFetch` for sensitive JSON or text APIs. Do not implement crypto inline, persist AES keys, print cleartext, retry with `fetch` after a crypto failure, or send sensitive query parameters outside the encrypted tunnel. Use normal authenticated HTTPS for images, media streams, PDFs, ZIPs, large binary files, and ordinary HTML/CSS/JavaScript.

Render server data with `textContent` or escaping helpers. Any app below `fully_protected` must show the navbar warning with accurate protected/unprotected lists and an explicit Continue choice. Warning copy must state that HTTPS still applies and must not promise protection from software controlling the browser/device.
