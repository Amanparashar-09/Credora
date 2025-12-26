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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const recentTransactions = [
  {
    id: 1,
    type: "credit",
    description: "Laptop Purchase - Amazon",
    amount: 45000,
    date: "Dec 24, 2024",
    status: "completed",
  },
  {
    id: 2,
    type: "repayment",
    description: "Slice Payment #3",
    amount: -5000,
    date: "Dec 20, 2024",
    status: "completed",
  },
  {
    id: 3,
    type: "credit",
    description: "Course Fee - Coursera",
    amount: 15000,
    date: "Dec 15, 2024",
    status: "completed",
  },
  {
    id: 4,
    type: "repayment",
    description: "Slice Payment #2",
    amount: -5000,
    date: "Dec 10, 2024",
    status: "completed",
  },
];

const badges = [
  { name: "First Credit", icon: "🎯", earned: true },
  { name: "On-Time Payer", icon: "⏰", earned: true },
  { name: "GitHub Active", icon: "💻", earned: true },
  { name: "Top 10%", icon: "🏆", earned: false },
];

export default function StudentDashboard() {
  return (
    <StudentLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Credit Overview Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-primary to-credora-slate rounded-2xl p-8 text-primary-foreground"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <p className="text-primary-foreground/70 mb-2">Available Credit</p>
              <h2 className="text-4xl lg:text-5xl font-bold mb-4">₹1,75,000</h2>
              <div className="flex items-center gap-4">
                <div className="text-sm">
                  <span className="text-primary-foreground/70">Total Limit: </span>
                  <span className="font-medium">₹2,50,000</span>
                </div>
                <div className="text-sm">
                  <span className="text-primary-foreground/70">Used: </span>
                  <span className="font-medium">₹75,000</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="hero" size="lg">
                Use Credit
              </Button>
              <Button variant="hero-outline" size="lg" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                Pay Now
              </Button>
            </div>
          </div>
          {/* Progress Bar */}
          <div className="mt-8">
            <div className="h-3 bg-primary-foreground/20 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "30%" }}
                transition={{ duration: 1, delay: 0.5 }}
                className="h-full bg-credora-emerald rounded-full"
              />
            </div>
            <p className="text-xs text-primary-foreground/60 mt-2">
              30% of credit limit utilized
            </p>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Reputation Score"
            value="847"
            subValue="/ 900"
            icon={Award}
            trend={{ value: 12, isPositive: true }}
            variant="emerald"
          />
          <StatCard
            label="Outstanding Balance"
            value="₹75,000"
            icon={CreditCard}
            variant="amber"
          />
          <StatCard
            label="Next Slice Due"
            value="₹5,000"
            subValue="in 7 days"
            icon={Clock}
            variant="blue"
          />
          <StatCard
            label="Interest Rate"
            value="8.5%"
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
              {recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between py-3 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        tx.type === "credit"
                          ? "bg-credora-amber/10"
                          : "bg-credora-emerald/10"
                      )}
                    >
                      {tx.type === "credit" ? (
                        <ArrowUpRight className="w-5 h-5 text-credora-amber" />
                      ) : (
                        <ArrowDownRight className="w-5 h-5 text-credora-emerald" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">{tx.date}</p>
                    </div>
                  </div>
                  <p
                    className={cn(
                      "font-semibold",
                      tx.amount > 0 ? "text-credora-amber" : "text-credora-emerald"
                    )}
                  >
                    {tx.amount > 0 ? "+" : ""}₹{Math.abs(tx.amount).toLocaleString()}
                  </p>
                </div>
              ))}
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
