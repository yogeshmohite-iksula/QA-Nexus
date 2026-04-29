// Gemini adapter — wraps @google/generative-ai's GenerativeModel.
//
// Spec: MS0-T023. Default model gemini-2.5-flash (free tier ~1.5k RPD).
// Used as the secondary fallback when the primary (typically Groq) fails
// with a transient 429/503.
import { GoogleGenerativeAI } from '@google/generative-ai';
import { LLMOptions, LLMResult, RetryableLLMError } from '../types';
import { BaseProvider } from './base.provider';

export class GeminiProvider extends BaseProvider {
  readonly name = 'gemini';
  readonly defaultModel: string;
  private readonly client: GoogleGenerativeAI;

  constructor() {
    super();
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error(
        'GEMINI_API_KEY (or GOOGLE_API_KEY) is required for GeminiProvider.',
      );
    }
    this.client = new GoogleGenerativeAI(apiKey);
    this.defaultModel = process.env.LLM_SECONDARY_MODEL || 'gemini-2.5-flash';
  }

  protected async callProvider(
    prompt: string,
    opts: LLMOptions,
  ): Promise<LLMResult> {
    const modelId = opts.model || this.defaultModel;
    try {
      const model = this.client.getGenerativeModel({
        model: modelId,
        systemInstruction: opts.systemPrompt,
        generationConfig: {
          temperature: opts.temperature ?? 0.7,
          maxOutputTokens: opts.maxTokens,
        },
      });
      const resp = await model.generateContent(prompt);
      const text = resp.response.text();
      const usage = resp.response.usageMetadata;
      return {
        text,
        providerName: this.name,
        modelUsed: modelId,
        tokensIn: usage?.promptTokenCount ?? Math.ceil(prompt.length / 4),
        tokensOut: usage?.candidatesTokenCount ?? Math.ceil(text.length / 4),
        latencyMs: 0,
        fallbackUsed: false,
        cost: 0,
        routeReason: 'primary',
      };
    } catch (err) {
      // Gemini SDK errors carry status in .message; sniff for 429 / 503.
      const errObj = err as { status?: number; message?: string };
      const status =
        errObj.status ??
        (errObj.message?.includes('429')
          ? 429
          : errObj.message?.includes('503')
            ? 503
            : undefined);
      if (status === 429 || status === 503) {
        throw new RetryableLLMError(
          errObj.message || `Gemini API ${status}`,
          this.name,
          status,
          err,
        );
      }
      throw err;
    }
  }
}
