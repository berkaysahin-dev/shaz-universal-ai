import * as readline from "node:readline";
import * as fs from "node:fs";
import * as path from "node:path";
import {
  VisionAI,
  requireShazLicense,
  normalizeLicenseKey,
  type VerifyLicenseOptions
} from "vision-universal-ai";

function loadDotenvLicenseVars(envPath: string): void {
  try {
    if (!fs.existsSync(envPath)) return;
    const content = fs.readFileSync(envPath, "utf-8");
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#") || !line.includes("=")) continue;
      const idx = line.indexOf("=");
      const key = line.slice(0, idx).trim();
      if (!key.startsWith("SHAZ_LICENSE_")) continue;
      const val = line
        .slice(idx + 1)
        .split(" #")[0]
        .trim()
        .replace(/^["']|["']$/g, "");
      if (val && !process.env[key]) {
        process.env[key] = val;
      }
    }
  } catch {
    // Ignore unreadable .env
  }
}

function persistEnvLicenseKey(envPath: string, licenseKey: string): void {
  try {
    if (!fs.existsSync(envPath)) return;
    const lines = fs.readFileSync(envPath, "utf-8").split(/\r?\n/);
    let updated = false;
    const nextLines = lines.map((line) => {
      if (line.trim().startsWith("SHAZ_LICENSE_KEY=")) {
        updated = true;
        return `SHAZ_LICENSE_KEY=${licenseKey}`;
      }
      return line;
    });
    if (!updated) {
      nextLines.push(`SHAZ_LICENSE_KEY=${licenseKey}`);
    }
    fs.writeFileSync(envPath, nextLines.filter((l, i, arr) => i < arr.length - 1 || l !== "").join("\n") + "\n", "utf-8");
  } catch {
    // Non-fatal
  }
}

async function promptForLicenseKey(): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise((resolve) => {
    console.log("Shaz Agency Lisans Doğrulama");
    console.log("Doğru format: SHAZ-XXXX-XXXX-XXXX-XXXX");
    rl.question("Lütfen lisans anahtarınızı girin: ", (answer) => {
      rl.close();
      resolve(normalizeLicenseKey(answer));
    });
  });
}

export async function ensureCliLicense(options?: VerifyLicenseOptions): Promise<void> {
  const envPath = path.resolve(process.cwd(), ".env");
  loadDotenvLicenseVars(envPath);

  let key = normalizeLicenseKey(options?.licenseKey ?? process.env.SHAZ_LICENSE_KEY);
  const isInteractive = Boolean(process.stdin.isTTY);

  if (!key && isInteractive) {
    const entered = await promptForLicenseKey();
    if (entered) {
      key = entered;
      process.env.SHAZ_LICENSE_KEY = entered;
    }
  }

  const result = await requireShazLicense({
    ...options,
    licenseKey: key || undefined
  });

  if (key) {
    persistEnvLicenseKey(envPath, result.key);
  }
}

export async function runCLI(args: string[]) {
  const command = args[0] || "help";

  const needsLicense = ["init", "chat", "models", "test"].includes(command);
  if (needsLicense) {
    try {
      await ensureCliLicense();
    } catch (err: any) {
      console.error(`Lisans doğrulama hatası: ${err?.message || "Lisans doğrulanamadı."}`);
      process.exitCode = 1;
      return;
    }
  }

  switch (command) {
    case "init":
      await handleInit();
      break;
    case "chat":
      await handleChat(args.slice(1));
      break;
    case "models":
      await handleModels();
      break;
    case "test":
      await handleTest();
      break;
    case "version":
    case "-v":
    case "--version":
      console.log("Vision Universal AI CLI v1.0.0");
      break;
    case "help":
    case "--help":
    case "-h":
    default:
      printHelp();
      break;
  }
}

function printHelp() {
  console.log(`
┌──────────────────────────────────────────────────┐
│  VISION UNIVERSAL AI - CLI                       │
│  "One SDK. Every AI."                            │
└──────────────────────────────────────────────────┘

Usage:
  vision-ai <command> [options]

Commands:
  init             Scaffold a new Vision AI project configuration
  chat [provider]  Start an interactive terminal chat with streaming
  models           List available providers and model configurations
  test             Run diagnostics to check provider API key validity
  version          Print CLI version
  help             Show this help message

Examples:
  npx vision-ai init
  npx vision-ai chat gemini
  npx vision-ai chat openai
  npx vision-ai test
`);
}

