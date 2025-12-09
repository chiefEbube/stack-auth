# Webhook Setup Guide

## Paystack Webhook Configuration

The Paystack webhook endpoint requires special configuration to handle raw body for signature verification.

### Option 1: Use Raw Body Parser (Recommended for Production)

Install the raw body parser:

```bash
npm install raw-body
```

Update `main.ts`:

```typescript
import * as express from 'express';
import { json } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true, // Enable raw body
  });

  // ... rest of configuration
}
```

### Option 2: Custom Middleware (Alternative)

Create a middleware to preserve raw body for webhook routes:

```typescript
// src/common/middleware/raw-body.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as getRawBody from 'raw-body';

@Injectable()
export class RawBodyMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    if (req.path === '/wallet/paystack/webhook') {
      req['rawBody'] = await getRawBody(req);
    }
    next();
  }
}
```

### Paystack Dashboard Configuration

1. Go to Paystack Dashboard → Settings → Webhooks
2. Add webhook URL: `https://your-domain.com/wallet/paystack/webhook`
3. Copy the webhook secret
4. Add to `.env`: `PAYSTACK_WEBHOOK_SECRET=your-secret`

### Testing Webhooks Locally

Use ngrok or similar tool to expose local server:

```bash
ngrok http 3000
```

Use the ngrok URL in Paystack webhook configuration.

### Webhook Event Types

The webhook currently processes:
- `charge.success` - Credits wallet when payment succeeds

Other events are ignored but return 200 to prevent retries.
