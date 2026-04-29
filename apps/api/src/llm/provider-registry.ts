// QA Nexus PM1 — provider registry.
//
// Spec: MS0-T023. The single seam through which the LLMGateway resolves
// a provider name (string from env) into an LLMProvider instance.
//
// Adding a new provider in PM1+ is therefore a 1-line change:
//   1. Author apps/api/src/llm/providers/<name>.provider.ts (extends BaseProvider).
//   2. Add `<name>: () => new <Name>Provider()` to REGISTRY below.
//   3. Done. The LLMGateway picks it up via env LLM_PRIMARY_PROVIDER=<name>.
//
// Providers are constructed lazily — the factory only fires when the
// gateway actually needs the provider. This avoids requiring every
// provider's API key to be present at boot (e.g. you can run with only
// GROQ_API_KEY set and not GEMINI_API_KEY, as long as the secondary
// route is never triggered).
import type { LLMProvider } from './types';
import { GeminiProvider } from './providers/gemini.provider';
import { GroqProvider } from './providers/groq.provider';

type ProviderFactory = () => LLMProvider;

const REGISTRY: Record<string, ProviderFactory> = {
  groq: () => new GroqProvider(),
  gemini: () => new GeminiProvider(),
  // Future free-tier providers — add here:
  // mistral:    () => new MistralProvider(),
  // together:   () => new TogetherProvider(),
  // openai:     () => new OpenAiProvider(),
  // cerebras:   () => new CerebrasProvider(),
};

const cache: Map<string, LLMProvider> = new Map();

/** Resolve a provider by name. Caches the instance per-name so we don't
 *  re-construct (and re-validate API keys) on every gateway call. */
export function getProvider(name: string): LLMProvider {
  const cached = cache.get(name);
  if (cached) return cached;
  const factory = REGISTRY[name];
  if (!factory) {
    throw new Error(
      `Unknown LLM provider: '${name}'. Known: ${Object.keys(REGISTRY).join(', ')}. ` +
        `Add a new provider by creating apps/api/src/llm/providers/${name}.provider.ts ` +
        `and registering it in apps/api/src/llm/provider-registry.ts.`,
    );
  }
  const instance = factory();
  cache.set(name, instance);
  return instance;
}

/** List of registered provider names — for diagnostics + /llm/providers endpoint. */
export function listProviders(): string[] {
  return Object.keys(REGISTRY);
}

/** Test-only: clear the cache so unit tests can rebuild with mock keys. */
export function _resetProviderCacheForTests(): void {
  cache.clear();
}