async function handleInit() {
  const targetEnv = path.resolve(process.cwd(), ".env.example");
  const envContent = `# Vision Universal AI - Environment Configuration
SHAZ_LICENSE_KEY=
SHAZ_LICENSE_API_URL=http://localhost:3000/api/licenses/verify
SHAZ_LICENSE_DOMAIN=
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
GROQ_API_KEY=your_groq_api_key_here
DEEPSEEK_API_KEY=your_deepseek_api_key_here
OPENROUTER_API_KEY=your_openrouter_api_key_here
MISTRAL_API_KEY=your_mistral_api_key_here
OLLAMA_HOST=http://localhost:11434
`;

  const configPath = path.resolve(process.cwd(), "vision.config.json");
  const configContent = JSON.stringify(
    {
      $schema: "https://vision-ai.dev/schema.json",
      defaultProvider: "gemini",
      routing: {
        default: "gemini",
        fallback: ["openai", "anthropic", "groq"],
        fallbackOnRateLimit: true,
        fallbackOnServerError: true
      },
      timeoutMs: 60000,
      retries: 3
    },
    null,
    2
  );

  fs.writeFileSync(targetEnv, envContent, "utf-8");
  fs.writeFileSync(configPath, configContent, "utf-8");

  console.log("Initialized Vision Universal AI project files:");
  console.log(`  Created: ${targetEnv}`);
  console.log(`  Created: ${configPath}`);
  console.log("\nNext step: Copy .env.example to .env and add your API keys.");
}

async function handleModels() {
  console.log(`
Configured Providers:
  1. Google Gemini  (GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? "CONFIGURED" : "MISSING"})
     - Default Model: gemini-2.5-flash
     - Capabilities: Chat, Streaming, Tools, Vision, Audio, PDF, JSON Schema, Embeddings

  2. OpenAI         (OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? "CONFIGURED" : "MISSING"})
     - Default Model: gpt-4o
     - Capabilities: Chat, Streaming, Tools, Vision, JSON Schema, Embeddings, DALL-E

  3. Anthropic      (ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? "CONFIGURED" : "MISSING"})
     - Default Model: claude-sonnet-5-5
     - Capabilities: Chat, Streaming, Tools, Vision, PDF, JSON Schema

  4. Groq           (GROQ_API_KEY: ${process.env.GROQ_API_KEY ? "CONFIGURED" : "MISSING"})
     - Default Model: llama-3.3-70b-versatile
     - Capabilities: Chat, Streaming, Tools, Ultra-low Latency

  5. DeepSeek       (DEEPSEEK_API_KEY: ${process.env.DEEPSEEK_API_KEY ? "CONFIGURED" : "MISSING"})
     - Default Model: deepseek-chat
     - Capabilities: Chat, Reasoning Tokens (R1), Tools, JSON Schema

  6. OpenRouter     (OPENROUTER_API_KEY: ${process.env.OPENROUTER_API_KEY ? "CONFIGURED" : "MISSING"})
     - Default Model: meta-llama/llama-3.3-70b-instruct
     - Capabilities: Multi-model Gateway

  7. Ollama (Local) (OLLAMA_HOST: ${process.env.OLLAMA_HOST || "http://localhost:11434"})
     - Default Model: llama3.2
     - Capabilities: Local Chat, Streaming, Vision, Embeddings

  8. Mistral AI     (MISTRAL_API_KEY: ${process.env.MISTRAL_API_KEY ? "CONFIGURED" : "MISSING"})
     - Default Model: mistral-large-latest
     - Capabilities: Chat, Streaming, Tools, Embeddings
`);
}

async function handleTest() {
  console.log("Checking configured AI providers...\n");
  const providers = ["gemini", "openai", "anthropic", "groq", "deepseek", "openrouter", "ollama", "mistral"];

  for (const p of providers) {
    const ai = new VisionAI({ provider: p });
    try {
      const start = Date.now();
      const res = await ai.chat({ prompt: "Say 'OK' in one word.", maxTokens: 5, timeoutMs: 5000 });
      const elapsed = Date.now() - start;
      console.log(`[PASS] ${p.toUpperCase().padEnd(12)} - ${elapsed}ms -> "${res.text.trim()}"`);
    } catch (err: any) {
      console.log(`[FAIL] ${p.toUpperCase().padEnd(12)} - ${err.message}`);
    }
  }
}

async function handleChat(args: string[]) {
  const provider = args[0] || process.env.DEFAULT_PROVIDER || "gemini";
  console.log(`Starting Vision AI interactive chat session [Provider: ${provider}]`);
  console.log("Type your prompt and press Enter. Type 'exit' to quit.\n");

  const ai = new VisionAI({ provider });
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const promptUser = () => {
    rl.question("\nYou > ", async (userInput) => {
      const input = userInput.trim();
      if (!input || input.toLowerCase() === "exit") {
        rl.close();
        return;
      }

      process.stdout.write("\nAI  > ");
      try {
        const stream = await ai.stream(input);
        for await (const chunk of stream) {
          process.stdout.write(chunk.delta);
        }
        console.log();
      } catch (err: any) {
        console.error(`\n[Error]: ${err.message}`);
      }

      promptUser();
    });
  };

  promptUser();
}
