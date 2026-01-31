import mongoose, { Document, Schema } from 'mongoose';

export interface ICreditHistory extends Document {
  studentAddress: string;
  score: number;
  limit: string;
  validUntil: Date;
  nonce: number;
  signature: string;
  signedBy: string;
  createdAt: Date;
  metadata?: {
    aiScore?: number;
    factors?: string[];
    riskLevel?: 'low' | 'medium' | 'high';
  };
}

const creditHistorySchema = new Schema<ICreditHistory>(
  {
    studentAddress: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    limit: {
      type: String,
      required: true,
    },
    validUntil: {
      type: Date,
      required: true,
    },
    nonce: {
      type: Number,
      required: true,
    },
    signature: {
      type: String,
      required: true,
    },
    signedBy: {
      type: String,
      required: true,
      lowercase: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
creditHistorySchema.index({ studentAddress: 1, createdAt: -1 });
creditHistorySchema.index({ score: -1 });

export const CreditHistory = mongoose.model<ICreditHistory>('CreditHistory', creditHistorySchema);
