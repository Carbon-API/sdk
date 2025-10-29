import { CarbonAPIClient } from "../src";

async function main() {
  // Initialize the client with your API key
  const client = new CarbonAPIClient({
    apiKey: "your-api-key-here",
    // Optional: Override the default base URL
    // baseURL: 'https://custom-api-url.com',
    // Optional: Set a custom timeout
    // timeout: 5000,
  });

  try {
    // Example: Upload a batch of documents
    const batchResponse = await client.createTransactionBatch({
      transactions: [
        {
          id: "123",
          date: "2025-05-13T03:52:52Z",
          tax: 10,
          total: 100,
          subtotal: 90,
          description: "Amazon.com",
          supplierName: "Amazon",
          sourceAccount: "Office Expenses",
          currency: "NZD",
        },
      ],
      countryCode: "NZL",
      factorClass: "commodity",
    });

    // Example: Get batch status and documents
    const batchId = batchResponse.batchIds[0];

    if (batchId) {
      const batchStatus = await client.getTransactionBatch(batchId);
      console.log("Batch Status:", batchStatus.status);
      console.log("Transactions:", batchStatus.transactions);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

main().catch(console.error);
