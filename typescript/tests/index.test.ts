/* eslint-disable @typescript-eslint/no-explicit-any */
import { CarbonAPIClient, VERSIONS } from "../src";
import createClient from "openapi-fetch";
import { Webhook } from "svix";
import { backOff } from "exponential-backoff";

// Mock dependencies
jest.mock("openapi-fetch");
jest.mock("svix");
jest.mock("exponential-backoff");

const mockCreateClient = createClient as jest.MockedFunction<
  typeof createClient
>;
const mockWebhook = Webhook as jest.MockedClass<typeof Webhook>;
const mockBackOff = backOff as jest.MockedFunction<typeof backOff>;

describe("CarbonAPIClient", () => {
  const mockClient = {
    POST: jest.fn(),
    GET: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateClient.mockReturnValue(mockClient as any);
    mockBackOff.mockImplementation(async (fn: any) => fn());
  });

  describe("constructor", () => {
    it("should initialize with minimal config", () => {
      new CarbonAPIClient({
        apiKey: "test-api-key",
      });

      expect(mockCreateClient).toHaveBeenCalledWith({
        baseUrl: "https://api.aws-au.carbonapi.io/",
        headers: expect.objectContaining({
          "x-api-key": "test-api-key",
          "Content-Type": "application/json",
          "x-api-version": VERSIONS.latest,
        }),
      });
      expect(mockWebhook).not.toHaveBeenCalled();
    });

    it("should initialize with custom baseURL", () => {
      new CarbonAPIClient({
        apiKey: "test-api-key",
        baseURL: "https://custom-api.example.com/",
      });

      expect(mockCreateClient).toHaveBeenCalledWith({
        baseUrl: "https://custom-api.example.com/",
        headers: expect.objectContaining({
          "x-api-key": "test-api-key",
        }),
      });
    });

    it("should initialize with custom version", () => {
      new CarbonAPIClient({
        apiKey: "test-api-key",
        version: VERSIONS.V2025_10_01,
      });

      expect(mockCreateClient).toHaveBeenCalledWith({
        baseUrl: "https://api.aws-au.carbonapi.io/",
        headers: expect.objectContaining({
          "x-api-version": VERSIONS.V2025_10_01,
        }),
      });
    });

    it("should initialize webhook handler when secret is provided", () => {
      const mockWebhookInstance = {
        verify: jest.fn(),
      };
      mockWebhook.mockImplementation(() => mockWebhookInstance as any);

      new CarbonAPIClient({
        apiKey: "test-api-key",
        webhookSecret: "test-webhook-secret",
      });

      expect(mockWebhook).toHaveBeenCalledWith("test-webhook-secret");
    });
  });

  describe("getClient", () => {
    it("should return the underlying openapi-fetch client", () => {
      const client = new CarbonAPIClient({
        apiKey: "test-api-key",
      });

      const returnedClient = client.getClient();
      expect(returnedClient).toBe(mockClient);
    });
  });

  describe("createDocumentEmissionsBatch", () => {
    it("should create a document batch successfully", async () => {
      const mockResponse = {
        batchId: "batch-123",
      };

      mockClient.POST.mockResolvedValue({
        data: mockResponse,
        error: undefined,
        response: {} as any,
      });

      const client = new CarbonAPIClient({
        apiKey: "test-api-key",
      });

      const batch = {
        documents: [
          {
            fileUrl: "https://example.com/doc.pdf",
            fileId: "file-1",
            categoryHint: "FUEL",
            meta: {},
          },
        ],
        type: "url",
        batchId: "batch-123",
        meta: {},
      };

      const result = await client.createDocumentEmissionsBatch(batch);

      expect(mockBackOff).toHaveBeenCalled();
      expect(mockClient.POST).toHaveBeenCalledWith("/document/batch", {
        body: batch,
      });
      expect(result).toEqual(mockResponse);
    });

    it("should throw error when API returns error", async () => {
      const mockError = new Error("API Error");
      mockClient.POST.mockResolvedValue({
        data: undefined,
        error: mockError,
        response: {} as any,
      });

      const client = new CarbonAPIClient({
        apiKey: "test-api-key",
      });

      const batch = {
        documents: [],
        type: "url",
        batchId: "batch-123",
        meta: {},
      };

      await expect(client.createDocumentEmissionsBatch(batch)).rejects.toThrow(
        "API Error",
      );
    });

    it("should throw error when no data is returned", async () => {
      mockClient.POST.mockResolvedValue({
        data: undefined,
        error: undefined,
        response: {} as any,
      });

      const client = new CarbonAPIClient({
        apiKey: "test-api-key",
      });

      const batch = {
        documents: [],
        type: "url",
        batchId: "batch-123",
        meta: {},
      };

      await expect(client.createDocumentEmissionsBatch(batch)).rejects.toThrow(
        "No data returned from API",
      );
    });
  });

  describe("getDocumentEmissionsBatch", () => {
    it("should get document batch successfully", async () => {
      const mockResponse = {
        status: "completed",
        documents: [],
      };

      mockClient.GET.mockResolvedValue({
        data: mockResponse,
        error: undefined,
        response: {} as any,
      });

      const client = new CarbonAPIClient({
        apiKey: "test-api-key",
      });

      const result = await client.getDocumentEmissionsBatch("batch-123");

      expect(mockBackOff).toHaveBeenCalled();
      expect(mockClient.GET).toHaveBeenCalledWith("/document/batch/{id}", {
        params: {
          path: { id: "batch-123" },
        },
      });
      expect(result).toEqual(mockResponse);
    });

    it("should throw error when API returns error", async () => {
      const mockError = new Error("API Error");
      mockClient.GET.mockResolvedValue({
        data: undefined,
        error: mockError,
        response: {} as any,
      });

      const client = new CarbonAPIClient({
        apiKey: "test-api-key",
      });

      await expect(
        client.getDocumentEmissionsBatch("batch-123"),
      ).rejects.toThrow("API Error");
    });

    it("should throw error when no data is returned", async () => {
      mockClient.GET.mockResolvedValue({
        data: undefined,
        error: undefined,
        response: {} as any,
      });

      const client = new CarbonAPIClient({
        apiKey: "test-api-key",
      });

      await expect(
        client.getDocumentEmissionsBatch("batch-123"),
      ).rejects.toThrow("No data returned from API");
    });
  });

  describe("createTransactionBatch", () => {
    it("should create a transaction batch successfully", async () => {
      const mockResponse = {
        batchIds: ["batch-123"],
      };

      mockClient.POST.mockResolvedValue({
        data: mockResponse,
        error: undefined,
        response: {} as any,
      });

      const client = new CarbonAPIClient({
        apiKey: "test-api-key",
      });

      const batch = {
        transactions: [
          {
            id: "txn-1",
            date: "2021-01-01T00:00:00.000Z",
            subtotal: 100,
            tax: 10,
            total: 110,
            description: "Test transaction",
            supplierName: "Test Supplier",
            sourceAccount: "Test Account",
            currency: "NZD",
          },
        ],
        countryCode: "NZL" as const,
      };

      const result = await client.createTransactionBatch(batch);

      expect(mockBackOff).toHaveBeenCalled();
      expect(mockClient.POST).toHaveBeenCalledWith("/transaction/batch", {
        body: batch,
      });
      expect(result).toEqual(mockResponse);
    });

    it("should throw error when API returns error", async () => {
      const mockError = new Error("API Error");
      mockClient.POST.mockResolvedValue({
        data: undefined,
        error: mockError,
        response: {} as any,
      });

      const client = new CarbonAPIClient({
        apiKey: "test-api-key",
      });

      const batch = {
        transactions: [],
        countryCode: "NZL" as const,
      };

      await expect(client.createTransactionBatch(batch)).rejects.toThrow(
        "API Error",
      );
    });
  });

  describe("getTransactionBatch", () => {
    it("should get transaction batch successfully", async () => {
      const mockResponse = {
        id: "batch-123",
        status: "Completed",
        createdAt: "2023-01-01T00:00:00.000Z",
        updatedAt: "2023-01-01T00:00:00.000Z",
        transactions: [],
      };

      mockClient.GET.mockResolvedValue({
        data: mockResponse,
        error: undefined,
        response: {} as any,
      });

      const client = new CarbonAPIClient({
        apiKey: "test-api-key",
      });

      const result = await client.getTransactionBatch("batch-123");

      expect(mockBackOff).toHaveBeenCalled();
      expect(mockClient.GET).toHaveBeenCalledWith(
        "/transaction/batch/{batchId}",
        {
          params: {
            path: { batchId: "batch-123" },
          },
        },
      );
      expect(result).toEqual(mockResponse);
    });

    it("should throw error when API returns error", async () => {
      const mockError = new Error("API Error");
      mockClient.GET.mockResolvedValue({
        data: undefined,
        error: mockError,
        response: {} as any,
      });

      const client = new CarbonAPIClient({
        apiKey: "test-api-key",
      });

      await expect(client.getTransactionBatch("batch-123")).rejects.toThrow(
        "API Error",
      );
    });
  });

  describe("verifyWebhook", () => {
    it("should verify webhook successfully", () => {
      const mockWebhookInstance = {
        verify: jest.fn().mockReturnValue({
          type: "document.batch.completed",
          batchId: "batch-123",
          organisationId: "org-123",
          projectId: "project-123",
          timestamp: "2023-01-01T00:00:00.000Z",
        }),
      };
      mockWebhook.mockImplementation(() => mockWebhookInstance as any);

      const client = new CarbonAPIClient({
        apiKey: "test-api-key",
        webhookSecret: "test-secret",
      });

      const payload = "test-payload";
      const headers = {
        "svix-id": "msg-id",
        "svix-timestamp": "1234567890",
        "svix-signature": "signature",
      };

      const result = client.verifyWebhook(payload, headers);

      expect(mockWebhookInstance.verify).toHaveBeenCalledWith(payload, headers);
      expect(result).toEqual({
        type: "document.batch.completed",
        batchId: "batch-123",
        organisationId: "org-123",
        projectId: "project-123",
        timestamp: "2023-01-01T00:00:00.000Z",
      });
    });

    it("should throw error when webhook secret is not configured", () => {
      const client = new CarbonAPIClient({
        apiKey: "test-api-key",
      });

      expect(() => {
        client.verifyWebhook("payload", {});
      }).toThrow(
        "Webhook secret not configured. Set webhookSecret in the client config.",
      );
    });

    it("should throw error when webhook verification fails", () => {
      const mockWebhookInstance = {
        verify: jest.fn().mockImplementation(() => {
          throw new Error("Invalid signature");
        }),
      };
      mockWebhook.mockImplementation(() => mockWebhookInstance as any);

      const client = new CarbonAPIClient({
        apiKey: "test-api-key",
        webhookSecret: "test-secret",
      });

      expect(() => {
        client.verifyWebhook("payload", {});
      }).toThrow("Webhook verification failed: Invalid signature");
    });

    it("should handle non-Error exceptions in webhook verification", () => {
      const mockWebhookInstance = {
        verify: jest.fn().mockImplementation(() => {
          throw "String error";
        }),
      };
      mockWebhook.mockImplementation(() => mockWebhookInstance as any);

      const client = new CarbonAPIClient({
        apiKey: "test-api-key",
        webhookSecret: "test-secret",
      });

      expect(() => {
        client.verifyWebhook("payload", {});
      }).toThrow("Webhook verification failed: Unknown error");
    });
  });

  describe("verifyWebhookRequest", () => {
    it("should verify webhook from Request object", async () => {
      const mockWebhookInstance = {
        verify: jest.fn().mockReturnValue({
          type: "transaction.batch.completed",
          batchId: "batch-456",
          organisationId: "org-456",
          projectId: "project-456",
          timestamp: "2023-01-02T00:00:00.000Z",
        }),
      };
      mockWebhook.mockImplementation(() => mockWebhookInstance as any);

      const client = new CarbonAPIClient({
        apiKey: "test-api-key",
        webhookSecret: "test-secret",
      });

      const mockRequest = new Request("https://example.com/webhook", {
        method: "POST",
        body: "test-payload",
        headers: {
          "svix-id": "msg-id",
          "svix-timestamp": "1234567890",
          "svix-signature": "signature",
        },
      });

      const result = await client.verifyWebhookRequest(mockRequest);

      expect(mockWebhookInstance.verify).toHaveBeenCalledWith(
        "test-payload",
        expect.objectContaining({
          "svix-id": "msg-id",
          "svix-timestamp": "1234567890",
          "svix-signature": "signature",
        }),
      );
      expect(result).toEqual({
        type: "transaction.batch.completed",
        batchId: "batch-456",
        organisationId: "org-456",
        projectId: "project-456",
        timestamp: "2023-01-02T00:00:00.000Z",
      });
    });

    it("should convert headers to lowercase", async () => {
      const mockWebhookInstance = {
        verify: jest.fn().mockReturnValue({
          type: "document.batch.completed",
          batchId: "batch-123",
          organisationId: "org-123",
          projectId: "project-123",
          timestamp: "2023-01-01T00:00:00.000Z",
        }),
      };
      mockWebhook.mockImplementation(() => mockWebhookInstance as any);

      const client = new CarbonAPIClient({
        apiKey: "test-api-key",
        webhookSecret: "test-secret",
      });

      const mockRequest = new Request("https://example.com/webhook", {
        method: "POST",
        body: "test-payload",
        headers: {
          "SVIX-ID": "msg-id",
          "SVIX-TIMESTAMP": "1234567890",
          "SVIX-SIGNATURE": "signature",
        },
      });

      await client.verifyWebhookRequest(mockRequest);

      expect(mockWebhookInstance.verify).toHaveBeenCalledWith(
        "test-payload",
        expect.objectContaining({
          "svix-id": "msg-id",
          "svix-timestamp": "1234567890",
          "svix-signature": "signature",
        }),
      );
    });
  });

  describe("VERSIONS", () => {
    it("should export VERSIONS constant", () => {
      expect(VERSIONS).toBeDefined();
      expect(VERSIONS.V2025_10_01).toBe("2025-10-01");
      expect(VERSIONS.latest).toBe("2025-10-01");
    });
  });
});
