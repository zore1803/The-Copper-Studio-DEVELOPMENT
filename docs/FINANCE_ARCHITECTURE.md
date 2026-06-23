# Finance Architecture

Finance is not just accounting in Copper Studio. It is the revenue engine that connects package purchase, coupon application, Razorpay payment, order creation, invoice generation, and project activation.

Services conversion is defined in `docs/SERVICES_ARCHITECTURE.md`. Proposals and coupons feed Finance orders, payments, invoices, and project activation.

Invoice PDFs and finance documents should be stored through `docs/DOCUMENT_CENTER_ARCHITECTURE.md`.

Payment, invoice, refund, and reminder messages should be sent and logged through `docs/COMMUNICATION_ARCHITECTURE.md`.

## Revenue Engine Flow

```text
Package Purchase
  |
  v
Coupon
  |
  v
Razorpay Payment
  |
  v
Order
  |
  v
Invoice
  |
  v
Project Activation
```

## Module Map

```text
Finance
|
+-- Orders
+-- Payments
+-- Invoices
+-- Coupons
```

## Relationship Architecture

```text
Company
  |
  v
Order
  |
  v
Coupon Applied
  |
  v
Payment
  |
  v
Invoice
  |
  v
Project Created
```

## 1. Orders Module

### Purpose

Orders represent purchase intent.

Example:

```text
Order #ORD-1001
Growth Package
Rs 49,999
Pending Payment
```

### Order Status Flow

```text
Created
Pending Payment
Paid
Failed
Refunded
Cancelled
```

### Orders Table

```text
Order ID
Company
Client
Package
Coupon Applied
Amount
Order Date
Payment Status
Project Status
```

### Order Workspace

```text
Order
|
+-- Overview
+-- Payment
+-- Invoice
+-- Coupon
+-- Customer
+-- Activity
```

### Overview Tab

```text
Order Number
Package Purchased
Original Amount
Discount Applied
Final Amount
Customer Information
Order Date
```

### Activity Log

```text
Order Created
Coupon Applied
Payment Initiated
Payment Completed
Invoice Generated
```

### Database Model

```javascript
Order {
  _id,
  orderId,
  companyId,
  contactId,
  packageId,
  couponId,
  amount,
  discount,
  finalAmount,
  status,
  razorpayOrderId,
  createdAt
}
```

## 2. Payments Module

### Purpose

Payments track actual money.

```text
Orders = Purchase Intent
Payments = Money Received
```

### Payment Status

```text
Pending
Processing
Success
Failed
Refunded
Partially Refunded
```

### Payments Table

```text
Payment ID
Order ID
Company
Amount
Method
Gateway
Date
Status
```

### Payment Methods

```text
UPI
Credit Card
Debit Card
Net Banking
Wallet
```

### Payment Workspace

```text
Payment
|
+-- Overview
+-- Razorpay Details
+-- Refunds
+-- Activity
```

### Razorpay Section

```text
Razorpay Order ID
Razorpay Payment ID
Gateway Response
Transaction Date
```

### Refund Flow

```text
Payment
  |
  v
Refund Requested
  |
  v
Approved
  |
  v
Refunded
```

### Database Model

```javascript
Payment {
  _id,
  paymentId,
  orderId,
  razorpayOrderId,
  razorpayPaymentId,
  amount,
  paymentMethod,
  status,
  refundedAmount
}
```

## 3. Invoices Module

### Purpose

Invoices are legal billing documents.

### Invoice Types

```text
Proforma Invoice
Tax Invoice
Final Invoice
Credit Note
```

### Invoice Status

```text
Draft
Generated
Sent
Paid
Overdue
Cancelled
```

### Invoice Table

```text
Invoice Number
Company
Project
Amount
GST
Issue Date
Due Date
Status
```

### Invoice Workspace

```text
Invoice
|
+-- Preview
+-- PDF
+-- Customer
+-- Payment Mapping
+-- Activity
```

### Invoice PDF

The invoice PDF contains:

```text
Invoice Number
Company Details
GST
Line Items
Subtotal
Tax
Discount
Total
Payment Status
```

### Actions

```text
Generate PDF
Download
Email
Share Link
```

### Database Model

```javascript
Invoice {
  _id,
  invoiceNumber,
  companyId,
  orderId,
  paymentId,
  subtotal,
  tax,
  discount,
  total,
  status
}
```

## 4. Coupons Module

Coupons are a unique Copper Studio feature and part of the revenue engine.

### Coupon Status

```text
Active
Redeemed
Expired
Cancelled
Revoked
```

### Coupon Format

```text
XXX-XXX-XXX
```

Example:

```text
COP-STU-25A
```

### Coupons Table

```text
Coupon Code
Created Date
Expiry Date
Discount Type
Discount Value
Client
Company
Status
```

### Coupon Types

```text
Percentage
Fixed Amount
```

### Coupon Workspace

```text
Coupon
|
+-- Overview
+-- Usage
+-- Assigned Client
+-- Orders
+-- Activity
```

### Usage Analytics

```text
Times Used
Revenue Influenced
Orders Generated
Last Redeemed
```

### Coupon Generator Fields

```text
Coupon Code
Discount Type
Discount Amount
Validity Start
Validity End
Usage Limit
Assigned Company
Assigned Contact
```

### Database Model

```javascript
Coupon {
  _id,
  code,
  type,
  value,
  validFrom,
  validUntil,
  usageLimit,
  usageCount,
  status
}
```

## Finance Dashboard

Finance should have a dashboard above all finance modules.

### KPI Cards

```text
Total Revenue
Monthly Revenue
Pending Payments
Successful Payments
Refunded Amount
Active Coupons
```

### Charts

```text
Revenue Trend
Payment Success Rate
Coupon Usage
Revenue by Package
```

## Automation Flow

```text
Order Created
  |
  v
Coupon Applied
  |
  v
Razorpay Payment Success
  |
  v
Payment Record Created
  |
  v
Invoice Generated
  |
  v
Project Activated
  |
  v
Client Portal Access Granted
```

## Database Relationship

```text
Company
|
+-- Orders
+-- Payments
+-- Invoices
+-- Coupons
```

Linked order relationship:

```text
Order
|
+-- Payment
+-- Invoice
+-- Coupon
+-- Project
```

## Implementation Principles

- Orders represent purchase intent. Payments represent actual money received.
- Every finance record should link back to `companyId` and, where available, `contactId`.
- Razorpay identifiers should be stored separately from internal order and payment identifiers.
- Coupons must be auditable: assigned company/contact, usage count, revenue influenced, and last redeemed.
- Invoice generation should be triggered by successful payment, but invoices remain their own legal records.
- Generated invoice PDFs should be stored and shared through Document Center.
- Payment success, invoice generated, payment reminder, and refund events should be logged through Communication.
- Project activation should happen only after the correct payment and invoice automation rules pass.
- Services feeds Finance through accepted proposals, redeemed coupons, and created orders.
