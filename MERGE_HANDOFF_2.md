# Merge Handoff #2 — Abhishek's changes (after the first merge)

This is the **second** handoff. The first one (`MERGE_HANDOFF.md`) is already merged
on your side. This file covers **only what changed after that** — do **not** redo
the first handoff's work.

- **No new npm packages.** One new file (`components/DocumentUploadPanel.jsx`);
  everything else is modifications using libraries the project already has.
- **Simplest merge: merge the whole `Abhishek` branch** (`git fetch origin` then
  `git merge origin/Abhishek`). All the work below is already committed there.
- This handoff has **two parts**:
  - **Part 1 (sections A–G)** — the first batch (project form, files module, timeline,
    client-linking, project-detail layout).
  - **Part 2 (sections H–K)** — later work: invoice viewing reliability, invoices in
    the client's billing, the Projects-vs-Companies section navigation, and the
    unified document-upload form with custom categories.

> 🗄️ **Data note (not code):** the dev database was wiped again (kept only the admin)
> and one orphan client login was deleted. That's data, not code — nothing to merge,
> just don't expect old test data.

---

## Files changed (all modifications — nothing new)

| File | Area | What changed |
|------|------|--------------|
| `copper-crm/src/components/ProjectFormPanel.jsx` | New Project form | Searchable company/contact, package→amount, discount %/₹, remove team/tags, new-company link |
| `copper-crm/src/pages/projects/ProjectsList.jsx` | New Project form | Passes `projects`, preselect company, "new company" nav, triggers invoice generation |
| `copper-crm/src/pages/crm/Companies.jsx` | Company create | Return-to-form nav, creates the captured primary contact, sends invite after save |
| `copper-crm/src/components/CompanyFormPanel.jsx` | Company create | "Add primary contact" opens the contact form; holds it until the company is saved |
| `copper-crm/src/components/ContactFormPanel.jsx` | Contact form | `hideCompany` + `deferInvite` props (used by the company-create flow) |
| `server/services/finance.js` | Backend | Back-fills a standalone project's `clientId` from its company's portal user |
| `copper-crm/src/pages/projects/ProjectDetail.jsx` | Project detail | Removed Budget-used field, removed side metadata box + Budget Usage, full-width roadmap, wider Manage panel |
| `copper-crm/src/pages/projects/ProjectHeader.jsx` | Project header | Start/Expected/Package metadata chips under the title |
| `copper-crm/src/pages/projects/ProjectFiles.jsx` | Project Files | Big rewrite — see section D |
| `copper-crm/src/pages/admin/DocumentCenter.jsx` | Document Center | "View" opens files reliably (data-URL → Blob) |
| `copper-crm/src/pages/projects/ProjectTimeline.jsx` | Timeline | Gantt is the default view; loading guard removes the "not found" flash |

---

## How to merge (recommended: git)

1. **On my machine:** commit these 11 files to a branch and push.
   ```bash
   git checkout -b feature/abhishek-merge-2
   git add copper-crm/src/components/ProjectFormPanel.jsx \
           copper-crm/src/pages/projects/ProjectsList.jsx \
           copper-crm/src/pages/crm/Companies.jsx \
           copper-crm/src/components/CompanyFormPanel.jsx \
           copper-crm/src/components/ContactFormPanel.jsx \
           server/services/finance.js \
           copper-crm/src/pages/projects/ProjectDetail.jsx \
           copper-crm/src/pages/projects/ProjectHeader.jsx \
           copper-crm/src/pages/projects/ProjectFiles.jsx \
           copper-crm/src/pages/admin/DocumentCenter.jsx \
           copper-crm/src/pages/projects/ProjectTimeline.jsx
   git commit -m "Project form + files module + timeline + client-linking improvements"
   git push -u origin feature/abhishek-merge-2
   ```

2. **On your machine:**
   ```bash
   git fetch origin
   git merge origin/feature/abhishek-merge-2
   ```
   Let git 3-way merge; resolve conflicts using the per-area notes below. For
   `ProjectFiles.jsx` specifically, it's usually easiest to **take my whole file**
   (it was substantially rewritten) unless you also changed it.

---

## The end-to-end flow this enables (read this first)

The individual changes below (A–C) combine into **one connected flow**: an admin can
start a brand-new project, create a brand-new company *and* contact along the way, and
have everything linked correctly with an invoice — without leaving the flow. Here's the
whole chain and where each link is made:

1. **Admin → Projects → New Project.** (`ProjectFormPanel` via `ProjectsList`.)
2. In the Company field, there's a **"+ New company"** link → it navigates to the
   **Add Company** page (`ProjectsList` pushes `state:{ openCreate, returnTo }`).
