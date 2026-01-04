# Credora Backend - Complete Setup & Deployment Guide

## 📋 Overview

This guide will walk you through setting up and running the complete Credora backend system, including all dependencies and integrations.

## 🏗️ Complete Backend Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                         │
│                     http://localhost:5173                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Backend API (Express + TS)                     │
│                     http://localhost:5000                       │
│  ┌────────────┬────────────┬────────────┬──────────────────┐   │
│  │   Auth     │  Student   │  Investor  │   Health Check   │   │
│  │  Routes    │  Routes    │  Routes    │     Routes       │   │
│  └────────────┴────────────┴────────────┴──────────────────┘   │
│                             │                                    │
│  ┌──────────────────────────┴───────────────────────────────┐  │
│  │                    Services Layer                         │  │
│  │  ┌──────────┬──────────┬──────────┬──────────────────┐   │  │
│  │  │ AI Svc   │ Oracle   │Blockchain│  Encryption Svc  │   │  │
│  │  └──────────┴──────────┴──────────┴──────────────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────┬──────────────────┬──────────────────┬──────────────┬────┘
       │                  │                  │              │
       ▼                  ▼                  ▼              ▼
┌─────────────┐  ┌─────────────────┐  ┌──────────┐  ┌──────────┐
│   MongoDB   │  │  AI Score Engine│  │Blockchain│  │   File   │
│   (DB)      │  │  (FastAPI/Py)   │  │(Hardhat) │  │  System  │
│   27017     │  │      8000       │  │   8545   │  │(encrypted)│
└─────────────┘  └─────────────────┘  └──────────┘  └──────────┘
```

## 🎯 Prerequisites

Before starting, ensure you have:

1. **Node.js** (v18 or higher)
2. **MongoDB** (v6 or higher)
3. **Python** (v3.9+ for AI Engine)
4. **Git**
5. **Hardhat Node** (for blockchain)

## 📥 Step 1: Install Dependencies

### Navigate to backend directory:
```bash
cd c:\Users\patel\BlockChainOSProject\Credora\backend
```

### Install Node packages:
```bash
npm install
```

This will install:
- Express + TypeScript
- MongoDB (Mongoose)
- ethers.js v6
- JWT, bcrypt
- Multer (file uploads)
- Winston (logging)
- Rate limiting, CORS, Helmet

## ⚙️ Step 2: Setup Environment Variables

### Copy example env file:
```bash
copy .env.example .env
```

### Update `.env` with your values:

```env
# Server Configuration
NODE_ENV=development
PORT=5000
API_VERSION=v1

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/credora

# JWT Configuration (GENERATE NEW SECRET!)
JWT_SECRET=<GENERATE_SECURE_SECRET_HERE>
JWT_EXPIRES_IN=7d

# Blockchain Configuration (from your deployment)
BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545
CHAIN_ID=31337
CREDIT_REGISTRY_ADDRESS=0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9
CREDORA_POOL_ADDRESS=0x5FC8d32690cc91D4c39d9d3abcBD16989F875707
MOCK_USDT_ADDRESS=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0

# Attester Wallet (first Hardhat account)
ATTESTER_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
ATTESTER_ADDRESS=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

# AI Score Engine Configuration
AI_ENGINE_URL=http://localhost:8000
AI_ENGINE_TIMEOUT=30000

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
ENCRYPTION_KEY=<GENERATE_32_BYTE_HEX_KEY>

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
```

### Generate secure secrets:

**For JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**For ENCRYPTION_KEY:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 🗄️ Step 3: Setup MongoDB

### Install MongoDB (if not installed):
Download from: https://www.mongodb.com/try/download/community

### Start MongoDB:
```bash
# Windows (as Service)
net start MongoDB

# Or run manually:
"C:\Program Files\MongoDB\Server\6.0\bin\mongod.exe" --dbpath="C:\data\db"
```

### Verify MongoDB is running:
```bash
mongosh
# Should connect to mongodb://localhost:27017
```

## 🔗 Step 4: Start Hardhat Blockchain Node

### In contracts directory:
```bash
cd ..\contracts
npx hardhat node
```

This will:
- Start local blockchain on `http://127.0.0.1:8545`
- Provide 20 test accounts with 10000 ETH each
- Keep running in background

### Deploy contracts (in new terminal):
```bash
cd c:\Users\patel\BlockChainOSProject\Credora\contracts
npx hardhat run scripts\deploy.js --network localhost
```

**Copy deployed addresses to backend `.env`!**

## 🤖 Step 5: Start AI Score Engine

### Navigate to AI Engine:
```bash
cd c:\Users\patel\BlockChainOSProject\Credora\AI_Score_Engine
```

### Install Python dependencies:
```bash
pip install -r requirements.txt
```

### Start FastAPI server:
```bash
cd app
uvicorn main:app --reload --port 8000
```

Verify at: http://localhost:8000/docs

## 🚀 Step 6: Start Backend Server

### Navigate to backend:
```bash
cd c:\Users\patel\BlockChainOSProject\Credora\backend
```

### Development mode (with auto-reload):
```bash
npm run dev
```

### Production build:
```bash
npm run build
npm start
```

## ✅ Step 7: Verify Everything is Running

### Check all services:

1. **Backend API**: http://localhost:5000/api/health
   ```json
   {
     "success": true,
     "status": "healthy"
   }
   ```

