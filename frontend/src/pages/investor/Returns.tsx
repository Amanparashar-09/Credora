import { InvestorLayout } from "@/components/layouts/InvestorLayout";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle, XCircle, AlertCircle, TrendingUp, Wallet, DollarSign } from "lucide-react";
import { ethers } from "ethers";
import { CONTRACT_CONFIG } from "@/lib/constants";
import { useUser } from "@/lib/userContext";
import investorService from "@/services/investor.service";
import { formatUSDT } from "@/utils/currency";

// Import ABIs
import CredoraPoolABI from "@/abis/CredoraPool.json";

export default function Returns() {
  const { walletAddress } = useUser();
  
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [shares, setShares] = useState("0");
  const [withdrawableAmount, setWithdrawableAmount] = useState("0");
  const [totalReturns, setTotalReturns] = useState("0");
  const [totalDeposited, setTotalDeposited] = useState("0");
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<"idle" | "withdrawing" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [txHash, setTxHash] = useState("");

  useEffect(() => {
    fetchBalances();
    fetchReturns();
  }, [walletAddress]);

  const fetchBalances = async () => {
    if (!walletAddress) return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const poolContract = new ethers.Contract(
        CONTRACT_CONFIG.CREDORA_POOL,
        CredoraPoolABI,
        provider
      );

      const userShares = await poolContract.balanceOf(walletAddress);
      const withdrawable = await poolContract.previewWithdraw(userShares);

      setShares(ethers.formatUnits(userShares, 18));
      setWithdrawableAmount(ethers.formatUnits(withdrawable, 18));
    } catch (error) {
      console.error("Failed to fetch balances:", error);
    }
  };

  const fetchReturns = async () => {
    try {
      const data = await investorService.getReturns();
      setTotalReturns(data.totalReturns);
      setTotalDeposited(data.totalDeposited);
    } catch (error) {
      console.error("Failed to fetch returns:", error);
    }
  };

  const handleWithdraw = async () => {
    if (!walletAddress || !withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      setErrorMessage("Please enter a valid amount");
      return;
    }

    if (parseFloat(withdrawAmount) > parseFloat(withdrawableAmount)) {
      setErrorMessage("Insufficient withdrawable balance");
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage("");
      setCurrentStep("withdrawing");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const poolContract = new ethers.Contract(CONTRACT_CONFIG.CREDORA_POOL, CredoraPoolABI, signer);

      // Calculate shares to burn based on withdraw amount
      const totalShares = await poolContract.totalShares();
      const totalAssets = parseFloat(withdrawableAmount);
      const sharesToBurn = (parseFloat(withdrawAmount) / totalAssets) * parseFloat(shares);
      const sharesToBurnWei = ethers.parseUnits(sharesToBurn.toFixed(18), 18);

      // Withdraw
      const withdrawTx = await poolContract.withdraw(sharesToBurnWei);
      const receipt = await withdrawTx.wait();

      setTxHash(receipt.hash);

      // Record withdrawal in backend
      try {
        await investorService.recordWithdrawal(withdrawAmount, receipt.hash);
      } catch (error) {
        console.error('Failed to record withdrawal in backend:', error);
      }

      setCurrentStep("success");

      // Refresh balances
      await fetchBalances();
      await fetchReturns();

      // Reset form after 3 seconds
      setTimeout(() => {
        setWithdrawAmount("");
        setCurrentStep("idle");
        setTxHash("");
      }, 3000);
    } catch (error: any) {
      console.error("Withdrawal failed:", error);
      setCurrentStep("error");
      setErrorMessage(error.message || "Transaction failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMaxWithdraw = () => {
    setWithdrawAmount(withdrawableAmount);
  };

  const getStatusMessage = () => {
    switch (currentStep) {
      case "withdrawing":
        return { icon: Loader2, text: "Processing withdrawal...", color: "text-blue-500" };
      case "success":
        return { icon: CheckCircle, text: "Withdrawal successful!", color: "text-green-500" };
      case "error":
        return { icon: XCircle, text: "Withdrawal failed", color: "text-red-500" };
      default:
        return null;
    }
  };

  const statusMessage = getStatusMessage();
  const returnsAmount = parseFloat(withdrawableAmount) - parseFloat(totalDeposited);
  const returnPercentage = parseFloat(totalDeposited) > 0 
    ? ((returnsAmount / parseFloat(totalDeposited)) * 100).toFixed(2) 
    : "0";

  return (
    <InvestorLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Returns & Withdrawals</h2>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-3 gap-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="bg-card rounded-2xl border border-border p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-credora-emerald/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-credora-emerald" />
              </div>
              <p className="text-sm text-muted-foreground">Total Returns</p>
            </div>
            <p className="text-3xl font-bold text-credora-emerald">
              {returnsAmount >= 0 ? '+' : ''}{formatUSDT(returnsAmount)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {returnsAmount >= 0 ? '+' : ''}{returnPercentage}% return
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.1 }} 
            className="bg-card rounded-2xl border border-border p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-credora-blue/10 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-credora-blue" />
              </div>
              <p className="text-sm text-muted-foreground">Withdrawable</p>
            </div>
            <p className="text-3xl font-bold">{formatUSDT(parseFloat(withdrawableAmount))}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {shares} shares
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.2 }} 
            className="bg-card rounded-2xl border border-border p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-credora-purple/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-credora-purple" />
              </div>
              <p className="text-sm text-muted-foreground">Total Invested</p>
            </div>
            <p className="text-3xl font-bold">{formatUSDT(parseFloat(totalDeposited))}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Principal amount
            </p>
          </motion.div>
        </div>

        {/* Withdrawal Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-2xl border border-border p-6"
        >
          <h3 className="text-xl font-semibold mb-6">Withdraw Funds</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Withdrawal Amount (USDT)
              </label>
              <div className="relative">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="text-lg pr-20"
                  disabled={isLoading}
                />
                <button
                  onClick={handleMaxWithdraw}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-credora-blue hover:text-credora-blue/80"
                  disabled={isLoading}
                >
                  MAX
                </button>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Available: {formatUSDT(parseFloat(withdrawableAmount))}
              </p>
            </div>

            {/* Status Messages */}
            {statusMessage && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted">
                <statusMessage.icon className={`w-5 h-5 ${statusMessage.color} ${currentStep === "withdrawing" ? "animate-spin" : ""}`} />
                <span className={statusMessage.color}>{statusMessage.text}</span>
              </div>
            )}

            {errorMessage && currentStep !== "error" && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/10">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <span className="text-red-500">{errorMessage}</span>
              </div>
            )}

            {txHash && (
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground mb-1">Transaction Hash:</p>
                <a
                  href={`${CONTRACT_CONFIG.BLOCK_EXPLORER}/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-credora-blue hover:underline break-all"
                >
                  {txHash}
                </a>
              </div>
            )}

            <Button
              onClick={handleWithdraw}
              disabled={isLoading || !withdrawAmount || parseFloat(withdrawAmount) <= 0 || currentStep === "success"}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Withdraw Funds"
              )}
            </Button>

            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800 dark:text-amber-200">
                  <p className="font-medium mb-1">Important Information:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Withdrawals are processed immediately on-chain</li>
                    <li>You'll receive USDT directly to your wallet</li>
                    <li>Gas fees apply for blockchain transactions</li>
                    <li>Your shares will be burned proportionally</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Recent Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card rounded-2xl border border-border p-6"
        >
          <h3 className="text-xl font-semibold mb-4">Withdrawal History</h3>
          <div className="text-center py-8 text-muted-foreground">
            <Wallet className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No withdrawal history yet</p>
            <p className="text-sm mt-1">Your withdrawals will appear here</p>
          </div>
        </motion.div>
      </div>
    </InvestorLayout>
  );
}
