import { InvestorLayout } from "@/components/layouts/InvestorLayout";
import { motion } from "framer-motion";

export default function Analytics() {
  return (
    <InvestorLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold">Risk Analytics</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {[{ label: "Default Rate", value: "1.2%", status: "Excellent" }, { label: "Diversification Score", value: "87/100", status: "Good" }, { label: "Risk-Adjusted Return", value: "11.8%", status: "Above Avg" }].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-card rounded-2xl border border-border p-6">
              <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-credora-emerald">{stat.status}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </InvestorLayout>
  );
}
