import { InvestorLayout } from "@/components/layouts/InvestorLayout";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { User, Bell, Shield, Wallet } from "lucide-react";

export default function InvestorSettings() {
  return (
    <InvestorLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold">Settings</h2>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center gap-3 mb-6"><Wallet className="w-5 h-5" /><h3 className="font-semibold">Connected Wallet</h3></div>
          <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
            <div><p className="font-medium">MetaMask</p><p className="text-sm text-muted-foreground font-mono">0x8765...4321</p></div>
            <span className="text-xs px-2 py-1 rounded-full bg-credora-blue/10 text-credora-blue">Connected</span>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center gap-3 mb-6"><Bell className="w-5 h-5" /><h3 className="font-semibold">Notifications</h3></div>
          <p className="text-sm text-muted-foreground">Configure your notification preferences</p>
        </motion.div>
      </div>
    </InvestorLayout>
  );
}
