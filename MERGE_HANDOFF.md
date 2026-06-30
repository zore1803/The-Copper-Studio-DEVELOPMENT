# Merge Handoff — Abhishek's changes

This describes **everything** that changed in my working tree so you (and your
Claude) can merge it into your copy of the project. There are **two bundles** of
work here:

- **Bundle A — Document visibility + client portal** (toggle, restyle, project switcher)
- **Bundle B — Checkout / company linking / manual invoice / Document Center redesign**

Both bundles are uncommitted in the same working tree, so they must be merged
**together**. Read the **"How to merge"** section first — using git is far safer
than hand-copying, because several files have large diffs and two files are new.

> ⚠️ One file, `copper-crm/src/pages/admin/DocumentCenter.jsx`, is touched by
> **both** bundles. Don't merge one bundle's version and forget the other — take
> the final version from my branch, which already has both sets of changes.

---

## All files touched (both bundles)

| File | Status | Bundle | What it's for |
|------|--------|--------|---------------|
| `server/models/Document.js` | modified | A | New `clientVisible` field |
| `server/models/Invoice.js` | modified | A | New `clientVisible` field |
| `server/routes/client.js` | modified | A | Filter hidden docs from client Documents only |
| `copper-crm/src/context/ClientProjectContext.jsx` | **NEW FILE** | A | Global selected-project state + helpers |
| `copper-crm/src/index.css` | modified | A | `--cs-*` design tokens retuned to admin palette |
| `copper-crm/src/layouts/ClientLayout.jsx` | modified | A | Light sidebar + header + project switcher |
| `copper-crm/src/pages/client/ClientPages.jsx` | modified | A | Restyle, lucide icons, per-project filtering |
| `copper-crm/src/pages/client/ClientDashboard.jsx` | modified | A | Restyle, lucide icons, project-aware |
| `copper-crm/src/pages/admin/DocumentCenter.jsx` | modified | **A + B** | Visibility toggle + scroll panes (A); company/project redesign (B) |
| `server/services/projectNaming.js` | **NEW FILE** | B | Shared project name/code builders |
| `server/models/Project.js` | modified | B | New `clientProjectName` field |
| `server/routes/crm.js` | modified | B | Adopt orphan client+project into a company |
| `server/routes/invoices.js` | modified | B | Project code on invoice PDF |
| `server/services/finance.js` | modified | B | Returning-client auto-link; repeat-purchase bug fix |
| `server/services/invoiceTemplate.js` | modified | B | Print project code on the PDF |
| `server/server.js` | modified | B | Checkout w/o company; manual-invoice flow; wiring |
| `copper-crm/src/pages/billing/Invoices.jsx` | modified | B | Manual-invoice form overhaul |
| `copper-crm/src/pages/projects/ProjectHeader.jsx` | modified | B | Shows client project name / code |
| `clear_db.js` | modified | B | Preserve `superadmin` on wipe |

No new npm packages are needed. New code uses `lucide-react`, already a
dependency. The two new files import only existing modules.

> 🗄️ **Data note (not code):** I also wiped the dev database (kept only the admin)
> and ran one-time backfills to fix existing records. Nothing for you to merge —
> just don't expect the old test data after you pull.

---

## How to merge (recommended: use git)

The cleanest path, since several files have large diffs and there are 2 new files:

1. **On my machine (the one with these changes):** commit *all* the files above to
   one branch and push it.
   ```bash
   git checkout -b feature/abhishek-merge
   git add server/models/Document.js server/models/Invoice.js server/models/Project.js \
           server/routes/client.js server/routes/crm.js server/routes/invoices.js \
           server/services/finance.js server/services/invoiceTemplate.js \
           server/services/projectNaming.js server/server.js clear_db.js \
           copper-crm/src/context/ClientProjectContext.jsx \
           copper-crm/src/index.css copper-crm/src/layouts/ClientLayout.jsx \
           copper-crm/src/pages/client/ClientPages.jsx \
           copper-crm/src/pages/client/ClientDashboard.jsx \
           copper-crm/src/pages/admin/DocumentCenter.jsx \
           copper-crm/src/pages/billing/Invoices.jsx \
           copper-crm/src/pages/projects/ProjectHeader.jsx
   git commit -m "Doc visibility + client portal + checkout/company-link + manual invoice + Document Center redesign"
   git push -u origin feature/abhishek-merge
   ```