3. In **Add Company**, the admin clicks **"Add primary contact"** → the normal contact
   form opens with the company picker hidden (`hideCompany`). The contact is **held**,
   not saved yet (the company has no id yet). *(No portal invite is sent here — see the
   orphan-account fix in B.)*
4. Admin clicks **Save Company** (`Companies.jsx > saveCompany`):
   - the **company** is created,
   - the held **contact** is created **under that company** (`companyId` set),
   - if "send portal invite" was ticked, the invite is sent **now** (after both exist),
   - it navigates **back to the project form** with the new company's id
     (`state.newCompanyId`).
5. Back in **New Project**, the company is **preselected** (`preselectCompanyId`), and
   the just-created contact appears in the (searchable) Primary-contact dropdown.
   Picking a package fills the amount; discount ₹/% applies.
6. Admin clicks **Create Project** (`ProjectsList.handleCreate`):
   - the project is saved with that `companyId` (and value),
   - `ProjectsList` fetches `/api/crm/invoices`, which triggers the backend's
     `syncStandaloneProjectInvoices()` to **generate the invoice** for it,
   - the backend links it all to the client's portal account by `clientId`
     (`withClientLink` at create-time, plus the `finance.js` back-fill in C for the
     invite-first ordering).

**Net result:** company, contact, project, and invoice all exist and are linked, and
the client (once they set their password from the invite) sees the project + invoice in
their portal. Sections A–C below are the mechanical details of each step.

---

## A — New Project form (`ProjectFormPanel.jsx`, `ProjectsList.jsx`)

- **Company field is now a searchable dropdown** (`SearchableSelectField`).
- **Primary contact is searchable AND correctly filtered.** The old code matched
  contacts only on `companyId`, which came up empty; it now also matches by company
  **name** (same robust logic `CompanyDetail.jsx` uses). Before a company is picked,
  all contacts are shown so choosing a contact can **back-fill its company**.
- **Package dropdown auto-fills "Package value"** — packages are fetched live from
  `/api/packages` (name + price); selecting one sets the amount.
- **Discount can be ₹ or %** — a small ₹/% toggle; in % mode it shows "= ₹X off" and
  the resolved rupee discount is what gets saved.
- **Removed "Assigned team" and "Tags"** fields.
- **Project name/code now numbers correctly.** `ProjectsList` now passes the full
  `projects` list into the form (`projects={projects}`). Before, the form received no
  projects, so it always counted 0 siblings and generated `Company-Project 1-MMYY`
  even when the company already had projects. It now uses the next number
  (e.g. `Company-Project 5-MMYY`) with a matching `CS-XXXX-05-MMYY` code.
- **"+ New company"** link under the Company field → navigates to the Add Company
  page, and on save returns to the project form with that company preselected
  (`ProjectsList` reads `location.state.newCompanyId`; `preselectCompanyId` prop).
- **Standalone project → invoice:** after creating a project that's linked to a
  company with a value, `ProjectsList.handleCreate` fetches `/api/crm/invoices`,
  which triggers the backend's existing `syncStandaloneProjectInvoices()` to mint
  the invoice immediately.

## B — Create a contact from the company form, without orphan accounts

Files: `CompanyFormPanel.jsx`, `ContactFormPanel.jsx`, `Companies.jsx`.

- In **Add Company**, the "Primary contact" field is now an **"Add primary contact"**
  button that opens the normal **contact form** with the company picker hidden
  (`hideCompany` prop). The filled contact is **held in state** — not saved yet,
  because the company has no id until it's saved.
- On **Save Company** (`Companies.jsx > saveCompany`): the company is created, then
  the held contact is created **under it** with the new `companyId`.
- **Orphan-account fix (important):** the portal invite used to fire the instant you
  saved the contact inside the form — so closing the page before saving the company
  left a **login with no CRM record**. Now `ContactFormPanel` takes a `deferInvite`
  prop: in the company-create flow it does **not** send the invite; instead the
  intent rides up and `Companies.jsx` sends the invite **only after** the company +
  contact are actually saved. No save → no account.

## C — Client-account linking (`server/services/finance.js`)

`syncStandaloneProjectInvoices()` now **back-fills a standalone project's `clientId`**
from its company's portal user (`company.userId` / `userIds[0]`) when it's missing.
This covers the case where a client is invited *before* a manually-created project
exists — without it, the project never shows in the client portal (the portal
filters projects by `clientId`). The generated invoice picks up the same `clientId`.

