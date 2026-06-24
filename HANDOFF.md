# Community Assist — Handoff & Editing Guide

This site is now an **Astro** static site whose content lives in editable JSON files,
with **Decap CMS** (at `/admin`) so the client can edit it in a browser. Auth is via
**DecapBridge** (email/password — no GitHub account needed for the client). Hosting is
**Netlify**, source of truth is **GitHub**.

```
Client edits at /admin  →  Decap commits JSON to GitHub  →  Netlify rebuilds  →  live site
```

---

## 1. Local development

```bash
npm install      # one time
npm run dev      # local preview at http://localhost:4321
npm run build    # production build → dist/
npm run preview  # serve the built dist/ locally
```

No backend, no database. The build is fully static.

## 2. Where things live

| What | Where |
|------|-------|
| **Editable content** (what the client changes) | `src/data/*.json` |
| Page sections (markup) | `src/components/*.astro` |
| Layout + `<head>` + nav/footer | `src/layouts/Base.astro`, `Header.astro`, `Footer.astro` |
| Icon/logo SVG sprite | `src/components/Sprite.astro` |
| Global styles | `src/styles/global.css` |
| Interactions (tabs, copy, reveal, video) | `public/main.js` |
| Images / video | `public/assets/...` (served at `/assets/...`) |
| **Decap CMS** | `public/admin/index.html` + `public/admin/config.yml` |
| Netlify build config | `netlify.toml` |

Every key in `src/data/*.json` is mapped in `public/admin/config.yml`. ⚠️ **Decap rewrites
each JSON file using only the fields declared in `config.yml`** — if you add a new key to a
data file, also add a field for it in `config.yml`, or it will be dropped when the client saves.

## 3. Setup status & what's left

The handoff is essentially complete:

- ✅ **Repo (client-owned):** `indosole/Community-Assist-2026-Website`. You push as a
  collaborator — use a **classic** GitHub token with the `repo` scope (a fine-grained token
  can't write to another account's repo, even as a collaborator).
- ✅ **DecapBridge:** site created (PKCE auth), backend wired into `public/admin/config.yml`.
- ✅ **Netlify:** connected to the repo, auto-builds on every push to `main`.
  Current URL: `https://storied-peony-52f1d5.netlify.app`.
- ✅ **CMS verified:** `/admin` login works and a test edit publishes through to the live site.

**Remaining:**

1. **Custom domain.** Netlify → Domain management → add `communityassistbali.com` → set the DNS
   records it shows at the domain registrar.
2. **Repoint the DecapBridge login URL** once the domain is live: DecapBridge dashboard → site
   settings → set **Decap CMS login URL** to `https://www.communityassistbali.com/admin/index.html`
   (it's currently the netlify.app URL, used for testing). Optionally update `site_url` /
   `display_url` in `public/admin/config.yml` to match.
3. **Invite the client** to DecapBridge (by email) so they can log in to `/admin`.

> Ongoing: a **content** change is done by the client in `/admin` (no deploy needed — Decap
> commits and Netlify rebuilds). A **code/design** change is a normal `git push` to `main`,
> which Netlify auto-deploys.

## 4. How to edit your site (for the client)

1. Go to **`https://<your-domain>/admin`** and log in (email + password from your invite).
2. Pick **Site settings** or **Page sections** in the left sidebar, then the section to change
   (e.g. *6 · 2026 goal*, *8 · Events*).
3. Edit the fields. To change a photo, click the image field → **Choose/Upload**.
4. Click **Publish** (top bar). Your change is saved and the live site updates in **~1–2 minutes**.

That's it — you never touch code. If something looks wrong, your developer can roll back any
change from the site's GitHub history.

## 5. Notes & gotchas

- **2026 goal progress bar** (`src/data/goal.json` → `progress`) is a number 0–100. It is a
  manual figure — update it as funds come in. Set it to whatever percentage you want shown.
- **Scholarship donut chart** (gift section): the *legend text and numbers* are editable, but the
  coloured ring itself is drawn in CSS (`src/styles/global.css`, `.donut`) with fixed proportions. If the
  18 / 8 / 4 split changes, update the legend text here and have your developer adjust the ring.
- **Image dimensions** (width/height fields) only reserve space to prevent layout shift. If you
  swap an image and the new one is a very different shape, ask your developer to update them.
- **Rich-text fields** marked "HTML allowed" accept tags like `<strong>`, `<em>`, `<br>`. Plain
  text is fine too.
- **Video** (Chintya's testimonial) lives in `public/assets/video/`. Swapping it via the CMS is
  possible but uncommon; easiest to hand to your developer.
