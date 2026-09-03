# Olumide Sajowa — Portfolio v5

Static frontend, one serverless function for contact. Deploy the whole folder to Vercel.

## Fixed this round
- Removed the hero's icosahedron ("red ball") — replaced with an angular constellation/wireframe-cube scene, not spherical.
- Removed the mouse-following preview box on the work list entirely.
- Nav now goes glass (blurred, semi-transparent) once you scroll, so it never fights page text.
- Dark/light theme toggle in the nav, persisted via localStorage.
- Contact page dropdown: fixed the invisible-option-text bug, added five more options including founder/startup work.
- Contact form now posts to a real /api/contact serverless function (see below) instead of mailto:.
- Removed all "open to roles in UK/UAE/Netherlands/Canada" language — replaced with a "Who this is for" section on the homepage that explicitly includes founders, product teams, agencies, and companies hiring outright.
- Added LinkedIn and Twitter/X links to every footer and the contact page.
- All 13 case studies are now full-depth (matching WorkPulse/Keryva), rewritten from the detailed source docs you sent, in your voice, not the emoji/table markdown-report format they arrived in.
- Enocessity's case study now includes the founder's origin story as its own section.

## Contact form setup (Resend)
`/api/contact.js` is ported from your old portfolio-uvgo implementation: rate limiting, honeypot, sanitisation, dual emails (notify + confirmation). To activate on Vercel:
1. `npm install resend` (package.json already lists it, Vercel installs automatically)
2. Vercel → Project → Settings → Environment Variables:
   - `RESEND_API_KEY` (required)
   - `CONTACT_TO_EMAIL` (optional, defaults to olumidesajowa@gmail.com)
   - `CONTACT_FROM_EMAIL` (optional, defaults to Resend's shared onboarding@resend.dev sender until you verify a custom domain in Resend — once you buy your domain, set this to something like `Portfolio Contact <hello@yourdomain.com>`)
   - `RECAPTCHA_SECRET_KEY` (optional — omitted entirely for now since there's no site key wired up client-side; the function skips verification cleanly if this isn't set)

## Still open
- Kaysaj, RootHaus, Renvia, Lyrion, Resource Bank, Recipe Finder, and UX Debt Detector case studies use real specs and figures from the documents you sent, but no real screenshots — send them and they slot in.
- Once you pick a domain, update `SITE_URL` in `/api/contact.js` and the CORS allowlist.

## v5 changes
- Removed the hero 3D scene entirely, per request — nothing replaces it, the hero is pure typography and layout now.
- Added two new full case studies: PoseCraft (Calgary photography props, brand identity) and Erco Grey Renovations (Ontario renovation firm, identity simplification), both from your detailed briefs, each with a distinct visual treatment (warm/tactile vs. architectural/structured).
- 15 case studies total now. Homepage counts and copy updated to match.
