import { motion } from "framer-motion";
import { StatCard } from "@/components/StatCard";
import { InvestorLayout } from "@/components/layouts/InvestorLayout";
import {
  Wallet,
  TrendingUp,
  Users,
  Shield,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  PieChart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import investorService from "@/services/investor.service";
import { formatUSDT } from "@/utils/currency";
import type { InvestorDashboard as DashboardData } from "@/types/api.types";
import { cn } from "@/lib/utils";

export default function InvestorDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setIsLoading(true);
        const data = await investorService.getDashboard();
        setDashboardData(data);
      } catch (err) {
        console.error("Failed to fetch dashboard:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (isLoading) {
    return (
      <InvestorLayout>
        <div className="flex items-center justify-center h-96">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </InvestorLayout>
    );
  }

  if (!dashboardData) {
    return (
      <InvestorLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-red-500">Failed to load dashboard</p>
        </div>
      </InvestorLayout>
    );
  }

  const { 
    portfolio = { totalValue: '0', invested: '0', available: '0', allocation: [], pools: [] },
    balance = { wallet: '0', poolShares: '0', withdrawable: '0', portfolioValue: '0' },
    returns = { totalEarned: '0', monthlyAverage: '0', currentAPY: 0 },
    recentActivity = []
  } = dashboardData || {};

  return (
    <InvestorLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Portfolio Overview Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-credora-blue to-credora-purple rounded-2xl p-8 text-accent-foreground"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <p className="text-accent-foreground/70 mb-2">Total Portfolio Value</p>
              <h2 className="text-4xl lg:text-5xl font-bold mb-4">{formatUSDT(parseFloat(portfolio.totalValue))}</h2>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-accent-foreground/10">
                  <TrendingUp className="w-4 h-4 text-credora-emerald" />
                  <span className="text-sm font-medium">+{parseFloat(returns.monthlyAverage) > 0 ? ((parseFloat(returns.monthlyAverage) / parseFloat(portfolio.totalValue)) * 100 * 12).toFixed(1) : 0}% APY</span>
                </div>
                <div className="text-sm">
                  <span className="text-accent-foreground/70">Lifetime Earnings: </span>
                  <span className="font-medium">{formatUSDT(parseFloat(returns.totalEarned))}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="hero" size="lg" className="bg-accent-foreground text-credora-blue hover:bg-accent-foreground/90">
                Invest More
              </Button>
              <Button variant="glass" size="lg" className="border-accent-foreground/30 text-accent-foreground hover:bg-accent-foreground/10">
                Withdraw
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Active Investment"
            value={formatUSDT(parseFloat(balance.portfolioValue))}
            icon={Wallet}
            variant="blue"
          />
          <StatCard
            label="Monthly Returns"
            value={formatUSDT(parseFloat(returns.monthlyAverage))}
            subValue="avg."
            icon={TrendingUp}
            trend={{ value: 8.2, isPositive: true }}
            variant="emerald"
          />
          <StatCard
            label="Total Shares"
            value={parseFloat(balance.totalShares).toFixed(2)}
            icon={Users}
            variant="purple"
          />
          <StatCard
            label="Withdrawable"
            value={formatUSDT(parseFloat(returns.withdrawable))}
            subValue="available"
            icon={Shield}
            variant="amber"
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Portfolio Allocation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-2xl border border-border p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-lg">Portfolio Allocation</h3>
              <PieChart className="w-5 h-5 text-muted-foreground" />
            </div>

            {/* Visual Bar */}
            <div className="h-4 rounded-full overflow-hidden flex mb-6">
              {portfolio.pools.map((pool, index) => {
                const percentage = (parseFloat(pool.currentValue) / parseFloat(portfolio.totalValue)) * 100;
                return (
                  <motion.div
                    key={pool.poolAddress}
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.8, delay: 0.3 + index * 0.1 }}
                    className={cn(
                      index === 0 ? "rounded-l-full" : "",
                      index === portfolio.pools.length - 1 ? "rounded-r-full" : "",
                      "bg-credora-" + ["emerald", "blue", "amber"][index % 3]
                    )}
                  />
                );
              })}
            </div>

            <div className="space-y-4">
              {portfolio.pools.map((pool) => {
                const percentage = ((parseFloat(pool.currentValue) / parseFloat(portfolio.totalValue)) * 100).toFixed(1);
                return (
                  <div key={pool.poolAddress} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-credora-blue" />
                      <span className="text-sm">{pool.poolName}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {formatUSDT(parseFloat(pool.currentValue))}
                      </p>
                      <p className="text-xs text-muted-foreground">{percentage}%</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <Link to="/investor/pools">
              <Button variant="outline" className="w-full mt-6">
                Manage Pools
              </Button>
            </Link>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2 bg-card rounded-2xl border border-border p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-lg">Recent Activity</h3>
              <Link
                to="/investor/returns"
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                View All <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between py-3 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        activity.type === "return"
                          ? "bg-credora-emerald/10"
                          : activity.type === "withdrawal"
                          ? "bg-credora-blue/10"
                          : "bg-credora-amber/10"
                      )}
                    >
                      {activity.type === "return" ? (
                        <ArrowDownRight className="w-5 h-5 text-credora-emerald" />
                      ) : activity.type === "withdrawal" ? (
                        <ArrowUpRight className="w-5 h-5 text-credora-blue" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5 text-credora-amber" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">{activity.date}</p>
                    </div>
                  </div>
                  <p
                    className={cn(
                      "font-semibold",
                      activity.type === "return"
                        ? "text-credora-emerald"
                        : activity.type === "withdrawal"
                        ? "text-credora-blue"
                        : "text-muted-foreground"
                    )}
                  >
                    {activity.type === "return" ? "+" : ""}₹
                    {Math.abs(activity.amount).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Risk Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card rounded-2xl border border-border p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-lg">Risk & Performance</h3>
              <p className="text-sm text-muted-foreground">
                Your portfolio is well-diversified across risk tiers
              </p>
            </div>
            <Link to="/investor/analytics">
              <Button variant="outline" size="sm">
                Detailed Analytics
              </Button>
            </Link>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="p-4 rounded-xl bg-credora-emerald/5 border border-credora-emerald/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Default Rate</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-credora-emerald/10 text-credora-emerald">
                  Excellent
                </span>
              </div>
              <p className="text-2xl font-bold text-credora-emerald">1.2%</p>
            </div>
            <div className="p-4 rounded-xl bg-credora-blue/5 border border-credora-blue/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Avg. Lock-in</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-credora-blue/10 text-credora-blue">
                  Optimal
                </span>
              </div>
              <p className="text-2xl font-bold text-credora-blue">6 months</p>
            </div>
            <div className="p-4 rounded-xl bg-credora-amber/5 border border-credora-amber/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Next Payout</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-credora-amber/10 text-credora-amber">
                  5 days
                </span>
              </div>
              <p className="text-2xl font-bold text-credora-amber">₹15,500</p>
            </div>
          </div>
        </motion.div>
      </div>
    </InvestorLayout>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
