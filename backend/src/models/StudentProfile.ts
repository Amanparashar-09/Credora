import mongoose, { Document, Schema } from 'mongoose';

export interface IStudentProfile extends Document {
  walletAddress: string;
  githubUsername: string;
  gpa: number;
  internships: number;
  resumeHash: string;
  creditScore: number;
  maxBorrowingLimit: number;
  interestRate: number;
  riskTier: 'LOW' | 'MEDIUM' | 'HIGH';
  currentBorrowed: number;
  totalBorrowed: number;
  totalRepaid: number;
  defaultCount: number;
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

const StudentProfileSchema = new Schema<IStudentProfile>(
  {
    walletAddress: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    githubUsername: {
      type: String,
      required: true,
    },
    gpa: {
      type: Number,
      required: true,
      min: 0,
      max: 10,
    },
    internships: {
      type: Number,
      required: true,
      min: 0,
    },
    resumeHash: {
      type: String,
      required: true,
    },
    creditScore: {
      type: Number,
      required: true,
      min: 300,
      max: 850,
    },
    maxBorrowingLimit: {
      type: Number,
      required: true,
      default: 0,
    },
    interestRate: {
      type: Number,
      required: true,
    },
    riskTier: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      required: true,
    },
    currentBorrowed: {
      type: Number,
      default: 0,
    },
    totalBorrowed: {
      type: Number,
      default: 0,
    },
    totalRepaid: {
      type: Number,
      default: 0,
    },
    defaultCount: {
      type: Number,
      default: 0,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster lookups
StudentProfileSchema.index({ creditScore: -1 });

export const StudentProfile = mongoose.model<IStudentProfile>('StudentProfile', StudentProfileSchema);
