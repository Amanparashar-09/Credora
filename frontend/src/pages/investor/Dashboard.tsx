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

const portfolioAllocation = [
  { name: "Low Risk Pool", percentage: 40, color: "bg-credora-emerald", amount: 600000 },
  { name: "Medium Risk Pool", percentage: 35, color: "bg-credora-blue", amount: 525000 },
  { name: "High Risk Pool", percentage: 25, color: "bg-credora-amber", amount: 375000 },
];

const recentActivity = [
  {
    id: 1,
    type: "return",
    description: "Monthly yield - Low Risk Pool",
    amount: 4500,
    date: "Dec 24, 2024",
  },
  {
    id: 2,
    type: "investment",
    description: "Added to Medium Risk Pool",
    amount: -100000,
    date: "Dec 20, 2024",
  },
  {
    id: 3,
    type: "return",
    description: "Monthly yield - High Risk Pool",
    amount: 3750,
    date: "Dec 15, 2024",
  },
  {
    id: 4,
    type: "withdrawal",
    description: "Partial withdrawal",
    amount: 50000,
    date: "Dec 10, 2024",
  },
];

export default function InvestorDashboard() {
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
              <h2 className="text-4xl lg:text-5xl font-bold mb-4">₹15,00,000</h2>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-accent-foreground/10">
                  <TrendingUp className="w-4 h-4 text-credora-emerald" />
                  <span className="text-sm font-medium">+12.4% APY</span>
                </div>
                <div className="text-sm">
                  <span className="text-accent-foreground/70">Lifetime Earnings: </span>
                  <span className="font-medium">₹1,86,000</span>
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
            value="₹15,00,000"
            icon={Wallet}
            variant="blue"
          />
          <StatCard
            label="Monthly Returns"
            value="₹15,500"
            subValue="avg."
            icon={TrendingUp}
            trend={{ value: 8.2, isPositive: true }}
            variant="emerald"
          />
          <StatCard
            label="Students Funded"
            value="24"
            icon={Users}
            variant="purple"
          />
          <StatCard
            label="Risk Score"
            value="Low-Med"
            subValue="diversified"
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
              {portfolioAllocation.map((pool, index) => (
                <motion.div
                  key={pool.name}
                  initial={{ width: 0 }}
                  animate={{ width: `${pool.percentage}%` }}
                  transition={{ duration: 0.8, delay: 0.3 + index * 0.1 }}
                  className={`${pool.color} ${index === 0 ? "rounded-l-full" : ""} ${
                    index === portfolioAllocation.length - 1 ? "rounded-r-full" : ""
                  }`}
                />
              ))}
            </div>

            <div className="space-y-4">
              {portfolioAllocation.map((pool) => (
                <div key={pool.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${pool.color}`} />
                    <span className="text-sm">{pool.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      ₹{pool.amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">{pool.percentage}%</p>
                  </div>
                </div>
              ))}
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
