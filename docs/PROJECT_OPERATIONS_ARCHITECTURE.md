# Project Operations Architecture

This document is the source of truth for Copper Studio project delivery. Project Operations is the core delivery module after CRM and Finance conversion.

Finance conversion is defined in `docs/FINANCE_ARCHITECTURE.md`. Projects should be created or activated only after the finance automation rules pass.

Project files, deliverables, internal documents, and client-shared documents are defined in `docs/DOCUMENT_CENTER_ARCHITECTURE.md`.

Project updates, milestone messages, and delivery notifications should be sent and logged through `docs/COMMUNICATION_ARCHITECTURE.md`.

## Module Map

```text
Project Operations
|
+-- Projects
+-- Client Projects
+-- Kanban Board
+-- Timeline
+-- Tasks
```

## Relationship Flow

```text
Lead
  |
  v
Deal Won
  |
  v
Order Created
  |
  v
Project Created
  |
  v
Tasks Created
  |
  v
Timeline Generated
  |
  v
Client Portal Activated
  |
  v
Project Delivered
```

## 1. Projects Module

### Purpose

Projects are the master delivery records for all work.

### Projects Table

```text
Project ID
Project Name
Company
Primary Contact
Package
Project Manager
Status
Progress %
Start Date
Expected Completion
Days Remaining
```

### Project Status Flow

```text
Pending
Confirmed
Requirement Gathering
Design
Development
Testing
Review
Deployment
Completed
Cancelled
On Hold
```

### Project Workspace

```text
Project
|
+-- Overview
+-- Timeline
+-- Tasks
+-- Files
+-- Invoices
+-- Internal Notes
+-- Client Notes
+-- Team
+-- History
```

### Overview Tab

```text
Project Name
Company
Client
Package
Revenue
Project Manager
Assigned Team
Progress %
Start Date
Due Date
Current Stage
```

### KPI Cards

```text
Days Remaining
Tasks Completed
Open Tasks
Files Uploaded
Pending Payments
```

## 2. Client Projects Module

Client Projects must not duplicate Projects.

### Purpose

Client Projects is the admin-side mirror of what the client can see.

```text
Admin Project
  |
  v
Client Portal Mirror
```

### Features

```text
Client Dashboard Preview
Visible Timeline
Visible Files
Visible Invoices
Visible Deliverables
Visible Comments
```

### Admin Controls

```text
Hide Milestone
Hide Document
Hide Internal Note
Hide Task
Publish Update
```

### Client Visibility Settings

```text
Overview
Timeline
Files
Invoices
Support
Activity Feed
```

## 3. Tasks Module

### Purpose

Tasks are the actual work execution records.

### Task Fields

```text
Task ID
Task Name
Project
Assigned To
Priority
Status
Due Date
Estimated Hours
Actual Hours
```

### Task Status

```text
Backlog
To Do
In Progress
Review
Completed
Blocked
```

### Task Workspace

```text
Task
|
+-- Description
+-- Attachments
+-- Comments
+-- Activity
+-- Time Tracking
```

### Priority

```text
Critical
High
Medium
Low
```

## 4. Kanban Board

### Purpose

Kanban is the visual project execution view for tasks.

### Board Structure

```text
Backlog
To Do
In Progress
Review
Completed
```

### Card Design

```text
Task Name
Assignee
Priority
Due Date
Project
Tags
```

### Actions

```text
Drag & Drop
Quick Edit
Add Comment
Upload File
Assign User
```

## 5. Timeline Module

Timeline must be independent from Tasks.

### Purpose

Timeline tracks project milestones, not individual task execution.

### Timeline Structure

```text
Requirement Gathering
Design
Development
Testing
Review
Deployment
Delivered
```

### Timeline Item

```text
Milestone Name
Start Date
Due Date
Status
Owner
Completion %
```

### Timeline Status

```text
Upcoming
On Track
Delayed
Completed
Blocked
```

### Timeline View Types

```text
List View
Calendar View
Gantt View
```

## Project Financial Architecture

Every project should contain or link to:

```text
Project
|
+-- Orders
+-- Payments
+-- Invoices
+-- Coupons Applied
+-- Revenue
```

## Project Files Architecture

```text
Project
|
+-- Proposals
+-- Contracts
+-- Invoices
+-- Design Files
+-- Development Files
+-- Deliverables
+-- Internal Documents
+-- Client Shared Documents
```

## Notes Architecture

Internal notes and client notes must be separate.

### Internal Notes

Visible only to the admin team.

Examples:

```text
Client is asking for extra revisions.
Payment follow-up required.
Need approval from founder.
```

### Client Notes

Visible to the client.

Examples:

```text
Development completed.
Testing phase started.
Deployment scheduled.
```

## History / Audit Trail

Every project should automatically log:

```text
Project Created
Task Added
Task Completed
Invoice Generated
Payment Received
File Uploaded
Status Changed
Milestone Completed
```

## Database Relationship

```text
Project
|
+-- Company
+-- Contact
+-- Tasks[]
+-- Timeline[]
+-- Files[]
+-- Invoices[]
+-- Payments[]
+-- Notes[]
+-- Activity[]
```

## Sidebar Mapping

```text
Projects
  +-- Master Project Workspace

Client Projects
  +-- Client Visibility Management

Kanban Board
  +-- Task Execution View

Timeline
  +-- Milestone Management

Tasks
  +-- Detailed Task Management
```

## Implementation Principles

- Do not duplicate Projects data inside Client Projects.
- Client Projects is a visibility and publishing layer over the master Project.
- Keep Timeline independent from Tasks.
- Keep Internal Notes separate from Client Notes.
- Project financial records should be linked to orders, invoices, payments, coupons, and revenue.
- Project files must distinguish internal documents from client-shared documents.
- Project file storage and sharing should use the Document Center architecture.
- Project started, project update, testing started, milestone completed, and project delivered events should be logged through Communication.
- Every meaningful project change should create an audit event.
- Finance should be architected next because it connects Razorpay, package purchase, orders, invoices, payments, and project creation.