2. **On your machine:**
   ```bash
   git fetch origin
   git merge origin/feature/abhishek-merge
   ```
   Let git do the 3-way merge and resolve conflicts in the files above. The
   per-feature notes below explain what each conflicting hunk should become.

> ⚠️ **The two new files won't appear as conflicts** — git just adds them. After
> merging, confirm both exist:
> - `server/services/projectNaming.js`
> - `copper-crm/src/context/ClientProjectContext.jsx`
>
> And confirm `server/models/Project.js` has the new `clientProjectName` field.
> These three are the most likely to be silently missed in a manual merge.

If you can't use git, apply the changes manually using the breakdown below.

---

# Bundle A — Document visibility + client portal

## A1 — Per-document "Client Visible" toggle (admin)

**Goal:** In the admin Document Center, each document row has an on/off toggle.
Off = hidden from the client's **Documents** section. On = client can see it.

### Backend

**`server/models/Document.js`** — add the field inside the schema (next to `scope`):
```js
// Admin-controlled switch for whether this document shows in the client portal.
clientVisible: { type: Boolean, default: true },
```
…and add `clientVisible: true` to the `defaults: { ... }` block.

**`server/models/Invoice.js`** — same idea (invoices are documents too). Add to
the schema (near `paidAt`):
```js
clientVisible: { type: Boolean, default: true },
```
…and `clientVisible: true` to its `defaults: { ... }`.

**`server/routes/client.js`** — in the `GET /documents` handler, filter hidden
items out of the three document sources:
- Collection docs query: add `{ clientVisible: { $ne: false } }` to the `$and`.
- Embedded `project.documents`: add `&& doc.clientVisible !== false` to the
  `.filter(...)`.
- Invoice-as-document list: `userInvoices.filter(inv => inv.clientVisible !== false)`
  before mapping.

### Frontend — `copper-crm/src/pages/admin/DocumentCenter.jsx`
- New helper `isClientVisible(doc)` (true unless `clientVisible === false` or the
  doc is internal/private).
- New `VisibilityToggle` component (the green/grey switch) — replaces the old
  static "Client Visible" badge in `DocumentRow`.
- `DocumentRow` now takes `onToggle`, `busy`, `canToggle` props.
- `FilesTable` passes `onToggle` + `togglingId` down.
- Main component:
  - `togglingId` state; pulls `save` from the `documents`, `projects`, **and**
    `invoices` hooks (`saveDocument`, `saveProject`, `saveInvoice`).
  - Each entry in `projectDocs` is tagged with `_source` = `"document"`,
    `"embedded"`, or `"invoice"` so we know which collection to update.
  - `handleToggleVisibility(doc, nextVisible)` writes the change to the right
    place: invoice → `saveInvoice`, embedded → update the parent project's
    `documents` array via `saveProject`, otherwise → `saveDocument` (also sets
    `visibility`/`scope`). **Important:** it saves the *full* record (the local
    store replaces, not merges), so look the record up from the hook's `records`
    first.

## A2 — Invoices stay in Billing (special-cased)

**Rule:** the toggle only controls the client **Documents** section. An invoice
is a record of a real purchase, so it must **always** appear in **Billing &
Invoices** and on the dashboard — even when hidden from Documents.

**`server/routes/client.js`** — the `GET /orders` handler must **not** filter by
`clientVisible`. It simply returns every order for the user:
```js
const orders = await Order.find({ "customer.customerEmail": user.email }).sort({ createdAt: -1 });
res.json(orders);
```
(If you see any "hiddenInvoices / visibleOrders" filtering in `/orders`, delete
it. Keep the filtering in `/documents` only.)

## A3 — Client portal restyled to match the admin UI

Pure visual alignment so the client portal looks like the admin app.

