# Enterprise-Grade Wallet Service

A production-ready wallet service built with NestJS, TypeORM, PostgreSQL, Paystack integration, JWT authentication, and API key management.

## 🚀 Features

- **Google OAuth Authentication** → JWT tokens
- **API Key Management** with permissions (deposit, transfer, read)
- **Wallet System** with unique wallet numbers
- **Paystack Integration** for deposits
- **Atomic Transfers** with database transactions
- **Webhook Processing** with signature validation
- **Comprehensive Security** (Helmet, CORS, Rate Limiting)
- **Enterprise Architecture** (Modular, DDD, Clean Code)

## 📋 Prerequisites

- Node.js (v18+)
- PostgreSQL (v14+)
- npm or yarn

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd stack-auth
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   # Server
   NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
   DB_PASSWORD=your_password
   DB_NAME=wallet_db

   # JWT
   JWT_SECRET=your-super-secret-jwt-key-min-32-chars
   JWT_EXPIRES_IN=7d

   # Google OAuth
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

   # Paystack
   PAYSTACK_SECRET_KEY=sk_test_xxxxx
   PAYSTACK_PUBLIC_KEY=pk_test_xxxxx
   PAYSTACK_WEBHOOK_SECRET=your-webhook-secret

   # CORS
   CORS_ORIGIN=http://localhost:3000
   ```

4. **Set up PostgreSQL database**
```bash
   createdb wallet_db
```

5. **Run migrations** (if using migrations instead of synchronize)
```bash
npm run migration:run
```

6. **Start the application**
   ```bash
   # Development
   npm run start:dev

   # Production
   npm run build
   npm run start:prod
   ```

## 📚 API Documentation

Once the server is running, access Swagger documentation at:
```
http://localhost:3000/docs
```

## 🔐 Authentication

### Google OAuth Flow

1. **Initiate OAuth**
   ```
   GET /auth/google
   ```
   Redirects to Google OAuth consent screen.

2. **Callback**
   ```
   GET /auth/google/callback?code=xxx&state=xxx
   ```
   Returns JWT token and user information.

### API Keys

1. **Create API Key** (Requires JWT)
   ```
   POST /keys/create
   Authorization: Bearer <jwt_token>
   Body: {
     "permissions": ["deposit", "transfer", "read"],
     "expiry": "1M"
   }
   ```
   Returns API key (store securely - shown only once).

2. **Rollover Expired Key** (Requires JWT)
   ```
   POST /keys/rollover
   Authorization: Bearer <jwt_token>
   Body: {
     "keyId": "uuid",
     "expiry": "1M"
   }
   ```

3. **Revoke API Key** (Requires JWT)
   ```
   DELETE /keys/:id
   Authorization: Bearer <jwt_token>
   ```

4. **List API Keys** (Requires JWT)
   ```
   GET /keys
   Authorization: Bearer <jwt_token>
   ```

## 💰 Wallet Operations

### Deposit

1. **Initialize Deposit** (JWT or API Key with `deposit` permission)
   ```
   POST /wallet/deposit
   Authorization: Bearer <jwt_token>
   # OR
   X-API-Key: sk_live_xxxxx
   Body: {
     "amount": 500000  // in kobo
   }
   ```
   Returns Paystack authorization URL.

2. **Check Deposit Status**
   ```
   GET /wallet/deposit/:reference/status
   Authorization: Bearer <jwt_token>
   # OR
   X-API-Key: sk_live_xxxxx
   ```

### Transfer

**Transfer Funds** (JWT or API Key with `transfer` permission)
```
POST /wallet/transfer
Authorization: Bearer <jwt_token>
# OR
X-API-Key: sk_live_xxxxx
Body: {
  "recipientWalletNumber": "12345678901234",
  "amount": 100000  // in kobo
}
```

### Balance & Transactions

1. **Get Balance** (JWT or API Key with `read` permission)
   ```
   GET /wallet/balance
   Authorization: Bearer <jwt_token>
   # OR
   X-API-Key: sk_live_xxxxx
   ```

2. **Get Transactions** (JWT or API Key with `read` permission)
   ```
   GET /wallet/transactions?limit=50&offset=0
   Authorization: Bearer <jwt_token>
   # OR
   X-API-Key: sk_live_xxxxx
   ```

## 🔔 Webhook

**Paystack Webhook** (No authentication - signature validated)
```
POST /wallet/paystack/webhook
X-Paystack-Signature: <signature>
Body: <Paystack event>
```

Configure webhook URL in Paystack dashboard:
```
https://your-domain.com/wallet/paystack/webhook
```

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📁 Project Structure

```
src/
  config/              # Configuration files
  common/              # Shared utilities
    guards/            # Authentication & authorization guards
    interceptors/      # Request/response interceptors
    decorators/        # Custom decorators
  modules/
    auth/              # Authentication module (Google OAuth, JWT)
    api-keys/          # API key management
    wallet/            # Wallet operations
    transactions/      # Transaction entities
    paystack/          # Paystack integration
    users/             # User management
  database/
    migrations/        # Database migrations
  main.ts              # Application entry point
```

## 🔒 Security Features

- **JWT Authentication** with expiration
- **API Key Hashing** using bcrypt
- **Webhook Signature Validation**
- **Rate Limiting** (100 requests/minute)
- **Helmet** for security headers
- **CORS** configuration
- **Input Validation** with class-validator
- **SQL Injection Protection** via TypeORM
- **No Secret Logging** in interceptors

## 📝 API Key Permissions

- `deposit`: Initialize Paystack deposits
- `transfer`: Transfer funds between wallets
- `read`: View balance and transactions

JWT tokens have full access to all endpoints.

## 🚨 Error Handling

The API returns proper HTTP status codes:
- `400` - Bad Request (validation errors, insufficient balance)
- `401` - Unauthorized (invalid/missing auth)
- `403` - Forbidden (missing permissions)
- `404` - Not Found (wallet/transaction not found)
- `500` - Internal Server Error

## 🔄 Database Transactions

Wallet transfers use atomic database transactions to ensure:
- Balance checks
- Deduction from sender
- Credit to recipient
- Transaction log creation
- All-or-nothing execution

## 📦 Dependencies

- **NestJS** - Framework
- **TypeORM** - ORM
- **PostgreSQL** - Database
- **Passport** - Authentication
- **JWT** - Token management
- **Paystack** - Payment gateway
- **bcrypt** - API key hashing
- **Joi** - Environment validation
- **Helmet** - Security headers
- **Swagger** - API documentation

## 🐛 Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running
- Check database credentials in `.env`
- Ensure database exists

### Paystack Webhook Not Working
- Verify webhook secret matches Paystack dashboard
- Check webhook URL is accessible
- Ensure raw body is being parsed correctly

### API Key Validation Failing
- Check key format: `sk_live_<hex>`
- Verify key hasn't expired
- Ensure key isn't revoked

## 📄 License

[Your License Here]

## 👥 Contributors

[Your Name/Team]

---

**Built with ❤️ using NestJS**
