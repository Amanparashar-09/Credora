# TIER 2: Important Security Improvements

## Overview

TIER 2 focuses on important security enhancements that improve access control, input validation, rate limiting, and operational security without fundamentally changing the core logic.

---

## 1. Access Control & Governance (HIGH PRIORITY)

### Issue: Ownerless Critical Functions

**Files:** `CreditRegistry.sol`, `CredoraPool.sol`

**Current Problem:**

```solidity
// CreditRegistry.sol - Lines 107-111
function setAttester(address newAttester) external {
    // MVP: ownerless. In production, restrict (Ownable/AccessControl + timelock).
    if (newAttester == address(0)) revert ZeroAttester();
    emit AttesterUpdated(attester, newAttester);
    attester = newAttester;
}

// Lines 113-117
function setPool(address poolAddress) external {
    // MVP: ownerless. In production, restrict (Ownable/AccessControl + timelock).
    require(poolAddress != address(0), "Zero pool address");
    pool = poolAddress;
}
```

**Security Risk:** Anyone can call these functions and change critical addresses!

### Fix Implementation:

#### A. Add Ownable2Step to CreditRegistry

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract CreditRegistry is Ownable2Step {
    using ECDSA for bytes32;

    // Add timelock delay
    uint256 public constant TIMELOCK_DELAY = 2 days;

    // Pending changes
    struct PendingChange {
        address newAddress;
        uint256 effectiveTime;
    }

    PendingChange public pendingAttester;
    PendingChange public pendingPool;

    event AttesterChangeProposed(address indexed newAttester, uint256 effectiveTime);
    event PoolChangeProposed(address indexed newPool, uint256 effectiveTime);
    event AttesterChangeExecuted(address indexed oldAttester, address indexed newAttester);
    event PoolChangeExecuted(address indexed oldPool, address indexed newPool);
    event AttesterChangeCancelled();
    event PoolChangeCancelled();

    // Constructor
    constructor(address initialAttester, address initialOwner) Ownable(initialOwner) {
        if (initialAttester == address(0)) revert ZeroAttester();
        attester = initialAttester;
        // ... rest of constructor
    }

    // Propose attester change (2-step with timelock)
    function proposeAttesterChange(address newAttester) external onlyOwner {
        if (newAttester == address(0)) revert ZeroAttester();
        if (newAttester == attester) revert("Same attester");

        pendingAttester = PendingChange({
            newAddress: newAttester,
            effectiveTime: block.timestamp + TIMELOCK_DELAY
        });

        emit AttesterChangeProposed(newAttester, pendingAttester.effectiveTime);
    }

    // Execute attester change after timelock
    function executeAttesterChange() external onlyOwner {
        require(pendingAttester.newAddress != address(0), "No pending change");
        require(block.timestamp >= pendingAttester.effectiveTime, "Timelock not expired");

        address oldAttester = attester;
        attester = pendingAttester.newAddress;

        delete pendingAttester;

        emit AttesterChangeExecuted(oldAttester, attester);
    }

    // Cancel pending attester change
    function cancelAttesterChange() external onlyOwner {
        require(pendingAttester.newAddress != address(0), "No pending change");
        delete pendingAttester;
        emit AttesterChangeCancelled();
    }

    // Same pattern for setPool
    function proposePoolChange(address newPool) external onlyOwner {
        require(newPool != address(0), "Zero pool address");
        require(newPool != pool, "Same pool");

        pendingPool = PendingChange({
            newAddress: newPool,
            effectiveTime: block.timestamp + TIMELOCK_DELAY
        });

        emit PoolChangeProposed(newPool, pendingPool.effectiveTime);
    }

    function executePoolChange() external onlyOwner {
        require(pendingPool.newAddress != address(0), "No pending change");
        require(block.timestamp >= pendingPool.effectiveTime, "Timelock not expired");

        address oldPool = pool;
        pool = pendingPool.newAddress;

        delete pendingPool;

        emit PoolChangeExecuted(oldPool, pool);
    }

    function cancelPoolChange() external onlyOwner {
        require(pendingPool.newAddress != address(0), "No pending change");
        delete pendingPool;
        emit PoolChangeCancelled();
    }
}
```

#### B. Add Emergency Pause to CredoraPool

```solidity
import "@openzeppelin/contracts/utils/Pausable.sol";

