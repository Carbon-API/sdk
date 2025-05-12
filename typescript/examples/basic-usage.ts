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

    // Example: Get batch status and documents
    const batchId = batchResponse.batchId;
    if (batchId) {
      const batchStatus = await client.getBatch(batchId);
      console.log("Batch Status:", batchStatus.status);
      console.log("Documents:", batchStatus.documents);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

main().catch(console.error);
