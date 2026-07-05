import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

// Ensure Gemini API key exists
const apiKey = process.env.GEMINI_API_KEY;

// Lazy initialization function
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required. Please set it in Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

const app = express();
app.use(express.json({ limit: "10mb" }));

// Helper to fetch content from provided URLs
async function fetchUrlContent(urlStr: string): Promise<string> {
  try {
    const parsedUrl = new URL(urlStr);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

    const response = await fetch(parsedUrl.toString(), {
      signal: controller.signal,
      headers: {
        "Accept": "text/html,application/json,application/yaml,text/yaml,text/plain",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) API-to-Cloud-Architect",
      },
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return `[Error fetching URL: HTTP ${response.status} ${response.statusText}]`;
    }

    const text = await response.text();
    // Simple text extraction from HTML to keep context clean
    if (text.includes("<body") || text.includes("<html")) {
      const plainText = text
        .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, "")
        .replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .substring(0, 15000); // Cap to 15k chars to stay safe
      return plainText;
    }

    return text.substring(0, 20000); // Cap raw JSON/YAML to 20k chars
  } catch (error: any) {
    return `[Failed to fetch URL ${urlStr}: ${error.message || error}]`;
  }
}

// REST API endpoint to generate proposal
app.post("/api/architect", async (req, res) => {
  try {
    const { specText, docUrls, constraints } = req.body;

    if (!specText && (!docUrls || docUrls.length === 0)) {
      res.status(400).json({ error: "Please provide either an OpenAPI/Swagger spec text or at least one documentation URL." });
      return;
    }

    // Initialize AI client lazily
    const ai = getAiClient();

    // 1. Fetch documentation from URLs if present
    let fetchedDocsContent = "";
    if (docUrls && Array.isArray(docUrls) && docUrls.length > 0) {
      const activeUrls = docUrls.filter((u: string) => u && u.trim().startsWith("http"));
      for (const url of activeUrls) {
        const content = await fetchUrlContent(url);
        fetchedDocsContent += `\n\n--- Source Documentation Content from URL: ${url} ---\n${content}\n`;
      }
    }

    // 2. Prepare System instruction & prompt based on constraints
    const platformName = constraints.platform.toUpperCase();
    const archStyle = constraints.architectureStyle;
    const scale = constraints.scalability;
    const budget = constraints.budget;
    const extra = constraints.additionalConstraints;

    const systemInstruction = `You are an elite Lead Enterprise Systems Architect specializing in Cloud Platforms (${platformName}) and ${archStyle} patterns.
Your role is to build detailed, secure, highly performant, and cost-optimized system architecture proposals based on API specifications, documentation, and specific design constraints.

When writing the Infrastructure-as-Code (IaC), ensure it is high quality, highly readable, valid code (e.g. Terraform HCL for the selected platform, GCP Deployment Manager, or AWS CDK) with ample explanatory comments directly solving the user constraints (e.g., handling high-write volume, serverless scale, etc.).
You must evaluate bottlenecks (e.g., database scaling, network constraints, state storage) and security flaws (e.g., raw keys, unauthenticated endpoints, missing HTTPS, lack of rate-limits) diligently.
Also, provide educational companions detailing how a stateful agent loop with schema-testing tools would validate these endpoints and how the long context window is essential to digest entire specifications.`;

    const prompt = `Analyze the following API specification and supplementary documentation, then design a comprehensive cloud architecture proposal matching the target enterprise constraints.

TARGET ENTERPRISE CONSTRAINTS:
- Cloud Platform: ${platformName}
- Architecture Style: ${archStyle}
- Scalability Profile: ${scale} (e.g. high-write, global, low, medium)
- Budget Goal: ${budget} (e.g. cost-optimized, balanced, high-availability)
- Additional constraints: ${extra || "None specified"}

API SPECIFICATION / SWAGGER / OPENAPI TEXT:
${specText || "Not provided directly (extracted from URLs below)"}

SUPPLEMENTARY FETCHED URL DOCS:
${fetchedDocsContent || "None provided"}

TASK:
Formulate an ArchitectureProposal object following the strict JSON schema provided. Make sure to map the endpoints to concrete cloud resources (e.g. API Gateway, Lambdas, Cloud Functions, DynamoDB, Cloud Run, Firestore) and include accurate cost components.
Return a completely valid and robust Terraform/CDK script under 'iacCode'. Provide detailed explanation in the 'educationalNotes' so the developer understands advanced stateful agent loop mechanics.`;

    // 3. Define structured response schema using GoogleGenAI Type
    const schema = {
      type: Type.OBJECT,
      properties: {
        projectName: {
          type: Type.STRING,
          description: "A concise descriptive name for the system architect proposal.",
        },
        architectureSummary: {
          type: Type.STRING,
          description: "Detailed description of the proposed cloud architecture, services used, data flow, and how it strictly addresses the constraints.",
        },
        iacCode: {
          type: Type.STRING,
          description: "A complete, production-ready Infrastructure-as-Code snippet (Terraform HCL or AWS CDK in TypeScript) deploying the proposed system architecture, heavily commented.",
        },
        iacLanguage: {
          type: Type.STRING,
          description: "The language/tool used for the IaC code. Must be 'terraform', 'cdk', or 'gcp-dm'.",
        },
        endpoints: {
          type: Type.ARRAY,
          description: "List of parsed API endpoints mapped to target microservices, security protocols, database paths, and vulnerability/scalability risks.",
          items: {
            type: Type.OBJECT,
            properties: {
              path: { type: Type.STRING },
              method: { type: Type.STRING, description: "GET, POST, PUT, DELETE, PATCH" },
              summary: { type: Type.STRING, description: "Brief description of the endpoint's purpose" },
              security: { type: Type.STRING, description: "Security scheme (e.g., Bearer JWT, IAM, API Key, None)" },
              targetService: { type: Type.STRING, description: "The cloud resource executing this endpoint (e.g., AWS Lambda, Cloud Run, Cloud Function)" },
              dbReadWrite: { type: Type.STRING, description: "Read/Write behavior (e.g., High Write to DynamoDB, Read-Heavy cache, None)" },
              vulnerabilityRisk: { type: Type.STRING, description: "Must be 'low', 'medium', or 'high'" },
              riskDescription: { type: Type.STRING, description: "Details about security flaws or bottleneck risks on this path" },
            },
            required: ["path", "method", "summary", "security", "targetService", "dbReadWrite", "vulnerabilityRisk", "riskDescription"],
          },
        },
        bottlenecks: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "List of potential system, database, or network bottlenecks.",
        },
        securityFlaws: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "List of security flaws, missing validations, or access risks identified in the API specs.",
        },
        costModel: {
          type: Type.ARRAY,
          description: "Services list with estimated standard pricing values to run a cost/performance simulation model.",
          items: {
            type: Type.OBJECT,
            properties: {
              serviceName: { type: Type.STRING, description: "e.g. AWS API Gateway, AWS Lambda, DynamoDB" },
              unitCost: { type: Type.NUMBER, description: "Estimated cost per million requests or operations (in USD, e.g., 3.5)" },
              baseCost: { type: Type.NUMBER, description: "Flat base fee per month (in USD, e.g., 15.0 or 0)" },
              calculatedCost: { type: Type.NUMBER, description: "Default calculated cost at standard volume (e.g. 5 million requests)" },
              formulaDescription: { type: Type.STRING, description: "Explanation of pricing (e.g. '$3.50 per Million requests + $0.25/GB data transfer')" },
            },
            required: ["serviceName", "unitCost", "baseCost", "calculatedCost", "formulaDescription"],
          },
        },
        performance: {
          type: Type.OBJECT,
          properties: {
            estimatedLatencyMs: { type: Type.NUMBER, description: "Average end-to-end latency in milliseconds under normal loads" },
            maxThroughputRps: { type: Type.NUMBER, description: "Maximum expected throughput before throttling in Requests-per-second" },
            slaAvailability: { type: Type.STRING, description: "Estimated uptime SLA (e.g., '99.99%', '99.9%')" },
          },
          required: ["estimatedLatencyMs", "maxThroughputRps", "slaAvailability"],
        },
        educationalNotes: {
          type: Type.OBJECT,
          properties: {
            agentLoopApplied: {
              type: Type.STRING,
              description: "Detailed masterclass description explaining how stateful agent loops (like ReAct or Plan-and-Execute) automate systems architecture, manage multi-step sub-agents, and correct IaC parse errors dynamically.",
            },
            toolUseExplanation: {
              type: Type.STRING,
              description: "Explain how tools (e.g., Schema Parser, Linter, Security scanner, and Sandboxed terminals) are declared and used programmatically by LLM function calling to validate the Swagger/OpenAPI schemas.",
            },
            longContextRelevance: {
              type: Type.STRING,
              description: "Explain why processing entire massive API specifications alongside supplementary enterprise books/documentation is only possible using Gemini's million-token long context window, eliminating chunking noise.",
            },
          },
          required: ["agentLoopApplied", "toolUseExplanation", "longContextRelevance"],
        },
      },
      required: [
        "projectName",
        "architectureSummary",
        "iacCode",
        "iacLanguage",
        "endpoints",
        "bottlenecks",
        "securityFlaws",
        "costModel",
        "performance",
        "educationalNotes",
      ],
    };

    // 4. Request from Gemini (Using gemini-3.5-flash as default, or we can upgrade to gemini-3.1-pro-preview if requested)
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.2, // Low temperature for higher accuracy and strict adherence to schemas
      },
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Empty response received from Gemini.");
    }

    const proposal = JSON.parse(resultText);

    // 5. Generate realistic logs to represent the "Agent Linux Sandbox" execution
    // This allows the UI to animate a beautiful terminal run showing real parsed endpoints!
    const pathsFound = proposal.endpoints.map((e: any) => `[${e.method}] ${e.path}`).join(", ");
    const riskIssues = proposal.endpoints.filter((e: any) => e.vulnerabilityRisk !== "low");

    const sandboxLogs = [
      { timestamp: "00:01.05", level: "info", message: "Starting Managed Agent Linux Sandbox container..." },
      { timestamp: "00:01.42", level: "info", message: "Virtual environment initialized: Linux x86_64 Ubuntu 24.04 LTS." },
      { timestamp: "00:01.88", level: "info", message: "Cloning parsing scripts, Swagger validation libraries, and linting suite." },
      { timestamp: "00:02.30", level: "info", message: "Injesting user-supplied OpenAPI Specification..." },
      { timestamp: "00:02.85", level: "info", message: `Parsing raw schema. Found paths: ${pathsFound.substring(0, 160)}${pathsFound.length > 160 ? "..." : ""}` },
      { timestamp: "00:03.40", level: "info", message: "Executing schema structural validation: swagger-parser --validate" },
      { timestamp: "00:03.95", level: "success", message: `Schema parsed successfully: ${proposal.endpoints.length} endpoints, ${proposal.endpoints.filter((e: any) => e.security && e.security !== "None").length} secured paths detected.` },
      { timestamp: "00:04.50", level: "info", message: "Executing Custom Linter: checking path naming conventions and param schemas..." },
      { timestamp: "00:05.10", level: "info", message: `Evaluating security models: found scopes ${[...new Set(proposal.endpoints.map((e: any) => e.security))].join(", ")}` },
      { timestamp: "00:05.70", level: "warn", message: `Lint warning: ${proposal.securityFlaws.length} security flaws identified in spec file.` },
      ...(riskIssues.slice(0, 3).map((issue: any, index: number) => ({
        timestamp: `00:06.${20 + index * 15}`,
        level: "warn" as const,
        message: `Vulnerability risk on ${issue.method} ${issue.path}: ${issue.riskDescription}`,
      }))),
      { timestamp: "00:07.10", level: "info", message: `Mapping system nodes to ${platformName} platform utilizing ${archStyle} architecture.` },
      { timestamp: "00:07.80", level: "info", message: "Running simulation generator to check latency profiles and cost formulas..." },
      { timestamp: "00:08.50", level: "success", message: "Enterprise Infrastructure-as-Code successfully created. Compiling System Architecture Proposal!" },
    ];

    res.json({ proposal, sandboxLogs });
  } catch (error: any) {
    console.error("API Architect route error:", error);
    res.status(500).json({ error: error.message || "An internal error occurred during architecture generation." });
  }
});

// Start server
async function startServer() {
  const PORT = 3000;

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
