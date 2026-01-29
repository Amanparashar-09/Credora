// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * CreditRegistry
 * - Minimal on-chain storage: score, creditLimit, expiry, nonce
 * - Updates are authorized via attester signature (EIP-712)
 */
contract CreditRegistry {
    using ECDSA for bytes32;

    error InvalidSignature();
    error ExpiredAttestation();
    error NonceMismatch();
    error ZeroUser();
    error ZeroAttester();
    error Blacklisted();

    event AttesterUpdated(
        address indexed oldAttester,
        address indexed newAttester
    );
    event LimitUpdated(
        address indexed user,
        uint256 score,
        uint256 creditLimit,
        uint256 expiry,
        uint256 nonce
    );
    event DefaultReported(
        address indexed user,
        uint256 defaultCount,
        uint256 newCreditLimit
    );
    event UserBlacklisted(address indexed user, uint256 defaultCount);

    struct LimitUpdate {
        address user;
        uint256 score;
        uint256 creditLimit;
        uint256 expiry; // unix seconds
        uint256 nonce; // must match currentNonce[user]
    }

    // EIP-712
    bytes32 private immutable _DOMAIN_SEPARATOR;
    uint256 private immutable _CHAIN_ID;

    bytes32 private constant _EIP712_DOMAIN_TYPEHASH =
        keccak256(
            "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
        );

    bytes32 private constant _LIMIT_UPDATE_TYPEHASH =
        keccak256(
            "LimitUpdate(address user,uint256 score,uint256 creditLimit,uint256 expiry,uint256 nonce)"
        );

    string private constant _NAME = "CredoraCreditRegistry";
    string private constant _VERSION = "1";

    address public attester;
    address public pool; // CredoraPool address that can report defaults

    mapping(address => uint256) public scoreOf;
    mapping(address => uint256) public limitOf;
    mapping(address => uint256) public expiryOf;
    mapping(address => uint256) public currentNonce;

    // Default tracking
    mapping(address => uint256) public defaultCount;
    mapping(address => bool) public isBlacklisted;
    mapping(address => uint256) public lastDefaultTimestamp;

    constructor(address initialAttester) {
        if (initialAttester == address(0)) revert ZeroAttester();
        attester = initialAttester;

        _CHAIN_ID = block.chainid;
        _DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                _EIP712_DOMAIN_TYPEHASH,
                keccak256(bytes(_NAME)),
                keccak256(bytes(_VERSION)),
                block.chainid,
                address(this)
            )
        );
    }

    function domainSeparator() external view returns (bytes32) {
        // if chain fork changes chainid, recompute
        if (block.chainid == _CHAIN_ID) return _DOMAIN_SEPARATOR;

        return
            keccak256(
                abi.encode(
                    _EIP712_DOMAIN_TYPEHASH,
                    keccak256(bytes(_NAME)),
                    keccak256(bytes(_VERSION)),
                    block.chainid,
                    address(this)
                )
            );
    }

    function setAttester(address newAttester) external {
        // MVP: ownerless. In production, restrict (Ownable/AccessControl + timelock).
        if (newAttester == address(0)) revert ZeroAttester();
        emit AttesterUpdated(attester, newAttester);
        attester = newAttester;
    }

    function setPool(address poolAddress) external {
        // MVP: ownerless. In production, restrict (Ownable/AccessControl + timelock).
        require(poolAddress != address(0), "Zero pool address");
        pool = poolAddress;
    }

    function reportDefault(address user) external {
        require(msg.sender == pool, "Only pool can report defaults");
        require(user != address(0), "Zero user");

        defaultCount[user]++;
        lastDefaultTimestamp[user] = block.timestamp;

        // Blacklist after 2 defaults
        if (defaultCount[user] >= 2) {
            isBlacklisted[user] = true;
            emit UserBlacklisted(user, defaultCount[user]);
        }

        // Reduce credit limit by 50% on each default
        uint256 currentLimit = limitOf[user];
        uint256 newLimit = (currentLimit * 50) / 100;
        limitOf[user] = newLimit;

        emit DefaultReported(user, defaultCount[user], newLimit);
    }

    function isValid(address user) public view returns (bool) {
        return user != address(0) && expiryOf[user] >= block.timestamp;
    }

    function checkBorrowEligibility(address user) public view returns (bool) {
        return !isBlacklisted[user] && isValid(user);
    }

    function getCreditLimit(
        address user
    ) external view returns (uint256 limit, uint256 expiry) {
        return (limitOf[user], expiryOf[user]);
    }

    function verify(
        LimitUpdate calldata u,
        bytes calldata signature
    ) public view returns (bool) {
        bytes32 structHash = keccak256(
            abi.encode(
                _LIMIT_UPDATE_TYPEHASH,
                u.user,
                u.score,
                u.creditLimit,
                u.expiry,
                u.nonce
            )
        );

        bytes32 digest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                (
                    block.chainid == _CHAIN_ID
                        ? _DOMAIN_SEPARATOR
                        : keccak256(
                            abi.encode(
                                _EIP712_DOMAIN_TYPEHASH,
                                keccak256(bytes(_NAME)),
                                keccak256(bytes(_VERSION)),
                                block.chainid,
                                address(this)
                            )
                        )
                ),
                structHash
            )
        );

        address recovered = digest.recover(signature);
        return recovered == attester;
    }

    function updateLimit(
        LimitUpdate calldata u,
        bytes calldata signature
    ) external {
        if (u.user == address(0)) revert ZeroUser();
        if (u.expiry < block.timestamp) revert ExpiredAttestation();
        if (u.nonce != currentNonce[u.user]) revert NonceMismatch();
        if (!verify(u, signature)) revert InvalidSignature();

        scoreOf[u.user] = u.score;
        limitOf[u.user] = u.creditLimit;
        expiryOf[u.user] = u.expiry;

        currentNonce[u.user] = u.nonce + 1;

        emit LimitUpdated(u.user, u.score, u.creditLimit, u.expiry, u.nonce);
    }
}
