import { InvestorLayout } from "@/components/layouts/InvestorLayout";
import { motion } from "framer-motion";

export default function Returns() {
  return (
    <InvestorLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold">Returns & Withdrawals</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl border border-border p-6">
            <p className="text-sm text-muted-foreground">Total Returns</p><p className="text-3xl font-bold text-credora-emerald">₹1,86,000</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-2xl border border-border p-6">
            <p className="text-sm text-muted-foreground">Withdrawable</p><p className="text-3xl font-bold">₹50,000</p>
          </motion.div>
        </div>
      </div>
    </InvestorLayout>
  );
}
