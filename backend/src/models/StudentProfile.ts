import mongoose, { Document, Schema } from 'mongoose';

export interface IStudentProfile extends Document {
  walletAddress: string;
  
  // Basic Information
  name?: string;
  email?: string;
  phone?: string;
  
  // Academic Details
  university?: string;
  degree?: string;
  branch?: string;
  graduationYear?: number;
  semester?: string;
  gpa: number;
  
  // GitHub & Technical
  githubUsername: string;
  repositoriesCount?: number;
  contributionsCount?: number;
  
  // Work Experience
  internships: number;
  
  // Skills & Certifications
  skills?: string[];
  certifications?: string[];
  
  // Resume
  resumeHash: string;
  
  // Credit Information
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
    
    // Basic Information
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    
    // Academic Details
    university: {
      type: String,
      trim: true,
    },
    degree: {
      type: String,
      trim: true,
    },
    branch: {
      type: String,
      trim: true,
    },
    graduationYear: {
      type: Number,
    },
    semester: {
      type: String,
      trim: true,
    },
    gpa: {
      type: Number,
      required: true,
      min: 0,
      max: 10,
    },
    
    // GitHub & Technical
    githubUsername: {
      type: String,
      required: true,
    },
    repositoriesCount: {
      type: Number,
      default: 0,
    },
    contributionsCount: {
      type: Number,
      default: 0,
    },
    
    // Work Experience
    internships: {
      type: Number,
      required: true,
      min: 0,
    },
    
    // Skills & Certifications
    skills: [{
      type: String,
      trim: true,
    }],
    certifications: [{
      type: String,
      trim: true,
    }],
    
    // Resume
    resumeHash: {
      type: String,
      required: true,
    },
    
    // Credit Information
    creditScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
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
