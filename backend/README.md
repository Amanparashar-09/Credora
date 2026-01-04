# Credora Backend API

Backend API server for Credora - A blockchain-based credit scoring and lending platform.

## 🏗️ Architecture

```
Backend API Server (Node.js + Express + TypeScript)
│
├── Authentication Layer (Wallet Signatures + JWT)
├── MongoDB (Encrypted Document Storage)
├── Services Layer
│   ├── AI Service → Python FastAPI (Credit Scoring)
│   ├── Oracle Service → EIP-712 Attestation Signing
│   ├── Blockchain Service → Smart Contract Interactions
│   └── Encryption Service → AES-256 File Encryption
│
└── API Routes
    ├── /auth → Authentication
    ├── /student → Student Operations
    └── /investor → Investor Operations
```

## 📦 Installation

```bash
cd backend
npm install
```

## ⚙️ Configuration

1. Copy `.env.example` to `.env`:
```bash
copy .env.example .env
```

2. Update environment variables:
   - **MongoDB URI**: Update `MONGODB_URI` with your MongoDB connection string
   - **Blockchain RPC**: Update `BLOCKCHAIN_RPC_URL` (default: localhost:8545)
   - **Contract Addresses**: Update deployed contract addresses
   - **Attester Key**: Update `ATTESTER_PRIVATE_KEY` with oracle wallet private key
   - **AI Engine**: Update `AI_ENGINE_URL` (default: http://localhost:8000)
   - **JWT Secret**: Generate secure JWT secret key

## 🚀 Running the Server

### Development Mode
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

## 📡 API Endpoints

### Authentication
- `POST /api/v1/auth/nonce` - Generate nonce for wallet signature
- `POST /api/v1/auth/login` - Login with wallet signature
- `GET /api/v1/auth/verify` - Verify JWT token

### Student Endpoints
All require authentication with student role.

#### Profile
- `GET /api/v1/student/profile` - Get student profile
- `PUT /api/v1/student/profile` - Update profile
- `POST /api/v1/student/onboard` - Complete onboarding

#### Documents
- `POST /api/v1/student/documents/upload` - Upload encrypted document
- `GET /api/v1/student/documents` - Get all documents
- `GET /api/v1/student/documents/:id` - Download specific document

#### Credit Scoring
- `POST /api/v1/student/submit-for-scoring` - Submit for AI credit scoring
- `GET /api/v1/student/credit-status` - Get credit score & limit
- `GET /api/v1/student/credit-history` - Get credit history

#### Borrowing
- `GET /api/v1/student/borrowing-status` - Get current debt info
- `GET /api/v1/student/borrowing-history` - Get repayment history
- `GET /api/v1/student/dashboard` - Get dashboard stats

### Investor Endpoints
All require authentication with investor role.

#### Profile
- `GET /api/v1/investor/profile` - Get investor profile
- `PUT /api/v1/investor/profile` - Update profile

#### Pools
- `GET /api/v1/investor/pools` - Get available pools
- `GET /api/v1/investor/pools/:address/stats` - Get pool statistics

#### Investment
- `GET /api/v1/investor/portfolio` - Get portfolio details
- `GET /api/v1/investor/balance` - Get balances (pool + wallet)
- `GET /api/v1/investor/returns` - Get returns/earnings
- `GET /api/v1/investor/analytics` - Get analytics data
- `GET /api/v1/investor/dashboard` - Get dashboard stats

### Health Check
- `GET /api/health` - Basic health check
- `GET /api/health/detailed` - Detailed health check

## 🔐 Authentication Flow

1. **Get Nonce**:
```javascript
POST /api/v1/auth/nonce
Body: { address: "0x..." }
Response: { nonce: "Sign this message..." }
```

2. **Sign Message** (Frontend with ethers.js):
```javascript
const signature = await signer.signMessage(nonce);
```

3. **Login**:
```javascript
POST /api/v1/auth/login
Body: {
  address: "0x...",
  signature: "0x...",
  message: "nonce from step 1",
  role: "student" | "investor"
}
Response: { token: "JWT...", user: {...} }
```

4. **Use Token**:
```javascript
Authorization: Bearer <JWT_TOKEN>
```

## 🔄 Credit Scoring Workflow

```
1. Student uploads documents (resume, certificates)
   ↓
2. Student submits for scoring
   ↓
3. Backend calls AI Engine (/score endpoint)
   ↓
4. AI returns credit score + limit
   ↓
5. Oracle Service signs EIP-712 attestation
   ↓
6. Attestation stored in MongoDB + CreditHistory
   ↓
7. Student can use signature to update on-chain registry
```

## 📊 Data Models

### Student
- Wallet address (unique identifier)
- Personal info (name, email, university, etc.)
- Credit info (score, limit, expiry, nonce)
- Onboarding status
- Borrowing stats

### Investor
- Wallet address
- Personal info
- Investment stats (deposited, withdrawn, shares, interest earned)
- Active pools

### Document
- Student address
- File metadata (type, name, size, mime type)
- Encrypted path + IV (for decryption)
- Verification status

### CreditHistory
- Student address
- Score, limit, validity
- EIP-712 signature
- Metadata (AI factors, risk level)

## 🛡️ Security Features

1. **Wallet Signature Authentication**: Verify user ownership via EIP-191 signatures
2. **JWT Tokens**: Secure session management
3. **AES-256 Encryption**: All uploaded documents encrypted at rest
4. **Rate Limiting**: Prevent abuse (100 req/15min general, 5 req/15min auth)
5. **Input Validation**: Express-validator for request validation
6. **Helmet**: Security headers
7. **CORS**: Restricted origins
8. **EIP-712 Signatures**: Type-safe oracle attestations

## 🔧 Development

### Project Structure
```
backend/
├── src/
│   ├── server.ts              # Entry point
│   ├── config/                # Configuration files
│   │   ├── database.ts        # MongoDB connection
│   │   └── contracts.ts       # Blockchain config
│   ├── models/                # Mongoose schemas
│   │   ├── Student.ts
│   │   ├── Investor.ts
│   │   ├── Document.ts
│   │   └── CreditHistory.ts
│   ├── routes/                # API routes
│   │   ├── auth.routes.ts
│   │   ├── student.routes.ts
│   │   ├── investor.routes.ts
│   │   └── health.routes.ts
│   ├── controllers/           # Request handlers
│   │   ├── student.controller.ts
│   │   └── investor.controller.ts
│   ├── services/              # Business logic
│   │   ├── aiService.ts       # AI Engine integration
│   │   ├── oracleService.ts   # EIP-712 signing
│   │   ├── blockchainService.ts  # Contract interactions
│   │   └── encryptionService.ts  # File encryption
│   ├── middleware/            # Express middleware
│   │   ├── auth.ts            # Authentication
│   │   ├── errorHandler.ts    # Error handling
│   │   ├── rateLimiter.ts     # Rate limiting
│   │   └── notFound.ts        # 404 handler
│   ├── utils/                 # Utilities
│   │   ├── logger.ts          # Winston logger
│   │   └── errors.ts          # Custom errors
│   └── abis/                  # Contract ABIs
│       ├── CreditRegistry.json
│       ├── CredoraPool.json
│       └── MockUSDT.json
├── package.json
├── tsconfig.json
└── .env.example
```

### Adding New Endpoints

1. Create route handler in `routes/`
2. Create controller logic in `controllers/`
3. Add business logic in `services/` if needed
4. Register route in `server.ts`

### Testing
```bash
npm test
```

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production) | development |
| `PORT` | Server port | 5000 |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/credora |
| `JWT_SECRET` | JWT signing secret | (required) |
| `BLOCKCHAIN_RPC_URL` | Blockchain RPC endpoint | http://127.0.0.1:8545 |
| `CREDIT_REGISTRY_ADDRESS` | CreditRegistry contract address | (required) |
| `CREDORA_POOL_ADDRESS` | CredoraPool contract address | (required) |
| `MOCK_USDT_ADDRESS` | MockUSDT contract address | (required) |
| `ATTESTER_PRIVATE_KEY` | Oracle wallet private key | (required) |
| `AI_ENGINE_URL` | AI Score Engine URL | http://localhost:8000 |
| `ENCRYPTION_KEY` | AES-256 encryption key (32 bytes hex) | (auto-generated) |
| `MAX_FILE_SIZE` | Max upload file size | 10485760 (10MB) |
| `CORS_ORIGIN` | Allowed frontend origin | http://localhost:5173 |

