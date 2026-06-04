// src/models/Journal.js
import mongoose from "mongoose";

const journalSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    issn: { type: String, default: "" },
    eissn: { type: String, default: "" },
    topic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Topic",
      required: true,
    },
    authors: [{ type: String }],
    abstract: { type: String, default: "" },
    content: { type: String, default: "" },
    coverImage: { type: String, default: "" },
    pdfUrl: { type: String, default: "" },
    externalUrl: { type: String, default: "" },
    publicationDate: { type: Date, default: null },
    volume: { type: String, default: "" },
    issue: { type: String, default: "" },
    pages: { type: String, default: "" },
    doi: { type: String, default: "" },
    hIndex: {
      type: Number,
      default: null,
      min: 0,
    },

    googleScholarIndex: {
      type: Number,
      default: null,
      min: 0,
    },

    webOfScienceIndex: {
      type: Number,
      default: null,
      min: 0,
    },

    publishedBy: {
      type: String,
      default: "",
      trim: true,
    },
    keywords: [{ type: String }],
    isFeatured: { type: Boolean, default: false },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    viewCount: { type: Number, default: 0 },

    // AI Vector Embedding
    embedding: { type: [Number], default: [], select: false },
    embeddingText: { type: String, default: "", select: false },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

// Indexes
journalSchema.index({ topic: 1, status: 1 });
journalSchema.index({ issn: 1 });
journalSchema.index({ isFeatured: 1, publicationDate: -1 });
journalSchema.index({ title: "text", abstract: "text", keywords: "text" });

export default mongoose.model("Journal", journalSchema);
