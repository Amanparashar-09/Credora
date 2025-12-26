import { motion } from "framer-motion";
import { StudentLayout } from "@/components/layouts/StudentLayout";
import {
  CreditCard,
  TrendingUp,
  Info,
  Brain,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const creditFactors = [
  {
    factor: "Academic Performance",
    score: 92,
    impact: "High",
    description: "Your 9.2 CGPA indicates strong academic discipline",
  },
  {
    factor: "GitHub Activity",
    score: 85,
    impact: "High",
    description: "156 commits and 12 active repositories show consistency",
  },
  {
    factor: "Work Experience",
    score: 78,
    impact: "Medium",
    description: "3 internships demonstrate professional experience",
  },
  {
    factor: "Repayment History",
    score: 95,
    impact: "High",
    description: "Perfect on-time payments on previous slices",
  },
];

export default function CreditDetails() {
  return (
    <StudentLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Credit Limit Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border border-border p-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-credora-emerald/10 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-credora-emerald" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Your Credit Limit</p>
                  <h2 className="text-3xl font-bold">₹2,50,000</h2>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="p-4 rounded-xl bg-secondary/50">
                  <p className="text-xs text-muted-foreground mb-1">Interest Rate</p>
                  <p className="text-xl font-semibold">8.5% p.a.</p>
                </div>
                <div className="p-4 rounded-xl bg-secondary/50">
                  <p className="text-xs text-muted-foreground mb-1">Tenure Options</p>
                  <p className="text-xl font-semibold">3-24 months</p>
                </div>
              </div>
            </div>
            <div className="flex-1 lg:max-w-xs">
              <div className="bg-credora-emerald/5 border border-credora-emerald/20 rounded-2xl p-6 text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-credora-emerald/10 flex items-center justify-center">
                  <span className="text-3xl font-bold text-credora-emerald">A+</span>
                </div>
                <h3 className="font-semibold mb-1">Credit Grade</h3>
                <p className="text-sm text-muted-foreground">
                  Top 5% of all students on Credora
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* AI Explanation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl border border-border p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-credora-purple/10 flex items-center justify-center">
              <Brain className="w-5 h-5 text-credora-purple" />
            </div>
            <div>
              <h3 className="font-semibold">AI Credit Analysis</h3>
              <p className="text-sm text-muted-foreground">
                How we calculated your credit limit
              </p>
            </div>
          </div>

          <div className="bg-credora-purple/5 rounded-xl p-6 mb-6">
            <p className="text-sm leading-relaxed">
              Based on our analysis, you've been assigned a credit limit of{" "}
              <strong>₹2,50,000</strong>. Your strong academic record (9.2 CGPA), 
              consistent GitHub activity (156 commits across 12 repos), and 3 
              verified internships indicate high earning potential post-graduation. 
              Your interest rate of <strong>8.5% p.a.</strong> is lower than average 
              due to your excellent profile.
            </p>
          </div>

          <div className="space-y-4">
            {creditFactors.map((item, index) => (
              <motion.div
                key={item.factor}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="flex items-center justify-between p-4 rounded-xl bg-secondary/30"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-card border border-border flex items-center justify-center">
                    <span className="text-lg font-bold">{item.score}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{item.factor}</h4>
                      <span
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-full",
                          item.impact === "High"
                            ? "bg-credora-emerald/10 text-credora-emerald"
                            : "bg-credora-amber/10 text-credora-amber"
                        )}
                      >
                        {item.impact} Impact
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* How to Improve */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-2xl border border-border p-8"
        >
          <h3 className="font-semibold mb-6">How to Increase Your Limit</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-credora-emerald/5 border border-credora-emerald/20">
              <CheckCircle className="w-5 h-5 text-credora-emerald flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Make on-time payments</p>
                <p className="text-xs text-muted-foreground">
                  Each on-time slice payment increases your score
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl bg-credora-blue/5 border border-credora-blue/20">
              <Info className="w-5 h-5 text-credora-blue flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Add more achievements</p>
                <p className="text-xs text-muted-foreground">
                  Certifications and awards boost your profile
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl bg-credora-amber/5 border border-credora-amber/20">
              <TrendingUp className="w-5 h-5 text-credora-amber flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Stay active on GitHub</p>
                <p className="text-xs text-muted-foreground">
                  Regular commits show ongoing skill development
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl bg-credora-purple/5 border border-credora-purple/20">
              <AlertCircle className="w-5 h-5 text-credora-purple flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Maintain good academics</p>
                <p className="text-xs text-muted-foreground">
                  CGPA updates can unlock higher limits
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </StudentLayout>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
