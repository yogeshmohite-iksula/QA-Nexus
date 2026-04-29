// Groq adapter — wraps groq-sdk's chat.completions.
//
// Spec: MS0-T023. Groq's free tier provides openai/gpt-oss-120b (default
// here) + meta-llama/llama-4-scout-17b-16e-instruct (long-context route)
// + openai/gpt-oss-20b (fast route). The model picked at call time is
// LLMOptions.model when provided, else this.defaultModel.
import Groq from 'groq-sdk';
import { LLMOptions, LLMResult, RetryableLLMError } from '../types';
import { BaseProvider } from './base.provider';

export class GroqProvider extends BaseProvider {
  readonly name = 'groq';
  readonly defaultModel: string;
  private readonly client: Groq;

  constructor() {
    super();
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error(
        'GROQ_API_KEY is required for GroqProvider. Set in apps/api/.env or Render env.',
      );
    }
    this.client = new Groq({ apiKey });
    this.defaultModel = process.env.LLM_PRIMARY_MODEL || 'openai/gpt-oss-120b';
  }

  protected async callProvider(
    prompt: string,
    opts: LLMOptions,
  ): Promise<LLMResult> {
    const model = opts.model || this.defaultModel;
    const messages: Array<{ role: 'system' | 'user'; content: string }> = [];
    if (opts.systemPrompt)
      messages.push({ role: 'system', content: opts.systemPrompt });
    messages.push({ role: 'user', content: prompt });

    try {
      const resp = await this.client.chat.completions.create({
        model,
        messages,
        temperature: opts.temperature ?? 0.7,
        max_tokens: opts.maxTokens,
      });
      const text = resp.choices[0]?.message?.content ?? '';
      const usage = resp.usage;
      return {
        text,
        providerName: this.name, // BaseProvider overwrites with this.name (same value)
        modelUsed: model,
        tokensIn: usage?.prompt_tokens ?? Math.ceil(prompt.length / 4),
        tokensOut: usage?.completion_tokens ?? Math.ceil(text.length / 4),
        latencyMs: 0, // BaseProvider fills this
        fallbackUsed: false, // gateway overwrites
        cost: 0, // free tier
        routeReason: 'primary', // gateway overwrites
      };
    } catch (err) {
      // Map groq-sdk errors to RetryableLLMError when transient.
      const errObj = err as { status?: number; message?: string };
      const status = errObj.status;
      if (status === 429 || status === 503) {
        throw new RetryableLLMError(
          errObj.message || `Groq API ${status}`,
          this.name,
          status,
          err,
        );
      }
      throw err;
    }
  }
}
