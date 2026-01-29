// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface ICreditRegistry {
    function isValid(address user) external view returns (bool);

    function checkBorrowEligibility(address user) external view returns (bool);

    function limitOf(address user) external view returns (uint256);

    function reportDefault(address user) external;

    function scoreOf(address user) external view returns (uint256);
}

/**
 * CredoraPool (MVP)
 * - LPs deposit USDT, receive pool shares
 * - Students borrow USDT within credit limit (set in CreditRegistry via attestation)
 * - Interest accrues via global borrowIndex
 * - Reserve fund is internal (funded from a cut of interest repayments)
 * - Defaults: admin can write off overdue loans; reserve absorbs first loss
 */
contract CredoraPool {
    using SafeERC20 for IERC20;

    // ---------- Errors ----------
    error ZeroAmount();
    error BorrowPaused();
    error NotAdmin();
    error InsufficientLiquidity();
    error LimitInvalid();
    error CreditExceeded();
    error TermNotActive();
    error NotInDefault();
    error BadParams();
    error SliceNotInOrder();
    error LoanMatured();
    error MaxUtilizationExceeded();
    error DailyLimitExceeded();
    error PersonalLimitExceeded();

    // ---------- Events ----------
    event Deposited(address indexed user, uint256 amount, uint256 shares);
    event Withdrawn(address indexed user, uint256 amount, uint256 shares);

    event Borrowed(
        address indexed user,
        uint256 amount,
        uint256 newPrincipal,
        uint256 dueAt
    );
    event Repaid(
        address indexed user,
        uint256 amount,
        uint256 principalPaid,
        uint256 interestPaid,
        uint256 reserveCut
    );
    event SlicePaid(
        address indexed user,
        uint256 sliceNumber,
        uint256 amount,
        uint256 timestamp
    );
    event LoanFullyPaid(address indexed user);
    event LoanDefaulted(
        address indexed user,
        uint256 amount,
        uint256 timestamp
    );

    event DefaultWrittenOff(
        address indexed user,
        uint256 writtenPrincipal,
        uint256 writtenInterest,
        uint256 reserveUsed
    );

    event ParamsUpdated(
        uint256 baseRatePerYearWad,
        uint256 slopePerYearWad,
        uint256 kinkUtilWad,
        uint256 jumpSlopePerYearWad,
        uint256 reserveBps,
        uint256 termSeconds,
        uint256 graceSeconds
    );

    event BorrowPausedSet(bool paused);
    event AdminSet(address indexed admin);

    // ---------- Constants / Precision ----------
    uint256 private constant WAD = 1e18;
    uint256 private constant RAY = 1e27;
    uint256 private constant SECONDS_PER_YEAR = 31536000;

    // Liquidity protection constants
    uint256 public constant MAX_UTILIZATION_RATE = 80; // 80% max
    uint256 public constant MIN_POOL_RESERVE = 1000e6; // 1000 USDT minimum
    uint256 public constant MAX_BORROW_PER_USER = 10000e6; // $10k max per user
    uint256 public constant DAILY_BORROW_LIMIT = 50000e6; // $50k total per day
    uint256 public constant LOAN_DURATION = 300 days; // 10 months
    uint256 public constant MAX_OVERDUE_DAYS = 30 days;
    uint256 public constant TOTAL_SLICES = 10; // Number of EMI installments

    IERC20 public immutable usdt;
    ICreditRegistry public immutable registry;

    // EMI Schedule for each borrower
    struct EMISchedule {
        uint256 principal;
        uint256 interestRateBps; // basis points (e.g., 800 = 8%)
        uint256 totalSlices;
        uint256 monthlyPayment;
        uint256 startDate;
    }

    // Loan details for tracking maturity and defaults
    struct LoanDetails {
        uint256 amount;
        uint256 startDate;
        uint256 maturityDate;
        uint256 paidAmount;
        bool isActive;
        bool isDefaulted;
    }

    mapping(address => EMISchedule) public emiSchedules;
    mapping(address => LoanDetails) public loanDetails;
    mapping(address => mapping(uint256 => bool)) public slicePaidMapping; // user => sliceNumber => paid
    mapping(address => uint256) public lastPaidSlice; // Sequential payment tracking
    mapping(uint256 => uint256) public dailyBorrowAmount; // day => amount borrowed

    // Shares (simple vault)
    uint256 public totalShares;
    mapping(address => uint256) public sharesOf;

    // Per-user interest tracking (credit score based rates)
    mapping(address => uint256) public userPrincipal;
    mapping(address => uint256) public userInterestAccrued;
    mapping(address => uint256) public lastInterestUpdate;
    mapping(address => uint256) public dueAt;

    // Aggregate debt
    uint256 public totalPrincipal; // sum(userPrincipal)

    // Reserve fund (internal balance held in USDT inside this contract)
    uint256 public reserveBalance;

    // Governance (MVP)
    address public admin;
    bool public borrowPaused;

    // Rate model params (WAD)
    // utilization u = totalDebt / (cash + totalDebt)
    // rate per year = piecewise kink model
    uint256 public baseRatePerYearWad; // e.g. 0.05e18 = 5%
    uint256 public slopePerYearWad; // pre-kink slope
    uint256 public kinkUtilWad; // e.g. 0.8e18
    uint256 public jumpSlopePerYearWad; // post-kink additional slope

    // Protocol params
    uint256 public reserveBps; // interest cut to reserve (bps)
    uint256 public termSeconds; // loan term per borrow (MVP: resets on borrow)
    uint256 public graceSeconds; // after dueAt, grace before default

    constructor(address usdt_, address registry_, address admin_) {
        if (
            usdt_ == address(0) ||
            registry_ == address(0) ||
            admin_ == address(0)
        ) revert BadParams();

        usdt = IERC20(usdt_);
        registry = ICreditRegistry(registry_);
        admin = admin_;

        // sane defaults (you can tune later)
        baseRatePerYearWad = 5e16; // 5%
        slopePerYearWad = 2e17; // +20% at kink
        kinkUtilWad = 8e17; // 80%
        jumpSlopePerYearWad = 5e17; // steeper after kink

        reserveBps = 800; // 8% of interest to reserve
        termSeconds = 30 days;
        graceSeconds = 7 days;
    }

    // ---------- Admin ----------
    modifier onlyAdmin() {
        if (msg.sender != admin) revert NotAdmin();
        _;
    }

    function setAdmin(address newAdmin) external onlyAdmin {
        if (newAdmin == address(0)) revert BadParams();
        admin = newAdmin;
        emit AdminSet(newAdmin);
    }

    function setBorrowPaused(bool paused) external onlyAdmin {
        borrowPaused = paused;
        emit BorrowPausedSet(paused);
    }

    function setParams(
        uint256 baseRatePerYearWad_,
        uint256 slopePerYearWad_,
        uint256 kinkUtilWad_,
        uint256 jumpSlopePerYearWad_,
        uint256 reserveBps_,
        uint256 termSeconds_,
        uint256 graceSeconds_
    ) external onlyAdmin {
        if (kinkUtilWad_ > WAD) revert BadParams();
        if (reserveBps_ > 3000) revert BadParams(); // cap 30% for safety (MVP)

        baseRatePerYearWad = baseRatePerYearWad_;
        slopePerYearWad = slopePerYearWad_;
        kinkUtilWad = kinkUtilWad_;
        jumpSlopePerYearWad = jumpSlopePerYearWad_;

        reserveBps = reserveBps_;
        termSeconds = termSeconds_;
        graceSeconds = graceSeconds_;

        emit ParamsUpdated(
            baseRatePerYearWad_,
            slopePerYearWad_,
            kinkUtilWad_,
            jumpSlopePerYearWad_,
            reserveBps_,
            termSeconds_,
            graceSeconds_
        );
    }

    // ---------- Views ----------
    function cash() public view returns (uint256) {
        // Cash includes reserveBalance physically, but reserveBalance is not withdrawable
        return usdt.balanceOf(address(this));
    }

    function totalDebt() public view returns (uint256) {
        // Sum of all user debts (principal + interest)
        // Note: This is gas-intensive for large # of users
        // For production, maintain a cached total updated on borrow/repay
        return totalPrincipal; // Simplified - interest calculated per-user
    }

    function totalBorrowed() public view returns (uint256) {
        // Alias for backend compatibility - same as totalDebt
        return totalDebt();
    }

    function utilizationWad() public view returns (uint256) {
        uint256 c = cash();
        uint256 d = totalDebt();
        if (c + d == 0) return 0;
        return (d * WAD) / (c + d);
    }

    function sharesToAssets(uint256 shares) public view returns (uint256) {
        if (totalShares == 0) return shares;
        // LPs effectively own: (cash - reserveBalance) + totalDebt
        uint256 backing = (cash() - reserveBalance) + totalDebt();
        return (shares * backing) / totalShares;
    }

    function assetsToShares(uint256 assets) public view returns (uint256) {
        if (totalShares == 0) return assets;
        uint256 backing = (cash() - reserveBalance) + totalDebt();
        if (backing == 0) return assets;
        return (assets * totalShares) / backing;
    }

    function userTotalDebt(address user) public view returns (uint256) {
        uint256 principal = userPrincipal[user];
        if (principal == 0) return 0;

        uint256 accruedInterest = userInterestAccrued[user];

        // Calculate pending interest since last update
        uint256 dt = block.timestamp - lastInterestUpdate[user];
        uint256 rateBps = emiSchedules[user].interestRateBps;
        uint256 pendingInterest = (principal * rateBps * dt) /
            (10000 * 365 days);

        return principal + accruedInterest + pendingInterest;
    }

    function userInterestDue(address user) public view returns (uint256) {
        uint256 principal = userPrincipal[user];
        if (principal == 0) return 0;

        uint256 accruedInterest = userInterestAccrued[user];
        uint256 dt = block.timestamp - lastInterestUpdate[user];
        uint256 rateBps = emiSchedules[user].interestRateBps;
        uint256 pendingInterest = (principal * rateBps * dt) /
            (10000 * 365 days);

        return accruedInterest + pendingInterest;
    }

    function availableCredit(address user) public view returns (uint256) {
        if (!registry.isValid(user)) return 0;
        uint256 limit = registry.limitOf(user);
        uint256 due = userTotalDebt(user);
        if (limit <= due) return 0;
        return limit - due;
    }

    // Backend convenience views
    function totalLiquidity() public view returns (uint256) {
        // Total assets = cash (including reserve) + total debt
        return cash() + totalDebt();
    }

    function balanceOf(address user) public view returns (uint256) {
        return sharesOf[user];
    }

    function previewWithdraw(uint256 shares) public view returns (uint256) {
        return sharesToAssets(shares);
    }

    function getBorrowerDebt(
        address borrower
    )
        public
        view
        returns (uint256 principal, uint256 debt, uint256 dueAtTimestamp)
    {
        return (
            userPrincipal[borrower],
            userTotalDebt(borrower),
            dueAt[borrower]
        );
    }

    // ---------- Interest Accrual ----------
    function calculateMonthlyEMI(
        uint256 principal,
        uint256 annualRateBps,
        uint256 months
    ) public pure returns (uint256) {
        if (principal == 0 || months == 0) return 0;

        // Convert annual rate to monthly rate (in WAD precision)
        uint256 monthlyRateWad = (annualRateBps * WAD) / (12 * 10000);

        if (monthlyRateWad == 0) {
            // No interest case
            return principal / months;
        }

        // EMI = P * r * (1+r)^n / ((1+r)^n - 1)
        // Using WAD precision
        uint256 onePlusR = WAD + monthlyRateWad;
        uint256 power = _pow(onePlusR, months, WAD);

        uint256 numerator = (principal * monthlyRateWad * power) / WAD;
        uint256 denominator = power - WAD;

        if (denominator == 0) return principal / months;

        return (numerator * WAD) / denominator / WAD;
    }

    function _pow(
        uint256 base,
        uint256 exponent,
        uint256 precision
    ) internal pure returns (uint256) {
        if (exponent == 0) return precision;

        uint256 result = precision;
        for (uint256 i = 0; i < exponent; i++) {
            result = (result * base) / precision;
        }
        return result;
    }

    function _borrowRatePerYearWad(
        uint256 utilWad
    ) internal view returns (uint256) {
        // kink model:
        // if u <= kink: r = base + slope * (u/kink)
        // if u > kink:  r = base + slope + jumpSlope * ((u-kink)/(1-kink))
        if (utilWad <= kinkUtilWad) {
            if (kinkUtilWad == 0) return baseRatePerYearWad;
            uint256 scaled = (utilWad * WAD) / kinkUtilWad;
            return baseRatePerYearWad + (slopePerYearWad * scaled) / WAD;
        } else {
            uint256 excess = utilWad - kinkUtilWad;
            uint256 denom = (WAD - kinkUtilWad);
            uint256 post = (denom == 0) ? WAD : (excess * WAD) / denom;
            return
                baseRatePerYearWad +
                slopePerYearWad +
                (jumpSlopePerYearWad * post) /
                WAD;
        }
    }

    // Per-user interest accrual based on their fixed credit score rate
    function accrueUserInterest(address user) internal {
        if (userPrincipal[user] == 0) return;

        uint256 dt = block.timestamp - lastInterestUpdate[user];
        if (dt == 0) return;

        uint256 principal = userPrincipal[user];
        uint256 rateBps = emiSchedules[user].interestRateBps;

        // Simple interest: I = P * R * T / (10000 * 365 days)
        uint256 interest = (principal * rateBps * dt) / (10000 * 365 days);
        userInterestAccrued[user] += interest;
        lastInterestUpdate[user] = block.timestamp;
    }

    // ---------- LP actions ----------
    function deposit(uint256 amount) external {
        if (amount == 0) revert ZeroAmount();

        uint256 mintedShares = assetsToShares(amount);
        totalShares += mintedShares;
        sharesOf[msg.sender] += mintedShares;

        usdt.safeTransferFrom(msg.sender, address(this), amount);

        emit Deposited(msg.sender, amount, mintedShares);
    }

    function withdraw(uint256 shares) external {
        if (shares == 0) revert ZeroAmount();

        if (shares > sharesOf[msg.sender]) revert InsufficientLiquidity();

        uint256 amount = sharesToAssets(shares);

        // must not withdraw reserveBalance
        uint256 availableCash = cash() - reserveBalance;
        if (amount > availableCash) revert InsufficientLiquidity();

        sharesOf[msg.sender] -= shares;
        totalShares -= shares;

        usdt.safeTransfer(msg.sender, amount);

        emit Withdrawn(msg.sender, amount, shares);
    }

    // ---------- Borrowing ----------
    function borrow(uint256 amount) external {
        if (borrowPaused) revert BorrowPaused();
        if (amount == 0) revert ZeroAmount();

        // TIER 1 FIX #1: Check eligibility (includes blacklist check)
        if (!registry.checkBorrowEligibility(msg.sender)) revert LimitInvalid();

        uint256 limit = registry.limitOf(msg.sender);
        uint256 due = userTotalDebt(msg.sender);
        if (due + amount > limit) revert CreditExceeded();

        // TIER 1 FIX #4: Liquidity Protection - Personal limit
        if (due + amount > MAX_BORROW_PER_USER) revert PersonalLimitExceeded();

        // TIER 1 FIX #4: Daily borrow limit
        uint256 today = block.timestamp / 1 days;
        if (dailyBorrowAmount[today] + amount > DAILY_BORROW_LIMIT)
            revert DailyLimitExceeded();

        // TIER 1 FIX #4: Utilization rate check
        uint256 totalLiq = cash() + totalDebt();
        uint256 newTotalBorrowed = totalDebt() + amount;
        uint256 utilizationRate = (newTotalBorrowed * 100) / totalLiq;
        if (utilizationRate > MAX_UTILIZATION_RATE)
            revert MaxUtilizationExceeded();

        // TIER 1 FIX #4: Minimum pool reserve check
        uint256 availableCash = cash() - reserveBalance;
        if (availableCash < amount + MIN_POOL_RESERVE)
            revert InsufficientLiquidity();

        // Update user debt (principal only, interest accrues separately)
        userPrincipal[msg.sender] += amount;
        totalPrincipal += amount;
        lastInterestUpdate[msg.sender] = block.timestamp;

        // TIER 1 FIX #5: Set loan maturity date
        uint256 startTime = block.timestamp;
        uint256 maturityTime = startTime + LOAN_DURATION;
        dueAt[msg.sender] = maturityTime;

        // TIER 1 FIX #2: Calculate and store EMI schedule on-chain
        uint256 interestRate = _getInterestRateForUser(msg.sender);
        uint256 monthlyEMI = calculateMonthlyEMI(
            amount,
            interestRate,
            TOTAL_SLICES
        );

        emiSchedules[msg.sender] = EMISchedule({
            principal: amount,
            interestRateBps: interestRate,
            totalSlices: TOTAL_SLICES,
            monthlyPayment: monthlyEMI,
            startDate: startTime
        });

        // TIER 1 FIX #5: Store loan details
        loanDetails[msg.sender] = LoanDetails({
            amount: amount,
            startDate: startTime,
            maturityDate: maturityTime,
            paidAmount: 0,
            isActive: true,
            isDefaulted: false
        });

        // Reset slice tracking for new loan
        lastPaidSlice[msg.sender] = 0;

        // Update daily borrow amount
        dailyBorrowAmount[today] += amount;

        usdt.safeTransfer(msg.sender, amount);

        emit Borrowed(
            msg.sender,
            amount,
            userPrincipal[msg.sender],
            maturityTime
        );
    }

    function _getInterestRateForUser(
        address user
    ) internal view returns (uint256) {
        // Get credit score from CreditRegistry
        uint256 score = registry.scoreOf(user);

        // Return FIXED rate based on credit tier
        if (score >= 750) {
            return 800; // 8% APY for LOW risk (excellent credit)
        } else if (score >= 650) {
            return 1200; // 12% APY for MEDIUM risk (good credit)
        } else {
            return 1500; // 15% APY for HIGH risk (fair/poor credit)
        }
    }

    function repay(uint256 amount) external {
        if (amount == 0) revert ZeroAmount();

        // Accrue user's interest first
        accrueUserInterest(msg.sender);

        uint256 principal = userPrincipal[msg.sender];
        uint256 interest = userInterestAccrued[msg.sender];
        uint256 due = principal + interest;

        if (due == 0) revert TermNotActive();

        uint256 pay = amount > due ? due : amount;

        // Pay interest first, then principal
        uint256 interestPaid = pay > interest ? interest : pay;
        uint256 principalPaid = pay - interestPaid;

        // Reserve cut from interest only
        uint256 reserveCut = (interestPaid * reserveBps) / 10000;
        reserveBalance += reserveCut;

        // Apply payments
        if (interestPaid > 0) {
            userInterestAccrued[msg.sender] -= interestPaid;
        }
        if (principalPaid > 0) {
            userPrincipal[msg.sender] -= principalPaid;
            totalPrincipal -= principalPaid;
        }

        // Update loan details paid amount
        LoanDetails storage loan = loanDetails[msg.sender];
        loan.paidAmount += pay;

        // if fully repaid, clear dueAt and mark loan inactive
        if (
            userPrincipal[msg.sender] == 0 &&
            userInterestAccrued[msg.sender] == 0
        ) {
            dueAt[msg.sender] = 0;
            loan.isActive = false;
            emit LoanFullyPaid(msg.sender);
        }

        usdt.safeTransferFrom(msg.sender, address(this), pay);

        emit Repaid(msg.sender, pay, principalPaid, interestPaid, reserveCut);
    }

    // TIER 1 FIX #3 & #6: Pay individual slice with sequential enforcement
    function paySlice(uint256 sliceNumber) external {
        if (sliceNumber == 0 || sliceNumber > TOTAL_SLICES) revert BadParams();

        // Accrue user's interest first
        accrueUserInterest(msg.sender);

        EMISchedule memory schedule = emiSchedules[msg.sender];
        if (schedule.principal == 0) revert TermNotActive();

        // TIER 1 FIX #6: Enforce sequential payment
        uint256 expectedSlice = lastPaidSlice[msg.sender] + 1;
        if (sliceNumber != expectedSlice) revert SliceNotInOrder();

        // TIER 1 FIX #5: Check if loan has matured/defaulted
        LoanDetails storage loan = loanDetails[msg.sender];
        if (loan.isDefaulted) revert NotInDefault();
        if (block.timestamp > loan.maturityDate + MAX_OVERDUE_DAYS) {
            revert LoanMatured();
        }

        uint256 paymentAmount = schedule.monthlyPayment;

        // First approve and transfer the exact EMI amount
        usdt.safeTransferFrom(msg.sender, address(this), paymentAmount);

        // Update debt using internal payment logic
        uint256 principal = userPrincipal[msg.sender];
        uint256 interest = userInterestAccrued[msg.sender];

        uint256 interestPaid = paymentAmount > interest
            ? interest
            : paymentAmount;
        uint256 principalPaid = paymentAmount - interestPaid;

        // Reserve cut from interest
        uint256 reserveCut = (interestPaid * reserveBps) / 10000;
        reserveBalance += reserveCut;

        // Apply payments
        if (interestPaid > 0) {
            userInterestAccrued[msg.sender] -= interestPaid;
        }
        if (principalPaid > 0) {
            userPrincipal[msg.sender] -= principalPaid;
            totalPrincipal -= principalPaid;
        }

        // TIER 1 FIX #3: Mark slice as paid on-chain (no localStorage!)
        slicePaidMapping[msg.sender][sliceNumber] = true;
        lastPaidSlice[msg.sender] = sliceNumber;

        // Update loan details
        loan.paidAmount += paymentAmount;

        // Check if loan is fully paid
        if (
            (userPrincipal[msg.sender] == 0 &&
                userInterestAccrued[msg.sender] == 0) ||
            sliceNumber == TOTAL_SLICES
        ) {
            dueAt[msg.sender] = 0;
            loan.isActive = false;
            emit LoanFullyPaid(msg.sender);
        }

        emit SlicePaid(msg.sender, sliceNumber, paymentAmount, block.timestamp);
        emit Repaid(
            msg.sender,
            paymentAmount,
            principalPaid,
            interestPaid,
            reserveCut
        );
    }

    // TIER 1 FIX #3: View function to check if slice is paid (for frontend)
    function isSlicePaid(
        address borrower,
        uint256 sliceNumber
    ) external view returns (bool) {
        return slicePaidMapping[borrower][sliceNumber];
    }

    // ---------- Defaults (MVP) ----------
    function isInDefault(address user) public view returns (bool) {
        uint256 d = dueAt[user];
        if (d == 0) return false;
        return block.timestamp > (d + graceSeconds) && userTotalDebt(user) > 0;
    }

    // TIER 1 FIX #5: Check loan status and auto-mark defaults
    function checkLoanStatus(address borrower) public returns (bool) {
        LoanDetails storage loan = loanDetails[borrower];

        if (!loan.isActive) return false;

        // Auto-mark as defaulted if overdue by 30+ days
        if (block.timestamp > loan.maturityDate + MAX_OVERDUE_DAYS) {
            if (!loan.isDefaulted) {
                loan.isDefaulted = true;
                // TIER 1 FIX #1: Report default to CreditRegistry
                registry.reportDefault(borrower);
                emit LoanDefaulted(borrower, loan.amount, block.timestamp);
                return false;
            }
        }

        return loan.isActive && !loan.isDefaulted;
    }

    /**
     * writeOffDefault
     * - admin marks a user defaulted and writes off their debt
     * - reserveBalance absorbs first loss; remainder is socialized (LPs take hit)
     * TIER 1 FIX #1: Also reports default to CreditRegistry
     */
    function writeOffDefault(address user) external onlyAdmin {
        if (!isInDefault(user)) revert NotInDefault();

        // Accrue final interest
        accrueUserInterest(user);

        uint256 principal = userPrincipal[user];
        uint256 interest = userInterestAccrued[user];
        uint256 due = principal + interest;

        // Remove user debt
        userPrincipal[user] = 0;
        userInterestAccrued[user] = 0;
        totalPrincipal -= principal;

        dueAt[user] = 0;

        // TIER 1 FIX #1: Mark loan as defaulted and report to registry
        LoanDetails storage loan = loanDetails[user];
        loan.isDefaulted = true;
        loan.isActive = false;

        // Report default to CreditRegistry (blacklist + credit limit reduction)
        registry.reportDefault(user);

        // reserve absorbs first loss
        uint256 reserveUsed = due > reserveBalance ? reserveBalance : due;
        reserveBalance -= reserveUsed;

        emit DefaultWrittenOff(user, principal, interest, reserveUsed);
        emit LoanDefaulted(user, due, block.timestamp);
    }
}
