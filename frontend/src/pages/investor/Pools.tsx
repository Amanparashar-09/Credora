import { motion } from "framer-motion";
import { InvestorLayout } from "@/components/layouts/InvestorLayout";
import { Droplets, TrendingUp, Users, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

const pools = [
  { id: 1, name: "Conservative Pool", risk: "Low", apy: "8-9%", invested: 600000, students: 12, color: "emerald" },
  { id: 2, name: "Balanced Pool", risk: "Medium", apy: "10-11%", invested: 525000, students: 8, color: "blue" },
  { id: 3, name: "Growth Pool", risk: "High", apy: "12-14%", invested: 375000, students: 4, color: "amber" },
];

export default function LiquidityPools() {
  return (
    <InvestorLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold">Liquidity Pools</h2>
        <div className="grid gap-6">
          {pools.map((pool, i) => (
            <motion.div key={pool.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-card rounded-2xl border border-border p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl bg-credora-${pool.color}/10 flex items-center justify-center`}>
                    <Droplets className={`w-7 h-7 text-credora-${pool.color}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{pool.name}</h3>
                    <p className="text-sm text-muted-foreground">{pool.risk} Risk • {pool.apy} APY</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 lg:gap-8">
                  <div><p className="text-xs text-muted-foreground">Your Investment</p><p className="font-semibold">₹{pool.invested.toLocaleString()}</p></div>
                  <div><p className="text-xs text-muted-foreground">Students Funded</p><p className="font-semibold">{pool.students}</p></div>
                  <div className="col-span-2 sm:col-span-1"><Button variant="outline" className="w-full">Manage</Button></div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </InvestorLayout>
  );
}
