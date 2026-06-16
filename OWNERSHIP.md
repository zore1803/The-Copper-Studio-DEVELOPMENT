# The Copper Studio Ownership Map

## Ownership Model
This document defines who owns what in the architecture so the codebase stays modular and safe to extend.

## Top-Level Ownership

### Public Website
Owner:
- `shared` for reusable UI and utilities

Purpose:
- Marketing and inbound conversion
- Public pages only

Ownership rule:
- The public website must not depend on admin-only or customer-only implementation details

### Pricing & Checkout
Owner:
- `shared` for reusable checkout utilities
- `customer` for user-facing purchase flow

Purpose:
- Hidden pricing
- Package selection
- Payment initiation
- Payment confirmation
- Account creation handoff

Ownership rule:
- Checkout logic must stay in one canonical flow
- Payment verification must not be duplicated in multiple modules

### Portal
Owner:
- `customer` for client-facing portal experiences
- `admin` for internal management experiences and full system control
- `shared` for common auth and UI primitives

Purpose:
- Centralized login
- Role-based dashboards
- Secure resource access

Ownership rule:
- Each role owns only its own user experience and data access surface

## Module Ownership

### `src/modules/customer/`
Owns:
- Client portal pages
- Client profile updates
- Client timeline views
- Client meetings views
- Client deliverables views
- Client invoices views

Does not own:
- Admin management screens
- Admin-only workflows
- System pricing management

### `src/modules/admin/`
Owns:
- Admin dashboards
- Client management
- Project management
- Timeline management
- Meeting management
- Deliverable uploads
- Package management
- Pricing management
- Coupon management
- Invoice management
- Portal content management
- Analytics

Does not own:
- Customer-only portal experience
- Customer-facing account behavior
- Duplicate auth implementations

### `src/modules/shared/`
Owns:
- Authentication primitives
- Authorization guards
- Shared validation
- Shared UI components
- Shared utilities
- Shared API clients when truly reusable

Does not own:
- Role-specific business logic
- Duplicate copies of module-specific APIs
- Duplicate domain models

## Role Ownership

### client
Owned surface:
- Personal portal data
- Personal profile
- Personal invoices
- Personal deliverables

Boundary:
- The client role owns only self-service access to its own records

### admin
Owned surface:
- Full system management
- Operational client management
- Projects
- Timelines
- Meetings
- Deliverables
- Packages
- Pricing
- Coupons
- Invoices
- Portal content
- Analytics

Boundary:
- The admin role owns platform governance and delivery operations

## API Ownership Principles
- Each API endpoint must have a single module owner
- Shared APIs belong in `shared` only if they are truly reusable
- A feature must not be implemented twice in different modules
- Cross-module data access must happen through explicit contracts, not ad hoc imports

## Model Ownership Principles
- Every domain model has one source of truth
- If two modules need the same model, they should import it from the canonical owner
- No module may define its own copy of another module's entity
- Role definitions must remain limited to `client` and `admin`

## Change Ownership Workflow
1. Identify the owning module
2. Check whether the change affects shared infrastructure
3. Confirm whether the change introduces a new model or API
4. Update the architecture docs before implementation if boundaries change
5. Keep the change inside the owning module unless a shared contract is required

## Escalation Rule
If a proposed change crosses module ownership boundaries, pause and confirm the design before implementation.
