import { motion } from "framer-motion";
import { Link } from "react-router-dom";
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
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import investorService from "@/services/investor.service";
import { formatUSDT } from "@/utils/currency";
import type { InvestorDashboard as DashboardData } from "@/types/api.types";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function InvestorDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("12");

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
    portfolio = { totalValue: '0', invested: '0', available: '0', allocation: [], pools: [], apy: '0%' },
    balance = { wallet: '0', poolShares: '0', withdrawable: '0', portfolioValue: '0' },
    returns = { totalEarned: '0', monthlyAverage: '0', currentAPY: 0, withdrawable: '0' },
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
              <Link to="/investor/invest">
                <Button variant="hero" size="lg" className="bg-accent-foreground text-credora-blue hover:bg-accent-foreground/90 w-full sm:w-auto">
                  Invest More
                </Button>
              </Link>
              <Link to="/investor/returns">
                <Button variant="glass" size="lg" className="border-accent-foreground/30 text-accent-foreground hover:bg-accent-foreground/10 w-full sm:w-auto">
                  Withdraw
                </Button>
              </Link>
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
          
          {/* Estimated Returns Card with Time Period Selector */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-4 h-full bg-gradient-to-br from-credora-emerald/5 to-credora-emerald/10 border-credora-emerald/20">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-credora-emerald/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-credora-emerald" />
                </div>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="w-[90px] h-7 text-xs border-credora-emerald/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 months</SelectItem>
                    <SelectItem value="6">6 months</SelectItem>
                    <SelectItem value="12">1 year</SelectItem>
                    <SelectItem value="24">2 years</SelectItem>
                    <SelectItem value="36">3 years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-sm text-muted-foreground mb-1">Estimated Returns</p>
              <p className="text-2xl font-bold text-credora-emerald">
                {formatUSDT(
                  parseFloat(balance.portfolioValue) * 
                  (returns.currentAPY / 100) * 
                  (parseInt(selectedPeriod) / 12)
                )}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                over {selectedPeriod} {parseInt(selectedPeriod) === 1 ? "month" : selectedPeriod === "12" ? "year" : selectedPeriod === "24" ? "years" : selectedPeriod === "36" ? "years" : "months"}
              </p>
            </Card>
          </motion.div>

          <StatCard
            label="Wallet Balance"
            value={formatUSDT(parseFloat(balance.wallet || '0'))}
            icon={Wallet}
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
          {/* Investment Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-2xl border border-border p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-lg">Investment Overview</h3>
              <TrendingUp className="w-5 h-5 text-credora-blue" />
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Current APY</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-credora-emerald/10 text-credora-emerald">
                    Active
                  </span>
                </div>
                <p className="text-3xl font-bold text-credora-emerald">{returns.currentAPY}%</p>
              </div>

              <div className="h-px bg-border" />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Invested</span>
                  <span className="font-semibold">{formatUSDT(parseFloat(balance.portfolioValue))}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Earned</span>
                  <span className="font-semibold text-credora-emerald">
                    +{formatUSDT(parseFloat(returns.totalEarned))}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Available to Withdraw</span>
                  <span className="font-semibold text-credora-blue">
                    {formatUSDT(parseFloat(returns.withdrawable))}
                  </span>
                </div>
              </div>

              <div className="h-px bg-border" />

              <div className="space-y-2">
                <Link to="/investor/invest">
                  <Button variant="default" className="w-full">
                    Invest More
                  </Button>
                </Link>
                <Link to="/investor/analytics">
                  <Button variant="outline" className="w-full">
                    View Analytics
                  </Button>
                </Link>
              </div>
            </div>
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
                      <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
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
                    {activity.type === "return" ? "+" : activity.type === "withdrawal" ? "-" : "+"}
                    {formatUSDT(Math.abs(parseFloat(activity.amount.toString())))}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </InvestorLayout>
  );
}
