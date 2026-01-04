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
      <div className="max-w-5xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold">Liquidity Pools</h2>
        <div className="grid gap-6">
          {pools.map((pool, i) => (
            <motion.div 
              key={pool.address} 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: i * 0.1 }} 
              className="bg-card rounded-2xl border border-border p-6"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-credora-blue/10 flex items-center justify-center">
                    <Droplets className="w-7 h-7 text-credora-blue" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{pool.name}</h3>
                    <p className="text-sm text-muted-foreground">{pool.riskLevel} Risk • {pool.apy}% APY</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 lg:gap-8">
                  <div>
                    <p className="text-xs text-muted-foreground">Your Investment</p>
                    <p className="font-semibold">{formatUSDT(parseFloat(pool.yourInvestment))}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Liquidity</p>
                    <p className="font-semibold">{formatUSDT(parseFloat(pool.totalLiquidity))}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Utilization</p>
                    <p className="font-semibold">{pool.utilizationRate.toFixed(1)}%</p>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <Button variant="outline" className="w-full">Manage</Button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </InvestorLayout>
  );
}
