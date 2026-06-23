# CRM Architecture

This document is the source of truth for Copper Studio CRM relationships before UI, drawers, tables, or API details are built.

## Core Rule

Everything revolves around the company.

```text
Company
  |
  +-- Contacts
  +-- Leads
  +-- Deals
  +-- Orders
  +-- Projects
  +-- Invoices
  +-- Documents
```

The CRM modules are:

```text
CRM
|
+-- Companies
+-- Contacts
+-- Leads
+-- Deals
```

## Real Copper Studio Flow

```text
Website Lead
  |
  v
Lead
  |
  v
Qualified
  |
  v
Proposal Sent
  |
  v
Deal Created
  |
  v
Won
  |
  v
Order
  |
  v
Invoice
  |
  v
Project
  |
  v
Client Portal
```

## 1. Companies

### Purpose

A company is the top-level business entity.

Examples:

```text
TCS
Infosys
Google
ABC Pvt Ltd
```

### Company Table

```text
Company ID
Company Name
Legal Name
GST Number
Industry
Type
Employee Count
Revenue Generated
Projects Count
Status
```

### Company Workspace

```text
Company
|
+-- Overview
+-- Contacts
+-- Leads
+-- Deals
+-- Projects
+-- Invoices
+-- Documents
+-- Activity
```

### Overview Tab

```text
Company Information
GST
Addresses
Website
Social Links
Total Revenue
Projects
Last Activity
```

### Data Model

```javascript
Company {
  _id,
  companyId,
  companyName,
  legalName,
  gstNumber,
  industry,
  type,
  employeeCount,
  website,
  socialLinks,
  billingAddress,
  shippingAddress,
  status,
  createdAt
}
```

## 2. Contacts

### Purpose

Contacts are people inside a company.

Example:

```text
Infosys
|
+-- Rohit
+-- Amit
+-- Priya
```

### Contact Fields

```text
Salutation
First Name
Last Name
Email
Phone
WhatsApp
Position
LinkedIn
Associated Company
```

### Contact Workspace

```text
Contact
|
+-- Overview
+-- Communication
+-- Projects
+-- Deals
+-- Activity
```

### Overview

```text
Profile
Company
Designation
WhatsApp
Email
LinkedIn
```

### Communication

```text
Emails
WhatsApp Messages
Calls
```

### Data Model

```javascript
Contact {
  _id,
  companyId,
  salutation,
  firstName,
  lastName,
  email,
  phone,
  whatsapp,
  linkedin,
  designation,
  status
}
```

## 3. Leads

### Purpose

Leads are potential customers.

Lead sources:

```text
Website
Package Checkout
Consultation Form
Manual Entry
Referral
```

### Lead Pipeline

```text
New
Contacted
Qualified
Proposal Sent
Negotiation
Won
Lost
```

### Lead Fields

```text
Lead Name
Company
Contact
Lead Source
Expected Value
Assigned To
Status
```

### Lead Workspace

```text
Lead
|
+-- Overview
+-- Notes
+-- Proposal
+-- Activity
+-- Conversion
```

### Conversion

```text
Convert Lead
  |
  v
Create Company
Create Contact
Create Deal
```

One-click conversion should create or link the company, create or link the contact, and create the deal.

### Data Model

```javascript
Lead {
  _id,
  companyId,
  contactId,
  source,
  status,
  expectedValue,
  assignedTo,
  notes
}
```

## 4. Deals

### Purpose

Deals track money and commercial progress.

Example:

```text
CRM Development
Rs 50,000
Negotiation Stage
```

### Deal Pipeline

```text
New
Qualified
Proposal Sent
Negotiation
Won
Lost
```

### Deal Fields

```text
Deal Name
Company
Contact
Package
Value
Probability
Expected Close Date
Stage
```

### Deal Workspace

```text
Deal
|
+-- Overview
+-- Proposal
+-- Payments
+-- Activity
+-- Conversion
```

### Deal Conversion

When a deal becomes `Won`, the system should create:

```text
Order Created
Invoice Created
Project Created
```

Flow:

```text
Won
  |
  v
Create Order
  |
  v
Create Project
```

### Data Model

```javascript
Deal {
  _id,
  companyId,
  contactId,
  dealName,
  value,
  probability,
  stage,
  expectedCloseDate
}
```

## Implementation Principles

- Do not design CRM screens in isolation. Every module should be company-aware.
- Prefer `companyId` and `contactId` relationships over name-based matching.
- Every table should support a drill-down workspace.
- Every workspace should expose linked records first, then activity.
- Lead conversion and deal conversion are first-class workflows, not side effects hidden in forms.
- Services conversion is defined in `docs/SERVICES_ARCHITECTURE.md`.
- Finance conversion is defined in `docs/FINANCE_ARCHITECTURE.md`.
- Project delivery is defined in `docs/PROJECT_OPERATIONS_ARCHITECTURE.md`.
- Document storage and sharing is defined in `docs/DOCUMENT_CENTER_ARCHITECTURE.md`.
- Client communication is defined in `docs/COMMUNICATION_ARCHITECTURE.md`.
- After lead qualification, proposals and coupons should flow through Services before Finance and Project Operations.