**`copper-crm/src/index.css`** — the `--cs-*` design tokens were retuned to the
admin palette: copper `#884c2d` / `#C57E5B`, neutrals `#111827` / `#6b7280`,
borders `#e5e7eb`, white surfaces. (This single change shifts every client page's
colors.)

**`copper-crm/src/layouts/ClientLayout.jsx`** — rewritten chrome: dark sidebar →
light `#FAFAFA` rail with `#ECECEC` border, wordmark logo
(`/copper-studio-wordmark.png`, already in `public/`), copper active pills,
collapse toggle, white header bar with bell + copper avatar.

**`ClientPages.jsx` + `ClientDashboard.jsx`:**
- Shared primitives restyled: `PageShell` (small dark title instead of giant
  copper), `Card`, `CsBtn`, `Badge`, `EmptyState`, `Spinner`.
- **All Material Symbols icons replaced with `lucide-react`** (≈38 of them).
  `CsBtn` and `EmptyState` now take a lucide **component** as their `icon` prop
  (not a string); `fileIcon()` returns a lucide component; `CsBtn` gained a
  `loading` prop for the spinner.

> If your client pages still use Material Symbols, this is the biggest diff —
> easiest to take the whole file from the branch rather than merge hunks.

## A4 — Global project switcher (NEW FILE)

**Goal:** A dropdown in the client header lets the client pick one project; the
whole portal then scopes to that project.

**NEW FILE `copper-crm/src/context/ClientProjectContext.jsx`** — copy it over
as-is. It exports:
- `ClientProjectProvider` — loads the client's projects once, holds the selected
  project id, persists it to `localStorage` (`cs_client_selected_project`).
- `useClientProject()` — `{ projects, loading, selectedId, setSelectedId, selectedProject }`.
- `belongsToProject(record, projectId)` — for meetings/documents (match on
  `projectId`; records with no `projectId` count as general).
- `orderBelongsToProject(order, project)` — for billing (match `order._id` to
  `project.orderId`, or by `projectName`).

**`ClientLayout.jsx`:**
- Wrap the whole returned layout in `<ClientProjectProvider> … </ClientProjectProvider>`.
- Add a `ProjectSwitcher` component (dropdown) into the header.

**Per-page scoping (in `ClientPages.jsx` / `ClientDashboard.jsx`):**
- **Timeline** — uses `selectedProject` from context; dropped its old left
  "pick a project" list; shows only the selected project full-width.
- **Meetings** — list/detail filtered by `belongsToProject`; new meeting requests
  are tagged with the selected `projectId`.
- **Documents** — filtered by `belongsToProject`.
- **Billing** — orders filtered by `orderBelongsToProject`; the open invoice
  auto-falls back to a valid one when the project changes.
- **Dashboard** — the three **summary cards stay account-wide** (all packages,
  all projects, all upcoming meetings); everything **below** the cards (active
  project, purchases, next meeting, recent activity) scopes to the selected
  project.

---

# Bundle B — Checkout / company linking / manual invoice / Document Center redesign

## B1 — Checkout no longer needs a company name

A buyer checks out with just their own details + a project name; the company gets
attached later by an admin.

**Behaviour now:**
- On payment, a project is created tied to the **buyer** (no company yet). The
  buyer's typed project name is preserved in the new
  `Project.clientProjectName` field.
- When an admin links the client to a company (Contact card → set company), the
  client's project, invoice, etc. are automatically pulled into that company; the
  project is **renamed** to the coded format `Company-Project N-MMYY`, and a
  project code `CS-XXXX-NN-MMYY` is assigned.

**`server/services/projectNaming.js` (NEW FILE)** — shared helpers so the
"create from order" path and the "adopt into company" path can't drift apart:
- `companyCodeFromName(name)` → first 4 **distinct** letters, padded with `X`
  (e.g. `"DATACENTRIC"` → `"DATC"`).
- `buildProjectCode(companyName, projectNumber, date)` → `CS-DATC-02-0626`.
- `buildDefaultProjectName(companyName, projectNumber, date)` →
  `"Datacentric-Project 2-0626"`.

