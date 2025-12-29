# Credora

## Overview

Credora is a decentralized finance (DeFi) protocol that provides **small, unsecured USDT loans to students** based on their **academic progress and educational achievements**, rather than traditional financial collateral.

The protocol is designed to:

* Enable students to access short-term credit for essential expenses (gadgets, accessories, study tools)
* Incentivize academic consistency and improvement
* Allow liquidity providers to earn yield by funding student loans
* Introduce a new reputation-based credit primitive to DeFi

Credora combines **on-chain lending mechanics** with **off-chain academic verification and scoring**, creating a trust-minimized but privacy-aware system.

---

## Core Concept

Traditional DeFi lending requires over-collateralization. Credora replaces financial collateral with **education-based reputation**.

Borrowing power is determined by:

* Academic performance
* Consistency over time
* Improvement trajectory
* Authenticity of submitted proofs

Higher academic progress ⇒ higher credit limit.

---

## Roles in the System

### 1. Student (Borrower)

* Connects wallet
* Submits academic information and proof documents
* Receives an education score
* Gets a USDT credit limit (buying power)
* Borrows and repays USDT

### 2. Depositor (Liquidity Provider)

* Deposits USDT into the lending pool
* Earns interest from borrower repayments
* Can simultaneously act as a borrower using the same wallet

### 3. Admin (Protocol Governor)

* Manages protocol parameters (rates, caps, limits)
* Monitors system health and defaults
* Has no manual control over individual loan approvals
* Uses multisig and timelocks for security

---

## System Architecture

### High-Level Architecture

```
┌────────────┐      ┌──────────────────┐      ┌──────────────┐
│  Frontend  │ ───▶ │ Backend / Oracle │ ───▶ │ Smart        │
│  (Next.js) │      │ (Scoring Engine) │      │ Contracts    │
└────────────┘      └──────────────────┘      └──────────────┘
        ▲                    │                         │
        │                    ▼                         ▼
        │            Encrypted Database          USDT Pool
        │            (Docs + Scores)            Borrow / Repay
        └───────────────────────────────────────────────────
```

---

## Smart Contract Layer (On-chain)

### 1. USDT Vault (Liquidity Pool)

* Accepts USDT deposits
* Issues pool shares (ERC-4626 style)
* Distributes interest to depositors

### 2. Loan Manager

* Handles borrow and repay logic
* Tracks outstanding debt per user
* Applies interest over time
* Enforces credit limits

### 3. Credit Limit Registry

* Stores:

  * Education score
  * Credit limit
  * Expiry timestamp
* Accepts only **signed attestations** from trusted scoring service

### 4. Reserve / Insurance Fund

* Funded via interest spread and protocol fees
* Absorbs losses from defaults
* Protects depositors from full loss exposure

---

## Off-Chain Scoring & Verification

### Academic Data Collected

* GPA / CGPA
* Semester completion status
* Attendance metrics
* Improvement over time
* Internship / placement offers (optional)

### Verification

* Document authenticity checks
* Issuer validation (university / institute)
* Fraud and anomaly detection

### Score Generation

```
Score =
  45% Academic Performance
+ 25% Consistency
+ 20% Improvement Trajectory
+ 10% Verification Integrity
```

### Credit Limit Mapping

```
Credit Limit = Base Amount × f(Score) × Risk Multiplier
```

Limits increase gradually and expire if not refreshed.

---

## Data & Privacy Design

* Academic documents are **never stored on-chain**
* Documents are:

  * Encrypted
  * Stored off-chain (database or object storage)
  * Used only for scoring
* On-chain data contains only:

  * Score
  * Credit limit
  * Expiry
  * Attestation signature

This ensures privacy while maintaining verifiability.

---

## End-to-End Workflow

### Borrow Flow

```
Student → Submit Docs → Scoring Engine
        → Score + Credit Limit Generated
        → Signed Attestation
        → Smart Contract Verification
        → Credit Limit Updated
        → Borrow USDT
```

### Repayment Flow

```
Borrower → Repay USDT
         → Interest Distributed
         → Pool Balance Increases
```

### Default Flow

```
Loan Overdue → Grace Period
             → Mark Default
             → Reserve Fund Covers Loss
             → (If insufficient) Socialized Loss
```

---

## Risk Management

* Small initial credit limits
* Short loan tenures
* Gradual limit increase
* Reserve / insurance fund
* Optional guarantor or underwriter staking (future)
* Admin emergency pause

---

## Social Impact

### Positive Outcomes

* Financial inclusion for students without credit history
* Encourages academic discipline and long-term thinking
* Reduces dependency on informal or predatory lending
* Creates a new education-backed financial identity

### Broader Impact

* Bridges education and decentralized finance
* Introduces non-financial reputation into credit markets
* Can inspire similar models for skill-based or work-based credit

---

## Future Scope

* Zero-knowledge proofs for academic verification
* University-issued verifiable credentials
* Cross-chain deployment (L2s for low gas)
* Account abstraction and gasless UX
* Risk tranching for depositors
* DAO-based governance
* Expansion beyond students (skills, certifications, work history)

---

## Summary

Credora is a **reputation-backed DeFi credit protocol** that replaces collateral with **educational progress**. By aligning financial access with learning outcomes, Credora creates a system where studying harder directly improves economic opportunity, while maintaining DeFi transparency, composability, and decentralization.
