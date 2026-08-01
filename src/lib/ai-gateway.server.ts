import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

/** Shared Lovable AI Gateway provider. Server-only: never import from client code. */
export function createLovableAiGatewayProvider(apiKey: string) {
  return createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: { "Lovable-API-Key": apiKey },
  });
}

export const COACH_MODEL = "openai/gpt-5.6-sol";

export const COACH_PROVIDER_OPTIONS = {
  lovable: { reasoningEffort: "none" },
} as const;

export function requireGatewayKey() {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI coaching is not configured yet.");
  return key;
}
