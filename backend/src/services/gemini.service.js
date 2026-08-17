/**
 * @module services/gemini
 * @description Anti-corruption layer wrapping the new Google Gen AI SDK.
 */

import { GoogleGenAI } from "@google/genai";
import config from "../config/env.config.js";
import { GeminiApiError, LlmQuotaExceededError } from "../utils/AppError.js";
import logger from "../utils/logger.js";

class GeminiService {
  _getClient() {
    const apiKey = config.gemini.apiKey;
    if (!apiKey) {
      throw new GeminiApiError(
        "GEMINI_API_KEY environment variable is not configured on the server.",
      );
    }
    return new GoogleGenAI({ apiKey });
  }

  _handleApiError(error, contextMessage) {
    if (
      error instanceof GeminiApiError ||
      error instanceof LlmQuotaExceededError
    ) {
      throw error;
    }

    const isQuotaError =
      error.status === 429 ||
      (error.message && error.message.includes("429")) ||
      (error.message && error.message.includes("RESOURCE_EXHAUSTED"));

    if (isQuotaError) {
      logger.warn(`LLM Quota Exceeded: ${contextMessage}`, {
        originalError: error.message,
      });
      throw new LlmQuotaExceededError(
        "Google Gemini API quota exceeded. Please try again later or upgrade your plan.",
      );
    }

    logger.error(`Gemini API failed: ${contextMessage}`, {
      error: error.message,
    });
    throw new GeminiApiError(`${contextMessage}: ${error.message}`);
  }

  /* ---------------------------------------------------------------- */
  /*  Chat Completion                                                  */
  /* ---------------------------------------------------------------- */

  async generateChatResponse(systemPrompt, chatHistory, userQuery) {
    try {
      const client = this._getClient();

      const transcript = [
        systemPrompt,
        "",
        ...chatHistory.map(
          (msg) =>
            `${msg.role === "assistant" ? "Assistant" : "User"}: ${msg.content}`,
        ),
        `User: ${userQuery}`,
      ].join("\n");

      const response = await client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: transcript,
      });

      return response.text || "";
    } catch (error) {
      this._handleApiError(error, "Failed to generate chat response");
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Embeddings                                                      */
  /* ---------------------------------------------------------------- */

  async generateEmbeddings(texts) {
    try {
      const client = this._getClient();
      const results = await Promise.all(
        texts.map(async (text) => {
          try {
            const response = await client.models.embedContent({
              model: "text-embedding-004",
              contents: text,
            });
            return response.embeddings[0].values;
          } catch (e) {
            logger.error("text-embedding-004 failed natively", {
              originalError: e.message,
            });
            throw e;
          }
        }),
      );
      return results;
    } catch (error) {
      this._handleApiError(error, "Failed to generate embeddings");
    }
  }

  /* ---------------------------------------------------------------- */
  /*  File Processing (OCR)                                           */
  /* ---------------------------------------------------------------- */

  async extractTextFromPdf(filePath) {
    let uploadResult = null;
    const client = this._getClient();
    try {
      logger.info("Uploading PDF to Gemini for extraction...", { filePath });
      uploadResult = await client.files.upload({
        file: filePath,
        mimeType: "application/pdf",
      });

      logger.info("PDF uploaded, starting Gemini extraction...", {
        fileName: uploadResult.name,
      });
      const response = await client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            fileData: {
              fileUri: uploadResult.uri,
              mimeType: uploadResult.mimeType,
            },
          },
          {
            text: "Extract all the text from this document exactly as it is written. Maintain layout, tables, and paragraphs. Do not summarize or omit anything. Just output the raw text.",
          },
        ],
      });

      return response.text;
    } catch (error) {
      this._handleApiError(error, "Failed to extract text from PDF");
    } finally {
      // Always clean up the file from Google's servers
      if (uploadResult && uploadResult.name) {
        try {
          await client.files.delete({ name: uploadResult.name });
          logger.info("Cleaned up PDF from Gemini servers.", {
            fileName: uploadResult.name,
          });
        } catch (cleanupError) {
          logger.warn("Failed to delete PDF from Gemini servers", {
            error: cleanupError.message,
          });
        }
      }
    }
  }
}

/** Singleton instance — one set of model handles for the entire process. */
export default new GeminiService();
