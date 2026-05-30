// src/models/Book.js
import mongoose from 'mongoose'

const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },

    subtitle: { type: String, default: '' },

    writers: [{ type: String, required: true }],
    editor: { type: String, required: true, trim: true },
    publishedBy: { type: String, required: true, trim: true },

    price: {
    type: Number,
    default: null,
    min: 0,
    },

  priceCurrency: {
    type: String,
    default: 'IDR',
    uppercase: true,
    trim: true,
    },

    isbn: { type: String, required: true, trim: true },

    description: { type: String, required: true },
    content: { type: String, default: '' },

    coverImage: { type: String, required: true },

    publicationYear: { type: Number, default: null },
    publicationDate: { type: Date, default: null },

    bookLanguage: { type: String, default: '' }, 
    edition: { type: String, default: '' },
    pages: { type: String, default: '' },
    category: { type: String, default: '' },
    tags: [{ type: String }],

    externalUrl: { type: String, default: '' },
    pdfUrl: { type: String, default: '' },

    isFeatured: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: false },
    viewCount: { type: Number, default: 0 },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
)

bookSchema.index({ isPublished: 1, createdAt: -1 })
bookSchema.index({ isFeatured: 1, createdAt: -1 })
bookSchema.index({ title: 'text', description: 'text', tags: 'text', writers: 'text' })

export default mongoose.model('Book', bookSchema)