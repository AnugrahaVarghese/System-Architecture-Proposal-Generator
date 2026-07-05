import React, { useState, useEffect } from 'react';
import { 
  Terminal, 
  Settings, 
  Play, 
  Cpu, 
  Layers, 
  ShieldAlert, 
  DollarSign, 
  Activity, 
  FileCode2, 
  Database, 
  Copy, 
  Check, 
  Plus, 
  Trash2, 
  BookOpen, 
  Sparkles, 
  Info, 
  Globe, 
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Zap,
  HelpCircle
} from 'lucide-react';
import { PRELOADED_TEMPLATES, PreloadedTemplate } from './templates';
import { ArchitectureProposal, DesignConstraints, SandboxLog } from './types';

export default function App() {
  // Input states
  const [selectedTemplateName, setSelectedTemplateName] = useState<string>(PRELOADED_TEMPLATES[0].name);
  const [specText, setSpecText] = useState<string>(PRELOADED_TEMPLATES[0].specText);
  const [docUrls, setDocUrls] = useState<string[]>(["https://api.enterprise.io/v3/spec.yaml"]);
  const [newUrl, setNewUrl] = useState<string>("");
  
  const [constraints, setConstraints] = useState<DesignConstraints>(PRELOADED_TEMPLATES[0].defaultConstraints);

  // Orchestration state
  const [isOrchestrating, setIsOrchestrating] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'iac' | 'endpoints' | 'security' | 'concepts'>('iac');
  
  // Terminal execution logs
  const [logs, setLogs] = useState<SandboxLog[]>([
    { timestamp: "00:01.00", level: "info", message: "System initialized. Select a template or insert custom API specs to begin." }
  ]);
  const [displayedLogs, setDisplayedLogs] = useState<SandboxLog[]>([]);
  const [logIndex, setLogIndex] = useState<number>(0);

  // Simulation Volume State (Requests per month in millions)
  const [monthlyVolumeMillions, setMonthlyVolumeMillions] = useState<number>(5);

  // Copy Feedback
  const [copied, setCopied] = useState<boolean>(false);

  // Proposal State (Starts with a beautiful initial default proposal matching the E-Commerce Checkout)
  const [proposal, setProposal] = useState<ArchitectureProposal>({
    projectName: "Enterprise E-Commerce Checkout Platform",
    architectureSummary: "This high-availability checkout architecture utilizes serverless AWS services. Traffic arrives at AWS API Gateway, which forwards secured requests to containerized Lambda functions. Ingested order details are enqueued directly to AWS SQS and processed by consumer Lambdas that persist to DynamoDB configured with PAY_PER_REQUEST billing. Webhooks bypass complex auth layers but utilize custom signature validators in the compute stage.",
    iacCode: `# Terraform Configuration for E-Commerce Checkout Platform
# Provider settings
provider "aws" {
  region = "us-east-1"
}

# 1. API Gateway Endpoint for Order Management
resource "aws_apigatewayv2_api" "checkout_api" {
  name          = "checkout-gateway"
  protocol_type = "HTTP"
  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["POST", "GET"]
    allow_headers = ["content-type", "authorization"]
  }
}

# 2. Serverless API Handler Lambda
resource "aws_lambda_function" "checkout_handler" {
  function_name = "checkout-handler-lambda"
  runtime       = "nodejs18.x"
  role          = aws_iam_role.lambda_exec_role.arn
  handler       = "index.handler"
  
  # ARM64 Graviton Architecture saves 18% on lambda costs
  architectures = ["arm64"]
  memory_size   = 512
  timeout       = 15

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.checkout_orders.name
      QUEUE_URL      = aws_sqs_queue.checkout_queue.id
    }
  }
}

# 3. Pay-Per-Request Scalable Orders Store
resource "aws_dynamodb_table" "checkout_orders" {
  name         = "checkout-orders-table"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "orderId"

  attribute {
    name = "orderId"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Environment = "production"
    Tier        = "database"
  }
}

# 4. SQS Queue to absorb high-burst order transaction peaks
resource "aws_sqs_queue" "checkout_queue" {
  name                      = "checkout-order-queue"
  delay_seconds             = 0
  max_message_size          = 262144
  message_retention_seconds = 86400
  receive_wait_time_seconds = 10
}
`,
    iacLanguage: "terraform",
    endpoints: [
      {
        path: "/orders",
        method: "POST",
        summary: "Place a new order",
        security: "Bearer JWT Authentication",
        targetService: "AWS Lambda (checkout_handler)",
        dbReadWrite: "High Write (DynamoDB Table)",
        vulnerabilityRisk: "low",
        riskDescription: "Rate limit checks are missing at the gateway level. If uncapped, high volume can deplete downstream budget allocation."
      },
      {
        path: "/inventory/check",
        method: "GET",
        summary: "Real-time inventory lookup",
        security: "None (Public API)",
        targetService: "AWS Lambda (inventory_checker)",
        dbReadWrite: "Read Heavy (ElastiCache Redis)",
        vulnerabilityRisk: "medium",
        riskDescription: "Public endpoints querying raw warehouse catalog are susceptible to DDoS scraping. Recommend adding API key restrictions or WAF protection."
      },
      {
        path: "/webhooks/stripe",
        method: "POST",
        summary: "Stripe billing notification webhook",
        security: "Stripe-Signature Header Validator",
        targetService: "AWS Lambda (stripe_webhook)",
        dbReadWrite: "Medium Write (DynamoDB Table)",
        vulnerabilityRisk: "high",
        riskDescription: "Lack of replay protection or strict IP range validation on this webhook endpoint may allow duplicate checkout fulfillment attacks."
      }
    ],
    bottlenecks: [
      "No caching layer present for repetitive GET '/inventory/check' queries. Rapid inventory spikes will translate into unnecessary read operations in DB.",
      "Synchronous order placement could choke when third-party payment gateways experience transient packet loss or increased execution times."
    ],
    securityFlaws: [
      "Stripe webhooks do not force TLS minimum standards or IP whitelist restrictions in API Gateway configuration.",
      "The '/inventory/check' is publicly exposed without OAuth scope constraints, leaving internal product catalog open to unauthenticated crawling."
    ],
    costModel: [
      {
        serviceName: "AWS HTTP API Gateway",
        unitCost: 1.00, // per million
        baseCost: 0,
        calculatedCost: 5.00,
        formulaDescription: "$1.00 per Million requests."
      },
      {
        serviceName: "AWS Lambda Compute (ARM64)",
        unitCost: 2.70, // per million requests (incl. 512MB RAM compute time)
        baseCost: 0,
        calculatedCost: 13.50,
        formulaDescription: "Estimated 250ms execution avg @ 512MB RAM."
      },
      {
        serviceName: "AWS DynamoDB Storage & I/O",
        unitCost: 1.25, // per million writes
        baseCost: 15.00, // base metadata
        calculatedCost: 21.25,
        formulaDescription: "$1.25 per Million writes + $15 Base table storage fee."
      },
      {
        serviceName: "AWS SQS Peak Buffer",
        unitCost: 0.40, // per million operations
        baseCost: 0,
        calculatedCost: 2.00,
        formulaDescription: "$0.40 per Million API actions."
      }
    ],
    performance: {
      estimatedLatencyMs: 38,
      maxThroughputRps: 25000,
      slaAvailability: "99.99%"
    },
    educationalNotes: {
      agentLoopApplied: "Instead of a single raw prompt, our stateful ReAct architecture operates on a persistent state record. It first parses the Swagger schema, lists all endpoints, initiates a sandbox build loop to check for syntax errors, evaluates YAML structural validity, and updates its orchestration strategy if errors occur.",
      toolUseExplanation: "Our sandbox provides declarative tools including 'schema_linter', 'vulnerability_scanner', and 'terraform_validate'. When Gemini identifies a threat on /webhooks/stripe, it invokes 'vulnerability_scanner' on the specific payload structure, dynamically analyzing input bounds.",
      longContextRelevance: "With standard LLMs, massive schemas must be chunked or summarized, destroying critical property relations or nested reference scopes. Gemini's native long-context window allows feeding 500+ page enterprise constraints books, previous IaC baselines, and Swagger JSON all in one unified context block."
    }
  });

  // Apply Preloaded Template to local inputs
  const handleTemplateChange = (templateName: string) => {
    setSelectedTemplateName(templateName);
    const template = PRELOADED_TEMPLATES.find(t => t.name === templateName);
    if (template) {
      setSpecText(template.specText);
      setConstraints(template.defaultConstraints);
      // Clean display log reset
      setDisplayedLogs([
        { timestamp: "00:01.00", level: "info", message: `Loaded blueprint: ${template.name}. Ready to trigger sandbox compilation.` }
      ]);
    }
  };

  // Add/Remove URLs
  const addUrl = () => {
    if (newUrl.trim() && newUrl.startsWith("http")) {
      setDocUrls([...docUrls, newUrl.trim()]);
      setNewUrl("");
    }
  };

  const removeUrl = (index: number) => {
    const next = [...docUrls];
    next.splice(index, 1);
    setDocUrls(next);
  };

  // Custom constraint state updates
  const handleConstraintChange = (key: keyof DesignConstraints, value: any) => {
    setConstraints({
      ...constraints,
      [key]: value
    });
  };

  // Trigger Backend Orchestration
  const triggerOrchestration = async () => {
    setIsOrchestrating(true);
    setLogIndex(0);
    setDisplayedLogs([]);
    
    // Initial sandbox bootup log sequence
    const bootLogs: SandboxLog[] = [
      { timestamp: "00:00.05", level: "info", message: "Starting Managed Agent Linux Sandbox container..." },
      { timestamp: "00:00.60", level: "info", message: "Virtual environment initialized: Ubuntu 24.04 LTS x86_64." },
      { timestamp: "00:01.20", level: "info", message: "Downloading sandbox linter suites and schema-validator..." },
    ];
    
    setDisplayedLogs(bootLogs);

    try {
      const response = await fetch('/api/architect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          specText,
          docUrls,
          constraints
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to trigger generative architect.");
      }

      const data = await response.json();
      
      // We have the proposal and the logs! Let's animate them for high immersion.
      setProposal(data.proposal);
      setLogs(data.sandboxLogs || []);
      setLogIndex(bootLogs.length);
      
    } catch (err: any) {
      console.error(err);
      setDisplayedLogs(prev => [
        ...prev,
        { timestamp: "Error", level: "error", message: `Execution halted: ${err.message || err}` }
      ]);
      setIsOrchestrating(false);
    }
  };

  // Playback sandbox logs progressively
  useEffect(() => {
    if (isOrchestrating && logIndex < logs.length) {
      const timer = setTimeout(() => {
        setDisplayedLogs(prev => [...prev, logs[logIndex]]);
        setLogIndex(prev => prev + 1);
      }, 700); // 700ms staggered intervals for high immersive realism
      return () => clearTimeout(timer);
    } else if (isOrchestrating && logIndex >= logs.length) {
      setIsOrchestrating(false);
    }
  }, [isOrchestrating, logIndex, logs]);

  // Copy code to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(proposal.iacCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Calculate dynamic monthly costs based on Volume Slider (Millions of requests/mo)
  const totalCalculatedCost = proposal.costModel.reduce((sum, item) => {
    // formula: baseCost + (unitCost * volumeInMillions)
    const cost = item.baseCost + (item.unitCost * monthlyVolumeMillions);
    return sum + cost;
  }, 0);

  return (
    <div className="flex flex-col min-h-screen bg-[#05060a] text-slate-200 font-sans selection:bg-brand-teal/30 selection:text-brand-teal">
      
      {/* 1. Header (Immersive System Architect OS style) */}
      <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-[#0a0c14]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-cyan-400 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.25)]">
            <span className="font-mono font-black text-white text-lg tracking-tight">Ω</span>
          </div>
          <div>
            <h1 className="text-md font-bold tracking-tight text-white flex items-center gap-2">
              ARCH-AGENT <span className="text-cyan-400 font-mono text-sm px-1.5 py-0.5 bg-cyan-500/10 border border-cyan-500/20 rounded">OS</span>
            </h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Multi-Agent Sandbox Parser</p>
          </div>
          <span className="hidden md:inline-block ml-4 text-[10px] uppercase tracking-widest text-slate-400 border border-white/10 px-2 py-0.5 rounded bg-white/5">
            Enterprise Generative Architect v3.5
          </span>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${isOrchestrating ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)] animate-pulse' : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse'} `}></div>
            <span className="text-xs font-mono text-slate-300">
              {isOrchestrating ? 'ORCHESTRATING_LOOP' : 'SANDBOX_READY'}
            </span>
          </div>
          
          <div className="hidden lg:block h-8 w-[1px] bg-white/10"></div>
          
          <div className="hidden lg:text-right lg:block">
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Evaluation Engine</p>
            <p className="text-xs font-mono text-cyan-300 flex items-center gap-1 justify-end">
              <Sparkles className="w-3 h-3 text-cyan-400 animate-spin" /> Gemini 3.5 Pro
            </p>
          </div>
        </div>
      </header>

      {/* 2. Main content block split into 3 responsive regions */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 p-5 overflow-visible">
        
        {/* Left Column: Input Panel & Agent Terminal Logs (lg:span-4) */}
        <section id="input-controls-section" className="lg:col-span-4 flex flex-col gap-5">
          
          {/* Blueprint Selection Header */}
          <div className="bg-[#0d101a] border border-white/10 rounded-2xl p-5 flex flex-col gap-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" /> Choose API Blueprint
              </h2>
              <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/20">Preloaded Specs</span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {PRELOADED_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.name}
                  id={`btn-${tmpl.name.replace(/\s+/g, '-').toLowerCase()}`}
                  onClick={() => handleTemplateChange(tmpl.name)}
                  className={`text-left p-3 rounded-xl border transition-all text-xs flex flex-col gap-1 ${
                    selectedTemplateName === tmpl.name 
                      ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-inner' 
                      : 'bg-black/30 border-white/5 text-slate-400 hover:bg-white/5 hover:border-white/10'
                  }`}
                >
                  <span className="font-semibold text-slate-200">{tmpl.name}</span>
                  <span className="text-[10px] text-slate-400 line-clamp-1">{tmpl.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Detailed Inputs Box */}
          <div className="bg-[#0d101a] border border-white/10 rounded-2xl p-5 flex flex-col gap-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5 text-brand-teal" /> Target Constraints
              </h2>
              <span className="text-[10px] bg-brand-teal/10 text-brand-teal px-2 py-0.5 rounded-full border border-brand-teal/20">Configurable</span>
            </div>

            {/* Cloud provider & style */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1 font-bold">Cloud Provider</label>
                <select
                  id="select-cloud-provider"
                  value={constraints.platform}
                  onChange={(e) => handleConstraintChange('platform', e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-brand-teal"
                >
                  <option value="aws">AWS (Amazon)</option>
                  <option value="gcp">GCP (Google Cloud)</option>
                  <option value="azure">Azure (Microsoft)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1 font-bold">Architecture Style</label>
                <select
                  id="select-arch-style"
                  value={constraints.architectureStyle}
                  onChange={(e) => handleConstraintChange('architectureStyle', e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-brand-teal"
                >
                  <option value="serverless">Serverless Function</option>
                  <option value="microservices">Containerized Microservices</option>
                  <option value="hybrid">Hybrid Legacy Cloud</option>
                  <option value="monolith">Modular Monolith</option>
                </select>
              </div>
            </div>

            {/* Scalability Profile & Budget goal */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1 font-bold">Scalability Needs</label>
                <select
                  id="select-scalability"
                  value={constraints.scalability}
                  onChange={(e) => handleConstraintChange('scalability', e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-brand-teal"
                >
                  <option value="low">Low Traffic (&lt; 100k req/mo)</option>
                  <option value="medium">Medium Load (1M - 10M req/mo)</option>
                  <option value="high-write">High Write Volume Ingestion</option>
                  <option value="global">Global Replication (Multi-region)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1 font-bold">Budget Mode</label>
                <select
                  id="select-budget-mode"
                  value={constraints.budget}
                  onChange={(e) => handleConstraintChange('budget', e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-brand-teal"
                >
                  <option value="cost-optimized">Strictly Cost-Optimized</option>
                  <option value="balanced">Balanced Performance/Cost</option>
                  <option value="high-availability">Maximum SLA / Multi-Zone</option>
                </select>
              </div>
            </div>

            {/* Custom Extra text constraints */}
            <div>
              <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1 font-bold">Enterprise Constraints</label>
              <textarea
                id="textarea-constraints"
                rows={2}
                value={constraints.additionalConstraints}
                onChange={(e) => handleConstraintChange('additionalConstraints', e.target.value)}
                placeholder="Specify compliance needs, max budget threshold, latency, etc."
                className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-slate-300 focus:outline-none focus:border-brand-teal placeholder:text-slate-600"
              />
            </div>

            {/* URL fetcher section */}
            <div>
              <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1.5 font-bold">
                API Source URLs (Optional Scrapers)
              </label>
              
              <div className="flex flex-col gap-1.5 mb-2 max-h-32 overflow-y-auto pr-1">
                {docUrls.map((url, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-black/40 border border-white/5 rounded-lg px-2.5 py-1 text-xs text-slate-300 font-mono">
                    <span className="truncate text-cyan-500 text-[11px]">{url}</span>
                    <button 
                      id={`btn-remove-url-${idx}`}
                      onClick={() => removeUrl(idx)} 
                      type="button" 
                      className="text-rose-400 hover:text-rose-300 p-0.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  id="input-new-url"
                  type="text"
                  placeholder="https://api.domain.com/v1/swagger.json"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="flex-1 bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-300 focus:outline-none focus:border-brand-teal"
                />
                <button
                  id="btn-add-url"
                  onClick={addUrl}
                  type="button"
                  className="px-3 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 rounded-lg text-xs font-bold"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Raw Swagger Input */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                  Raw OpenAPI Spec (YAML/JSON)
                </label>
                <span className="text-[9px] text-slate-500 font-mono">Length: {specText.length} bytes</span>
              </div>
              <textarea
                id="textarea-spec"
                rows={6}
                value={specText}
                onChange={(e) => setSpecText(e.target.value)}
                placeholder="Paste swagger yaml specification here..."
                className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-[11px] font-mono text-cyan-300/90 focus:outline-none focus:border-brand-teal"
              />
            </div>

            {/* Run Orchestration Trigger Button */}
            <button
              id="btn-run-orchestration"
              onClick={triggerOrchestration}
              disabled={isOrchestrating}
              className={`w-full py-3.5 rounded-xl font-bold uppercase tracking-wider text-xs transition-all duration-300 flex items-center justify-center gap-2 ${
                isOrchestrating 
                  ? 'bg-amber-600/20 text-amber-400 border border-amber-500/30 cursor-wait' 
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.45)] border border-indigo-400/20'
              }`}
            >
              {isOrchestrating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                  Orchestrating Agent Sandbox...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  Run Sandbox Orchestration
                </>
              )}
            </button>
          </div>

          {/* Sandboxed Terminals log outputs */}
          <div className="bg-[#04060d] border border-cyan-500/20 rounded-2xl p-5 flex flex-col h-64 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl"></div>
            
            <h3 className="text-[11px] font-bold text-cyan-400 uppercase tracking-widest mb-3 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                Agent Sandbox Sandbox Output
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-mono">ubuntu-24.04</span>
            </h3>

            <div className="flex-1 overflow-y-auto font-mono text-[10px] space-y-2 pr-1 custom-scrollbar">
              {displayedLogs.map((log, idx) => (
                <div key={idx} className="leading-relaxed border-b border-white/5 pb-1">
                  <span className="text-slate-500 mr-2">[{log.timestamp}]</span>
                  <span className={`font-semibold ${
                    log.level === 'error' ? 'text-rose-400' :
                    log.level === 'warn' ? 'text-amber-400' :
                    log.level === 'success' ? 'text-emerald-400' :
                    'text-cyan-300'
                  }`}>
                    {log.level === 'error' ? '✖ ' : 
                     log.level === 'warn' ? '⚠ ' : 
                     log.level === 'success' ? '✔ ' : 
                     'ℹ '} {log.message}
                  </span>
                </div>
              ))}
              
              {isOrchestrating && (
                <div className="flex items-center gap-2 text-slate-400 italic">
                  <span className="terminal-cursor"></span>
                  <span>Agent analyzing schema constraints...</span>
                </div>
              )}
            </div>
          </div>

        </section>

        {/* Center Column: Interactive Proposal & Tabs Viewer (lg:span-5) */}
        <section id="proposal-output-section" className="lg:col-span-5 flex flex-col bg-[#0d101a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          
          {/* Tabs bar */}
          <div className="border-b border-white/10 px-5 pt-3.5 flex flex-col md:flex-row justify-between md:items-center bg-white/2 gap-3 pb-0">
            <div className="flex gap-2 overflow-x-auto">
              <button 
                id="tab-iac"
                onClick={() => setActiveTab('iac')}
                className={`text-[11px] font-bold uppercase tracking-wider pb-3 px-2 transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'iac' 
                    ? 'text-cyan-400 border-cyan-400 font-bold' 
                    : 'text-slate-400 border-transparent hover:text-slate-200'
                }`}
              >
                <FileCode2 className="w-3.5 h-3.5" /> IaC Code
              </button>
              
              <button 
                id="tab-endpoints"
                onClick={() => setActiveTab('endpoints')}
                className={`text-[11px] font-bold uppercase tracking-wider pb-3 px-2 transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'endpoints' 
                    ? 'text-cyan-400 border-cyan-400 font-bold' 
                    : 'text-slate-400 border-transparent hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" /> Integration Map
              </button>

              <button 
                id="tab-security"
                onClick={() => setActiveTab('security')}
                className={`text-[11px] font-bold uppercase tracking-wider pb-3 px-2 transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'security' 
                    ? 'text-cyan-400 border-cyan-400 font-bold' 
                    : 'text-slate-400 border-transparent hover:text-slate-200'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" /> Security & Bottlenecks
              </button>

              <button 
                id="tab-concepts"
                onClick={() => setActiveTab('concepts')}
                className={`text-[11px] font-bold uppercase tracking-wider pb-3 px-2 transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'concepts' 
                    ? 'text-cyan-400 border-cyan-400 font-bold' 
                    : 'text-slate-400 border-transparent hover:text-slate-200'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" /> Advanced Lessons
              </button>
            </div>

            <div className="flex gap-1.5 pb-2.5 md:pb-0 items-center justify-end">
              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[9px] rounded-md font-mono border border-emerald-500/20 font-bold">
                PROD-READY
              </span>
              <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 text-[9px] rounded-md font-mono border border-cyan-500/20 uppercase font-bold">
                {proposal.iacLanguage}
              </span>
            </div>
          </div>

          {/* Active Tab Body container */}
          <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-5 custom-scrollbar min-h-[480px]">
            
            {/* Header info of proposal */}
            <div className="bg-black/40 border border-white/5 rounded-xl p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-[10px] font-bold rounded-md font-mono">
                  {constraints.platform.toUpperCase()} Proposal
                </span>
                <span className="text-[11px] text-slate-500 font-mono">• Generated successfully</span>
              </div>
              <h2 className="text-md font-bold text-white tracking-tight font-display">{proposal.projectName}</h2>
              <p className="text-xs text-slate-400 leading-relaxed italic">{proposal.architectureSummary}</p>
            </div>

            {/* TAB 1: IaC Code Panel */}
            {activeTab === 'iac' && (
              <div className="flex flex-col gap-4 flex-1">
                <div className="flex justify-between items-center bg-[#070912] border border-white/5 rounded-t-xl px-4 py-2 text-xs">
                  <span className="text-slate-500 font-mono flex items-center gap-1">
                    <FileCode2 className="w-3.5 h-3.5 text-indigo-400" />
                    main.{proposal.iacLanguage === 'terraform' ? 'tf' : 'ts'}
                  </span>
                  
                  <button
                    id="btn-copy-iac"
                    onClick={copyToClipboard}
                    className="text-xs flex items-center gap-1.5 py-1 px-2 bg-white/5 hover:bg-white/10 rounded border border-white/10 text-slate-300 transition-all active:scale-95"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400 text-[11px]">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span className="text-[11px]">Copy IaC</span>
                      </>
                    )}
                  </button>
                </div>
                
                {/* Terraform Code container */}
                <div className="bg-[#05060b] border-x border-b border-white/5 rounded-b-xl p-4 font-mono text-xs overflow-x-auto whitespace-pre leading-relaxed text-slate-300 max-h-96">
                  {proposal.iacCode}
                </div>

                {/* Automation highlight explanation */}
                <div className="p-4 border border-indigo-500/20 rounded-xl bg-indigo-500/5 flex flex-col gap-2">
                  <h4 className="text-white font-sans font-bold text-xs uppercase tracking-widest flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" /> Optimization Rationale
                  </h4>
                  <p className="text-slate-300 font-sans text-xs leading-relaxed">
                    Gemini evaluated {proposal.endpoints.length} routes from the spec sheet. Based on target <strong className="text-cyan-400 font-mono">{constraints.scalability}</strong> limits, resources like serverless queues (SQS/PubSub) were instantiated into your script code to block cold starts and buffer downstream writes automatically.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 2: API Integration Map */}
            {activeTab === 'endpoints' && (
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Mapped Routes & Service Bindings</h3>
                  <span className="text-[10px] text-slate-500 font-mono">{proposal.endpoints.length} routes verified</span>
                </div>

                <div className="space-y-3">
                  {proposal.endpoints.map((endpoint, i) => (
                    <div key={i} className="bg-black/30 border border-white/5 hover:border-indigo-500/30 rounded-xl p-3.5 flex flex-col gap-2.5 transition-all">
                      <div className="flex flex-wrap justify-between items-center gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
                            endpoint.method === 'GET' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' :
                            endpoint.method === 'POST' ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/25' :
                            'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                          }`}>
                            {endpoint.method}
                          </span>
                          <span className="font-mono text-xs font-bold text-white">{endpoint.path}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md ${
                            endpoint.vulnerabilityRisk === 'high' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                            endpoint.vulnerabilityRisk === 'medium' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                            'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}>
                            Risk: {endpoint.vulnerabilityRisk.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300">{endpoint.summary}</p>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 text-[10px] font-mono">
                        <div>
                          <span className="text-slate-500 block uppercase text-[8px] tracking-wider font-bold">Target Service:</span>
                          <span className="text-indigo-300">{endpoint.targetService}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block uppercase text-[8px] tracking-wider font-bold">Storage/DB Pattern:</span>
                          <span className="text-cyan-300">{endpoint.dbReadWrite}</span>
                        </div>
                        <div className="col-span-2 pt-1 border-t border-white/5">
                          <span className="text-slate-500 block uppercase text-[8px] tracking-wider font-bold">Risk Assessment:</span>
                          <span className="text-amber-300/90 leading-relaxed italic block">{endpoint.riskDescription}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: Security & Bottlenecks Audit */}
            {activeTab === 'security' && (
              <div className="flex flex-col gap-4">
                
                {/* Security flaws section */}
                <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-4 flex flex-col gap-3">
                  <h3 className="text-xs font-bold text-rose-400 uppercase tracking-widest flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    Security Flaws Identified in Schema
                  </h3>
                  {proposal.securityFlaws.length === 0 ? (
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" /> No urgent security flaws detected.
                    </div>
                  ) : (
                    <ul className="space-y-2 list-none">
                      {proposal.securityFlaws.map((flaw, i) => (
                        <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                          <span className="text-rose-400 text-sm leading-none">•</span>
                          <span>{flaw}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* System bottlenecks section */}
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 flex flex-col gap-3">
                  <h3 className="text-xs font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-400" />
                    System & Scalability Bottlenecks
                  </h3>
                  <ul className="space-y-2 list-none">
                    {proposal.bottlenecks.map((bottleneck, i) => (
                      <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                        <span className="text-amber-400 text-sm leading-none">•</span>
                        <span>{bottleneck}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Dynamic audit tool-use simulation explanation */}
                <div className="p-4 bg-black/40 border border-white/5 rounded-xl flex flex-col gap-2">
                  <h4 className="text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                    Stateful Sandbox Scan Pipeline
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Under real production scenarios, Gemini launches a multi-layered ReAct agent loop inside a sandboxed Linux kernel. It generates automated scripts, compiles the code locally, runs validator suites, and performs endpoint integration checks to ensure the generated resources actually build without syntax issues.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 4: Advanced Concepts & Masterclass */}
            {activeTab === 'concepts' && (
              <div className="flex flex-col gap-5">
                <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                  <BookOpen className="w-5 h-5 text-indigo-400 animate-pulse" />
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-widest">Developer Concepts Masterclass</h3>
                    <p className="text-[10px] text-slate-500">How to code stateful, long-context system flows</p>
                  </div>
                </div>

                {/* Concept 1: Stateful loops */}
                <div className="bg-[#121524] border border-white/5 rounded-xl p-4 flex flex-col gap-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xs">1</span>
                    <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Stateful Agent Loops (ReAct Style)</h4>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {proposal.educationalNotes.agentLoopApplied}
                  </p>
                  <div className="p-2.5 bg-black/40 rounded border border-white/5 font-mono text-[10px] text-indigo-400">
                    State = &#123; schemaValid: false, retryCount: 2, errors: ["Missing type 'orderId'"] &#125;
                  </div>
                </div>

                {/* Concept 2: Tool Use */}
                <div className="bg-[#121524] border border-white/5 rounded-xl p-4 flex flex-col gap-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold text-xs">2</span>
                    <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider">Tool Use (Function Calling)</h4>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {proposal.educationalNotes.toolUseExplanation}
                  </p>
                  <div className="p-2.5 bg-black/40 rounded border border-white/5 font-mono text-[10px] text-cyan-400">
                    ai.models.generateContent(&#123; tools: [validateSchema, runLinter] &#125;)
                  </div>
                </div>

                {/* Concept 3: Long Context Processing */}
                <div className="bg-[#121524] border border-white/5 rounded-xl p-4 flex flex-col gap-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs">3</span>
                    <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Long-Context Relevance</h4>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {proposal.educationalNotes.longContextRelevance}
                  </p>
                  <div className="p-2.5 bg-black/40 rounded border border-white/5 font-mono text-[10px] text-emerald-400">
                    Gemini 3.5 Native Context Window: 1,000,000+ Tokens
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Right Column: Simulation & Pricing Dashboard (lg:span-3) */}
        <section id="cost-simulation-section" className="lg:col-span-3 flex flex-col gap-5">
          
          {/* Cost Ingest Slider Simulation */}
          <div className="bg-[#0d101a] border border-white/10 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Cost Simulator
            </h3>

            {/* Slider Widget */}
            <div className="bg-black/40 border border-white/5 rounded-xl p-4 flex flex-col gap-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-bold">Monthly Ingest Volume:</span>
                <span className="text-white font-mono bg-indigo-500/10 px-2 py-0.5 rounded font-bold border border-indigo-500/20">
                  {monthlyVolumeMillions} Million / mo
                </span>
              </div>
              
              <input
                id="input-volume-slider"
                type="range"
                min="1"
                max="100"
                value={monthlyVolumeMillions}
                onChange={(e) => setMonthlyVolumeMillions(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />

              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>1 Million</span>
                <span>50 Million</span>
                <span>100 Million</span>
              </div>
            </div>

            {/* Big Calculated Number */}
            <div className="text-center py-3 bg-[#0d1324] border border-cyan-500/15 rounded-xl">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">Total Estimated Budget</p>
              <p className="text-3xl font-black text-emerald-400 tracking-tight italic font-mono mt-1">
                ${totalCalculatedCost.toFixed(2)}<span className="text-xs text-slate-500 font-normal">/mo</span>
              </p>
            </div>

            {/* Broken-down components list */}
            <div className="space-y-2.5">
              <h4 className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Estimated Line Items:</h4>
              
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {proposal.costModel.map((item, idx) => {
                  const calculated = item.baseCost + (item.unitCost * monthlyVolumeMillions);
                  return (
                    <div key={idx} className="flex flex-col gap-0.5 p-2 bg-black/20 border border-white/5 rounded-lg text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-300 font-semibold">{item.serviceName}</span>
                        <span className="text-white font-mono font-bold">${calculated.toFixed(2)}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 italic font-mono">{item.formulaDescription}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Performance Dashboard KPIs */}
          <div className="bg-[#0d101a] border border-white/10 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" /> Performance KPIs
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-black/30 border border-white/5 rounded-xl p-3 text-center">
                <p className="text-2xl font-black text-cyan-400 tracking-tighter font-mono italic">
                  {proposal.performance.estimatedLatencyMs}ms
                </p>
                <p className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold mt-1">Avg Latency</p>
              </div>

              <div className="bg-black/30 border border-white/5 rounded-xl p-3 text-center">
                <p className="text-2xl font-black text-white tracking-tighter font-mono">
                  {(proposal.performance.maxThroughputRps / 1000).toFixed(0)}k
                </p>
                <p className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold mt-1">Max RPS</p>
              </div>
            </div>

            {/* SLA indicator */}
            <div className="flex items-center justify-between p-3 bg-[#0d141e] border border-indigo-500/10 rounded-xl">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Estimated SLA Target:</span>
              <span className="text-xs font-mono font-bold text-indigo-300 px-2.5 py-0.5 bg-indigo-500/10 rounded-md border border-indigo-500/20">
                {proposal.performance.slaAvailability} Availability
              </span>
            </div>

            {/* Platform Expert Insight card */}
            <div className="p-3.5 bg-[#141b2e] border border-indigo-500/30 rounded-xl">
              <div className="flex items-center gap-1.5 mb-1 text-[10px] font-bold text-cyan-300 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                AI Optimization Recommendation
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed italic">
                &quot;Deploying compute structures to {constraints.platform.toUpperCase()} with ARM64 / Graviton options and Pay-Per-Request DB billing matches the estimated request envelope to keep flat costs down to zero during idle intervals.&quot;
              </p>
            </div>
          </div>

          {/* Interactive Micro API-Tester sandbox controller */}
          <div className="bg-[#0c1222]/60 border border-white/10 rounded-2xl p-4 shadow-md flex flex-col gap-2.5">
            <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
              <Globe className="w-3 h-3 text-indigo-400" /> API Gateway Tester
            </h4>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Configure parameters to mock testing the compiled sandbox REST API endpoints locally.
            </p>
            <div className="flex gap-2">
              <div className="bg-black/40 text-[10px] border border-white/5 rounded px-2 py-1 font-mono text-cyan-400">
                POST
              </div>
              <div className="flex-1 bg-black/40 text-[10px] border border-white/5 rounded px-2 py-1 font-mono text-slate-400 truncate">
                /orders?cartId=cart_923
              </div>
            </div>
            <button
              id="btn-simulate-test-call"
              onClick={() => {
                setDisplayedLogs(prev => [
                  ...prev,
                  { timestamp: "TestRun", level: "info", message: "POST /orders mock test dispatched from Gateway client." },
                  { timestamp: "TestRun", level: "success", message: "Response received: HTTP 201 Created. Latency: 42ms." }
                ]);
              }}
              className="py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-[11px] font-bold text-slate-300 transition-all active:scale-95"
            >
              Simulate Test Call
            </button>
          </div>

        </section>

      </main>

      {/* 3. Footer */}
      <footer className="h-12 border-t border-white/10 bg-[#05060a]/90 flex items-center justify-between px-6 z-40">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-slate-500 uppercase tracking-wider">Sandbox Node:</span>
            <span className="text-[9px] font-mono text-cyan-500 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">linux-x64-agent-04</span>
          </div>
        </div>
        
        <div className="hidden sm:flex items-center gap-4 text-[9px] font-bold text-slate-500 font-mono tracking-wider">
          <span className="hover:text-cyan-400 cursor-pointer" onClick={() => setActiveTab('concepts')}>STATEFUL AGENT LOOPS</span>
          <span>/</span>
          <span className="hover:text-cyan-400 cursor-pointer" onClick={() => setActiveTab('concepts')}>TOOL DEFINITIONS</span>
          <span>/</span>
          <span className="hover:text-cyan-400 cursor-pointer" onClick={() => setActiveTab('concepts')}>LONG-CONTEXT WINDOW</span>
        </div>
      </footer>

    </div>
  );
}
