import { CarbonAPIClient } from "../src";
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
        // Handle batch completion
        break;

      case "batch.failed":
        console.log("Batch failed:", event.data);
        // Handle batch failure
        break;

      case "document.completed":
        console.log("Document processed:", event.data);
        // Handle document processing completion
        break;

      case "document.failed":
        console.log("Document processing failed:", event.data);
        // Handle document processing failure
        break;

      default:
        console.log("Unknown event type:", event.type);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Webhook verification failed:", error);
    res.status(400).json({ error: "Webhook verification failed" });
  }
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Webhook server listening on port ${port}`);
});