contract CredoraPool is Pausable {
    // Add to existing modifiers
    modifier whenNotPaused() override {
        _requireNotPaused();
        _;
    }

    // Emergency pause - can be called by owner
    function emergencyPause() external onlyAdmin {
        _pause();
        emit EmergencyPaused(msg.sender, block.timestamp);
    }

    function unpause() external onlyAdmin {
        _unpause();
        emit Unpaused(msg.sender, block.timestamp);
    }

    // Add whenNotPaused to critical functions
    function borrow(uint256 amount) external whenNotPaused {
        // ... existing logic
    }

    function deposit(uint256 amount) external whenNotPaused {
        // ... existing logic
    }
}
```

---

## 2. Input Validation & Bounds Checking (HIGH PRIORITY)

### Issue: Missing Maximum Limits

**Current Problem:**

- No maximum deposit/borrow limits
- No validation on credit limit size
- No bounds on interest rate parameters

### Fix Implementation:

```solidity
// Add constants to CredoraPool
contract CredoraPool {
    // Maximum limits
    uint256 public constant MAX_DEPOSIT = 1_000_000e18; // 1M USDT per deposit
    uint256 public constant MAX_TOTAL_DEPOSITS = 10_000_000e18; // 10M USDT total
    uint256 public constant MAX_BORROW = 100_000e18; // 100k USDT per borrow
    uint256 public constant MIN_DEPOSIT = 10e18; // 10 USDT minimum
    uint256 public constant MIN_BORROW = 100e18; // 100 USDT minimum

    // Interest rate bounds (as wad, 1e18 = 100%)
    uint256 public constant MAX_BASE_RATE = 2e17; // 20% max base rate
    uint256 public constant MAX_SLOPE_RATE = 5e17; // 50% max slope
    uint256 public constant MAX_JUMP_SLOPE = 1e18; // 100% max jump slope
    uint256 public constant MIN_KINK = 5e17; // 50% minimum kink
    uint256 public constant MAX_KINK = 95e17; // 95% maximum kink

    // Reserve bounds
    uint256 public constant MIN_RESERVE_BPS = 200; // 2% minimum
    uint256 public constant MAX_RESERVE_BPS = 2000; // 20% maximum

    // Add validation to deposit
    function deposit(uint256 amount) external whenNotPaused {
        if (amount == 0) revert ZeroAmount();
        if (amount < MIN_DEPOSIT) revert("Amount too small");
        if (amount > MAX_DEPOSIT) revert("Amount too large");
        if (totalLiquidity + amount > MAX_TOTAL_DEPOSITS) revert("Pool cap exceeded");

        // ... rest of deposit logic
    }

    // Add validation to borrow
    function borrow(uint256 amount) external whenNotPaused {
        if (borrowPaused) revert BorrowPaused();
        if (amount == 0) revert ZeroAmount();
        if (amount < MIN_BORROW) revert("Amount too small");
        if (amount > MAX_BORROW) revert("Amount too large");

        // ... rest of borrow logic
    }

    // Add validation to interest rate setters
    function setRates(
        uint256 baseRatePerYearWad_,
        uint256 slopePerYearWad_,
        uint256 kinkUtilWad_,
        uint256 jumpSlopePerYearWad_
    ) external onlyAdmin {
        require(baseRatePerYearWad_ <= MAX_BASE_RATE, "Base rate too high");
        require(slopePerYearWad_ <= MAX_SLOPE_RATE, "Slope too high");
        require(jumpSlopePerYearWad_ <= MAX_JUMP_SLOPE, "Jump slope too high");
        require(kinkUtilWad_ >= MIN_KINK && kinkUtilWad_ <= MAX_KINK, "Invalid kink");

        baseRatePerYearWad = baseRatePerYearWad_;
        slopePerYearWad = slopePerYearWad_;
        kinkUtilWad = kinkUtilWad_;
        jumpSlopePerYearWad = jumpSlopePerYearWad_;

        emit RatesUpdated(baseRatePerYearWad_, slopePerYearWad_, kinkUtilWad_, jumpSlopePerYearWad_);
    }

    function setReserve(uint256 newReserveBps) external onlyAdmin {
        require(newReserveBps >= MIN_RESERVE_BPS && newReserveBps <= MAX_RESERVE_BPS, "Invalid reserve");
        reserveBps = newReserveBps;
        emit ReserveUpdated(newReserveBps);
    }
}
```

### Add Slippage Protection for Withdrawals

```solidity
// Add minAmountOut parameter to withdraw
function withdraw(uint256 shares, uint256 minAmountOut) external whenNotPaused {
    if (shares == 0) revert ZeroAmount();
    if (shares > balanceOf[msg.sender]) revert("Insufficient shares");

    uint256 assets = previewWithdraw(shares);

    // Slippage protection
    require(assets >= minAmountOut, "Slippage exceeded");

    // ... rest of withdraw logic
}
```

---

## 3. Rate Limiting & Flash Loan Protection (MEDIUM PRIORITY)

### Issue: No Protection Against Rapid Operations

### Fix Implementation:

```solidity
contract CredoraPool {
    // Rate limiting storage
    struct UserLimits {
        uint256 dailyBorrowed;
        uint256 lastBorrowDay;
        uint256 lastBorrowTime;
    }

    mapping(address => UserLimits) public userLimits;

    uint256 public constant DAILY_BORROW_LIMIT = 50_000e18; // 50k USDT per day per user
    uint256 public constant MIN_BORROW_INTERVAL = 1 hours; // 1 hour between borrows

    function borrow(uint256 amount) external whenNotPaused {
        if (borrowPaused) revert BorrowPaused();
        if (amount == 0) revert ZeroAmount();

        // Check time-based rate limit (prevent flash loan style attacks)
        UserLimits storage limits = userLimits[msg.sender];
        require(
            block.timestamp >= limits.lastBorrowTime + MIN_BORROW_INTERVAL,
            "Cooldown period active"
        );

        // Check daily limit
        uint256 currentDay = block.timestamp / 1 days;
        if (currentDay > limits.lastBorrowDay) {
            // Reset daily counter
            limits.dailyBorrowed = 0;
            limits.lastBorrowDay = currentDay;
        }

        require(
            limits.dailyBorrowed + amount <= DAILY_BORROW_LIMIT,
            "Daily limit exceeded"
        );

        limits.dailyBorrowed += amount;
        limits.lastBorrowTime = block.timestamp;

        // ... rest of borrow logic
    }
}
```

---

## 4. Oracle & Attestation Security (HIGH PRIORITY)

### Issue: No Validation of Attestation Freshness

**Current Problem:**

```solidity
// CreditRegistry.sol - No check for how old the attestation is
function updateLimit(
    LimitUpdate calldata u,
    bytes calldata signature
) external {
    if (u.user == address(0)) revert ZeroUser();
    if (!verify(u, signature)) revert InvalidSignature();
    if (u.expiry < block.timestamp) revert ExpiredAttestation();
    if (u.nonce != currentNonce[u.user]) revert NonceMismatch();

    // ... update logic
}
```

### Fix Implementation:

```solidity
contract CreditRegistry {
    // Add attestation timing validation
    uint256 public constant MAX_ATTESTATION_AGE = 1 hours;
    uint256 public constant MIN_EXPIRY_DURATION = 7 days;
    uint256 public constant MAX_EXPIRY_DURATION = 365 days;

    // Add timestamp to LimitUpdate struct
    struct LimitUpdate {
        address user;
        uint256 score;
        uint256 creditLimit;
        uint256 expiry;
        uint256 nonce;
        uint256 timestamp; // When attestation was created
    }

    function updateLimit(
        LimitUpdate calldata u,
        bytes calldata signature
    ) external {
        if (u.user == address(0)) revert ZeroUser();

        // Validate attestation is fresh (prevent replay of old signatures)
        require(
            block.timestamp <= u.timestamp + MAX_ATTESTATION_AGE,
            "Attestation too old"
        );

        // Validate expiry is reasonable
        uint256 duration = u.expiry - block.timestamp;
        require(
            duration >= MIN_EXPIRY_DURATION && duration <= MAX_EXPIRY_DURATION,
            "Invalid expiry duration"
        );

        if (!verify(u, signature)) revert InvalidSignature();
        if (u.expiry < block.timestamp) revert ExpiredAttestation();
        if (u.nonce != currentNonce[u.user]) revert NonceMismatch();

        // Validate credit limit is reasonable
        require(u.creditLimit > 0, "Zero credit limit");
        require(u.creditLimit <= MAX_CREDIT_LIMIT, "Credit limit too high");

        // Validate score is in valid range
        require(u.score >= 300 && u.score <= 850, "Invalid credit score");

        // ... rest of update logic
    }

    // Add emergency function to invalidate compromised attestations
    function emergencyInvalidateUser(address user, string calldata reason) external onlyOwner {
        isBlacklisted[user] = true;
        emit EmergencyBlacklist(user, reason);
    }
}
```

---

## 5. Reserve Fund Management (MEDIUM PRIORITY)

### Issue: No Monitoring or Safety Checks on Reserve

### Fix Implementation:

```solidity
contract CredoraPool {
    // Reserve fund requirements
    uint256 public constant MIN_RESERVE_RATIO = 5e16; // 5% of total borrowed
    uint256 public constant TARGET_RESERVE_RATIO = 1e17; // 10% of total borrowed

    event ReserveLow(uint256 currentReserve, uint256 minimumRequired);
    event ReserveHealthy(uint256 currentReserve, uint256 target);

    // Check reserve health
    function checkReserveHealth() public view returns (bool isHealthy, uint256 shortfall) {
        uint256 minRequired = (totalBorrowed * MIN_RESERVE_RATIO) / 1e18;

        if (reserveFund < minRequired) {
            return (false, minRequired - reserveFund);
        }
        return (true, 0);
    }

    // Add to borrow function
    function borrow(uint256 amount) external whenNotPaused {
        // ... existing checks

        // Check reserve health after borrow
        (bool isHealthy, uint256 shortfall) = checkReserveHealth();
        if (!isHealthy) {
            emit ReserveLow(reserveFund, reserveFund + shortfall);
            // Don't revert, but warn
        }

        // ... rest of logic
    }

    // Emergency reserve withdrawal (only if pool is being shut down)
    bool public poolShutdown;

    function initiateShutdown() external onlyAdmin {
        require(!poolShutdown, "Already shutdown");
        poolShutdown = true;
        borrowPaused = true;
        _pause();
        emit PoolShutdownInitiated(msg.sender, block.timestamp);
    }

    function withdrawReserve(address to, uint256 amount) external onlyAdmin {
        require(poolShutdown, "Pool not shutdown");
        require(totalBorrowed == 0, "Outstanding loans exist");
        require(to != address(0), "Zero address");
        require(amount <= reserveFund, "Insufficient reserve");

        reserveFund -= amount;
        usdt.safeTransfer(to, amount);

        emit ReserveWithdrawn(to, amount);
    }
}
```

---

## 6. Frontend Security Updates

### Update Contract Constants

**File:** `frontend/src/lib/constants.ts`

```typescript
// Add new validation constants
export const VALIDATION_LIMITS = {
  MIN_DEPOSIT: "10", // 10 USDT
  MAX_DEPOSIT: "1000000", // 1M USDT
  MIN_BORROW: "100", // 100 USDT
  MAX_BORROW: "100000", // 100k USDT
  DAILY_BORROW_LIMIT: "50000", // 50k USDT per day
  MIN_BORROW_INTERVAL: 3600, // 1 hour in seconds
};