## D — Project Files module rewrite (`ProjectFiles.jsx`)

This file was substantially rewritten. What it now does:

- **Shows everything for the project**, aggregating the same three sources the
  Document Center uses (previously it only read embedded `project.documents`):
  1. embedded `project.documents` (uploaded here),
  2. `Document` collection records tagged with this `projectId`,
  3. `Invoice` records for this project (opened via `/api/invoices/{id}/pdf`).
  So invoices and centrally-uploaded files are no longer invisible here.
- **Files actually open now.** Browsers block navigating to big base64 `data:` URLs,
  so files are converted to a **Blob object URL** before `window.open` (the old
  `<a href>` silently failed). Same fix applied in `DocumentCenter.jsx` — see E.
- **Folder click opens a drill-in view** (folder grid hides, breadcrumb
  `Directory › FolderName`, back link) instead of just filtering in place.
- **Folder dropdown has a "+ Create new folder…" option.**
- **Delete folder** — a trash button appears on hover over a folder; a folder can
  only be deleted **when it's empty** (blocked otherwise).
- **Upload shows a live % progress bar.**
- **Search + type filter** on the documents list (type filter always lists all types:
  PDF/Image/Document/Figma), plus **pagination** (8 per page).
- **Robust file/folder sizes** (handles `sizeMB` or byte `size`; shows "—" if unknown).
- **Action menu has icons on every item** (Open ↗ / View Info ⓘ / Delete 🗑); Delete
  only shows for embedded uploads (invoices/central docs are managed elsewhere).
- **"View Info" is a redesigned panel** that shows the full (wrapping) file name.

## E — Document Center (`DocumentCenter.jsx`)

The "View" link is now a button that opens files reliably via the same Blob/data-URL
handling (and prefixes the API base for `/api/...` endpoints). This is the only
change in this file.

## F — Timeline (`ProjectTimeline.jsx`)

- **Gantt is the default view** (was Kanban); the toggle now lists **Gantt · Kanban**.
  You can still switch to Kanban.
- **Loading guard:** navigating into Timeline no longer flashes "we couldn't find
  that project" — it shows a "Loading timeline…" spinner until the records load, and
  only shows "not found" if the project genuinely doesn't exist.

## G — Project detail & header layout (`ProjectDetail.jsx`, `ProjectHeader.jsx`)

- **Removed the "Budget used" field** from the **Manage Project** panel (Commercials
  section) — it's no longer editable.
- **Removed the right-side "Project Metadata" box entirely**, including the
  **"Budget Usage"** progress bar. There is no budget-usage display anywhere now.
- **The Project Roadmap now spans the full width** (the two-column grid became a
  single full-width column).
- **The "Manage Project" side panel is now ~50% of the screen** on desktop
  (`SidePanel width="max-w-none md:w-1/2"`), instead of the default narrow width.
- **The key metadata moved up next to the project title** (`ProjectHeader.jsx`): small
  chips under the name show **Start**, **Expected** (completion), and **Package**.
  Because `ProjectHeader` is shared, these chips also appear on the Timeline and Files
  tabs.
