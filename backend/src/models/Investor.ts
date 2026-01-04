import mongoose, { Document, Schema } from 'mongoose';

export interface IInvestor extends Document {
  walletAddress: string;
  email?: string;
  name?: string;
  investorType: 'individual' | 'institutional';
  kycVerified: boolean;
  
  // Investment Stats
  totalDeposited: string;
  totalWithdrawn: string;
  currentBalance: string;
  shareBalance: string;
  totalInterestEarned: string;
  
  // Portfolio
  activePools: Array<{
    poolAddress: string;
    shares: string;
    depositedAt: Date;
  }>;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastActive: Date;
}

const investorSchema = new Schema<IInvestor>(
  {
    walletAddress: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      sparse: true,
    },
    name: String,
    investorType: {
      type: String,
      enum: ['individual', 'institutional'],
      default: 'individual',
    },
    kycVerified: {
      type: Boolean,
      default: false,
    },
    
    totalDeposited: {
      type: String,
      default: '0',
    },
    totalWithdrawn: {
      type: String,
      default: '0',
    },
    currentBalance: {
      type: String,
      default: '0',
    },
    shareBalance: {
      type: String,
      default: '0',
    },
    totalInterestEarned: {
      type: String,
      default: '0',
    },
    
    activePools: [
      {
        poolAddress: {
          type: String,
          lowercase: true,
        },
        shares: String,
        depositedAt: Date,
      },
    ],
    
    lastActive: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
investorSchema.index({ investorType: 1 });
investorSchema.index({ kycVerified: 1 });
investorSchema.index({ createdAt: -1 });

export const Investor = mongoose.model<IInvestor>('Investor', investorSchema);
