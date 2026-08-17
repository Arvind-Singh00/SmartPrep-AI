import Groq from 'groq-sdk';
import config from '../config/env.config.js';
import { LlmQuotaExceededError, AppError } from '../utils/AppError.js';
import logger from '../utils/logger.js';

class GroqApiError extends AppError {
  constructor(message) {
    super(message, 502, 'GROQ_UPSTREAM_FAIL');
  }
}

const GROQ_MODELS = [
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'qwen/qwen3.6-27b',
];

class GroqService {
  _getClient() {
    const apiKey = config.groq.apiKey;
    if (!apiKey || apiKey === 'missing-key') {
      throw new GroqApiError('GROQ_API_KEY environment variable is not configured on the server.');
    }
    return new Groq({ apiKey });
  }

  _handleApiError(error, contextMessage) {
    if (error instanceof GroqApiError || error instanceof LlmQuotaExceededError) {
      throw error;
    }

    const isQuotaError =
      error.status === 429 ||
      (error.message && error.message.includes('429')) ||
      (error.error && error.error.error && error.error.error.code === 'rate_limit_exceeded');

    if (isQuotaError) {
      logger.warn(`Groq Quota Exceeded: ${contextMessage}`, { originalError: error.message });
      throw new LlmQuotaExceededError('Groq API quota exceeded. Please wait a minute and try again.');
    }

    logger.error(`Groq API failed: ${contextMessage}`, { error: error.message });
    throw new GroqApiError(`${contextMessage}: ${error.message}`);
  }

  async generateChatResponse(systemPrompt, chatHistory, userQuery) {
    const messages = [
      { role: 'system', content: systemPrompt },
      ...chatHistory.map((msg) => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content,
      })),
      { role: 'user', content: userQuery },
    ];

    let lastError = null;
    const client = this._getClient();

    for (const model of GROQ_MODELS) {
      try {
        const response = await client.chat.completions.create({
          messages,
          model,
          temperature: 0.2,
          max_tokens: 800,
        });

        return response.choices[0].message.content;
      } catch (error) {
        lastError = error;
        const isNotFound = error.status === 404 || (error.message && error.message.includes('model_not_found'));
        if (isNotFound) {
          logger.warn(`Groq model ${model} not found, trying fallback model...`);
          continue;
        }
        this._handleApiError(error, 'Failed to generate chat response');
      }
    }

    this._handleApiError(lastError || new Error('All Groq models failed'), 'Failed to generate chat response');
  }

  async generateStructuredData(systemPrompt, context) {
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `CONTEXT:\n${context}` },
    ];

    let lastError = null;
    const client = this._getClient();

    for (const model of GROQ_MODELS) {
      try {
        const response = await client.chat.completions.create({
          messages,
          model,
          temperature: 0.1,
          max_tokens: 2000,
          response_format: { type: 'json_object' },
        });

        return JSON.parse(response.choices[0].message.content);
      } catch (error) {
        lastError = error;
        const isNotFound = error.status === 404 || (error.message && error.message.includes('model_not_found'));
        if (isNotFound) {
          logger.warn(`Groq model ${model} not found for structured data, trying fallback model...`);
          continue;
        }
        if (error instanceof SyntaxError) {
          logger.error('JSON parse failed for Groq output', { error: error.message });
          throw new GroqApiError('Groq returned invalid JSON.');
        }
        this._handleApiError(error, 'Failed to generate structured data');
      }
    }

    this._handleApiError(lastError || new Error('All Groq models failed'), 'Failed to generate structured data');
  }
}

export default new GroqService();
