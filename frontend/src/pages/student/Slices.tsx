import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { StudentLayout } from "@/components/layouts/StudentLayout";
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight,
  Wallet,
  TrendingUp,
  CreditCard,
  Plus,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import studentService from "@/services/student.service";
import blockchainService from "@/services/blockchain.service";
import { useToast } from "@/hooks/use-toast";
import { formatUSDT } from "@/utils/currency";
import type { Transaction, StudentDashboard } from "@/types/api.types";

interface PaymentSlice {
  id: number;
  sliceNumber: number;
  amount: number;
  dueDate: string;
  status: 'upcoming' | 'due' | 'paid' | 'overdue';
  paidDate?: string;
  principal: number;
  interest: number;
}

export default function Slices() {
  const [dashboardData, setDashboardData] = useState<StudentDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBorrowing, setIsBorrowing] = useState(false);
  const [isRepaying, setIsRepaying] = useState(false);
  const [borrowAmount, setBorrowAmount] = useState("");
  const [repayAmount, setRepayAmount] = useState("");
  const [showBorrowDialog, setShowBorrowDialog] = useState(false);
  const [showRepayDialog, setShowRepayDialog] = useState(false);
  const [paymentSlices, setPaymentSlices] = useState<PaymentSlice[]>([]);
  const [numberOfSlices, setNumberOfSlices] = useState("10");
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Generate payment slices when borrowing data changes
    if (dashboardData) {
      generatePaymentSlices();
    }
  }, [dashboardData]);

  const generatePaymentSlices = () => {
    if (!dashboardData) return;

    const totalBorrowed = parseFloat(dashboardData.borrowing.totalBorrowed);
    if (totalBorrowed === 0) {
      setPaymentSlices([]);
      return;
    }

    const interestRate = dashboardData.credit.interestRate / 100;
    const sliceCount = 10; // Default 10 EMI slices
    const monthlyInterestRate = interestRate / 12;
    
    // Calculate EMI using reducing balance method
    const emi = (totalBorrowed * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, sliceCount)) / 
                (Math.pow(1 + monthlyInterestRate, sliceCount) - 1);

    const slices: PaymentSlice[] = [];
    let remainingPrincipal = totalBorrowed;
    const today = new Date();

    for (let i = 0; i < sliceCount; i++) {
      const dueDate = new Date(today);
      dueDate.setDate(today.getDate() + (i + 1) * 30); // 30 days apart

      const interestForSlice = remainingPrincipal * monthlyInterestRate;
      const principalForSlice = emi - interestForSlice;
      remainingPrincipal -= principalForSlice;

      const daysDiff = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      let status: 'upcoming' | 'due' | 'paid' | 'overdue' = 'upcoming';
      if (daysDiff < 0) {
        status = 'overdue';
      } else if (daysDiff <= 7) {
        status = 'due';
      }

      slices.push({
        id: i + 1,
        sliceNumber: i + 1,
        amount: emi,
        dueDate: dueDate.toISOString(),
        status: status,
        principal: principalForSlice,
        interest: interestForSlice,
      });
    }

    setPaymentSlices(slices);
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const data = await studentService.getDashboard();
      setDashboardData(data);
    } catch (err: any) {
      console.error("Failed to fetch data:", err);
      toast({
        title: "Error",
        description: "Failed to load borrowing data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBorrow = async () => {
    if (!borrowAmount || parseFloat(borrowAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to borrow",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(borrowAmount);
    const availableCredit = dashboardData ? parseFloat(dashboardData.credit.available) : 0;

    if (amount > availableCredit) {
      toast({
        title: "Insufficient Credit",
        description: `You can only borrow up to ${formatUSDT(availableCredit)}`,
        variant: "destructive",
      });
      return;
    }

    try {
      setIsBorrowing(true);
      
      // Connect wallet if not connected and get address
      let walletAddress = localStorage.getItem('wallet_address');
      if (!walletAddress) {
        const { address } = await blockchainService.connectWallet();
        walletAddress = address;
        localStorage.setItem('wallet_address', address);
      }

      if (!walletAddress) {
        throw new Error('Failed to get wallet address. Please connect your wallet.');
      }

      // Check if credit is valid on-chain
      const creditCheck = await blockchainService.checkCreditValidity(walletAddress);
      
      if (!creditCheck.isValid) {
        // Credit not registered on-chain, register it now
        toast({
          title: "Registering Credit On-Chain",
          description: "Please wait while we register your credit limit on the blockchain...",
        });

        try {
          const attestationData = await studentService.getAttestationData();
          const registerResult = await blockchainService.registerCreditOnChain(attestationData);
          
          toast({
            title: "Credit Registered",
            description: `Credit limit registered on-chain! TX: ${registerResult.txHash.slice(0, 10)}... Now processing borrow...`,
          });

          // Wait a bit for the transaction to be confirmed
          await new Promise(resolve => setTimeout(resolve, 3000));
        } catch (registerErr: any) {
          throw new Error(`Failed to register credit on-chain: ${registerErr.message}`);
        }
      }

      // Now borrow
      const result = await blockchainService.borrowFunds(amount.toString());
      
      toast({
        title: "Borrow Successful",
        description: `Successfully borrowed ${formatUSDT(amount)}. Transaction: ${result.txHash.slice(0, 10)}...`,
      });
      
      setShowBorrowDialog(false);
      setBorrowAmount("");
      
      // Refresh data after borrowing
      setTimeout(fetchData, 2000);
    } catch (err: any) {
      toast({
        title: "Borrowing Failed",
        description: err.message || "Failed to process borrowing request. Make sure your wallet is connected.",
        variant: "destructive",
      });
    } finally {
      setIsBorrowing(false);
    }
  };

  const handleRepay = async () => {
    if (!repayAmount || parseFloat(repayAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to repay",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(repayAmount);
    const totalBorrowed = dashboardData ? parseFloat(dashboardData.borrowing.totalBorrowed) : 0;

    if (amount > totalBorrowed) {
      toast({
        title: "Amount Too High",
        description: `Your total debt is only ${formatUSDT(totalBorrowed)}`,
        variant: "destructive",
      });
      return;
    }

    try {
      setIsRepaying(true);
      
      // Connect wallet if not connected
      const walletAddress = localStorage.getItem('wallet_address');
      if (!walletAddress) {
        await blockchainService.connectWallet();
      }

      // Call smart contract repay function (includes USDT approval)
      const result = await blockchainService.repayLoan(amount.toString());
      
      toast({
        title: "Repayment Successful",
        description: `Successfully repaid ${formatUSDT(amount)}. Transaction: ${result.txHash.slice(0, 10)}...`,
      });
      
      setShowRepayDialog(false);
      setRepayAmount("");
      
      // Refresh data after repayment
      setTimeout(fetchData, 2000);
    } catch (err: any) {
      toast({
        title: "Repayment Failed",
        description: err.message || "Failed to process repayment. Make sure you have enough USDT and your wallet is connected.",
        variant: "destructive",
      });
    } finally {
      setIsRepaying(false);
    }
  };

  const handlePaySlice = async (slice: PaymentSlice) => {
    try {
      // Connect wallet if not connected
      const walletAddress = localStorage.getItem('wallet_address');
      if (!walletAddress) {
        await blockchainService.connectWallet();
      }

      // Call smart contract repay function with slice amount (includes USDT approval)
      const result = await blockchainService.paySlice(slice.amount.toString());
      
      toast({
        title: "Slice Payment Successful",
        description: `Successfully paid Slice #${slice.sliceNumber} - ${formatUSDT(slice.amount)}. TX: ${result.txHash.slice(0, 10)}...`,
      });
      
      // Update slice status to paid (local state)
      setPaymentSlices(prev => 
        prev.map(s => 
          s.id === slice.id 
            ? { ...s, status: 'paid' as const, paidDate: new Date().toISOString() }
            : s
        )
      );

      // Refresh dashboard data
      setTimeout(fetchData, 2000);
    } catch (err: any) {
      toast({
        title: "Payment Failed",
        description: err.message || "Failed to process slice payment. Make sure you have enough USDT and your wallet is connected.",
        variant: "destructive",
      });
    }
  };

  const getSliceStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-credora-emerald/10 border-credora-emerald/30 text-credora-emerald';
      case 'due':
        return 'bg-credora-amber/10 border-credora-amber/30 text-credora-amber';
      case 'overdue':
        return 'bg-red-50 border-red-300 text-red-600';
      default:
        return 'bg-secondary/30 border-border text-muted-foreground';
    }
  };

  const getSliceStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-5 h-5" />;
      case 'due':
        return <Clock className="w-5 h-5" />;
      case 'overdue':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Calendar className="w-5 h-5" />;
    }
  };

  if (isLoading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading borrowing data...</p>
          </div>
        </div>
      </StudentLayout>
    );
  }

  if (!dashboardData) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-semibold mb-2">No Data Available</p>
            <p className="text-muted-foreground mb-4">Complete your profile to access borrowing features</p>
            <Button onClick={fetchData}>Retry</Button>
          </div>
        </div>
      </StudentLayout>
    );
  }

  const { credit, borrowing, recentTransactions = [] } = dashboardData;
  const availableCredit = parseFloat(credit.available);
  const totalBorrowed = parseFloat(borrowing.totalBorrowed);
  const nextPayment = parseFloat(borrowing.nextPaymentAmount);

  const borrowTransactions = recentTransactions.filter(t => t.type === 'borrow');
  const repayTransactions = recentTransactions.filter(t => t.type === 'repay');

  return (
    <StudentLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Borrowing & Payments</h1>
            <p className="text-muted-foreground">Manage your loans and track payments</p>
          </div>
          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-credora-emerald to-credora-emerald/80 rounded-2xl p-6 text-white"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-white/80">Available Credit</p>
              <Wallet className="h-5 w-5 text-white/80" />
            </div>
            <p className="text-3xl font-bold">{formatUSDT(availableCredit)}</p>
            <p className="text-xs text-white/70 mt-1">Ready to borrow</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-2xl border border-border p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Total Borrowed</p>
              <ArrowUpRight className="h-5 w-5 text-credora-amber" />
            </div>
            <p className="text-3xl font-bold">{formatUSDT(totalBorrowed)}</p>
            <p className="text-xs text-muted-foreground mt-1">Outstanding balance</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-2xl border border-border p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Next Payment</p>
              <Clock className="h-5 w-5 text-credora-blue" />
            </div>
            <p className="text-3xl font-bold">{nextPayment > 0 ? formatUSDT(nextPayment) : 'N/A'}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {nextPayment > 0 ? new Date(borrowing.nextPaymentDue).toLocaleDateString() : 'No payment due'}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card rounded-2xl border border-border p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Interest Rate</p>
              <TrendingUp className="h-5 w-5 text-credora-purple" />
            </div>
            <p className="text-3xl font-bold">{credit.interestRate.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground mt-1">Per annum</p>
          </motion.div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Dialog open={showBorrowDialog} onOpenChange={setShowBorrowDialog}>
            <DialogTrigger asChild>
              <Button size="lg" className="flex-1" disabled={availableCredit === 0}>
                <Plus className="mr-2 h-5 w-5" />
                Borrow Funds
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Borrow Funds</DialogTitle>
                <DialogDescription>
                  Enter the amount you want to borrow. Available credit: {formatUSDT(availableCredit)}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="borrow-amount">Amount (USDT)</Label>
                  <Input
                    id="borrow-amount"
                    type="number"
                    placeholder="0.00"
                    value={borrowAmount}
                    onChange={(e) => setBorrowAmount(e.target.value)}
                    max={availableCredit}
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum: {formatUSDT(availableCredit)}
                  </p>
                </div>
                <div className="bg-secondary/30 rounded-xl p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Interest Rate:</span>
                    <span className="font-medium">{credit.interestRate.toFixed(1)}% p.a.</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monthly Interest:</span>
                    <span className="font-medium">
                      {borrowAmount ? formatUSDT((parseFloat(borrowAmount) * credit.interestRate / 100 / 12)) : '$0'}
                    </span>
                  </div>
                </div>
                <Button 
                  onClick={handleBorrow} 
                  disabled={isBorrowing || !borrowAmount} 
                  className="w-full"
                >
                  {isBorrowing ? 'Processing...' : 'Confirm Borrow'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showRepayDialog} onOpenChange={setShowRepayDialog}>
            <DialogTrigger asChild>
              <Button size="lg" variant="outline" className="flex-1" disabled={totalBorrowed === 0}>
                <DollarSign className="mr-2 h-5 w-5" />
                Make Payment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Make Payment</DialogTitle>
                <DialogDescription>
                  Enter the amount you want to repay. Outstanding debt: {formatUSDT(totalBorrowed)}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="repay-amount">Amount (USDT)</Label>
                  <Input
                    id="repay-amount"
                    type="number"
                    placeholder="0.00"
                    value={repayAmount}
                    onChange={(e) => setRepayAmount(e.target.value)}
                    max={totalBorrowed}
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum: {formatUSDT(totalBorrowed)}
                  </p>
                </div>
                <div className="bg-secondary/30 rounded-xl p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Principal:</span>
                    <span className="font-medium">{formatUSDT(parseFloat(borrowing.principal))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Interest:</span>
                    <span className="font-medium">{formatUSDT(parseFloat(borrowing.interest))}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-semibold">Remaining after payment:</span>
                    <span className="font-semibold">
                      {repayAmount ? formatUSDT(Math.max(0, totalBorrowed - parseFloat(repayAmount))) : formatUSDT(totalBorrowed)}
                    </span>
                  </div>
                </div>
                <Button 
                  onClick={handleRepay} 
                  disabled={isRepaying || !repayAmount} 
                  className="w-full"
                >
                  {isRepaying ? 'Processing...' : 'Confirm Payment'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Payment Slices Schedule */}
        {paymentSlices.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card rounded-2xl border border-border p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-lg">Payment Schedule (10 Monthly Slices)</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {paymentSlices.filter(s => s.status === 'paid').length}/{paymentSlices.length} slices completed
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-credora-emerald transition-all duration-300"
                      style={{ 
                        width: `${(paymentSlices.filter(s => s.status === 'paid').length / paymentSlices.length) * 100}%` 
                      }}
                    />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    {Math.round((paymentSlices.filter(s => s.status === 'paid').length / paymentSlices.length) * 100)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paymentSlices
                .sort((a, b) => {
                  // Sort: overdue → due → upcoming → paid
                  const statusOrder = { overdue: 0, due: 1, upcoming: 2, paid: 3 };
                  return statusOrder[a.status] - statusOrder[b.status];
                })
                .map((slice) => (
                  <motion.div
                    key={slice.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={cn(
                      "p-5 rounded-xl border-2 transition-all",
                      getSliceStatusColor(slice.status),
                      slice.status === 'overdue' && "shadow-lg shadow-red-500/10",
                      slice.status === 'due' && "shadow-lg shadow-credora-amber/10"
                    )}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {getSliceStatusIcon(slice.status)}
                        <div>
                          <p className="font-semibold">Slice #{slice.sliceNumber}</p>
                          <p className="text-xs opacity-75 mt-0.5">
                            Due: {new Date(slice.dueDate).toLocaleDateString()}
                          </p>
                          {slice.status === 'paid' && slice.paidDate && (
                            <p className="text-xs opacity-75">
                              Paid: {new Date(slice.paidDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge 
                        variant={slice.status === 'paid' ? 'default' : 'secondary'}
                        className={cn(
                          "capitalize",
                          slice.status === 'paid' && "bg-credora-emerald text-white",
                          slice.status === 'due' && "bg-credora-amber text-white",
                          slice.status === 'overdue' && "bg-red-500 text-white"
                        )}
                      >
                        {slice.status}
                      </Badge>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="opacity-75">Total Amount:</span>
                        <span className="font-bold text-lg">{formatUSDT(slice.amount)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="opacity-75">Principal:</span>
                        <span className="font-medium">{formatUSDT(slice.principal)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="opacity-75">Interest:</span>
                        <span className="font-medium">{formatUSDT(slice.interest)}</span>
                      </div>
                    </div>

                    {slice.status !== 'paid' && (
                      <Button
                        size="sm"
                        className={cn(
                          "w-full",
                          slice.status === 'overdue' && "bg-red-500 hover:bg-red-600",
                          slice.status === 'due' && "bg-credora-amber hover:bg-credora-amber/90"
                        )}
                        onClick={() => handlePaySlice(slice)}
                      >
                        {slice.status === 'overdue' ? '⚠️ Pay Overdue' : 
                         slice.status === 'due' ? '⏰ Pay Now' : 
                         'Pay This Slice'}
                      </Button>
                    )}

                    {slice.status === 'paid' && (
                      <div className="flex items-center justify-center gap-2 py-2 bg-credora-emerald/10 rounded-lg">
                        <CheckCircle className="w-4 h-4 text-credora-emerald" />
                        <span className="text-sm font-medium text-credora-emerald">Paid</span>
                      </div>
                    )}
                  </motion.div>
                ))}
            </div>
          </motion.div>
        )}

        {/* Transaction History with Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-card rounded-2xl border border-border p-6"
        >
          <Tabs defaultValue="all" className="w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-lg">Transaction History</h3>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="borrows">Borrows</TabsTrigger>
                <TabsTrigger value="payments">Payments</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="all" className="space-y-4">
              {recentTransactions.length > 0 ? (
                recentTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-xl border",
                      tx.type === 'borrow' 
                        ? "bg-credora-amber/5 border-credora-amber/30" 
                        : "bg-credora-emerald/5 border-credora-emerald/30"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center",
                        tx.type === 'borrow' 
                          ? "bg-credora-amber/20" 
                          : "bg-credora-emerald/20"
                      )}>
                        {tx.type === 'borrow' ? (
                          <ArrowUpRight className="w-6 h-6 text-credora-amber" />
                        ) : (
                          <ArrowDownRight className="w-6 h-6 text-credora-emerald" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold">
                          {tx.type === 'borrow' ? 'Borrowed' : 'Repayment'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(tx.timestamp).toLocaleString()}
                        </p>
                        {tx.txHash && (
                          <p className="text-xs text-muted-foreground mt-1">
                            TX: {tx.txHash.slice(0, 10)}...{tx.txHash.slice(-8)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        "text-2xl font-bold",
                        tx.type === 'borrow' ? "text-credora-amber" : "text-credora-emerald"
                      )}>
                        {tx.type === 'borrow' ? '+' : '-'}{formatUSDT(parseFloat(tx.amount))}
                      </p>
                      <Badge variant={tx.status === 'completed' ? 'default' : 'secondary'} className="mt-1">
                        {tx.status}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <CreditCard className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-sm text-muted-foreground">No transactions yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Start borrowing to see your transaction history
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="borrows" className="space-y-4">
              {borrowTransactions.length > 0 ? (
                borrowTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-credora-amber/5 border border-credora-amber/30"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-credora-amber/20 flex items-center justify-center">
                        <ArrowUpRight className="w-6 h-6 text-credora-amber" />
                      </div>
                      <div>
                        <p className="font-semibold">Borrowed Funds</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(tx.timestamp).toLocaleString()}
                        </p>
                        {tx.txHash && (
                          <p className="text-xs text-muted-foreground mt-1">
                            TX: {tx.txHash.slice(0, 10)}...{tx.txHash.slice(-8)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-credora-amber">
                        +{formatUSDT(parseFloat(tx.amount))}
                      </p>
                      <Badge variant="default" className="mt-1">{tx.status}</Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <Wallet className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-sm text-muted-foreground">No borrowing history</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Click "Borrow Funds" to get started
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="payments" className="space-y-4">
              {repayTransactions.length > 0 ? (
                repayTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-credora-emerald/5 border border-credora-emerald/30"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-credora-emerald/20 flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-credora-emerald" />
                      </div>
                      <div>
                        <p className="font-semibold">Payment Made</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(tx.timestamp).toLocaleString()}
                        </p>
                        {tx.txHash && (
                          <p className="text-xs text-muted-foreground mt-1">
                            TX: {tx.txHash.slice(0, 10)}...{tx.txHash.slice(-8)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-credora-emerald">
                        -{formatUSDT(parseFloat(tx.amount))}
                      </p>
                      <Badge variant="default" className="mt-1">{tx.status}</Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-sm text-muted-foreground">No payment history</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Make a payment to see your repayment history
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Borrowing Info */}
        {totalBorrowed > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-credora-blue/5 border border-credora-blue/20 rounded-2xl p-6"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-credora-blue flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold mb-2">Active Loan Details</h4>
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Principal Amount</p>
                    <p className="font-semibold">{formatUSDT(parseFloat(borrowing.principal))}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Accrued Interest</p>
                    <p className="font-semibold">{formatUSDT(parseFloat(borrowing.interest))}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Next Payment Due</p>
                    <p className="font-semibold">{new Date(borrowing.nextPaymentDue).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Payment Amount</p>
                    <p className="font-semibold">{formatUSDT(nextPayment)}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  Interest is calculated daily at {credit.interestRate.toFixed(1)}% per annum. Make payments on time to maintain your credit score.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </StudentLayout>
  );
}


