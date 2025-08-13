import createClient from "openapi-fetch";
import { Webhook } from "svix";
import { backOff } from "exponential-backoff";
import type { paths } from "./types/api";
import type { components } from "./types/api";
import packageJson from "../package.json";

export interface CarbonAPIConfig {
  apiKey: string;
  baseURL?: string;
  webhookSecret?: string;
}

type WebhookType = "document.batch.completed" | "transaction.batch.completed";

export interface WebhookEvent {
  type: WebhookType;
  batchId: string;
  organisationId: string;
  projectId: string;
  timestamp: string;
}

const backoffOptions = {
  numOfAttempts: 5,
  delayFirstAttempt: false,
};

export class CarbonAPIClient {
  private client: ReturnType<typeof createClient<paths>>;
  private apiKey: string;
  private webhook: Webhook | null;

  constructor(config: CarbonAPIConfig) {
    this.apiKey = config.apiKey;

    const userAgent = `carbonapi-typescript-sdk/${packageJson.version}`;

    this.client = createClient<paths>({
      baseUrl: config.baseURL || "https://api.aws-au.carbonapi.io/",
      headers: {
        "x-api-key": this.apiKey,
        "Content-Type": "application/json",
        "User-Agent": userAgent,
      },
    });

    // Initialize webhook handler if secret is provided
    this.webhook = config.webhookSecret
      ? new Webhook(config.webhookSecret)
      : null;
  }

  /**
   * Get the underlying openapi-fetch client
   * This provides access to all typed API endpoints
   */
  public getClient(): ReturnType<typeof createClient<paths>> {
    return this.client;
  }

  /**
   * Upload a batch of documents
   */
  public async createDocumentEmissionsBatch() {
    throw new Error("Not implemented");
  }

  /**
   * Get batch status and documents
   */
  public async getDocumentEmissionsBatch() {
    throw new Error("Not implemented");
  }

  /**
   * Create a batch of transactions
   */
  public async createTransactionBatch(
    batch: components["schemas"]["CreateBatchRequestDTO"]
  ) {
    const { data, error } = await backOff(
      () =>
        this.client.POST("/transaction/batch", {
          body: batch,
        }),
      backoffOptions
    );
    if (error) throw error;
    return data;
  }

  /**
   * Get transaction batch status and transactions
   */
  public async getTransactionBatch(batchId: string) {
    const { data, error } = await backOff(
      () =>
        this.client.GET("/transaction/batch/{batchId}", {
          params: {
            path: { batchId },
          },
        }),
      backoffOptions
    );
    if (error) throw error;
    return data;
  }

  /**
   * Verify and parse a webhook payload
   * @param payload The raw webhook payload
   * @param headers The webhook request headers
   * @returns The verified and parsed webhook event
   * @throws Error if webhook verification fails or webhook secret is not configured
   */
  public verifyWebhook(
    payload: string,
    headers: Record<string, string>
  ): WebhookEvent {
    if (!this.webhook) {
      throw new Error(
        "Webhook secret not configured. Set webhookSecret in the client config."
      );
    }

    try {
      const event = this.webhook.verify(payload, headers) as WebhookEvent;
      return event;
    } catch (error) {
      throw new Error(
        `Webhook verification failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Verify and parse a webhook payload from a raw request
   * @param request The raw webhook request
   * @returns The verified and parsed webhook event
   * @throws Error if webhook verification fails or webhook secret is not configured
   */
  public async verifyWebhookRequest(request: Request): Promise<WebhookEvent> {
    const payload = await request.text();
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });

    return this.verifyWebhook(payload, headers);
  }
}
