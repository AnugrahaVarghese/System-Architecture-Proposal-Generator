/**
 * Types and interfaces for the API-to-Cloud System Architect
 */

export interface DesignConstraints {
  platform: 'aws' | 'gcp' | 'azure';
  architectureStyle: 'serverless' | 'microservices' | 'hybrid' | 'monolith';
  scalability: 'low' | 'medium' | 'high-write' | 'global';
  budget: 'cost-optimized' | 'balanced' | 'high-availability';
  additionalConstraints: string;
}

export interface EndpointMapItem {
  path: string;
  method: string;
  summary: string;
  security: string;
  targetService: string; // e.g. AWS Lambda, Cloud Run
  dbReadWrite: string; // e.g. "High Write (DynamoDB)", "Read Heavy"
  vulnerabilityRisk: 'low' | 'medium' | 'high';
  riskDescription: string;
}

export interface CostComponent {
  serviceName: string;
  unitCost: number; // monthly cost per million requests or base cost
  baseCost: number; // flat monthly cost
  calculatedCost: number; // dynamically calculated on the frontend
  formulaDescription: string;
}

export interface PerformanceMetrics {
  estimatedLatencyMs: number;
  maxThroughputRps: number;
  slaAvailability: string; // e.g. "99.99%"
}

export interface ArchitectureProposal {
  projectName: string;
  architectureSummary: string;
  iacCode: string; // Terraform or AWS CDK code
  iacLanguage: 'terraform' | 'cdk' | 'gcp-dm';
  endpoints: EndpointMapItem[];
  bottlenecks: string[];
  securityFlaws: string[];
  costModel: CostComponent[];
  performance: PerformanceMetrics;
  educationalNotes: {
    agentLoopApplied: string;
    toolUseExplanation: string;
    longContextRelevance: string;
  };
}

export interface PipelineStep {
  id: 'evaluate' | 'sandbox' | 'analyze' | 'generate' | 'complete';
  title: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  message: string;
}

export interface SandboxLog {
  timestamp: string;
  level: 'info' | 'warn' | 'success' | 'error';
  message: string;
}
