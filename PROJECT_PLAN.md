# The Copper Studio Project Plan

## Canonical Design Direction

Use the quieter editorial studio system across the entire product:

- Headlines: Eb Garamond
- Body: Barlow Condensed
- Labels and metadata: Courier Prime
- Primary color: muted copper brown, `#6e5b48`
- Background: warm off-white, `#fff8f5`
- Shape language: restrained 4-8px radii, light borders, minimal shadows

The Storefront Home page should be rebuilt on this same system before React componentization. Avoid carrying forward a separate Inter/Playfair/orange-brown visual language.

## Commercial Flow

The public site is meeting-gated. Visitors should not see fixed package pricing or reach a pay-now flow before a consultation and approved quotation.

Primary public CTA:

- Book a Consultation

Checkout rules:

- Checkout is only reachable from the authenticated/client portal flow after a quotation is approved.
- Order summary content must render from a Quotation record, not static package pricing.
- Coupon/promo codes can remain, but only as adjustments against an approved quoted total.
- No public pricing tiers should appear on the Services page.

## MERN Build Notes

When moving from static HTML to MERN:

- Set up Tailwind through Vite rather than Tailwind CDN.
- Lift the canonical tokens into `tailwind.config.js`.
- Split the interface into shared components: Navbar, Footer, Hero, ServiceCard, AccordionItem, ConsultationCTA, QuoteSummary, CheckoutForm.
- Replace static checkout data with quotation-driven state from the API.
- Home animation can be a real CSS copper gradient animation; avoid the old `{{DATA:ANIMATION:ANIMATION_1}}` placeholder.

## CRM Architecture

The CRM relationship model is locked in `docs/CRM_ARCHITECTURE.md`.

Core rule:

- Company is the top-level entity.
- Contacts, leads, deals, orders, projects, invoices, and documents must link back to a company.
- Lead conversion creates or links a company, contact, and deal.
- Won deal conversion creates an order, invoice, and project.
- CRM UI, API routes, and data models should be designed from this relationship structure before visual polish.

## Project Operations Architecture

The project delivery model is locked in `docs/PROJECT_OPERATIONS_ARCHITECTURE.md`.

Core rule:

- Projects are the master delivery records.
- Client Projects is a visibility and publishing layer, not duplicate project data.
- Kanban is for task execution.
- Timeline is for milestone management and must stay independent from tasks.
- Internal notes and client-visible notes must be separate.
- Project history should automatically log status changes, task events, invoice events, payment events, file uploads, and milestone completion.
- Finance should be architected next because orders, invoices, payments, coupons, and Razorpay directly create and fund projects.

## Finance Architecture

The revenue engine is locked in `docs/FINANCE_ARCHITECTURE.md`.

Core rule:

- Orders represent purchase intent.
- Payments represent actual money received.
- Coupons can modify order value and must remain auditable.
- Razorpay identifiers must be stored separately from internal identifiers.
- Successful payment should create the payment record, generate the invoice, activate the project, and grant client portal access.
- Finance must stay linked to company, contact, order, invoice, payment, coupon, and project records.
- Services should be architected next because proposal generation and coupon generation feed directly into sales and finance.

## Services Architecture

The sales tooling layer is locked in `docs/SERVICES_ARCHITECTURE.md`.

Core rule:

- Services sits between CRM and Finance.
- Proposal Generator is a workspace, not a single form.
- Proposals are built from structured sections with live PDF preview.
- Coupon Generator is a marketing and conversion tool, not just discount storage.
- Proposal acceptance should create or update a deal, then feed order and invoice creation.
- Coupon redemption should be attributable to company, contact, order, and revenue generated.
- This module may later become Sales Tools with Proposal Generator, Coupon Generator, Quotation Builder, Package Builder, and Contract Generator.

## Document Center Architecture

The file and sharing system is locked in `docs/DOCUMENT_CENTER_ARCHITECTURE.md`.

Core rule:

- Document Center is the single source of truth for company, project, invoice, proposal, contract, and deliverable files.
- The experience should be folder-first, not table-first.
- Files should link to company and project whenever possible.
- Visibility must be explicit: private, internal team, project team, or client visible.
- Client-visible documents power the Client Portal documents view.
- Deliverables and important documents require version history.
- Every upload, edit, delete, share, and download should create an activity event.

## Communication Architecture

The client communication center is locked in `docs/COMMUNICATION_ARCHITECTURE.md`.

Core rule:

- Communication is an audit layer across CRM, Services, Finance, Projects, and Document Center.
- Templates are only one part of the module; communication logs are the core.
- Emails, WhatsApp messages, replies, opens, clicks, reads, calls, and reminders should be logged.
- Every communication should link to company, contact, lead, deal, and project when applicable.
- Proposal, coupon, payment, invoice, document sharing, and project update flows should emit communication events.
- Scheduled messages and campaigns should be workflow-driven.

## UI Sections to Preserve

The static prototype now includes the core UI blocks to carry into React:

- Trust strip with business-model promises instead of fake client logos.
- Consultation-to-quotation journey timeline.
- Before/after workflow comparison.
- Client portal preview with quote status, metrics, mini timeline, and animated progress.
- Consultation request form with service intent, studio size, timeline, and email fields.
- Checkout progress strip and quotation snapshot before billing details.

These should become data-driven components, but the structure and motion language can stay.

## Shipping Flags

- Social proof names such as MAISON, ARCADE, STUDIO 8, PRISM, and VELVET are prototype placeholders and must be replaced or removed before launch.
- Legal pages are lightweight placeholders and need proper review before production.
