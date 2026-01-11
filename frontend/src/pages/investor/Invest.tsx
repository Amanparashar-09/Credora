import { InvestorLayout } from "@/components/layouts/InvestorLayout";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { CONTRACT_CONFIG } from "@/lib/constants";
import { useUser } from "@/lib/userContext";
import investorService from "@/services/investor.service";
import { useNavigate } from "react-router-dom";
import { Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";

// Import ABIs
import MockUSDTABI from "@/abis/MockUSDT.json";
import CredoraPoolABI from "@/abis/CredoraPool.json";

type RiskTier = "Low" | "Medium" | "High";
type LockInPeriod = "3 months" | "6 months" | "12 months";

export default function Invest() {
  const { walletAddress } = useUser();
  const navigate = useNavigate();
  
  const [amount, setAmount] = useState("");
  const [selectedRisk, setSelectedRisk] = useState<RiskTier>("Medium");
  const [selectedLockIn, setSelectedLockIn] = useState<LockInPeriod>("6 months");
  const [usdtBalance, setUsdtBalance] = useState("0");
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<"idle" | "approving" | "depositing" | "recording" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [txHash, setTxHash] = useState("");

  useEffect(() => {
    fetchUSDTBalance();
  }, [walletAddress]);

  const fetchUSDTBalance = async () => {
    if (!walletAddress) return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const usdtContract = new ethers.Contract(
        CONTRACT_CONFIG.MOCK_USDT,
        MockUSDTABI,
        provider
      );
      const balance = await usdtContract.balanceOf(walletAddress);
      setUsdtBalance(ethers.formatUnits(balance, 18));
    } catch (error) {
      console.error("Failed to fetch USDT balance:", error);
    }
  };

  const handleInvest = async () => {
    if (!walletAddress || !amount || parseFloat(amount) <= 0) {
      setErrorMessage("Please enter a valid amount");
      return;
    }

    if (parseFloat(amount) > parseFloat(usdtBalance)) {
      setErrorMessage("Insufficient USDT balance");
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage("");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Contracts
      const usdtContract = new ethers.Contract(CONTRACT_CONFIG.MOCK_USDT, MockUSDTABI, signer);
      const poolContract = new ethers.Contract(CONTRACT_CONFIG.CREDORA_POOL, CredoraPoolABI, signer);

      const amountWei = ethers.parseUnits(amount, 18);

      // Step 1: Approve USDT
      setCurrentStep("approving");
      const approveTx = await usdtContract.approve(CONTRACT_CONFIG.CREDORA_POOL, amountWei);
      await approveTx.wait();

      // Step 2: Deposit to pool
      setCurrentStep("depositing");
      const depositTx = await poolContract.deposit(amountWei);
      const receipt = await depositTx.wait();
      setTxHash(receipt.hash);

      // Step 3: Record in backend
      setCurrentStep("recording");
      await investorService.recordInvestment(amount, receipt.hash, selectedRisk, selectedLockIn);

      // Success
      setCurrentStep("success");
      await fetchUSDTBalance();

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate("/investor");
      }, 2000);
    } catch (error: any) {
      console.error("Investment failed:", error);
      setCurrentStep("error");
      setErrorMessage(error.message || "Transaction failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusMessage = () => {
    switch (currentStep) {
      case "approving":
        return "Approving USDT... Please confirm in MetaMask";
      case "depositing":
        return "Depositing to pool... Please confirm in MetaMask";
      case "recording":
        return "Recording transaction...";
      case "success":
        return "Investment successful! Redirecting...";
      case "error":
        return errorMessage;
      default:
        return "";
    }
  };

  const getStatusIcon = () => {
    switch (currentStep) {
      case "approving":
      case "depositing":
      case "recording":
        return <Loader2 className="w-5 h-5 animate-spin" />;
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "error":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const isFormDisabled = isLoading || currentStep === "success";

  return (
    <InvestorLayout>
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl border border-border p-8">
          <h2 className="text-2xl font-bold mb-6">Invest in Student Pool</h2>
          
          {/* USDT Balance Display */}
          <div className="mb-6 p-4 bg-muted/50 rounded-xl">
            <p className="text-sm text-muted-foreground mb-1">Your USDT Balance</p>
            <p className="text-2xl font-bold">{parseFloat(usdtBalance).toFixed(2)} USDT</p>
            {parseFloat(usdtBalance) === 0 && (
              <div className="mt-2 flex items-start gap-2 text-sm text-amber-600">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>You need USDT tokens to invest. You can mint test tokens from the MockUSDT contract.</span>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Investment Amount (USDT)</label>
              <input
                type="number"
                placeholder="10000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isFormDisabled}
                className="credora-input w-full rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Risk Tier</label>
              <div className="grid grid-cols-3 gap-3">
                {(["Low", "Medium", "High"] as RiskTier[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => setSelectedRisk(r)}
                    disabled={isFormDisabled}
                    className={`p-4 rounded-xl border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      selectedRisk === r
                        ? "border-credora-blue bg-credora-blue/10"
                        : "border-border hover:border-credora-blue"
                    }`}
                  >
                    <p className="font-medium">{r}</p>
                    <p className="text-xs text-muted-foreground">
                      {r === "Low" ? "8-9%" : r === "Medium" ? "10-11%" : "12-14%"} APY
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Lock-in Period</label>
              <div className="grid grid-cols-3 gap-3">
                {(["3 months", "6 months", "12 months"] as LockInPeriod[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setSelectedLockIn(p)}
                    disabled={isFormDisabled}
                    className={`p-3 rounded-xl border transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                      selectedLockIn === p
                        ? "border-credora-blue bg-credora-blue/10"
                        : "border-border hover:border-credora-blue"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Message */}
            {currentStep !== "idle" && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-xl flex items-center gap-3 ${
                  currentStep === "error"
                    ? "bg-red-50 text-red-700 border border-red-200"
                    : currentStep === "success"
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-blue-50 text-blue-700 border border-blue-200"
                }`}
              >
                {getStatusIcon()}
                <span className="text-sm">{getStatusMessage()}</span>
              </motion.div>
            )}

            {/* Transaction Hash */}
            {txHash && (
              <div className="text-xs text-muted-foreground">
                Transaction:{" "}
                <a
                  href={`${CONTRACT_CONFIG.BLOCK_EXPLORER}/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-credora-blue hover:underline"
                >
                  {txHash.slice(0, 10)}...{txHash.slice(-8)}
                </a>
              </div>
            )}

            <Button
              onClick={handleInvest}
              disabled={isFormDisabled || !amount || parseFloat(amount) <= 0}
              variant="investor"
              size="lg"
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Confirm Investment"
              )}
            </Button>
          </div>
        </motion.div>
      </div>
    </InvestorLayout>
  );
}
