/**
 * @module services/embeddings
 * @description Text chunking, embedding generation, and similarity search.
 *
 * Previously stored vectors in a local `data/vectors.json` file, which was
 * wiped on every Render restart (ephemeral filesystem). This version persists
 * vectors in MongoDB via the VectorChunk model so they survive deployments.
 */

import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import VectorChunk from '../models/VectorChunk.model.js';
import geminiService from './gemini.service.js';
import { AppError } from '../utils/AppError.js';
import logger from '../utils/logger.js';

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

/**
 * Calculate cosine similarity between two equal-length numeric vectors.
 * Returns a value in [-1, 1] where 1 means identical direction.
 */
function cosineSimilarity(vecA, vecB) {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot   += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/* ------------------------------------------------------------------ */
/*  Service                                                           */
/* ------------------------------------------------------------------ */

const embeddingsService = {
  /**
   * Split a long text into overlapping chunks suitable for embedding.
   * @param {string} text
   * @param {{ chunkSize?: number, chunkOverlap?: number }} [opts]
   * @returns {Promise<string[]>}
   */
  async chunkText(text, { chunkSize = 1000, chunkOverlap = 200 } = {}) {
    const splitter = new RecursiveCharacterTextSplitter({ chunkSize, chunkOverlap });
    return splitter.splitText(text);
  },

  /**
   * Generate embeddings for each chunk and **upsert** them into MongoDB.
   * Old vectors for the same noteId are deleted first (upsert semantics).
   *
   * @param {{ noteId: string, ownerId: string, chunks: string[], originalFilename: string }} params
   * @returns {Promise<{ chunksStored: number }>}
   */
  async embedAndStore({ noteId, ownerId, chunks, originalFilename }) {
    try {
      // 1. Generate embeddings via Gemini
      const embeddings = await geminiService.generateEmbeddings(chunks);

      // 2. Remove stale vectors for this note (re-upload scenario)
      await VectorChunk.deleteMany({ noteId });

      // 3. Bulk-insert new vectors
      const docs = chunks.map((chunk, i) => ({
        noteId,
        ownerId,
        chunkIndex: i,
        text: chunk,
        sourceFilename: originalFilename,
        embedding: embeddings[i],
      }));

      await VectorChunk.insertMany(docs, { ordered: false });

      logger.info('Embeddings stored in MongoDB', {
        noteId: noteId.toString(),
        chunksStored: chunks.length,
      });

      return { chunksStored: chunks.length };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Embedding storage failed', { error: error.message });
      throw new AppError('Failed to store embeddings.', 500, 'EMBEDDING_STORE_ERROR');
    }
  },

  /**
   * Query MongoDB for the most relevant chunks using cosine similarity.
   * Returns results shaped exactly like the old ChromaDB response so
   * no callers need to change.
   *
   * @param {{ query: string, ownerId: string, noteIds?: string[], topK?: number }} params
   * @returns {Promise<{ documents: string[][], metadatas: object[][], distances: number[][] }>}
   */
  async queryRelevantChunks({ query, ownerId, noteIds, topK = 5 }) {
    try {
      // 1. Build MongoDB filter (always scope to owner)
      const filter = { ownerId };
      if (noteIds && noteIds.length > 0) {
        filter.noteId = { $in: noteIds };
      }

      // 2. Fetch candidate chunks from MongoDB
      const candidates = await VectorChunk.find(filter).lean();

      if (candidates.length === 0) {
        // Return empty result in ChromaDB-compatible shape
        return { documents: [[]], metadatas: [[]], distances: [[]] };
      }

      // 3. Embed the user's query
      const [queryEmbedding] = await geminiService.generateEmbeddings([query]);

      // 4. Score each chunk by cosine similarity
      const scored = candidates.map(c => ({
        text: c.text,
        metadata: {
          noteId:         c.noteId.toString(),
          ownerId:        c.ownerId.toString(),
          chunkIndex:     c.chunkIndex,
          sourceFilename: c.sourceFilename,
        },
        score: cosineSimilarity(queryEmbedding, c.embedding),
      }));

      // 5. Sort descending by similarity and take topK
      scored.sort((a, b) => b.score - a.score);
      const top = scored.slice(0, topK);

      // 6. Return in ChromaDB-compatible format (distance = 1 - similarity)
      return {
        documents: [top.map(v => v.text)],
        metadatas: [top.map(v => v.metadata)],
        distances: [top.map(v => 1 - v.score)],
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Vector query failed', { error: error.message });
      throw new AppError(
        `Failed to query vectors: ${error.message}`,
        500,
        'VECTOR_QUERY_ERROR',
      );
    }
  },

  /**
   * Delete all stored vectors for a specific note.
   * Should be called when a note is deleted.
   * @param {string} noteId
   */
  async deleteByNoteId(noteId) {
    const result = await VectorChunk.deleteMany({ noteId });
    logger.info('Vectors deleted for note', { noteId: noteId.toString(), deleted: result.deletedCount });
  },
};

export default embeddingsService;
