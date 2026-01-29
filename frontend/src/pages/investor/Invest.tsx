import { InvestorLayout } from "@/components/layouts/InvestorLayout";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { CONTRACT_CONFIG } from "@/lib/constants";
import { useUser } from "@/lib/userContext";
import investorService from "@/services/investor.service";
import { useNavigate } from "react-router-dom";
import { Loader2, CheckCircle, XCircle, AlertCircle, TrendingUp, Calendar } from "lucide-react";

// Import ABIs
import MockUSDTABI from "@/abis/MockUSDT.json";
import CredoraPoolABI from "@/abis/CredoraPool.json";

export default function Invest() {
  const { walletAddress } = useUser();
  const navigate = useNavigate();
  
  const [amount, setAmount] = useState("");
  const [lockInMonths, setLockInMonths] = useState(6); // Default 6 months
  const [usdtBalance, setUsdtBalance] = useState("0");
  const [poolAPY, setPoolAPY] = useState(10.0); // Current pool APY
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<"idle" | "approving" | "depositing" | "recording" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [txHash, setTxHash] = useState("");

  useEffect(() => {
    fetchUSDTBalance();
    fetchPoolAPY();
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

  const fetchPoolAPY = async () => {
    try {
      const pools = await investorService.getPools();
      if (pools && pools.length > 0) {
        const apy = parseFloat(pools[0].apy);
        setPoolAPY(apy);
      }
    } catch (error) {
      console.error("Failed to fetch pool APY:", error);
    }
  };

  // Calculate estimated earnings based on amount, APY, and time period
  const calculateEstimatedEarnings = () => {
    const amountNum = parseFloat(amount) || 0;
    const years = lockInMonths / 12;
    const earnings = amountNum * (poolAPY / 100) * years;
    return earnings;
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
      await investorService.recordInvestment(amount, receipt.hash, lockInMonths);

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
  const estimatedEarnings = calculateEstimatedEarnings();
  const estimatedTotal = (parseFloat(amount) || 0) + estimatedEarnings;

  return (
    <InvestorLayout>
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl border border-border p-8">
          <h2 className="text-2xl font-bold mb-6">Invest in Credora Pool</h2>
          
          {/* Current Pool Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-gradient-to-br from-credora-blue/10 to-credora-blue/5 rounded-xl border border-credora-blue/20">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-credora-blue" />
                <p className="text-sm text-muted-foreground">Current Pool APY</p>
              </div>
              <p className="text-2xl font-bold text-credora-blue">{poolAPY.toFixed(2)}%</p>
              <p className="text-xs text-muted-foreground mt-1">After 8% reserve fee</p>
            </div>
            
            <div className="p-4 bg-muted/50 rounded-xl">
              <p className="text-sm text-muted-foreground mb-1">Your USDT Balance</p>
              <p className="text-2xl font-bold">{parseFloat(usdtBalance).toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-1">Available to invest</p>
            </div>
          </div>

          {parseFloat(usdtBalance) === 0 && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-amber-800">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium mb-1">No USDT Balance</p>
                <p>You need USDT tokens to invest. You can mint test tokens from the MockUSDT contract.</p>
              </div>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Investment Amount (USDT)</label>
              <input
                type="number"
                placeholder="10000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isFormDisabled}
                className="credora-input w-full rounded-xl disabled:opacity-50 disabled:cursor-not-allowed text-lg px-4 py-3"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-credora-blue" />
                  Investment Period
                </label>
                <span className="text-sm font-bold text-credora-blue">{lockInMonths} months</span>
              </div>
              
              {/* Slider */}
              <input
                type="range"
                min="3"
                max="60"
                step="3"
                value={lockInMonths}
                onChange={(e) => setLockInMonths(parseInt(e.target.value))}
                disabled={isFormDisabled}
                className="w-full h-2 bg-gradient-to-r from-credora-blue/20 to-credora-blue/40 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed slider-thumb"
                style={{
                  background: `linear-gradient(to right, #1e40af 0%, #1e40af ${((lockInMonths - 3) / 57) * 100}%, #e5e7eb ${((lockInMonths - 3) / 57) * 100}%, #e5e7eb 100%)`
                }}
              />
              
              {/* Time markers */}
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>3M</span>
                <span>1Y</span>
                <span>2Y</span>
                <span>3Y</span>
                <span>5Y</span>
              </div>
              
              <p className="text-xs text-muted-foreground mt-3">
                Note: Lock-in period is informational only. You can withdraw anytime from the smart contract.
              </p>
            </div>

            {/* Estimated Earnings Display */}
            {amount && parseFloat(amount) > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl"
              >
                <p className="text-sm font-medium text-green-800 mb-3">Estimated Returns</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-green-700 mb-1">Total Earnings</p>
                    <p className="text-2xl font-bold text-green-900">${estimatedEarnings.toFixed(2)}</p>
                    <p className="text-xs text-green-600 mt-1">Over {lockInMonths} months @ {poolAPY.toFixed(2)}% APY</p>
                  </div>
                  <div>
                    <p className="text-xs text-green-700 mb-1">Total Value</p>
                    <p className="text-2xl font-bold text-green-900">${estimatedTotal.toFixed(2)}</p>
                    <p className="text-xs text-green-600 mt-1">Principal + Interest</p>
                  </div>
                </div>
              </motion.div>
            )}

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
