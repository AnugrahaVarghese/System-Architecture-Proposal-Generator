export interface PreloadedTemplate {
  name: string;
  description: string;
  specText: string;
  defaultConstraints: {
    platform: 'aws' | 'gcp' | 'azure';
    architectureStyle: 'serverless' | 'microservices' | 'hybrid' | 'monolith';
    scalability: 'low' | 'medium' | 'high-write' | 'global';
    budget: 'cost-optimized' | 'balanced' | 'high-availability';
    additionalConstraints: string;
  };
}

export const PRELOADED_TEMPLATES: PreloadedTemplate[] = [
  {
    name: "🛒 E-Commerce Checkout API",
    description: "Serverless checkout with customer orders, inventory check, and payment processing endpoints.",
    defaultConstraints: {
      platform: "aws",
      architectureStyle: "serverless",
      scalability: "medium",
      budget: "cost-optimized",
      additionalConstraints: "Require low cold start latency, integrate Stripe webhook security, and notify warehouse on checkout."
    },
    specText: `openapi: 3.0.0
info:
  title: E-Commerce Checkout Service
  version: 1.2.0
  description: High-reliability e-commerce payment & checkout service.
paths:
  /orders:
    post:
      summary: Place a new order
      operationId: createOrder
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [cartId, paymentMethodId, shippingAddress]
              properties:
                cartId: { type: string }
                paymentMethodId: { type: string }
                shippingAddress: { type: string }
      responses:
        '201':
          description: Order created successfully
        '400':
          description: Invalid checkout parameters
        '401':
          description: Unauthorized session

  /inventory/check:
    get:
      summary: Real-time inventory lookup
      operationId: checkInventory
      parameters:
        - name: itemIds
          in: query
          required: true
          schema:
            type: array
            items: { type: string }
      responses:
        '200':
          description: Product availability matrix returned

  /webhooks/stripe:
    post:
      summary: Stripe billing notification webhook
      operationId: stripeBillingWebhook
      description: Receives asynchronous payment status from Stripe Stripe-Signature header.
      responses:
        '200':
          description: Webhook acknowledged`
  },
  {
    name: "⚡ IoT Telemetry & Sensor Ingestion",
    description: "High-write ingestion API for billions of sensor data payloads with near-instant persistence.",
    defaultConstraints: {
      platform: "gcp",
      architectureStyle: "serverless",
      scalability: "high-write",
      budget: "balanced",
      additionalConstraints: "Must absorb massive write spikes, perform fast window aggregations, and keep database write fees low."
    },
    specText: `openapi: 3.0.0
info:
  title: High-Velocity IoT Telemetry Ingestion API
  version: 2.0.1
paths:
  /sensors/{deviceId}/telemetry:
    post:
      summary: Stream telemetry batch from a registered sensor
      operationId: postTelemetry
      parameters:
        - name: deviceId
          in: path
          required: true
          schema: { type: string }
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [timestamp, metrics]
              properties:
                timestamp: { type: string, format: date-time }
                metrics:
                  type: object
                  properties:
                    temperature: { type: number }
                    humidity: { type: number }
                    voltage: { type: number }
      responses:
        '202':
          description: Batch accepted for streaming pipeline enqueue

  /devices:
    get:
      summary: Query active smart devices registry
      operationId: listDevices
      parameters:
        - name: status
          in: query
          schema: { type: string, enum: [online, offline, provisioning] }
      responses:
        '200':
          description: Paginated device list`
  },
  {
    name: "🏦 Enterprise Core Ledger API",
    description: "Traditional banking transfer endpoints with strict payload signing, auditing, and low latency.",
    defaultConstraints: {
      platform: "aws",
      architectureStyle: "microservices",
      scalability: "global",
      budget: "high-availability",
      additionalConstraints: "Require dual-write security auditing, end-to-end payload signature verification, and zero data-loss guarantees."
    },
    specText: `openapi: 3.0.0
info:
  title: Core Bank Ledger Transaction Gateway
  version: 4.1.0
paths:
  /ledger/transfer:
    post:
      summary: Execute high-integrity balance transfer
      operationId: transferFunds
      security:
        - OAuth2ClientCredentials: [write:transactions]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [sourceAccount, destinationAccount, amount, currency, transactionSignature]
              properties:
                sourceAccount: { type: string }
                destinationAccount: { type: string }
                amount: { type: number }
                currency: { type: string }
                transactionSignature: { type: string }
      responses:
        '200':
          description: Transaction settled in ledger
        '403':
          description: Signature mismatch or insufficient limits

  /ledger/accounts/{accountId}/balance:
    get:
      summary: Fetch official account statement balance
      operationId: getBalance
      parameters:
        - name: accountId
          in: path
          required: true
          schema: { type: string }
      responses:
        '200':
          description: Account details and balances returned`
  }
];
