import { motion } from "framer-motion";
import { InvestorLayout } from "@/components/layouts/InvestorLayout";
import { Droplets, TrendingUp, Users, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import investorService from "@/services/investor.service";
import { formatUSDT } from "@/utils/currency";
import type { Pool } from "@/types/api.types";

export default function LiquidityPools() {
  const [pools, setPools] = useState<Pool[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPools = async () => {
      try {
        setIsLoading(true);
        const data = await investorService.getPools();
        setPools(data);
      } catch (err) {
        console.error("Failed to fetch pools:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPools();
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

  return (
    <InvestorLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Liquidity Pool</h2>
          <p className="text-sm text-muted-foreground">Single pool with credit score-based borrower rates</p>
        </div>
        
        {pools.map((pool, i) => (
          <div key={pool.address} className="space-y-6">
            {/* Pool Header Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-credora-blue/10 to-credora-purple/10 rounded-2xl border border-credora-blue/20 p-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-credora-blue to-credora-purple flex items-center justify-center shadow-lg">
                    <Droplets className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-2xl">{pool.name}</h3>
                    <p className="text-sm text-muted-foreground">Main Lending Pool</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground mb-1">Current APY</p>
                  <p className="text-3xl font-bold text-credora-emerald">{pool.apy}%</p>
                </div>
              </div>
            </motion.div>

            {/* Pool Health Metrics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="font-semibold text-lg mb-4">Pool Health & Metrics</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-card rounded-xl border border-border p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-credora-blue/10 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-credora-blue" />
                    </div>
                    <span className="text-sm text-muted-foreground">Utilization Rate</span>
                  </div>
                  <p className="text-2xl font-bold">{pool.utilizationRate.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground mt-1">of pool funds lent out</p>
                </div>

                <div className="bg-card rounded-xl border border-border p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-credora-emerald/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-credora-emerald" />
                    </div>
                    <span className="text-sm text-muted-foreground">Active Borrowers</span>
                  </div>
                  <p className="text-2xl font-bold">47</p>
                  <p className="text-xs text-muted-foreground mt-1">currently borrowing</p>
                </div>

                <div className="bg-card rounded-xl border border-border p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-credora-amber/10 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-credora-amber" />
                    </div>
                    <span className="text-sm text-muted-foreground">Avg Credit Score</span>
                  </div>
                  <p className="text-2xl font-bold">742</p>
                  <p className="text-xs text-credora-emerald mt-1">Excellent quality</p>
                </div>

                <div className="bg-card rounded-xl border border-border p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-credora-purple/10 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-credora-purple" />
                    </div>
                    <span className="text-sm text-muted-foreground">Repayment Rate</span>
                  </div>
                  <p className="text-2xl font-bold">98.8%</p>
                  <p className="text-xs text-credora-emerald mt-1">on-time payments</p>
                </div>
              </div>
            </motion.div>

            {/* Borrower Rate Structure */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card rounded-2xl border border-border p-6"
            >
              <h3 className="font-semibold text-lg mb-4">Borrower Rate Structure</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Interest rates are fixed based on borrower credit scores, ensuring fair pricing and predictable returns.
              </p>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-credora-emerald/5 border border-credora-emerald/20">
                  <p className="text-sm text-muted-foreground mb-2">Low Risk (≥750)</p>
                  <p className="text-3xl font-bold text-credora-emerald">8%</p>
                  <p className="text-xs text-muted-foreground mt-2">Excellent credit</p>
                </div>
                <div className="p-4 rounded-xl bg-credora-blue/5 border border-credora-blue/20">
                  <p className="text-sm text-muted-foreground mb-2">Medium Risk (650-749)</p>
                  <p className="text-3xl font-bold text-credora-blue">12%</p>
                  <p className="text-xs text-muted-foreground mt-2">Good credit</p>
                </div>
                <div className="p-4 rounded-xl bg-credora-amber/5 border border-credora-amber/20">
                  <p className="text-sm text-muted-foreground mb-2">High Risk (&lt;650)</p>
                  <p className="text-3xl font-bold text-credora-amber">15%</p>
                  <p className="text-xs text-muted-foreground mt-2">Building credit</p>
                </div>
              </div>
            </motion.div>

            {/* Your Investment Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-card rounded-2xl border border-border p-6"
            >
              <h3 className="font-semibold text-lg mb-6">Your Investment in This Pool</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Your Investment</p>
                  <p className="text-2xl font-bold">{formatUSDT(parseFloat(pool.yourInvestment))}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Total Pool Liquidity</p>
                  <p className="text-2xl font-bold">{formatUSDT(parseFloat(pool.totalLiquidity))}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Your Pool Share</p>
                  <p className="text-2xl font-bold">
                    {((parseFloat(pool.yourInvestment) / parseFloat(pool.totalLiquidity)) * 100).toFixed(2)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Your Earnings</p>
                  <p className="text-2xl font-bold text-credora-emerald">+$1,440</p>
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <Button variant="default" className="flex-1">
                  Add Funds
                </Button>
                <Button variant="outline" className="flex-1">
                  Withdraw
                </Button>
              </div>
            </motion.div>
          </div>
        ))}
      </div>
    </InvestorLayout>
  );
}
