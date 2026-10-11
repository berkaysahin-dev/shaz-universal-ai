import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts", "packages/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"]
    }
  },
  resolve: {
    alias: {
      "@vision-ai/core": path.resolve(import.meta.dirname, "packages/core/src"),
      "@vision-ai/openai": path.resolve(import.meta.dirname, "packages/openai/src"),
      "@vision-ai/gemini": path.resolve(import.meta.dirname, "packages/gemini/src"),
      "@vision-ai/anthropic": path.resolve(import.meta.dirname, "packages/anthropic/src"),
      "@vision-ai/groq": path.resolve(import.meta.dirname, "packages/groq/src"),
      "@vision-ai/deepseek": path.resolve(import.meta.dirname, "packages/deepseek/src"),
      "@vision-ai/openrouter": path.resolve(import.meta.dirname, "packages/openrouter/src"),
      "@vision-ai/ollama": path.resolve(import.meta.dirname, "packages/ollama/src"),
      "@vision-ai/mistral": path.resolve(import.meta.dirname, "packages/mistral/src"),
      "vision-universal-ai": path.resolve(import.meta.dirname, "packages/sdk/src")
    }
  }
});
