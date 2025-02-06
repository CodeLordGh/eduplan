# Payment Service Development Plan

## Service Overview
The Payment Service handles all financial transactions, including school fees, feeding fees, and other charges. It manages payment processing, transaction tracking, and invoice generation.

## Dependencies

### Shared Libraries
```typescript
// From @eduflow/common
import { createLogger, ErrorHandler, CurrencyUtils } from '@eduflow/common'

// From @eduflow/types
import { Transaction, Invoice, PaymentMethod, PaymentStatus } from '@eduflow/types'

// From @eduflow/validators
import { validatePayment, validateInvoice } from '@eduflow/validators'

// From @eduflow/middleware
import { authGuard, roleGuard, paymentGuard } from '@eduflow/middleware'

// From @eduflow/constants
import { PAYMENT_TYPES, TRANSACTION_STATUS } from '@eduflow/constants'
```

### External Dependencies
```json
{
  "dependencies": {
    "fastify": "^4.21.0",
    "@fastify/swagger": "^8.8.0",
    "zod": "^3.22.2",
    "pg": "^8.11.3",
    "@prisma/client": "^5.2.0",
    "stripe": "^13.4.0",
    "paystack": "^2.0.1",
    "flutterwave-node-v3": "^1.1.6",
    "@fastify/redis": "^6.1.1",
    "ioredis": "^5.3.2",
    "pdf-lib": "^1.17.1"
  },
  "devDependencies": {
    "prisma": "^5.2.0",
    "jest": "^29.6.4",
    "typescript": "^5.2.2"
  }
}
```

## Database Schema (Prisma)
```prisma
model Transaction {
  id            String            @id @default(uuid())
  userId        String
  amount        Decimal
  currency      String
  type          TransactionType
  status        TransactionStatus
  paymentMethod PaymentMethod
  reference     String            @unique
  metadata      Json?
  createdAt     DateTime          @default(now())
  updatedAt     DateTime          @updatedAt

  @@index([userId, status])
  @@map("transactions")
}

model Invoice {
  id          String        @id @default(uuid())
  userId      String
  schoolId    String
  items       Json          // Line items
  amount      Decimal
  currency    String
  dueDate     DateTime
  status      InvoiceStatus
  metadata    Json?
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  @@map("invoices")
}

model PaymentPlan {
  id          String    @id @default(uuid())
  userId      String
  invoiceId   String
  frequency   String    // WEEKLY, MONTHLY, etc.
  amount      Decimal
  startDate   DateTime
  endDate     DateTime?
  status      PlanStatus
  metadata    Json?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@map("payment_plans")
}

model Wallet {
  id        String   @id @default(uuid())
  userId    String   @unique
  balance   Decimal
  currency  String
  status    WalletStatus
  metadata  Json?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("wallets")
}

model WalletTransaction {
  id        String               @id @default(uuid())
  walletId  String
  amount    Decimal
  type      WalletTransactionType
  reference String               @unique
  metadata  Json?
  createdAt DateTime             @default(now())

  @@map("wallet_transactions")
}
```

## Event System

### Events Published
```typescript
type PaymentEvents = {
  PAYMENT_PROCESSED: {
    transactionId: string
    userId: string
    amount: number
    currency: string
    status: TransactionStatus
    timestamp: Date
  }
  PAYMENT_FAILED: {
    transactionId: string
    userId: string
    reason: string
    timestamp: Date
  }
  INVOICE_GENERATED: {
    invoiceId: string
    userId: string
    amount: number
    dueDate: Date
    timestamp: Date
  }
  WALLET_UPDATED: {
    walletId: string
    userId: string
    balance: number
    type: 'CREDIT' | 'DEBIT'
    timestamp: Date
  }
}
```

### Events Consumed
```typescript
type ConsumedEvents = {
  USER_CREATED: {
    userId: string
    email: string
  }
  SCHOOL_CREATED: {
    schoolId: string
    name: string
  }
  KYC_VERIFIED: {
    userId: string
    documentType: string
  }
  SCHOOL_VERIFIED: {
    schoolId: string
    verificationId: string
  }
}
```

## API Endpoints

### Payment Processing
```typescript
// POST /payments
type CreatePaymentRequest = {
  userId: string
  amount: number
  currency: string
  type: PaymentType
  paymentMethod: PaymentMethod
  metadata?: Record<string, unknown>
}

// GET /payments/:paymentId
type GetPaymentResponse = Transaction & {
  receipt?: string // URL to receipt
}
```

### Invoice Management
```typescript
// POST /invoices
type CreateInvoiceRequest = {
  userId: string
  schoolId: string
  items: Array<{
    description: string
    amount: number
    quantity: number
  }>
  dueDate: Date
  metadata?: Record<string, unknown>
}

// GET /users/:userId/invoices
type GetInvoicesResponse = {
  invoices: Invoice[]
  summary: {
    total: number
    paid: number
    pending: number
  }
}
```

### Wallet Management
```typescript
// POST /wallets/:walletId/deposit
type WalletDepositRequest = {
  amount: number
  paymentMethod: PaymentMethod
  metadata?: Record<string, unknown>
}

// POST /wallets/:walletId/withdraw
type WalletWithdrawRequest = {
  amount: number
  bankAccount: {
    accountNumber: string
    bankCode: string
  }
}
```

## Implementation Plan

### Phase 1: Core Payment Processing
1. Payment gateway integration
2. Transaction handling
3. Receipt generation
4. Payment validation

### Phase 2: Invoice System
1. Invoice generation
2. Payment plans
3. Due date tracking
4. Automated reminders

### Phase 3: Wallet System
1. Wallet management
2. Balance tracking
3. Transaction history
4. Auto-deduction setup

### Phase 4: Integration Features
1. Multiple payment methods
2. Payment analytics
3. Reporting system
4. Audit logging

## Testing Strategy

### Unit Tests
```typescript
// Payment service tests
describe('PaymentService', () => {
  test('should process payments')
  test('should handle failed payments')
  test('should generate receipts')
})

// Invoice service tests
describe('InvoiceService', () => {
  test('should generate invoices')
  test('should calculate totals')
  test('should track due dates')
})
```

### Integration Tests
```typescript
describe('Payment API', () => {
  test('should handle payment flow')
  test('should manage invoices')
  test('should handle wallet operations')
  test('should integrate with payment gateways')
})
```

## Monitoring & Logging

### Metrics
- Transaction success rate
- Payment processing time
- Invoice payment rate
- Wallet usage statistics
- Gateway response times

### Logging
```typescript
const logger = createLogger({
  service: 'payment-service',
  level: process.env.LOG_LEVEL || 'info',
  metadata: {
    version: process.env.APP_VERSION
  }
})
```

## Security Measures
1. Payment data encryption
2. Secure gateway integration
3. Transaction verification
4. Fraud detection rules
5. Audit trail maintenance 