2. **Detailed Health**: http://localhost:5000/api/health/detailed
   ```json
   {
     "services": {
       "api": "healthy",
       "database": "healthy"
     }
   }
   ```

3. **AI Engine**: http://localhost:8000/health

4. **MongoDB**: `mongosh` → should connect

5. **Blockchain**: Check Hardhat node terminal for activity

## 🧪 Step 8: Test the API

### 1. Get Authentication Nonce:
```bash
curl -X POST http://localhost:5000/api/v1/auth/nonce ^
  -H "Content-Type: application/json" ^
  -d "{\"address\":\"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266\"}"
```

### 2. Test Health Check:
```bash
curl http://localhost:5000/api/health/detailed
```

### 3. Check Pool Stats (requires auth):
First login, then use token to access protected endpoints.

## 📁 Project Structure Reference

```
backend/
├── src/
│   ├── server.ts                    # Main entry point
│   ├── config/
│   │   ├── database.ts              # MongoDB connection
│   │   └── contracts.ts             # Blockchain config
│   ├── models/
│   │   ├── Student.ts               # Student schema
│   │   ├── Investor.ts              # Investor schema
│   │   ├── Document.ts              # Document schema
│   │   └── CreditHistory.ts         # Credit history schema
│   ├── routes/
│   │   ├── auth.routes.ts           # Auth endpoints
│   │   ├── student.routes.ts        # Student endpoints
│   │   ├── investor.routes.ts       # Investor endpoints
│   │   └── health.routes.ts         # Health checks
│   ├── controllers/
│   │   ├── student.controller.ts    # Student logic
│   │   └── investor.controller.ts   # Investor logic
│   ├── services/
│   │   ├── aiService.ts             # AI Engine integration
│   │   ├── oracleService.ts         # EIP-712 signing
│   │   ├── blockchainService.ts     # Contract interactions
│   │   └── encryptionService.ts     # File encryption
│   ├── middleware/
│   │   ├── auth.ts                  # JWT + Signature verification
│   │   ├── errorHandler.ts          # Error handling
│   │   ├── rateLimiter.ts           # Rate limiting
│   │   └── notFound.ts              # 404 handler
│   ├── utils/
│   │   ├── logger.ts                # Winston logger
│   │   └── errors.ts                # Custom error classes
│   └── abis/
│       ├── CreditRegistry.json      # Contract ABI
│       ├── CredoraPool.json         # Contract ABI
│       └── MockUSDT.json            # Contract ABI
├── uploads/                         # Encrypted files (gitignored)
├── logs/                            # Log files (gitignored)
├── package.json
├── tsconfig.json
├── .env                             # Environment variables (gitignored)
└── README.md
```

## 🔐 Security Checklist

- ✅ All uploaded documents encrypted with AES-256
- ✅ Wallet signature authentication
- ✅ JWT tokens for session management
- ✅ Rate limiting on all endpoints
- ✅ CORS restricted to frontend origin
- ✅ Helmet security headers
- ✅ Input validation on all requests
- ✅ Private keys in environment variables (never committed)

## 🚨 Common Issues & Solutions

### Issue 1: MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution**: Start MongoDB service
```bash
net start MongoDB
```

### Issue 2: Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution**: Change PORT in `.env` or kill process on port 5000

### Issue 3: AI Engine Not Reachable
```
Error: AI Engine is not reachable
```
**Solution**: 
1. Navigate to `AI_Score_Engine/app`
2. Run `uvicorn main:app --reload --port 8000`

### Issue 4: Contract Read Errors
```
Error: could not detect network
```
**Solution**: Ensure Hardhat node is running on port 8545

### Issue 5: Invalid Contract Address
```
Error: invalid address
```
**Solution**: Update contract addresses in `.env` from deployment output

## 📊 Monitoring & Logs

### View logs:
```bash
# Development (console)
npm run dev

# Production (file)
tail -f logs/combined.log
tail -f logs/error.log
```

### Check MongoDB data:
```bash
mongosh
use credora
db.students.find()
db.investors.find()
db.documents.find()
db.credithistories.find()
```

## 🔄 Development Workflow

1. **Start all services**:
   - MongoDB
   - Hardhat node
   - AI Score Engine
   - Backend server

2. **Make changes** to backend code

3. **Server auto-reloads** (in dev mode)

4. **Test endpoints** with Postman or curl

5. **Check logs** for errors

6. **Commit changes** to git

## 🎯 Next Steps

1. ✅ **Backend Complete**: All core functionality implemented
2. 🔄 **Connect Frontend**: Update frontend to call backend API
3. 🧪 **Integration Testing**: Test complete user flows
4. 🚀 **Deploy**: Move to testnet/mainnet
5. 📈 **Monitoring**: Add Sentry/New Relic
6. 🔒 **Security Audit**: Professional audit before mainnet

## 📚 API Documentation

Full API documentation available at:
- http://localhost:5000/api/v1 (when server running)
- See `README.md` for endpoint details

## 🤝 Support

If you encounter issues:
1. Check this guide's troubleshooting section
2. Review logs in `logs/` directory
3. Check MongoDB data for inconsistencies
4. Verify all services are running
5. Open GitHub issue with error details

## 🎉 Success!

If all health checks pass, your backend is ready! 🚀

Next: Connect your frontend to start building the complete user experience.
