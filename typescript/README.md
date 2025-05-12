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

// Upload a batch of documents
const batchResponse = await client.uploadBatch({
  type: "url",
  documents: [
    {
      fileUrl: "https://example.com/document.pdf",
      categoryHint: "TRAVEL_AIR_TICKET",
      meta: {
        source: "example",
      },
    },
  ],
});
console.log("Batch ID:", batchResponse.batchId);

// Get batch status and documents
const batchStatus = await client.getBatch(batchResponse.batchId);
console.log("Batch Status:", batchStatus.status);
console.log("Documents:", batchStatus.documents);
```

### Webhook Handling

The SDK includes built-in webhook verification using Svix. Here's how to handle webhooks:

```typescript
import { CarbonAPIClient } from "@carbonapi/typescript-sdk";
import express from "express";

const app = express();
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
      case "batch.completed":
        console.log("Batch completed:", event.data);
        break;
      case "batch.failed":
        console.log("Batch failed:", event.data);
        break;
      case "document.completed":
        console.log("Document processed:", event.data);
        break;
      case "document.failed":
        console.log("Document processing failed:", event.data);
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
- `uploadBatch(batch: BatchDocuments)`: Upload a batch of documents for processing
- `getBatch(batchId: string)`: Get the status and documents for a batch
- `verifyWebhook(payload: string, headers: Record<string, string>)`: Verify and parse a webhook payload
- `verifyWebhookRequest(request: Request)`: Verify and parse a webhook payload from a raw request

### Webhook Events

The SDK supports the following webhook event types:

- `batch.completed`: Emitted when a batch of documents has been processed
- `batch.failed`: Emitted when a batch of documents has failed processing
- `document.completed`: Emitted when a single document has been processed
- `document.failed`: Emitted when a single document has failed processing

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
