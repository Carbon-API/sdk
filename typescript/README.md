# CarbonAPI TypeScript SDK

A TypeScript SDK for interacting with the CarbonAPI, featuring full type safety and automatic type generation from OpenAPI specifications.

## Requirements

- An API key from the CarbonAPI Portal (https://portal.carbonapi.io)
- A webhook signing secret from your project page (only if you verify webhooks with this SDK)

## Installation

```bash
npm install @carbonapi/typescript-sdk
# or
yarn add @carbonapi/typescript-sdk
# or
pnpm add @carbonapi/typescript-sdk
```

## Usage

### Basic usage

```typescript
import { CarbonAPIClient } from "@carbonapi/typescript-sdk";

// Initialize the client with your API key
const client = new CarbonAPIClient({
  apiKey: "your-api-key-here",
  // Optional: Override the default base URL
  // baseURL: "https://custom-api-url.com/",
  // Optional: Pin the API version header (default: latest)
  // version: VERSIONS.V2025_10_01,
});

// Create a batch of transactions
const transactionBatchResponse = await client.createTransactionBatch({
  transactions: [
    {
      id: "123",
      date: "2025-05-13T03:52:52Z",
      tax: 10,
      total: 100,
      subtotal: 90,
      description: "Purchase of new laptop",
      supplierName: "Mighty Ape",
      sourceAccount: "Office Expenses",
      currency: "NZD",
    },
  ],
  countryCode: "NZL",
  factorClass: "commodity",
});

// Get transaction batch status
const batchId = transactionBatchResponse.batchIds[0];
const transactionBatchStatus = await client.getTransactionBatch(batchId);

console.log("Transaction batch status:", transactionBatchStatus.status);
console.log("Transactions:", transactionBatchStatus.transactions);
```

Request and response bodies are typed from the OpenAPI spec—use your editor’s autocomplete on `client` calls and the published `.d.ts` for this package.

### API version

The client sends `x-api-version` on every request. You can import `VERSIONS` and pass `version` in the constructor to pin a specific release:

```typescript
import { CarbonAPIClient, VERSIONS } from "@carbonapi/typescript-sdk";

const client = new CarbonAPIClient({
  apiKey: "your-api-key-here",
  version: VERSIONS.V2025_10_01,
});
```

### Supplier emissions

Resolve a single supplier synchronously (name, country, amount, and currency are required query parameters; optional disambiguation hints are supported):

```typescript
const estimate = await client.searchSupplierSync({
  name: "Air New Zealand",
  countryCode: "NZL",
  amount: 100,
  currency: "NZD",
});
```

For up to 100 suppliers at a time, submit a batch, wait for the `supplier.batch.completed` webhook (or poll), then fetch results:

```typescript
const created = await client.createSupplierBatch({
  suppliers: [
    {
      id: "row-1",
      name: "Air New Zealand",
      countryCode: "NZL",
      amount: 100,
      currency: "NZD",
    },
  ],
});

const supplierBatchId = created.batchIds[0];
const results = await client.getSupplierBatch(supplierBatchId);
```

### Webhook handling

The SDK verifies webhook signatures using [Svix](https://www.svix.com/) (same as the CarbonAPI portal). Use a **raw** JSON body in your HTTP framework so the signature matches the bytes CarbonAPI sent.

```typescript
import { CarbonAPIClient } from "@carbonapi/typescript-sdk";
import express from "express";

const app = express();

// Remember to use RAW body type, otherwise verification will fail
app.use(express.raw({ type: "application/json" }));

const client = new CarbonAPIClient({
  apiKey: "your-api-key-here",
  webhookSecret: "your-webhook-secret-here",
});

app.post("/webhook", async (req, res) => {
  try {
    const event = await client.verifyWebhookRequest(req);

    switch (event.type) {
      case "transaction.batch.completed":
        console.log("Transaction batch:", event.batchId);
        break;
      case "document.batch.completed":
        console.log("Document batch:", event.batchId);
        break;
      case "supplier.batch.completed":
        console.log("Supplier batch:", event.batchId);
        break;
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Webhook verification failed:", error);
    res.status(400).json({ error: "Webhook verification failed" });
  }
});
```

`verifyWebhook` is available if you already have a string payload and headers map instead of a `Request`.

## API reference

### `CarbonAPIClient`

#### Constructor

`new CarbonAPIClient(config: CarbonAPIConfig)`

| Option | Required | Description |
|--------|----------|-------------|
| `apiKey` | Yes | CarbonAPI API key |
| `baseURL` | No | API base URL (default: `https://api.aws-au.carbonapi.io/`) |
| `webhookSecret` | No | Signing secret for `verifyWebhook` / `verifyWebhookRequest` |

#### Methods

| Method | Description |
|--------|-------------|
| `getClient()` | Underlying typed [openapi-fetch](https://openapi-ts.pages.dev/openapi-fetch/) client for direct access to all paths |
| `createDocumentEmissionsBatch` | `POST /document/batch` |
| `getDocumentEmissionsBatch` | `GET /document/batch/{id}` |
| `createTransactionBatch` | `POST /transaction/batch` |
| `getTransactionBatch` | `GET /transaction/batch/{batchId}` |
| `calculatePreCategorisedTransactions` | `POST /transaction/pre-categorised` |
| `listTaxonomies` | `GET /taxonomy/commodity` |
| `listCommodityUrnsUnderPrefix` | `GET /taxonomy/commodity/{parentUrn}` (pass the parent URN; encode reserved characters in the path as required) |
| `searchSupplierSync` | `GET /supplier/search/sync` |
| `createSupplierBatch` | `POST /supplier/search/batch` |
| `getSupplierBatch` | `GET /supplier/batch/{batchId}` |
| `verifyWebhook` | Verify and parse a raw payload + headers |
| `verifyWebhookRequest` | Verify and parse a Web `Request` |

Retries with exponential backoff are applied to the HTTP calls above (not to webhook verification).

### Exports

- `VERSIONS` — supported `x-api-version` values
- `CarbonAPIConfig` — client constructor options
- `WebhookEvent` — shape returned by webhook verification

### `WebhookEvent`

Verified webhooks match this structure:

```typescript
interface WebhookEvent {
  type:
    | "document.batch.completed"
    | "transaction.batch.completed"
    | "supplier.batch.completed";
  batchId: string;
  organisationId: string;
  projectId: string;
  timestamp: string;
}
```

### Transaction batch item shape

When creating a transaction batch, each item follows the API schema (see generated types). Typical fields include:

```typescript
interface TransactionDTO {
  id: string;
  date: string; // ISO 8601
  subtotal: number;
  tax: number;
  total: number;
  description: string;
  supplierName: string;
  sourceAccount: string;
  currency: string;
}
```

For standalone types, use the schema names in the package’s TypeScript declarations (generated from OpenAPI), or the `openapi.json` / `src/types/api.ts` file in the SDK repository.

## Development

1. Clone the repository
2. Install dependencies: `npm install` (or `pnpm install`)
3. Build: `npm run build`
4. Run tests: `npm test`

## License

MIT
