# Investor Module - Backend Integration TODO

This document tracks all hardcoded/dummy data in the investor frontend that requires backend API implementation.

---

## ✅ COMPLETED (Type Definitions Added)

### Dashboard.tsx

- [x] `returns.currentAPY` - Type added, backend must calculate weighted pool APY
- [x] `balance.wallet` - Type added, backend must return USDT wallet balance
- [x] `activity.timestamp` - Type expects timestamp field

---

## ❌ PENDING IMPLEMENTATION

### 1. Pools.tsx - Pool Health Metrics (HIGH PRIORITY)

**Location:** `frontend/src/pages/investor/Pools.tsx`

**Hardcoded Values:**

```typescript
// Line ~104
<p className="text-2xl font-bold">47</p>
<p className="text-xs text-muted-foreground mt-1">currently borrowing</p>

// Line ~114
<p className="text-2xl font-bold">742</p>
<p className="text-xs text-credora-emerald mt-1">Excellent quality</p>

// Line ~124
<p className="text-2xl font-bold">98.8%</p>
<p className="text-xs text-credora-emerald mt-1">on-time payments</p>

// Line ~182
<p className="text-2xl font-bold text-credora-emerald">+$1,440</p>
```

**Backend API Required:**

```typescript
// GET /api/investor/pool-health
Response: {
  activeBorrowers: number; // Number of students currently borrowing
  avgCreditScore: number; // Average credit score of all borrowers
  repaymentRate: number; // Percentage (0-100) of on-time payments
  totalPoolLiquidity: string; // Total pool liquidity
  utilizationRate: number; // Already returned in pools API
}

// GET /api/investor/earnings/:walletAddress
Response: {
  totalEarnings: string; // Total earnings for specific investor
  monthlyAverage: string; // Average monthly earnings
  projectedAnnual: string; // Projected annual earnings
}
```

**Calculation Logic:**

- **activeBorrowers**: Query `Loan` table where `status = 'active'`, count unique borrowers
- **avgCreditScore**: Query `CreditScore` table, calculate average of all active borrowers
- **repaymentRate**: Count on-time payments vs total payments from `Slice` or `Payment` table
- **totalEarnings**: Sum all earnings for specific investor wallet address

---

### 2. Analytics.tsx - Historical Data (MEDIUM PRIORITY)

**Location:** `frontend/src/pages/investor/Analytics.tsx`

**Hardcoded Mock Data:**

```typescript
// Lines 12-19: Historical APY (7 months)
const historicalAPY = [
  { month: "Jul", apy: 10.2 },
  { month: "Aug", apy: 10.8 },
  // ... etc
];

// Lines 21-29: Earnings History
const earningsHistory = [
  { month: "Jul", earnings: 150, investment: 10000 },
  // ... etc
];

// Lines 31-39: Comparative Performance
const comparativeData = [
  { month: "Jul", credora: 10.2, savings: 4.5, market: 7.8 },
  // ... etc
];

// Lines 41-47: Transaction History
const transactionHistory = [
  { date: "2026-01-28", type: "deposit", amount: 3000, apy: 12.4, txHash: "0x1a2b3c..." },
  // ... etc
];

// Lines 84-107: Key Metrics Cards
currentAPY: 12.4
Total Earnings: $1,440
Avg Monthly: $205
vs Traditional: +175%
```

**Backend APIs Required:**

#### A. Historical APY Endpoint

```typescript
// GET /api/investor/analytics/historical-apy?months=12
Response: {
  history: Array<{
    month: string; // "Jan", "Feb", etc.
    year: number; // 2025, 2026
    apy: number; // Weighted average APY for that month
    timestamp: string; // ISO date
  }>;
}
```

**Calculation:**

- Track pool APY daily/weekly in database
- Aggregate by month: average of all APY values in that month
- Source: `calculateWeightedPoolAPY()` function already exists in backend

---

