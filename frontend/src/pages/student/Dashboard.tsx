import { motion } from "framer-motion";
import { StatCard } from "@/components/StatCard";
import { StudentLayout } from "@/components/layouts/StudentLayout";
import {
  CreditCard,
  TrendingUp,
  Award,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import studentService from "@/services/student.service";
import { formatUSDT } from "@/utils/currency";
import type { StudentDashboard as DashboardData } from "@/types/api.types";
import { cn } from "@/lib/utils";

export default function StudentDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setIsLoading(true);
        const data = await studentService.getDashboard();
        setDashboardData(data);
      } catch (err: any) {
        console.error("Failed to fetch dashboard:", err);
        setError(err.message || "Failed to load dashboard");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (isLoading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </StudentLayout>
    );
  }

  if (error || !dashboardData) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error || "Failed to load dashboard"}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </div>
      </StudentLayout>
    );
  }

  const { 
    profile,
    credit, 
    borrowing, 
    recentTransactions = [], 
    badges = [] 
  } = dashboardData;

  return (
    <StudentLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Credit Overview Card - Main focus */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-primary to-credora-slate rounded-2xl p-8 text-primary-foreground"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <p className="text-primary-foreground/70">Available Credit</p>
                {profile?.name && (
                  <span className="text-sm bg-primary-foreground/10 px-3 py-1 rounded-full">
                    {profile.name}
                  </span>
                )}
              </div>
              <h2 className="text-4xl lg:text-5xl font-bold mb-4">{formatUSDT(parseFloat(credit.available))}</h2>
              <div className="flex items-center gap-6 flex-wrap">
                <div className="text-sm">
                  <span className="text-primary-foreground/70">Total Limit: </span>
                  <span className="font-medium">{formatUSDT(parseFloat(credit.limit))}</span>
                </div>
                <div className="text-sm">
                  <span className="text-primary-foreground/70">Used: </span>
                  <span className="font-medium">{formatUSDT(parseFloat(credit.used))}</span>
                </div>
                <div className="text-sm">
                  <span className="text-primary-foreground/70">Credit Score: </span>
                  <span className="font-bold text-credora-emerald">{credit.score}</span>
                  <span className="text-primary-foreground/60 ml-1">/ 900</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/student/slices">
                <Button variant="hero" size="lg">
                  Borrow Funds
                </Button>
              </Link>
              <Link to="/student/slices">
                <Button variant="hero-outline" size="lg" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                  Make Payment
                </Button>
              </Link>
            </div>
          </div>
          {/* Progress Bar */}
          <div className="mt-8">
            <div className="flex justify-between text-xs text-primary-foreground/70 mb-2">
              <span>Credit Utilization</span>
              <span>{((parseFloat(credit.used) / parseFloat(credit.limit || '1')) * 100).toFixed(1)}%</span>
            </div>
            <div className="h-3 bg-primary-foreground/20 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((parseFloat(credit.used) / parseFloat(credit.limit || '1')) * 100, 100)}%` }}
                transition={{ duration: 1, delay: 0.5 }}
                className={cn(
                  "h-full rounded-full",
                  (parseFloat(credit.used) / parseFloat(credit.limit || '1')) < 0.3 ? "bg-credora-emerald" :
                  (parseFloat(credit.used) / parseFloat(credit.limit || '1')) < 0.7 ? "bg-credora-amber" : "bg-red-500"
                )}
              />
            </div>
            <p className="text-xs text-primary-foreground/60 mt-2">
              {parseFloat(credit.limit) === 0 
                ? "Complete your profile to get a credit limit"
                : (parseFloat(credit.used) / parseFloat(credit.limit)) < 0.3 
                ? "Excellent credit utilization" 
                : (parseFloat(credit.used) / parseFloat(credit.limit)) < 0.7
                ? "Good credit utilization"
                : "High utilization - consider making a payment"}
            </p>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Credit Score"
            value={credit.score.toString()}
            subValue={`Grade: ${credit.grade}`}
            icon={Award}
            trend={credit.score >= 700 ? { value: 12, isPositive: true } : undefined}
            variant="emerald"
          />
          <StatCard
            label="Outstanding Balance"
            value={formatUSDT(parseFloat(borrowing.totalBorrowed))}
            subValue={parseFloat(borrowing.totalBorrowed) > 0 ? `Principal: ${formatUSDT(parseFloat(borrowing.principal))}` : 'No active loans'}
            icon={CreditCard}
            variant="amber"
          />
          <StatCard
            label="Next Payment Due"
            value={parseFloat(borrowing.nextPaymentAmount) > 0 ? formatUSDT(parseFloat(borrowing.nextPaymentAmount)) : 'N/A'}
            subValue={parseFloat(borrowing.nextPaymentAmount) > 0 ? new Date(borrowing.nextPaymentDue).toLocaleDateString() : 'No pending payments'}
            icon={Clock}
            variant="blue"
          />
          <StatCard
            label="Interest Rate"
            value={`${credit.interestRate.toFixed(1)}%`}
            subValue="per annum"
            icon={TrendingUp}
            variant="purple"
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Transactions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 bg-card rounded-2xl border border-border p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-lg">Recent Transactions</h3>
              <Link
                to="/student/slices"
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                View All <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-4">
              {recentTransactions.length > 0 ? (
                recentTransactions.slice(0, 4).map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between py-3 border-b border-border last:border-0"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center",
                          tx.type === "borrow"
                            ? "bg-credora-amber/10"
                            : "bg-credora-emerald/10"
                        )}
                      >
                        {tx.type === "borrow" ? (
                          <ArrowUpRight className="w-5 h-5 text-credora-amber" />
                        ) : (
                          <ArrowDownRight className="w-5 h-5 text-credora-emerald" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{tx.type === "borrow" ? "Borrowed" : "Repaid"}</p>
                        <p className="text-xs text-muted-foreground">{new Date(tx.timestamp).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <p
                      className={cn(
                        "font-semibold",
                        tx.type === "borrow" ? "text-credora-amber" : "text-credora-emerald"
                      )}
                    >
                      {tx.type === "borrow" ? "+" : "-"}{formatUSDT(parseFloat(tx.amount))}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <CreditCard className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-sm text-muted-foreground">No transactions yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Start borrowing to see your transaction history</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Reputation Badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card rounded-2xl border border-border p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-lg">Reputation Badges</h3>
              <Link
                to="/student/reputation"
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                View All <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {badges.map((badge) => (
                <div
                  key={badge.name}
                  className={cn(
                    "p-4 rounded-xl text-center transition-all",
                    badge.earned
                      ? "bg-secondary"
                      : "bg-secondary/50 opacity-50"
                  )}
                >
                  <div className="text-3xl mb-2">{badge.icon}</div>
                  <p className="text-xs font-medium">{badge.name}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </StudentLayout>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
