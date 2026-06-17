# Services Architecture

Services is Copper Studio's sales tooling layer. It sits between CRM and Finance.

Generated proposal PDFs, shared proposal links, and related client documents should be stored through `docs/DOCUMENT_CENTER_ARCHITECTURE.md`.

Proposal and coupon messages should be sent and logged through `docs/COMMUNICATION_ARCHITECTURE.md`.

Most CRMs stop at:

```text
Lead
  |
  v
Deal
  |
  v
Invoice
```

Copper Studio's platform supports:

```text
Lead
  |
  v
Proposal
  |
  v
Coupon
  |
  v
Order
  |
  v
Payment
  |
  v
Project
```

## Module Map

```text
Services
|
+-- Proposal Generator
+-- Coupon Generator
```

## Relationship Flow

```text
Lead
  |
  v
Proposal Created
  |
  v
Coupon Generated
  |
  v
Client Accepts
  |
  v
Order Created
  |
  v
Payment
```

## 1. Proposal Generator

The Proposal Generator should be treated as a workspace, not a simple form.

Think:

```text
Canva
+
Notion
+
PandaDoc
```

### Purpose

Generate professional project proposals.

### Proposal Lifecycle

```text
Draft
Generated
Sent
Viewed
Accepted
Rejected
Expired
```

### Proposal Table

```text
Proposal ID
Client
Company
Project Type
Package
Value
Status
Created Date
Expiry Date
```

### Proposal Workspace

```text
Proposal
|
+-- Overview
+-- Content Builder
+-- Pricing
+-- Timeline
+-- PDF Preview
+-- Client Activity
+-- History
```

### Overview Tab

```text
Proposal Name
Client
Company
Project Type
Package
Value
Expiry Date
Proposal Status
```

### Content Builder

The proposal should be built from sections, not one large text area.

```text
Cover Page
About Copper Studio
Project Understanding
Scope of Work
Deliverables
Pricing
Timeline
Terms & Conditions
Contact Information
```

### Cover Page

```text
Proposal Title
Client Name
Company
Date
Prepared By
```

### About Section

```text
About Copper Studio
Mission
Services
Portfolio Highlights
```

### Scope of Work

```text
What is Included
What is Excluded
Responsibilities
```

### Deliverables

```text
Website
CRM
Admin Panel
Mobile App
SEO Setup
```

### Pricing Section

```text
Package Price
Custom Add-ons
Discount
GST
Total Amount
```

### Timeline Section

```text
Requirement Gathering
Design
Development
Testing
Deployment
```

### PDF Preview

Proposal PDF preview should be live, side-by-side, and visual like a Canva-style canvas.

### Client Activity

Track:

```text
Proposal Opened
Proposal Downloaded
Proposal Accepted
Proposal Rejected
```

### Actions

```text
Save Draft
Generate PDF
Send Email
Share Link
Duplicate
Archive
```

### Proposal Database

```javascript
Proposal {
  _id,
  proposalId,
  companyId,
  contactId,
  projectType,
  packageId,
  value,
  status,
  sections: [],
  sentAt,
  viewedAt,
  acceptedAt
}
```

### Proposal Acceptance Flow

```text
Proposal Accepted
  |
  v
Create Deal
  |
  v
Create Order
  |
  v
Generate Invoice
```

## 2. Coupon Generator

The Coupon Generator should be a marketing and conversion tool, not just a table.

### Purpose

Generate discounts and track their impact.

### Coupon Lifecycle

```text
Draft
Active
Redeemed
Expired
Cancelled
Revoked
```

### Coupon Dashboard KPI Cards

```text
Active Coupons
Redeemed
Expired
Revenue Influenced
Conversion Rate
```

### Coupon Table

```text
Coupon Code
Discount
Company
Contact
Created Date
Expiry Date
Status
Orders Generated
```

### Coupon Workspace

```text
Coupon
|
+-- Overview
+-- Usage Analytics
+-- Assigned Clients
+-- Related Orders
+-- Activity
```

### Coupon Creation Wizard

Step 1: Coupon Type

```text
Percentage
Fixed Amount
```

Step 2: Discount Value

```text
10%
15%
20%
Rs 1000
Rs 5000
```

Step 3: Validity

```text
Start Date
Expiry Date
Usage Limit
```

Step 4: Assignment

```text
Company
Contact
Lead
Deal
```

### Coupon Code Format

```text
COP-STU-25A
COP-GRO-30B
COP-ENT-40C
```

or:

```text
XXX-XXX-XXX
```

### Coupon Analytics

Track:

```text
Times Used
Revenue Generated
Orders Created
Conversion Rate
```

### Activity Log

```text
Coupon Created
Coupon Sent
Coupon Applied
Coupon Redeemed
Coupon Expired
```

### Coupon Database

```javascript
Coupon {
  _id,
  code,
  type,
  value,
  assignedCompany,
  assignedContact,
  validFrom,
  validTo,
  usageLimit,
  usageCount,
  revenueGenerated,
  status
}
```

## Combined Services Flow

```text
Lead
  |
  v
Proposal Generator
  |
  v
Proposal Sent
  |
  v
Coupon Generator
  |
  v
Discount Offered
  |
  v
Client Accepts
  |
  v
Deal Won
  |
  v
Order
  |
  v
Payment
```

## Future Enhancement

Services may eventually be renamed to Sales Tools.

Future structure:

```text
Sales Tools
|
+-- Proposal Generator
+-- Coupon Generator
+-- Quotation Builder
+-- Package Builder
+-- Contract Generator
```

These are not operational services. They are tools used to convert leads into paying clients.

## Implementation Principles

- Services sits between CRM and Finance.
- Proposal Generator should be a workspace with structured sections and live preview.
- Coupon Generator should track conversion impact, not only discount metadata.
- Proposals should link to `companyId`, `contactId`, package, value, and lifecycle status.
- Coupons should link to assigned company, contact, lead, or deal when applicable.
- Proposal acceptance should create or update the deal, then feed Finance order and invoice creation.
- Coupon redemption should be visible in Finance and attributable to orders and revenue generated.
- Generated proposal documents should be versioned and shared through Document Center.
- Proposal sent, proposal viewed, coupon sent, and coupon redeemed events should be logged through Communication.