## 🚨 Error Handling

All errors follow this format:
```json
{
  "success": false,
  "error": {
    "message": "Error description"
  },
  "timestamp": "2026-01-04T12:00:00.000Z"
}
```

HTTP Status Codes:
- `400` - Validation Error
- `401` - Authentication Error
- `403` - Authorization Error
- `404` - Not Found
- `409` - Conflict Error
- `429` - Rate Limit Exceeded
- `500` - Internal Server Error
- `502` - Blockchain/AI Engine Error

## 🔗 Integration with Other Components

### Frontend
- Frontend calls `/auth/login` with wallet signature
- Uses JWT token in `Authorization` header for all requests
- Calls student/investor endpoints based on user role

### AI Score Engine
- Backend calls `POST http://localhost:8000/score`
- Sends student data (university, major, GPA, etc.)
- Receives credit score + limit + risk factors

### Smart Contracts
- Backend reads contract state (credit limits, pool stats, debt info)
- Oracle service signs EIP-712 attestations
- Frontend uses signatures to submit transactions

## 📈 Performance

- **Connection Pooling**: MongoDB with 10 max connections
- **Compression**: Gzip compression for responses
- **Rate Limiting**: Prevents API abuse
- **Caching**: (Future) Redis for frequently accessed data

## 🛠️ Troubleshooting

### MongoDB Connection Error
```
Error: connect ECONNREFUSED
```
**Solution**: Ensure MongoDB is running on the specified URI

### AI Engine Unreachable
```
Error: AI Engine is not reachable
```
**Solution**: Start AI Score Engine on http://localhost:8000

### Blockchain RPC Error
```
Error: could not detect network
```
**Solution**: Ensure Hardhat node is running (`npx hardhat node`)

### Contract Address Missing
```
Error: invalid address
```
**Solution**: Update contract addresses in `.env` after deployment

## 📄 License

MIT

## 👥 Support

For issues or questions, please open an issue on GitHub.
