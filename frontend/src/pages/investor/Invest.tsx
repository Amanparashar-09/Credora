import { InvestorLayout } from "@/components/layouts/InvestorLayout";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function Invest() {
  return (
    <InvestorLayout>
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl border border-border p-8">
          <h2 className="text-2xl font-bold mb-6">Invest in Student Pool</h2>
          <div className="space-y-6">
            <div><label className="block text-sm font-medium mb-2">Investment Amount</label><input type="text" placeholder="₹100,000" className="credora-input w-full rounded-xl" /></div>
            <div><label className="block text-sm font-medium mb-2">Risk Tier</label>
              <div className="grid grid-cols-3 gap-3">
                {["Low", "Medium", "High"].map(r => <button key={r} className="p-4 rounded-xl border border-border hover:border-credora-blue text-center"><p className="font-medium">{r}</p><p className="text-xs text-muted-foreground">{r === "Low" ? "8-9%" : r === "Medium" ? "10-11%" : "12-14%"} APY</p></button>)}
              </div>
            </div>
            <div><label className="block text-sm font-medium mb-2">Lock-in Period</label>
              <div className="grid grid-cols-3 gap-3">
                {["3 months", "6 months", "12 months"].map(p => <button key={p} className="p-3 rounded-xl border border-border hover:border-credora-blue text-sm">{p}</button>)}
              </div>
            </div>
            <Button variant="investor" size="lg" className="w-full">Confirm Investment</Button>
          </div>
        </motion.div>
      </div>
    </InvestorLayout>
  );
}
