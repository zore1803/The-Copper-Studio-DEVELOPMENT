# Communication Architecture

Communication is not only template storage. For Copper Studio, it should become a complete Client Communication Center.

Every proposal, coupon, payment, invoice, and project update flows through this communication layer.

## Module Map

```text
Communication
|
+-- Email Templates
+-- WhatsApp Templates
+-- Communication Logs
+-- Scheduled Messages
+-- Campaigns
+-- Activity Feed
```

## Relationship Architecture

```text
Lead
  |
  v
Proposal
  |
  v
Communication
  |
  +-- Email
  +-- WhatsApp
  +-- Activity
  |
  v
Client
```

Every communication should be linked to:

```text
Company
Contact
Lead
Deal
Project
```

## 1. Email Templates

### Purpose

Reusable email templates.

### Categories

```text
Welcome
Consultation Booked
Proposal Sent
Proposal Reminder
Coupon Issued
Payment Success
Invoice Generated
Project Started
Project Update
Testing Started
Project Delivered
Support Follow-up
```

### Template Workspace

```text
Email Template
|
+-- Overview
+-- Editor
+-- Preview
+-- Variables
+-- Usage Analytics
```

### Template Editor

Use:

```text
Subject
Email Body
Variables
Attachments
```

### Dynamic Variables

```text
{{client_name}}
{{company_name}}
{{proposal_id}}
{{invoice_id}}
{{coupon_code}}
{{project_name}}
{{project_status}}
{{payment_amount}}
```

Example:

```text
Hello {{client_name}},

Your proposal {{proposal_id}}
is ready for review.
```

### Actions

```text
Save Draft
Preview
Send Test Email
Duplicate
Archive
```

## 2. WhatsApp Templates

### Purpose

Quick customer communication.

### Categories

```text
OTP
Proposal Sent
Coupon Shared
Payment Received
Invoice Generated
Project Started
Milestone Completed
Project Delivered
Reminder
```

### WhatsApp Template Workspace

```text
Template
|
+-- Message Builder
+-- Variables
+-- Preview
+-- Usage Analytics
```

### Example

```text
Hello {{client_name}}

Your project
{{project_name}}
has moved to
{{project_status}}

The Copper Studio
```

### Template Status

If using Meta WhatsApp Business API:

```text
Draft
Pending Approval
Approved
Rejected
Archived
```

## 3. Communication Logs

Communication Logs are the most important part of this module.

Most CRMs hide communication history. Copper Studio should centralize it.

### Purpose

Complete communication audit trail.

### Communication Timeline

```text
10:00 AM
Proposal Email Sent

10:30 AM
Proposal Opened

11:15 AM
WhatsApp Reminder Sent

12:20 PM
Client Replied
```

### Log Types

```text
Email Sent
Email Opened
Email Clicked
WhatsApp Sent
WhatsApp Delivered
WhatsApp Read
Client Reply
Call Logged
```

### Filters

```text
Company
Project
Client
Date
Communication Type
```

## 4. Scheduled Messages

Scheduled Messages power automated communication.

### Examples

```text
Send proposal reminder after 3 days
Send payment reminder after 5 days
Send project update every Friday
```

### Workflow

```text
Trigger
  |
  v
Template
  |
  v
Schedule
  |
  v
Send
```

## 5. Campaigns

Campaigns support future growth.

### Examples

```text
Black Friday Offer
New Service Launch
Website Package Discount
Coupon Campaign
```

### Campaign Metrics

```text
Emails Sent
Open Rate
Click Rate
Replies
Conversions
```

## 6. Activity Feed

Real-time communication activity.

### Feed Examples

```text
Rohit received Proposal
ABC Company opened Invoice
Coupon Redeemed
Payment Reminder Sent
Project Update Sent
```

## Email Workflow Architecture

```text
Lead
  |
  v
Proposal Created
  |
  v
Proposal Email Sent
  |
  v
Proposal Opened
  |
  v
Reminder Sent
  |
  v
Accepted
```

## WhatsApp Workflow Architecture

```text
Coupon Generated
  |
  v
WhatsApp Sent
  |
  v
Delivered
  |
  v
Read
  |
  v
Coupon Redeemed
```

## Database Architecture

### Email Templates

```javascript
EmailTemplate {
  _id,
  name,
  category,
  subject,
  content,
  variables: [],
  status
}
```

### WhatsApp Templates

```javascript
WhatsAppTemplate {
  _id,
  name,
  category,
  content,
  variables: [],
  status
}
```

### Communication Logs

```javascript
CommunicationLog {
  _id,
  companyId,
  contactId,
  projectId,
  type,
  channel,
  status,
  subject,
  content,
  sentAt,
  deliveredAt,
  openedAt
}
```

## UI Architecture

```text
Communication
|
+-- Overview Dashboard
+-- Email Templates
+-- WhatsApp Templates
+-- Communication Logs
+-- Scheduled Messages
+-- Activity Feed
```

## KPI Cards

At the top of Communication:

```text
Emails Sent
Email Open Rate
WhatsApp Sent
WhatsApp Read Rate
Replies Received
Conversions
```

## Long-Term Vision

Eventually this module should feel closer to:

```text
HubSpot Communications
Intercom Inbox
Customer.io
Mailchimp
```

than a simple template manager.

## Implementation Principles

- Communication should be an audit layer across the whole product.
- Communication logs are as important as templates.
- Every sent email, WhatsApp message, reply, open, click, and read event should be logged.
- Every communication should link to company, contact, lead, deal, and project when applicable.
- Templates must support variables and previews.
- Proposal, coupon, payment, invoice, and project update flows should emit communication events.
- Scheduled messages should be workflow-driven, not manually duplicated reminders.
