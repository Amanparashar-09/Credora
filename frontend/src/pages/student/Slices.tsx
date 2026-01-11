import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { StudentLayout } from "@/components/layouts/StudentLayout";
import { Calendar, Clock, CheckCircle, AlertCircle, Plus, X, Edit, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import studentService from "@/services/student.service";
import blockchainService from "@/services/blockchain.service";
import { useToast } from "@/hooks/use-toast";
import { formatUSDT } from "@/utils/currency";
import type { Transaction } from "@/types/api.types";

interface Slice {
  id: number;
  amount: number;
  dueDate: string;
  status: "upcoming" | "pending" | "paid";
  daysLeft?: number;
  principal: number;
  interest: number;
  paidOn?: string;
}

export default function Slices() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [borrowingStatus, setBorrowingStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [borrowingData, history] = await Promise.all([
          studentService.getBorrowingStatus(),
          studentService.getBorrowingHistory(),
        ]);
        setBorrowingStatus(borrowingData);
        setTransactions(history || []); // Add default empty array
      } catch (err: any) {
        console.error("Failed to fetch slices data:", err);
        toast({
          title: "Error",
          description: "Failed to load payment slices",
          variant: "destructive",
        });
        setTransactions([]); // Set to empty array on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading payment slices...</p>
          </div>
        </div>
      </StudentLayout>
    );
  }

  const upcomingSlices = transactions.filter((t) => t.type === "borrow" && t.status === "completed");
  const paidSlices = transactions.filter((t) => t.type === "repay" && t.status === "completed");
  const totalOutstanding = borrowingStatus ? parseFloat(borrowingStatus.totalBorrowed) : 0;

  return (
    <StudentLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Summary */}
        <div className="grid sm:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl border border-border p-6"
          >
            <p className="text-sm text-muted-foreground mb-1">Total Borrowed</p>
            <p className="text-2xl font-bold">{formatUSDT(totalOutstanding)}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-2xl border border-border p-6"
          >
            <p className="text-sm text-muted-foreground mb-1">Next Payment</p>
            <p className="text-2xl font-bold">
              {borrowingStatus ? formatUSDT(parseFloat(borrowingStatus.nextPaymentAmount)) : "$0"}
            </p>
            <p className="text-xs text-muted-foreground">
              {borrowingStatus ? new Date(borrowingStatus.nextPaymentDue).toLocaleDateString() : "No payment due"}
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-2xl border border-border p-6"
          >
            <p className="text-sm text-muted-foreground mb-1">Repayments Made</p>
            <p className="text-2xl font-bold">{paidSlices.length}</p>
            <p className="text-xs text-credora-emerald">All on time</p>
          </motion.div>
        </div>

        {/* Active Borrowings */}
        {upcomingSlices.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card rounded-2xl border border-border p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-lg">Active Borrowings</h3>
            </div>

            <div className="space-y-4">
              {upcomingSlices.map((tx, index) => (
                <div
                  key={tx.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-credora-amber/30 bg-credora-amber/5"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-credora-amber/20 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-6 h-6 text-credora-amber" />
                    </div>
                    <div>
                      <p className="font-semibold">Borrowed Amount</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(tx.timestamp).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        TX: {tx.txHash.slice(0, 10)}...{tx.txHash.slice(-8)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right mt-4 sm:mt-0">
                    <p className="text-2xl font-bold text-credora-amber">{formatUSDT(parseFloat(tx.amount))}</p>
                    <p className="text-sm text-muted-foreground">
                      Status: <span className="text-emerald-500">{tx.status}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Payment History */}
        {paidSlices.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card rounded-2xl border border-border p-6"
          >
            <h3 className="font-semibold text-lg mb-6">Payment History</h3>
            <div className="space-y-4">
              {paidSlices.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-credora-emerald/10 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-credora-emerald" />
                    </div>
                    <div>
                      <p className="font-medium">Repayment</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(tx.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <p className="font-semibold text-credora-emerald">
                    -{formatUSDT(parseFloat(tx.amount))}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </StudentLayout>
  );
}


