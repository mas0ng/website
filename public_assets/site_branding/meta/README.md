# Metadata image brief

Place finished metadata images in this directory. Do not reference a filename from HTML or Worker output until the corresponding image exists in production.

## Export specification

- Social cards: exactly `1200 x 630` pixels, PNG, sRGB, under 5 MB.
- Profile image: exactly `1200 x 1200` pixels, JPEG, sRGB, under 5 MB.
- Keep important content at least 80 pixels from the left and right edges and 60 pixels from the top and bottom edges.
- Images are user-visible. Use `Mason`, `@mas0ng`, or `mas0ng.com`; do not put a full personal name in the artwork.
- Avoid tiny text. Designs should remain readable when displayed at roughly 300 pixels wide.

## Public-site cards

| Filename | Page or reuse group | Suggested direction |
| --- | --- | --- |
| `default-social-1200x630.png` | General fallback and legal pages | Clean mas0ng.com branding without page-specific copy |
| `home-social-1200x630.png` | Main homepage | Black liquid treatment and the mas0ng.com wordmark |
| `bio-social-1200x630.png` | Bio | Portrait, `Mason`, and `@mas0ng` |
| `certifications-social-1200x630.png` | Certifications | Credential or badge treatment with `Certifications` and `@mas0ng` |
| `404-social-1200x630.png` | Main-site 404 response | A playful `404` or `Not found` design using the orbit/error-page style |
| `profile-1200x1200.jpg` | Person/ProfilePage structured data and square fallback | Centred portrait with enough room for circular cropping; no text needed |

## Additional page-level cards

| Filename | Page or reuse group | Suggested direction |
| --- | --- | --- |
| `auth-social-1200x630.png` | Login, approval, and authentication pages | Secure entry/login visual with `mas0ng.com` and `Authentication` or `Log in` |
| `dev-social-1200x630.png` | Public dev and releases site | Release/package treatment with `dev.mas0ng.com` |

## Wiring plan

Once the assets exist, each applicable page will receive absolute Open Graph and X image URLs plus `og:image:width`, `og:image:height`, `og:image:type`, and descriptive `og:image:alt` metadata. The profile JPEG will replace the current 150-pixel image in Person and ProfilePage structured data.

Private apps remain authenticated and `noindex`; they reuse general branding rather than having individual metadata cards. A metadata image must never weaken authentication or expose private page content.
