import mongoose, { Document as MongooseDocument, Schema } from 'mongoose';

export interface IDocument extends MongooseDocument {
  studentAddress: string;
  documentType: 'resume' | 'certificate' | 'transcript' | 'id' | 'other';
  fileName: string;
  fileSize: number;
  mimeType: string;
  encryptedPath: string;
  encryptionIV: string; // Initialization vector for AES decryption
  uploadedAt: Date;
  verifiedAt?: Date;
  verified: boolean;
  verifiedBy?: string;
  metadata?: {
    university?: string;
    issueDate?: Date;
    expiryDate?: Date;
    [key: string]: any;
  };
}

const documentSchema = new Schema<IDocument>(
  {
    studentAddress: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
    },
    documentType: {
      type: String,
      enum: ['resume', 'certificate', 'transcript', 'id', 'other'],
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    encryptedPath: {
      type: String,
      required: true,
    },
    encryptionIV: {
      type: String,
      required: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    verifiedAt: Date,
    verified: {
      type: Boolean,
      default: false,
    },
    verifiedBy: String,
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
documentSchema.index({ studentAddress: 1, documentType: 1 });
documentSchema.index({ verified: 1 });

export const Document = mongoose.model<IDocument>('Document', documentSchema);
