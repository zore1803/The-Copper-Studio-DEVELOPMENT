# The Copper Studio Rules

## Scope
These rules apply to the entire codebase unless a deeper document states otherwise.

## Core Development Rules
- Build only within the approved module boundary
- Do not create duplicate APIs
- Do not create duplicate models
- Keep shared code reusable and domain-neutral
- Keep authentication centralized
- Enforce role-based access control on every protected route
- Enforce ownership checks for client-specific resources
- Do not mix customer and admin responsibilities in one module

## Module Boundaries

### customer
- Customer code may only serve customer-facing portal behavior
- Customer code cannot modify admin domain logic
- Customer code cannot import admin-only implementation details

### admin
- Admin code may only serve internal management behavior
- Admin code cannot modify customer domain logic
- Admin code cannot import customer-only implementation details

### shared
- Shared code must be reusable
- Shared code must not contain business logic that belongs only to one role
- Shared code is the only place for common utilities, guards, validators, and primitives

## Authentication Rules
- All sign-in, token validation, and session handling must use one centralized system
- Do not implement separate auth flows for customer and admin
- Do not duplicate auth middleware across modules when a shared implementation exists
- Recovery and verification flows must use the same identity source

## Authorization Rules
- Access must be granted by authenticated identity plus explicit role
- `client` users may only access their own records
- `admin` users may manage the full system
- Never rely on the UI alone for security

## Payment and Checkout Rules
- Pricing remains hidden from public navigation
- Checkout must validate the selected package before payment starts
- Razorpay payment confirmation must be verified before account creation
- Account creation must occur only after successful payment verification
- Payment state must be traceable and auditable

## Data Rules
- One business entity should map to one canonical model
- Do not create separate models for the same concept in different modules
- Use shared schema fragments only when they are truly reusable
- Protect all user-owned data with ownership checks
- Package data must come from MongoDB only

## API Rules
- Keep APIs canonical and intentional
- Avoid duplicate endpoints for the same operation
- Prefer module-specific route grouping over feature duplication
- Keep sensitive routes behind auth and role guards

## Git and Delivery Rules
- No direct pushes to `main`
- Work through branches and reviewed changes
- Keep changes scoped to the owning module
- Document boundary changes before implementation

## Architecture Rules
- Public website must remain separate from portal logic
- Checkout must remain separate from portal management logic
- Portal dashboards must be role-driven
- Only `client` and `admin` roles may exist
- Admin capabilities must remain centralized under `admin`

## Review Checklist
Before merging any change, confirm:
- The module boundary is respected
- No duplicate API was introduced
- No duplicate model was introduced
- Authentication is centralized
- RBAC is enforced
- Ownership checks are present where needed
- No direct `main` branch push path was introduced
- Role definitions are limited to `client` and `admin`
