// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface ICreditRegistry {
    function isValid(address user) external view returns (bool);
    function limitOf(address user) external view returns (uint256);
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

    // ---------- Events ----------
    event Deposited(address indexed user, uint256 amount, uint256 shares);
    event Withdrawn(address indexed user, uint256 amount, uint256 shares);

    event Borrowed(address indexed user, uint256 amount, uint256 newPrincipal, uint256 dueAt);
    event Repaid(address indexed user, uint256 amount, uint256 principalPaid, uint256 interestPaid, uint256 reserveCut);

    event DefaultWrittenOff(address indexed user, uint256 writtenPrincipal, uint256 writtenInterest, uint256 reserveUsed);

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

    IERC20 public immutable usdt;
    ICreditRegistry public immutable registry;

    // Shares (simple vault)
    uint256 public totalShares;
    mapping(address => uint256) public sharesOf;

    // Debt accounting (index-based)
    uint256 public borrowIndexRay = RAY;
    uint256 public lastAccrualTs;

    // Aggregate debt
    uint256 public totalScaledDebtRay; // sum(userScaledDebtRay)
    uint256 public totalPrincipal;     // sum(userPrincipal)

    // Per user
    mapping(address => uint256) public userScaledDebtRay;
    mapping(address => uint256) public userPrincipal;
    mapping(address => uint256) public dueAt;

    // Reserve fund (internal balance held in USDT inside this contract)
    uint256 public reserveBalance;

    // Governance (MVP)
    address public admin;
    bool public borrowPaused;

    // Rate model params (WAD)
    // utilization u = totalDebt / (cash + totalDebt)
    // rate per year = piecewise kink model
    uint256 public baseRatePerYearWad;     // e.g. 0.05e18 = 5%
    uint256 public slopePerYearWad;        // pre-kink slope
    uint256 public kinkUtilWad;            // e.g. 0.8e18
    uint256 public jumpSlopePerYearWad;    // post-kink additional slope

    // Protocol params
    uint256 public reserveBps;     // interest cut to reserve (bps)
    uint256 public termSeconds;    // loan term per borrow (MVP: resets on borrow)
    uint256 public graceSeconds;   // after dueAt, grace before default

    constructor(
        address usdt_,
        address registry_,
        address admin_
    ) {
        if (usdt_ == address(0) || registry_ == address(0) || admin_ == address(0)) revert BadParams();

        usdt = IERC20(usdt_);
        registry = ICreditRegistry(registry_);
        admin = admin_;

        // sane defaults (you can tune later)
        baseRatePerYearWad = 5e16;      // 5%
        slopePerYearWad = 2e17;         // +20% at kink
        kinkUtilWad = 8e17;             // 80%
        jumpSlopePerYearWad = 5e17;     // steeper after kink

        reserveBps = 800;               // 8% of interest to reserve
        termSeconds = 30 days;
        graceSeconds = 7 days;

        lastAccrualTs = block.timestamp;
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
        // totalDebt = totalScaledDebtRay * borrowIndexRay / RAY
        return (totalScaledDebtRay * borrowIndexRay) / RAY;
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
        return (userScaledDebtRay[user] * borrowIndexRay) / RAY;
    }

    function userInterestDue(address user) public view returns (uint256) {
        uint256 due = userTotalDebt(user);
        uint256 principal = userPrincipal[user];
        if (due <= principal) return 0;
        return due - principal;
    }

    function availableCredit(address user) public view returns (uint256) {
        if (!registry.isValid(user)) return 0;
        uint256 limit = registry.limitOf(user);
        uint256 due = userTotalDebt(user);
        if (limit <= due) return 0;
        return limit - due;
    }

    // ---------- Interest Accrual ----------
    function _borrowRatePerYearWad(uint256 utilWad) internal view returns (uint256) {
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
            return baseRatePerYearWad + slopePerYearWad + (jumpSlopePerYearWad * post) / WAD;
        }
    }

    function accrue() public {
        uint256 nowTs = block.timestamp;
        if (nowTs == lastAccrualTs) return;

        uint256 dt = nowTs - lastAccrualTs;
        lastAccrualTs = nowTs;

        uint256 util = utilizationWad();
        uint256 rYearWad = _borrowRatePerYearWad(util);

        // rate per second in RAY:
        // rSecRay = (rYearWad / SECONDS_PER_YEAR) * (RAY/WAD)
        uint256 rSecRay = (rYearWad * RAY) / (WAD * SECONDS_PER_YEAR);

        // simple interest: index *= (1 + rSec * dt)
        // factorRay = RAY + rSecRay * dt
        uint256 factorRay = RAY + (rSecRay * dt);
        borrowIndexRay = (borrowIndexRay * factorRay) / RAY;
    }

    // ---------- LP actions ----------
    function deposit(uint256 amount) external {
        if (amount == 0) revert ZeroAmount();
        accrue();

        uint256 mintedShares = assetsToShares(amount);
        totalShares += mintedShares;
        sharesOf[msg.sender] += mintedShares;

        usdt.safeTransferFrom(msg.sender, address(this), amount);

        emit Deposited(msg.sender, amount, mintedShares);
    }

    function withdraw(uint256 shares) external {
        if (shares == 0) revert ZeroAmount();
        accrue();

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

        accrue();

        if (!registry.isValid(msg.sender)) revert LimitInvalid();

        uint256 limit = registry.limitOf(msg.sender);
        uint256 due = userTotalDebt(msg.sender);
        if (due + amount > limit) revert CreditExceeded();

        uint256 availableCash = cash() - reserveBalance;
        if (amount > availableCash) revert InsufficientLiquidity();

        // update user debt
        uint256 scaledAdd = (amount * RAY) / borrowIndexRay;
        userScaledDebtRay[msg.sender] += scaledAdd;
        totalScaledDebtRay += scaledAdd;

        userPrincipal[msg.sender] += amount;
        totalPrincipal += amount;

        // set/refresh due date for MVP
        dueAt[msg.sender] = block.timestamp + termSeconds;

        usdt.safeTransfer(msg.sender, amount);

        emit Borrowed(msg.sender, amount, userPrincipal[msg.sender], dueAt[msg.sender]);
    }

    function repay(uint256 amount) external {
        if (amount == 0) revert ZeroAmount();
        accrue();

        uint256 due = userTotalDebt(msg.sender);
        if (due == 0) revert TermNotActive();

        uint256 pay = amount > due ? due : amount;

        // compute interest vs principal
        uint256 principalOutstanding = userPrincipal[msg.sender];
        uint256 interestOutstanding = (due > principalOutstanding) ? (due - principalOutstanding) : 0;

        uint256 interestPaid = pay > interestOutstanding ? interestOutstanding : pay;
        uint256 remaining = pay - interestPaid;

        uint256 principalPaid = remaining > principalOutstanding ? principalOutstanding : remaining;

        // reserve cut from interest only
        uint256 reserveCut = (interestPaid * reserveBps) / 10000;
        reserveBalance += reserveCut;

        // apply principal reduction first to principal state
        if (principalPaid > 0) {
            userPrincipal[msg.sender] = principalOutstanding - principalPaid;
            totalPrincipal -= principalPaid;
        }

        // reduce scaled debt by total pay (interest + principal)
        // scaledDelta = pay * RAY / borrowIndex
        uint256 scaledDelta = (pay * RAY) / borrowIndexRay;

        // guard rounding: cap at userScaledDebt
        uint256 usd = userScaledDebtRay[msg.sender];
        if (scaledDelta > usd) scaledDelta = usd;

        userScaledDebtRay[msg.sender] = usd - scaledDelta;
        totalScaledDebtRay -= scaledDelta;

        // if fully repaid, clear dueAt
        if (userTotalDebt(msg.sender) == 0) {
            dueAt[msg.sender] = 0;
        }

        usdt.safeTransferFrom(msg.sender, address(this), pay);

        emit Repaid(msg.sender, pay, principalPaid, interestPaid, reserveCut);
    }

    // ---------- Defaults (MVP) ----------
    function isInDefault(address user) public view returns (bool) {
        uint256 d = dueAt[user];
        if (d == 0) return false;
        return block.timestamp > (d + graceSeconds) && userTotalDebt(user) > 0;
    }

    /**
     * writeOffDefault
     * - admin marks a user defaulted and writes off their debt
     * - reserveBalance absorbs first loss; remainder is socialized (LPs take hit)
     */
    function writeOffDefault(address user) external onlyAdmin {
        accrue();
        if (!isInDefault(user)) revert NotInDefault();

        uint256 due = userTotalDebt(user);
        uint256 principal = userPrincipal[user];
        uint256 interest = due > principal ? due - principal : 0;

        // remove user from aggregates
        uint256 usd = userScaledDebtRay[user];
        totalScaledDebtRay -= usd;
        userScaledDebtRay[user] = 0;

        if (principal > 0) {
            totalPrincipal -= principal;
            userPrincipal[user] = 0;
        }

        dueAt[user] = 0;

        // reserve absorbs first loss
        uint256 reserveUsed = due > reserveBalance ? reserveBalance : due;
        reserveBalance -= reserveUsed;

        emit DefaultWrittenOff(user, principal, interest, reserveUsed);
    }
}