#### B. Earnings History Endpoint

```typescript
// GET /api/investor/analytics/earnings-history/:walletAddress?months=12
Response: {
  history: Array<{
    month: string;
    year: number;
    earnings: number; // Total earnings in that month
    investment: number; // Investment value at end of month
    timestamp: string;
  }>;
  summary: {
    totalEarnings: number;
    averageMonthly: number;
    highestMonth: {
      month: string;
      amount: number;
    }
  }
}
```

**Calculation:**

- Query investment transactions from blockchain or database
- Calculate accrued interest per month using APY
- Aggregate earnings by month

---

#### C. Comparative Performance Endpoint

```typescript
// GET /api/investor/analytics/comparative?months=12
Response: {
  comparison: Array<{
    month: string;
    year: number;
    credora: number; // Credora pool APY
    savings: number; // Fixed at 4.5% (traditional savings)
    market: number; // S&P 500 or market index (optional, can be external API)
  }>;
}
```

**Data Sources:**

- **Credora APY**: Use historical APY endpoint data
- **Savings Rate**: Hardcode at 4.5% or make configurable
- **Market Index**: Either hardcode average (8%) or integrate external API (Alpha Vantage, Yahoo Finance)

---

#### D. Transaction History Endpoint

```typescript
// GET /api/investor/analytics/transactions/:walletAddress?limit=50&offset=0
Response: {
  transactions: Array<{
    date: string; // ISO timestamp
    type: "deposit" | "earnings" | "withdrawal";
    amount: number;
    apy: number; // APY at time of transaction
    txHash: string; // Blockchain transaction hash
    blockNumber?: number;
    status: "confirmed" | "pending";
  }>;
  pagination: {
    total: number;
    limit: number;
    offset: number;
  }
}
```

**Data Sources:**

- Query blockchain events (deposits, withdrawals)
- Track interest accruals from smart contract or backend calculations
- Store in `Investment` or `Transaction` table with proper indexing

---

#### E. Analytics Summary Endpoint

```typescript
// GET /api/investor/analytics/summary/:walletAddress
Response: {
  currentAPY: number; // Current pool APY
  totalEarnings: number; // Lifetime earnings
  averageMonthly: number; // Average monthly earnings
  vsTraditionalSavings: number; // Percentage difference vs 4.5% savings
  investmentDuration: number; // Months since first investment
  totalInvested: number; // Total principal invested
  currentValue: number; // Current portfolio value
}
```

---

### 3. Dashboard.tsx - Dynamic Calculations (LOW PRIORITY)

**Current Implementation:**

```typescript
// Line 150-158: Estimated Returns calculation
parseFloat(balance.portfolioValue) *
  (returns.currentAPY / 100) *
  (parseInt(selectedPeriod) / 12);
```

**Status:** ✅ Already dynamic, uses `returns.currentAPY` from backend

**Requirement:** Backend must provide accurate `currentAPY` value via weighted pool calculation

---

## 📊 Database Schema Requirements

### New Tables Needed:

#### 1. `pool_apy_history` Table

```sql
CREATE TABLE pool_apy_history (
  id SERIAL PRIMARY KEY,
  pool_address VARCHAR(42) NOT NULL,
  apy DECIMAL(10, 4) NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total_borrowed DECIMAL(20, 2),
  total_liquidity DECIMAL(20, 2),
  utilization_rate DECIMAL(5, 2)
);

CREATE INDEX idx_pool_apy_timestamp ON pool_apy_history(pool_address, timestamp DESC);
```

#### 2. `investor_earnings_history` Table

```sql
CREATE TABLE investor_earnings_history (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(42) NOT NULL,
  month VARCHAR(7) NOT NULL,  -- "2026-01"
  earnings DECIMAL(20, 2) NOT NULL,
  investment_value DECIMAL(20, 2) NOT NULL,
  apy_rate DECIMAL(10, 4),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_investor_month ON investor_earnings_history(wallet_address, month);
```