- Internal cleanup: the now-unused `Section`, `MetaRow`, and `budgetPct` helpers were
  removed from `ProjectDetail.jsx`. If you kept using any of them elsewhere, re-add as
  needed (they weren't referenced anywhere else here).

---

# Part 2 — later changes (sections H–K)

Additional files touched in this part:

| File | Area | What changed |
|------|------|--------------|
| `server/routes/client.js` | Backend | Client billing now also lists standalone invoices (manual projects with no order) |
| `server/server.js` | Backend | Warms up the headless browser at startup so the first invoice-PDF isn't a cold-start failure |
| `copper-crm/src/App.jsx` | Routing | New `/admin/projects/:projectId(/tasks|/files)` routes |
| `copper-crm/src/layouts/AdminLayout.jsx` | Routing | Breadcrumb labels for project sub-pages (tasks → "Timeline") |
| `copper-crm/src/pages/projects/ProjectHeader.jsx` | Routing | Header tabs are route-aware (Projects vs Companies section) |
| `copper-crm/src/pages/projects/ProjectsList.jsx` | Routing | Opens projects under `/admin/projects/:id` |
| `copper-crm/src/pages/projects/ProjectDetail.jsx` `ProjectFiles.jsx` `ProjectTimeline.jsx` | Routing | Derive the company from the project when there's no companyId in the URL |
| `copper-crm/src/components/DocumentUploadPanel.jsx` | **NEW FILE** | The single shared upload form |
| `copper-crm/src/pages/admin/DocumentCenter.jsx` | Documents | Uses the shared upload form; invoice "View" opens HTML (reliable); dynamic category filter |
| `copper-crm/src/pages/crm/CompanyDetail.jsx` | Documents | Uses the shared upload form; folder grid reads live categories |

## H — Invoice viewing reliability (PDF cold-start fix)

The invoice PDF is rendered by headless Chromium (Puppeteer). On a **cold start**,
launching Chromium takes 25–30s and **times out the browser tab** — that was the
"localhost can't currently handle this request" when opening an invoice. Uploaded
documents never hit this (they're blob URLs), which is why only invoices failed.

- **Viewing an invoice now opens the HTML version** (`/api/invoices/{id}/html`) —
  instant, no Chromium — in `ProjectFiles.jsx` and `DocumentCenter.jsx`. The HTML
  invoice is identical and prints to PDF from the browser.
- **`server/server.js` warms the browser at startup** (renders a tiny throwaway PDF)
  so the billing page's actual PDF **download** is ready (~2s) instead of a cold fail.
- Also (from Part 1/E) files open via a **Blob object URL** — browsers block
  top-level navigation to big base64 `data:` URLs, which is why "View" did nothing.

## I — Invoices show in the client's billing (`server/routes/client.js`)

The client billing/dashboard counted **orders**, but a manual/admin-created project
produces an **Invoice with no Order**, so billing showed 0. The client `GET /orders`
route now **also returns the client's standalone invoices** as order-shaped entries
(linked by `clientId`/email), while **excluding** invoices whose project already has
an order (so online purchases aren't double-counted). Project name is set so the
client project switcher still filters them.

## J — Projects vs Companies section navigation

Opening a project always used a URL under `/admin/companies/...`, so the sidebar
jumped to **Companies** even when you opened the project from the **Projects** list.

- **New routes** `/admin/projects/:projectId` (+ `/tasks`, `/files`) render the same
  project pages, so opening from the Projects list keeps you in the **Projects**
  section; opening from a company keeps you in **Companies**. The sidebar highlights
  by URL prefix (already), so it now stays correct in both flows.
- `ProjectsList` links to `/admin/projects/:id`; the company flow is unchanged.
- `ProjectHeader` builds its tabs relative to the current section.
- `ProjectDetail` / `ProjectFiles` / `ProjectTimeline` **derive the company from the
  project** when there's no companyId in the URL. **Important:** the match is against
  both the company's local `id` and its Mongo `_id` (a project's `companyId` is the
  `_id`, while `c.id` is the local id) — matching only one of them was a real bug.
- Breadcrumb shows "Timeline" for the `tasks` sub-page.

## K — Unified document-upload form + custom categories

- **`components/DocumentUploadPanel.jsx` (NEW)** — one shared "Upload Document" form
  used everywhere. When a fixed `company` is passed it **locks/pre-fills** the
  destination; otherwise it shows the company + project-folder pickers. It has the
  file-with-% reader, name, category, file type, "paste a URL", and notes.
- **`DocumentCenter.jsx` and `CompanyDetail.jsx`** dropped their own local upload
  forms and now render this shared component (their old copies + helper functions
  were removed). So the upload experience is identical across modules.
- **Custom categories:** the Category field accepts a typed custom value (via a
  `datalist`). If the category isn't one of the defaults, the user **must pick a
  project folder** — Save is disabled with a warning until they do.
- **Dynamic categories in the UI:** the company Documents folder grid and the Document
  Center category filter are built from the **actual** categories present on the
  documents, so a new custom category automatically appears as a folder / filter
  option. The Document Center's category filter is context-aware (company-wide vs
  the open project) and resets when you switch company/project.

---

## Verify after merging

```bash
# frontend
cd copper-crm
npm install        # only if your lockfile differs
npm run build      # should succeed

# backend
cd ../server
node --check services/finance.js
```

Then run the app and spot-check:
- **New Project:** company + contact are searchable; picking a contact fills the
  company; package fills the amount; discount ₹/% works; "+ New company" round-trips.
- **Add Company → Add primary contact:** fill it, save the company → the contact
  exists under the company; the invite arrives only after saving (close early → no
  orphan account).
- **Project → Files:** the project's invoice shows (under an "Invoices" folder) and
  opens as a PDF; upload shows a %; search/filter/pagination work; empty folders can
  be deleted.
- **Project detail:** roadmap is full-width, metadata chips are under the title, no
  Budget Usage anywhere.
- **Timeline:** opens on the Gantt, no "not found" flash.
