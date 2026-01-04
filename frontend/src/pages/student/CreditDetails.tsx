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
import { useState, useEffect } from "react";
import studentService from "@/services/student.service";
import { formatUSDT } from "@/utils/currency";
import type { CreditStatus } from "@/types/api.types";
import { useToast } from "@/hooks/use-toast";

export default function CreditDetails() {
  const [creditStatus, setCreditStatus] = useState<CreditStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchCreditStatus = async () => {
      try {
        setIsLoading(true);
        const data = await studentService.getCreditStatus();
        setCreditStatus(data);
      } catch (err: any) {
        console.error("Failed to fetch credit status:", err);
        toast({
          title: "Error",
          description: "Failed to load credit status",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCreditStatus();
  }, []);

  const handleSubmitForScoring = async () => {
    try {
      setIsSubmitting(true);
      const result = await studentService.submitForScoring();
      toast({
        title: "Scoring Requested",
        description: result.message,
      });
    } catch (err: any) {
      console.error("Failed to submit for scoring:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to submit for scoring",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center h-96">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </StudentLayout>
    );
  }

  if (!creditStatus) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-red-500">Failed to load credit status</p>
        </div>
      </StudentLayout>
    );
  }

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
                  <h2 className="text-3xl font-bold">{formatUSDT(parseFloat(creditStatus.limit))}</h2>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="p-4 rounded-xl bg-secondary/50">
                  <p className="text-xs text-muted-foreground mb-1">Interest Rate</p>
                  <p className="text-xl font-semibold">{creditStatus.interestRate}% p.a.</p>
                </div>
                <div className="p-4 rounded-xl bg-secondary/50">
                  <p className="text-xs text-muted-foreground mb-1">Credit Score</p>
                  <p className="text-xl font-semibold">{creditStatus.score}/900</p>
                </div>
              </div>
            </div>
            <div className="flex-1 lg:max-w-xs">
              <div className="bg-credora-emerald/5 border border-credora-emerald/20 rounded-2xl p-6 text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-credora-emerald/10 flex items-center justify-center">
                  <span className="text-3xl font-bold text-credora-emerald">{creditStatus.grade}</span>
                </div>
                <h3 className="font-semibold mb-1">Credit Grade</h3>
                <p className="text-sm text-muted-foreground">
                  Based on your credit score and history
                </p>
                <Button 
                  onClick={handleSubmitForScoring}
                  disabled={isSubmitting}
                  className="mt-4 w-full"
                  size="sm"
                >
                  {isSubmitting ? "Submitting..." : "Request Re-scoring"}
                </Button>
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