#### 3. `borrower_metrics` Table

```sql
CREATE TABLE borrower_metrics (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(42) NOT NULL,
  credit_score INTEGER,
  total_borrowed DECIMAL(20, 2),
  on_time_payments INTEGER DEFAULT 0,
  late_payments INTEGER DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔧 Backend Service Methods to Implement

### 1. `blockchainService.ts`

```typescript
// Already exists ✅
async calculateWeightedPoolAPY(poolAddress: string): Promise<number>

// New methods needed:
async getPoolHealthMetrics(poolAddress: string): Promise<PoolHealthMetrics>
async getActiveBorrowers(poolAddress: string): Promise<number>
async getAverageCreditScore(poolAddress: string): Promise<number>
async getRepaymentRate(poolAddress: string): Promise<number>
```

### 2. `investorAnalytics.service.ts` (NEW FILE)

```typescript
async getHistoricalAPY(months: number): Promise<HistoricalAPY[]>
async getEarningsHistory(walletAddress: string, months: number): Promise<EarningsHistory[]>
async getComparativePerformance(months: number): Promise<ComparativeData[]>
async getTransactionHistory(walletAddress: string, limit: number, offset: number): Promise<TransactionHistory>
async getAnalyticsSummary(walletAddress: string): Promise<AnalyticsSummary>
```

### 3. `investor.service.ts`

```typescript
// New methods:
async getInvestorEarnings(walletAddress: string): Promise<InvestorEarnings>
async getPoolHealth(poolAddress: string): Promise<PoolHealth>
```

---

## 📋 Implementation Priority

### Phase 1: Critical (Week 1)

1. ✅ Add TypeScript type definitions (DONE)
2. ❌ Implement `calculateWeightedPoolAPY()` in dashboard response
3. ❌ Implement pool health metrics endpoint
4. ❌ Implement investor earnings endpoint

### Phase 2: Important (Week 2)

1. ❌ Create database tables for historical data
2. ❌ Implement historical APY tracking (cron job)
3. ❌ Implement earnings history endpoint
4. ❌ Implement transaction history endpoint

### Phase 3: Nice-to-Have (Week 3)

1. ❌ Implement comparative performance endpoint
2. ❌ Add market index data integration (optional)
3. ❌ Create analytics summary endpoint
4. ❌ Add data visualization optimizations

---

## 🧪 Testing Checklist

- [ ] Pool health metrics return accurate real-time data
- [ ] Historical APY data aggregates correctly by month
- [ ] Earnings calculations match smart contract accruals
- [ ] Transaction history pagination works correctly
- [ ] All endpoints handle missing data gracefully (return defaults)
- [ ] Performance: All analytics endpoints respond < 500ms
- [ ] Caching: Implement Redis cache for frequently accessed data

---

## 📝 Notes

- **APY Calculation**: The `calculateWeightedPoolAPY()` function already exists in `blockchainService.ts`. Need to integrate it into dashboard API response.
- **Blockchain vs Database**: Some data (like transactions) should come from blockchain events, while aggregated metrics can be cached in database.
- **Cron Jobs**: Set up daily job to record pool APY, calculate monthly earnings, and update borrower metrics.
- **Frontend Fallbacks**: Current frontend has hardcoded defaults. When backend returns null/empty, frontend should handle gracefully.

---

## 🔗 Related Files

- Frontend: `frontend/src/pages/investor/Dashboard.tsx`
- Frontend: `frontend/src/pages/investor/Pools.tsx`
- Frontend: `frontend/src/pages/investor/Analytics.tsx`
- Backend: `backend/src/services/blockchainService.ts`
- Backend: `backend/src/services/investor.service.ts`
- Types: `frontend/src/types/api.types.ts`

---

**Last Updated:** January 30, 2026  
**Status:** Documentation Complete - Ready for Implementation