**`server/models/Project.js`** — new field (and matching `defaults` entry):
```js
// Buyer-typed project name, preserved at checkout before a company adopts the
// project. The display name is later rewritten to the coded format on adoption.
clientProjectName: { type: String, default: "" },
```

**Other files:** `server/server.js` (checkout creates the company-less project),
`server/routes/crm.js` (admin "set company" adopts the orphan client + project
and applies the coded name/code), `copper-crm/src/pages/projects/ProjectHeader.jsx`
(surfaces the client project name / code).

> ℹ️ **No buyer-facing checkout UI changed.** This feature is backend-only — the
> server simply stopped requiring a company at checkout. There is **no** edit to
> `Payments.jsx`, the storefront, or any checkout form, so don't go looking for
> one. The only client-portal UI changes in this handoff are Bundle A's.

## B2 — Returning clients auto-link to their company

Once a client is linked to a company, every future purchase automatically lands
under that same company (correctly named/coded) — no manual linking needed.

**Also fixed a bug** where a repeat purchase wiped the client's existing company
link.

**Files:** `server/server.js`, `server/services/finance.js`.

## B3 — Manual invoice (admin-created) overhaul

`copper-crm/src/pages/billing/Invoices.jsx` (+ `server/server.js`):
- The form collects **full client info + billing** in both "Existing Company" and
  "New Company" modes.
- Added a **searchable "existing client" dropdown** that auto-fills the client and
  their company.
- **Package field is now a dropdown** (Starter / Growth / Enterprise, pulled live
  from the API) plus a **Custom** option; selecting a package auto-fills the
  amount.
- **GST fix:** the entered amount is treated as **pre-tax**, and 18% GST is added
  on top (9% CGST + 9% SGST, or 18% IGST out-of-state) — so manual invoices match
  the online packages.
- Manual invoices flow into **Analytics** and the **Document Center** just like
  online purchases.

## B4 — Project ID on the invoice PDF

The invoice PDF now prints the project code (e.g. `CS-DATC-02-0626`) so you can
tell which project an invoice belongs to straight from the document.

**Files:** `server/services/invoiceTemplate.js`, `server/routes/invoices.js`,
`server/server.js`.

## B5 — Document Center redesign

`copper-crm/src/pages/admin/DocumentCenter.jsx` (note: this file **also** carries
Bundle A's visibility toggle — keep both):
- Click a **company** → see all its documents in one place (all projects' files +
  invoices).
- Click a **project** → a **Details** tab (project info cards) + a **Documents**
  tab (only that project's files), with **breadcrumb** navigation.

## B6 — Database utility fix

`clear_db.js` was fixed so it preserves the admin account — it used to keep a
non-existent `admin` role; it now keeps `superadmin`.

---

## Verify after merging

```bash
# frontend
cd copper-crm
npm install        # only if your lockfile differs
npm run build      # should succeed
npm run lint       # should be clean for the changed files

# backend
cd ../server
node --check routes/client.js
node --check routes/crm.js
node --check services/finance.js
node --check services/projectNaming.js
node --check server.js
```

Then run the app and check:

**Bundle A**
- Admin → Documents: toggle a document's visibility; it flips green/grey.
- Client portal → Documents: a hidden doc/invoice is gone there…
- …but Client portal → Billing & Invoices: the invoice is **still there**.
- Client header: the project switcher filters Timeline/Meetings/Documents/Billing,
  while the dashboard summary cards still show all-projects totals.

**Bundle B**
- Checkout with just buyer details + a project name → a project is created with no
  company, `clientProjectName` preserved.
- Admin sets a company on that contact → project is renamed `Company-Project N-MMYY`
  and gets a `CS-XXXX-NN-MMYY` code.
- A returning linked client buys again → lands under the same company; the company
  link is **not** wiped.
- Manual invoice: package dropdown auto-fills amount; entered amount is pre-tax and
  18% GST is added on top; the invoice shows up in Analytics + Document Center.
- Open an invoice PDF → the project code is printed on it.
- Document Center: company view shows all docs; project view has Details + Documents
  tabs with breadcrumbs.
