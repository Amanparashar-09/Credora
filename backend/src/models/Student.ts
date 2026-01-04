import mongoose, { Document, Schema } from 'mongoose';

export interface IStudent extends Document {
  walletAddress: string;
  email?: string;
  name?: string;
  dateOfBirth?: Date;
  university?: string;
  major?: string;
  graduationYear?: number;
  phoneNumber?: string;
  
  // Credit Information
  creditScore: number;
  creditLimit: string; // BigNumber stored as string
  creditExpiry?: Date;
  lastScoreUpdate?: Date;
  nonce: number;

  // Onboarding Status
  onboardingCompleted: boolean;
  documentsSubmitted: boolean;
  kycVerified: boolean;

  // Borrowing Stats
  totalBorrowed: string;
  totalRepaid: string;
  activeBorrows: number;
  defaultCount: number;
  repaymentHistory: Array<{
    amount: string;
    timestamp: Date;
    transactionHash: string;
  }>;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastActive: Date;
}

const studentSchema = new Schema<IStudent>(
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
    dateOfBirth: Date,
    university: String,
    major: String,
    graduationYear: Number,
    phoneNumber: String,

    creditScore: {
      type: Number,
      default: 0,
      min: 300,
      max: 1000,
    },
    creditLimit: {
      type: String,
      default: '0',
    },
    creditExpiry: Date,
    lastScoreUpdate: Date,
    nonce: {
      type: Number,
      default: 0,
    },

    onboardingCompleted: {
      type: Boolean,
      default: false,
    },
    documentsSubmitted: {
      type: Boolean,
      default: false,
    },
    kycVerified: {
      type: Boolean,
      default: false,
    },

    totalBorrowed: {
      type: String,
      default: '0',
    },
    totalRepaid: {
      type: String,
      default: '0',
    },
    activeBorrows: {
      type: Number,
      default: 0,
    },
    defaultCount: {
      type: Number,
      default: 0,
    },
    repaymentHistory: [
      {
        amount: String,
        timestamp: Date,
        transactionHash: String,
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

// Indexes for performance
studentSchema.index({ creditScore: -1 });
studentSchema.index({ onboardingCompleted: 1 });
studentSchema.index({ createdAt: -1 });

export const Student = mongoose.model<IStudent>('Student', studentSchema);
