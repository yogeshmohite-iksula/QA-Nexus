// Unit tests for the provider registry — the seam where adding a new
// LLM provider becomes a 1-line change.
//
// Spec: MS0-T023.
//
// Strategy: jest.mock the concrete provider modules so we don't need real
// API keys at test time (GroqProvider + GeminiProvider both validate keys
// in their constructors). The registry's behaviour we want to pin:
//   1. listProviders() returns the registered names
//   2. getProvider() lazy-instantiates + caches per-name
//   3. getProvider() with unknown name throws with a helpful message
//   4. _resetProviderCacheForTests() clears the cache so subsequent calls
//      re-instantiate (used by other test files to inject mocks)

jest.mock('../providers/groq.provider', () => {
  let n = 0;
  return {
    GroqProvider: jest.fn().mockImplementation(() => ({
      __id: ++n,
      name: 'groq',
      defaultModel: 'mock-groq-model',
    })),
  };
});
jest.mock('../providers/gemini.provider', () => {
  let n = 0;
  return {
    GeminiProvider: jest.fn().mockImplementation(() => ({
      __id: ++n,
      name: 'gemini',
      defaultModel: 'mock-gemini-model',
    })),
  };
});

import {
  getProvider,
  listProviders,
  _resetProviderCacheForTests,
} from '../provider-registry';

describe('provider-registry', () => {
  beforeEach(() => {
    _resetProviderCacheForTests();
  });

  it('listProviders() returns the canonical Day-3 set', () => {
    const names = listProviders();
    expect(names).toContain('groq');
    expect(names).toContain('gemini');
    expect(names.length).toBe(2);
  });

  it('getProvider("groq") returns a GroqProvider instance', () => {
    const p = getProvider('groq');
    expect(p.name).toBe('groq');
  });

  it('getProvider() caches per-name (same instance on second call)', () => {
    const a = getProvider('groq');
    const b = getProvider('groq');
    expect(a).toBe(b);
    // Different name = different cache entry.
    const c = getProvider('gemini');
    expect(c).not.toBe(a);
  });

  it('getProvider("unknown") throws with a helpful add-a-provider message', () => {
    expect(() => getProvider('mistral')).toThrow(
      /Unknown LLM provider.*mistral/,
    );
    expect(() => getProvider('mistral')).toThrow(/Known: groq, gemini/);
    expect(() => getProvider('mistral')).toThrow(/provider-registry\.ts/);
  });

  it('_resetProviderCacheForTests() clears so factory fires again', () => {
    const a = getProvider('groq') as any;
    _resetProviderCacheForTests();
    const b = getProvider('groq') as any;
    // Different __id = new instance after cache clear.
    expect(b.__id).not.toBe(a.__id);
  });
});