// Add slippage settings
export const SLIPPAGE_CONFIG = {
  DEFAULT_SLIPPAGE: 0.5, // 0.5%
  MAX_SLIPPAGE: 5.0, // 5%
  MIN_SLIPPAGE: 0.1, // 0.1%
};
```

### Update Withdrawal UI

**File:** `frontend/src/pages/investor/Returns.tsx`

```typescript
// Add slippage protection to withdrawal
const [slippage, setSlippage] = useState(0.5); // 0.5% default

const handleWithdraw = async () => {
  // Calculate minimum amount out with slippage
  const expectedAmount = /* calculate from shares */;
  const minAmountOut = expectedAmount * (1 - slippage / 100);

  // Call withdraw with slippage protection
  await poolContract.withdraw(shares, ethers.parseUnits(minAmountOut.toString(), 18));
};
```

---

## Implementation Priority

### Week 1: Critical Access Control

- [ ] Add Ownable2Step to CreditRegistry
- [ ] Implement timelock for critical changes
- [ ] Add emergency pause to CredoraPool
- [ ] Update deployment scripts

### Week 2: Input Validation

- [ ] Add all maximum/minimum bounds
- [ ] Implement slippage protection
- [ ] Add validation to all setter functions
- [ ] Update frontend with new limits

### Week 3: Rate Limiting

- [ ] Implement daily borrow limits
- [ ] Add cooldown periods
- [ ] Track user limits on-chain
- [ ] Update frontend with rate limit warnings

### Week 4: Oracle Security

- [ ] Add attestation freshness checks
- [ ] Implement timestamp validation
- [ ] Add emergency invalidation function
- [ ] Update backend attestation generation

### Week 5: Reserve Management

- [ ] Implement reserve health monitoring
- [ ] Add reserve ratio checks
- [ ] Create emergency reserve withdrawal
- [ ] Add reserve monitoring dashboard

---

## Testing Checklist

- [ ] Test ownerless function protection
- [ ] Test timelock delays work correctly
- [ ] Test emergency pause stops all operations
- [ ] Test maximum limits are enforced
- [ ] Test slippage protection prevents MEV
- [ ] Test rate limiting prevents abuse
- [ ] Test old attestations are rejected
- [ ] Test reserve health monitoring
- [ ] Test emergency functions work correctly
- [ ] Integration tests for all new features

---

## Gas Optimization Notes

- Timelock storage adds ~20k gas to admin operations
- Rate limiting adds ~5k gas to borrow operations
- Input validation adds ~2k gas per check
- Reserve monitoring adds ~3k gas to borrow

**Total Estimated Gas Increase:**

- Deposit: +2k gas
- Withdraw: +2k gas
- Borrow: +10k gas
- Admin operations: +20k gas

---

## Backward Compatibility

All changes are additive and backward compatible:

- Existing deposits/borrows continue to work
- Only new operations use new validation
- Admin functions require migration to new ownership model
- Frontend needs updates to support slippage and limits

---

**Status:** Ready for Implementation  
**Estimated Time:** 5 weeks  
**Priority:** HIGH - Should complete before mainnet deployment
