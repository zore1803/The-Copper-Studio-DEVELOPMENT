# The Copper Studio Architecture Foundation

## Purpose
The Copper Studio is a MERN-based SaaS application structured around three clear product areas:

1. Public Website
2. Pricing & Checkout
3. Portal

This document defines the application boundary, module ownership, access model, and the rules that keep the codebase maintainable as the platform grows.

## Product Areas

### 1) Public Website
The public website is the top-of-funnel presence for the business and is fully accessible without authentication.

Core pages:
- Landing Page
- Services
- About
- Contact

Responsibilities:
- Present the brand and value proposition
- Drive users toward pricing and contact actions
- Collect basic inbound interest without exposing portal functionality

### 2) Pricing & Checkout
The pricing flow is intentionally hidden from the public navigation and is used for conversion and account creation.

Core capabilities:
- Hidden pricing page
- Package selection
- User information collection
- Razorpay integration
- Account creation after successful payment

Responsibilities:
- Validate the selected package before checkout
- Send payment metadata to the payment provider
- Create the account only after payment confirmation
- Attach the purchased package to the created client record

### 3) Portal
The portal is the authenticated application area. It uses a shared login system and role-based dashboards.

Responsibilities:
- Authenticate users centrally
- Authorize access by role and resource ownership
- Present dashboard experiences based on role
- Keep client and admin capabilities separate

## Roles

### client
Client users can only access their own portal data.

Allowed actions:
- View project timeline
- View meetings
- View deliverables
- View invoices
- Update profile

Restrictions:
- Cannot access other clients' records
- Cannot manage admin resources
- Cannot access admin routes

### admin
Admin users operate the full system workflow.

Allowed actions:
- Manage clients
- Manage projects
- Manage timelines
- Manage meetings
- Manage deliverables
- Manage packages
- Manage pricing
- Manage coupons
- Manage invoices
- Manage portal content
- View analytics

Restrictions:
- Cannot access client routes
- Must still respect centralized authentication and auditability
- Must not bypass ownership checks where resource scope applies

## Folder Structure

The repository is organized by domain and capability:

```text
src/
  modules/
    customer/
    admin/
    shared/
```

### Module Intent
- `customer/` contains customer-facing portal logic and resources
- `admin/` contains internal administration logic and resources
- `shared/` contains reusable code only

### Architectural Rules
- Customer module cannot modify admin module
- Admin module cannot modify customer module
- Shared module contains reusable code only
- No duplicate APIs
- No duplicate models
- Authentication must be centralized
- Role-based access control must be enforced everywhere
- All privileged flows must be auditable

## Application Flow

### Public to Checkout
1. A visitor lands on the public website.
2. The visitor reviews services or submits a contact request.
3. The visitor opens the hidden pricing page.
4. The visitor selects a package and provides user information.
5. The system initiates Razorpay checkout.
6. Payment confirmation triggers account creation.
7. The new user receives access to the portal.

### Portal Access
1. The user signs in through the shared login system.
2. Authentication validates identity centrally.
3. Authorization resolves the user role.
4. If the role is `client`, the user is redirected to `/dashboard`.
5. If the role is `admin`, the user is redirected to `/admin/dashboard`.
6. Each dashboard only exposes role-appropriate actions.

## Backend Design Principles

### Authentication
- Use one centralized authentication system
- Reuse auth logic across portal areas instead of duplicating it
- Keep token/session validation in shared infrastructure

### Authorization
- Enforce role-based access control at the API layer
- Enforce ownership checks for client-specific resources
- Treat role checks and ownership checks as separate concerns

### Data Modeling
- Define a single model per business entity
- Keep models normalized and reusable across modules
- Avoid duplicate representations of the same business concept
- The user role field must use `enum: ["client", "admin"]` with `default: "client"`
- Package data must be sourced from MongoDB only
- Package records include `name`, `description`, `price`, `currency`, `duration`, `features`, `isActive`, `createdAt`, and `updatedAt`

### API Design
- Expose one canonical API per feature
- Keep admin and customer endpoints separated by intent, not by copy
- Place shared validation and utility logic in shared infrastructure

## Recommended Domain Boundaries

### Public Domain
- Marketing pages
- Lead capture
- Contact forms

### Commerce Domain
- Packages
- Pricing
- Checkout
- Payment verification
- Account provisioning

### Portal Domain
- Profiles
- Projects
- Timelines
- Meetings
- Deliverables
- Invoices

### Administration Domain
- Client management
- Package management
- Pricing management
- Coupon management
- Invoice management
- Portal content management
- Analytics

## Quality Bar
The foundation should remain simple, predictable, and scalable.

Expected standards:
- Keep module responsibilities narrow
- Prefer explicit ownership over shared mutation
- Avoid circular dependencies
- Keep sensitive operations centralized
- Document any new boundary before implementation

## Suggested Next Step
After this foundation, define the module-by-module API contract and database entities before writing implementation code.
