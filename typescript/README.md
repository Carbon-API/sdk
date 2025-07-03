# CarbonAPI TypeScript SDK

A TypeScript SDK for interacting with the CarbonAPI, featuring full type safety and automatic type generation from OpenAPI specifications.

## Installation

```bash
npm install @carbonapi/typescript-sdk
# or
yarn add @carbonapi/typescript-sdk
# or
pnpm add @carbonapi/typescript-sdk
```

## Usage

### Basic Usage

```typescript
import { CarbonAPIClient } from "@carbonapi/typescript-sdk";

// Initialize the client with your API key
const client = new CarbonAPIClient({
  apiKey: "your-api-key-here",
  // Optional: Override the default base URL
  // baseURL: 'https://custom-api-url.com',
});

// Create a batch of transactions
const transactionBatchResponse = await client.createTransactionBatch([
  {
    amount: 100.0,
    currency: "AUD",
    category: "TRAVEL_AIR",
    date: "2024-03-20",
    meta: {
      source: "example",
    },
  },
]);

// Get transaction batch status
const transactionBatchStatus = await client.getTransactionBatch(
  transactionBatchResponse[0].batchId
);

console.log("Transaction Batch Status:", transactionBatchStatus.status);
console.log("Transactions:", transactionBatchStatus.transactions);
```

### Webhook Handling

The SDK includes built-in webhook verification. Here's how to handle webhooks:

```typescript
import { CarbonAPIClient } from "@carbonapi/typescript-sdk";
import express from "express";

const app = express();

// Remember to use RAW body type, otherwise this won't work as expected!
app.use(express.raw({ type: "application/json" }));

// Initialize the client with your API key and webhook secret
const client = new CarbonAPIClient({
  apiKey: "your-api-key-here",
  webhookSecret: "your-webhook-secret-here",
});

// Example webhook handler using Express
app.post("/webhook", async (req, res) => {
  try {
    // Verify and parse the webhook payload
    const event = await client.verifyWebhookRequest(req);

    // Handle different webhook event types
    switch (event.type) {
      case "transaction.batch.completed":
        console.log("Batch completed:", event.data);
        break;
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Webhook verification failed:", error);
    res.status(400).json({ error: "Webhook verification failed" });
  }
});
```

## API Reference

### CarbonAPIClient

The main client class for interacting with the CarbonAPI.

#### Constructor

```typescript
new CarbonAPIClient(config: CarbonAPIConfig)
```

##### Configuration Options

- `apiKey` (required): Your CarbonAPI API key
- `baseURL` (optional): Custom base URL for the API (default: 'https://api.au.carbonapi.io/api')
- `webhookSecret` (optional): Your webhook signing secret for verifying webhook payloads

#### Methods

- `getClient()`: Returns the underlying typed openapi-fetch client
- `createDocumentEmissionsBatch(batch: BatchDocuments)`: Upload a batch of documents for processing
- `getDocumentEmissionsBatch(batchId: string)`: Get the status and documents for a batch
- `createTransactionBatch(batch: BatchTransactions)`: Create a batch of transactions
- `getTransactionBatch(batchId: string)`: Get the status and transactions for a batch
- `verifyWebhook(payload: string, headers: Record<string, string>)`: Verify and parse a webhook payload
- `verifyWebhookRequest(request: Request)`: Verify and parse a webhook payload from a raw request

### Webhook Events

The SDK supports webhook events with the following structure:

```typescript
interface WebhookEvent {
  id: string;
  type: string;
  data: unknown;
  timestamp: number;
}
```

The event type and data structure will depend on the specific webhook event being received.

## Development

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Build the SDK:
   ```bash
   pnpm run build
   ```
4. Run tests:
   ```bash
   pnpm test
   ```

## License

MIT
