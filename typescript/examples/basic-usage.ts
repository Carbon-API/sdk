import { CarbonAPIClient } from "../src";

async function main() {
  // Initialize the client with your API key
  const client = new CarbonAPIClient({
    apiKey: "your-api-key-here",
    // Optional: Override the default base URL
    // baseURL: 'https://custom-api-url.com',
  });

  try {
    // Example: Create a batch of transactions
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

    const batchId = batchResponse.batchIds[0];

    if (batchId) {
      const batchStatus = await client.getTransactionBatch(batchId);
      console.log("Batch Status:", batchStatus.status);
      console.log("Transactions:", batchStatus.transactions);
    }

    // Example: Submit a document batch as Base64 content (NZL only)
    const documentBatch = await client.createDocumentEmissionsBatch({
      type: "base64",
      countryCode: "NZL",
      documents: [
        {
          content: Buffer.from("%PDF-1.4 example").toString("base64"),
          contentType: "application/pdf",
          fileId: "invoice-001",
          categoryHint: "FUEL",
        },
      ],
    });

    const documentStatus = await client.getDocumentEmissionsBatch(
      documentBatch.batchId,
    );
    console.log("Document batch status:", documentStatus.status);
    if (documentStatus.status === "Error") {
      console.log(
        "Failure:",
        documentStatus.failureCode,
        documentStatus.failureReason,
      );
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

main().catch(console.error);
