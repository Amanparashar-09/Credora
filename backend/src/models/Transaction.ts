import mongoose, { Document, Schema } from 'mongoose';

export interface ITransaction extends Document {
  walletAddress: string;
  type: 'deposit' | 'withdrawal' | 'interest';
  amount: string;
  txHash: string;
  poolAddress: string;
  shares?: string; // For deposits/withdrawals
  description: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    walletAddress: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['deposit', 'withdrawal', 'interest'],
      required: true,
      index: true,
    },
    amount: {
      type: String,
      required: true,
    },
    txHash: {
      type: String,
      required: true,
      unique: true,
    },
    poolAddress: {
      type: String,
      required: true,
      lowercase: true,
    },
    shares: String,
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'completed',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
transactionSchema.index({ walletAddress: 1, createdAt: -1 });
transactionSchema.index({ type: 1, createdAt: -1 });

export const Transaction = mongoose.model<ITransaction>('Transaction', transactionSchema);
