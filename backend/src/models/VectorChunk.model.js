/**
 * @module models/VectorChunk
 * @description Stores text chunks and their embedding vectors in MongoDB.
 * Replaces the local `data/vectors.json` file so embeddings persist across
 * Render restarts and deployments (which wipe the ephemeral filesystem).
 */

import mongoose from 'mongoose';

const { Schema } = mongoose;

const vectorChunkSchema = new Schema(
  {
    /** The note this chunk belongs to */
    noteId: {
      type: Schema.Types.ObjectId,
      ref: 'Note',
      required: true,
      index: true,
    },
    /** The user who owns the note (for tenant isolation in queries) */
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    /** Position of this chunk within the note (0-based) */
    chunkIndex: {
      type: Number,
      required: true,
    },
    /** The raw text content of this chunk */
    text: {
      type: String,
      required: true,
    },
    /** Original filename of the source PDF */
    sourceFilename: {
      type: String,
      default: 'Unknown',
    },
    /**
     * The embedding vector produced by Gemini.
     * Stored as a plain array of Numbers.
     * Note: MongoDB Atlas Vector Search would be ideal here, but for the
     * free tier we do cosine similarity in application code.
     */
    embedding: {
      type: [Number],
      required: true,
      select: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index so we can efficiently fetch all chunks for a note
vectorChunkSchema.index({ noteId: 1, chunkIndex: 1 });

const VectorChunk = mongoose.model('VectorChunk', vectorChunkSchema);

export default VectorChunk;
