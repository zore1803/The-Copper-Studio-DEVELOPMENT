# Document Center Architecture

Document Center is not just file storage. It is the single source of truth for every company, project, invoice, proposal, contract, and deliverable.

Document sharing, downloads, and client notifications should be logged through `docs/COMMUNICATION_ARCHITECTURE.md` when they involve client-facing communication.

## Module Map

```text
Document Center
|
+-- Company Folders
+-- Project Folders
+-- Internal Documents
+-- Client Shared Documents
```

## Relationship Architecture

```text
Company
|
+-- Projects
+-- Invoices
+-- Proposals
+-- Contracts
+-- Deliverables
```

## Main Structure

Design Document Center around structured folders:

```text
Documents
|
+-- Companies
+-- Projects
+-- Internal
+-- Shared With Clients
```

Do not design it as:

```text
Random Files
Random Uploads
```

## 1. Company Folders

### Purpose

Company folders contain everything related to a company.

### Structure

```text
Infosys
|
+-- Contacts
+-- Proposals
+-- Contracts
+-- Invoices
+-- Projects
+-- Shared Files
```

### Workspace

```text
Company Folder
|
+-- Overview
+-- Documents
+-- Shared Files
+-- Contracts
+-- Activity
```

### Overview

```text
Company Name
Total Documents
Last Upload
Storage Used
Active Projects
```

### File Types

```text
PDF
DOCX
XLSX
PPT
Images
ZIP
URLs
```

## 2. Project Folders

Project folders will be one of the most-used areas.

### Structure

```text
CRM Development
|
+-- Proposal
+-- Contract
+-- Invoice
+-- Design Files
+-- Development Files
+-- Testing Reports
+-- Deliverables
+-- Client Files
```

### Project Workspace

```text
Project
|
+-- Files
+-- Deliverables
+-- Versions
+-- Shared
+-- Activity
```

### Deliverables

```text
Source Code
APK
Website Backup
Deployment Credentials
Documentation
```

### Versioning

Keep version history:

```text
Website_v1.zip
Website_v2.zip
Website_v3.zip
```

## 3. Internal Documents

Internal documents are admin-only documents.

### Structure

```text
Internal
|
+-- SOPs
+-- Team Documents
+-- HR
+-- Templates
+-- Branding
+-- Legal
```

### Examples

```text
Proposal Template
Invoice Template
Contract Template
Brand Guidelines
Onboarding Checklist
```

### Permissions

```text
Admin
Project Manager
Sales
Operations
```

Clients never see internal documents.

## 4. Client Shared Documents

Client Shared Documents are visible inside the Client Portal.

### Structure

```text
Client Shared
|
+-- Proposals
+-- Contracts
+-- Invoices
+-- Progress Reports
+-- Deliverables
+-- Manuals
```

### Client View

```text
Proposal.pdf
Contract.pdf
Invoice.pdf
Project Progress.pdf
SourceCode.zip
```

## Folder Workspace Architecture

Do not build a boring table as the primary experience.

The main experience should be:

```text
Documents
  |
  v
Grid View
```

Example:

```text
Folder: Infosys
Folder: TCS
Folder: Reliance
Folder: Internal
```

### Folder Drill-Down

Clicking a folder opens a breadcrumb path:

```text
Infosys / CRM Project / Deliverables
```

### Right Panel

The right panel should show:

```text
File Details
Owner
Created Date
Size
Version
Shared Status
```

## Upload System

### Upload Types

```text
File Upload
Folder Upload
External URL
Google Drive Link
Figma Link
GitHub Link
```

### Metadata

Every document should store:

```text
Name
Type
Owner
Company
Project
Version
Visibility
Tags
```

## Visibility Architecture

Visibility is critical.

### Visibility Levels

```text
Private
Internal Team
Project Team
Client Visible
```

Examples:

```text
Proposal.pdf
Visible To: Client
```

```text
Internal Notes.pdf
Visible To: Admin Only
```

## Activity Center

Every file action should be logged:

```text
Document Uploaded
Document Edited
Document Deleted
Document Shared
Document Downloaded
```

## Search Architecture

Global search should work across all folders.

Example search:

```text
CRM Proposal
```

Possible results:

```text
Proposal.pdf
CRM Contract.pdf
CRM Invoice.pdf
```

## Database Architecture

```javascript
Document {
  _id,
  companyId,
  projectId,
  folderId,
  fileName,
  fileType,
  storageUrl,
  version,
  uploadedBy,
  visibility,
  tags,
  createdAt
}
```

## Final Sidebar Structure

```text
Document Center
|
+-- Company Folders
+-- Project Folders
+-- Internal Documents
+-- Client Shared Documents
```

## UI Recommendation

Do not design this like a CRM page.

Design it like:

```text
Google Drive
Notion
Dropbox
Linear attachments
```

The experience should be folder-first with:

```text
Grid View
List View
Version History
Sharing Controls
Activity Logs
```

This makes Document Center feel like a premium feature rather than another file upload page.

## Implementation Principles

- Document Center is folder-first, not table-first.
- Documents must link to company and project whenever possible.
- Proposals, contracts, invoices, deliverables, and internal files should all live in the same document model.
- Visibility must be explicit and enforceable.
- Client-visible documents must power the Client Portal documents view.
- Version history must be retained for deliverables and important documents.
- Every document action must create an activity event.
- Document shared, document downloaded, and client-visible document notifications should be logged through Communication where applicable.
- Global search should index document name, company, project, tags, file type, and folder path.
