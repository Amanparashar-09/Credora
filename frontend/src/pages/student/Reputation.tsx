import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { StudentLayout } from "@/components/layouts/StudentLayout";
import { Award, Star, Lock, Trophy, Zap, Target, Clock, Code, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import studentService from "@/services/student.service";
import { useToast } from "@/hooks/use-toast";
import type { Badge } from "@/types/api.types";

export default function Reputation() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [reputationScore, setReputationScore] = useState(842);
  const [percentile, setPercentile] = useState(95);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchReputationData = async () => {
      try {
        setIsLoading(true);
        const dashboard = await studentService.getDashboard();
        setBadges(dashboard.badges || []);
        setReputationScore(dashboard.credit.score);
        // Calculate percentile based on score (simplified)
        const calculatedPercentile = Math.min(100, Math.floor((dashboard.credit.score / 900) * 100));
        setPercentile(calculatedPercentile);
      } catch (err: any) {
        console.error("Failed to fetch reputation data:", err);
        toast({
          title: "Error",
          description: "Failed to load reputation data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchReputationData();
  }, []);

  if (isLoading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading reputation...</p>
          </div>
        </div>
      </StudentLayout>
    );
  }

  const earnedBadges = badges.filter((b) => b.earned);
  const pendingBadges = badges.filter((b) => !b.earned);
  const maxScore = 900;

  return (
    <StudentLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Reputation Score Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-credora-emerald to-credora-blue rounded-2xl p-8 text-accent-foreground"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Award className="w-8 h-8" />
                <p className="text-accent-foreground/80">Your Reputation Score</p>
              </div>
              <div className="flex items-center gap-4">
                <h2 className="text-5xl font-bold">{reputationScore}</h2>
              </div>
              <p className="text-accent-foreground/70 mt-2">out of {maxScore} possible points</p>
            </div>
            <div className="flex-1 max-w-md">
              <div className="h-4 bg-accent-foreground/20 rounded-full overflow-hidden mb-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(reputationScore / maxScore) * 100}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="h-full bg-accent-foreground rounded-full"
                />
              </div>
              <div className="flex justify-between text-sm text-accent-foreground/70">
                <span>0</span>
                <div className="flex items-center gap-2">
                  <span>Top {percentile}% of students</span>
                </div>
                <span>{maxScore}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* SBT Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-credora-purple/5 border border-credora-purple/20 rounded-2xl p-6"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-credora-purple/10 flex items-center justify-center flex-shrink-0">
              <Zap className="w-6 h-6 text-credora-purple" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Soul-Bound Tokens (SBTs)</h3>
              <p className="text-sm text-muted-foreground">
                Your reputation badges are minted as non-transferable SBTs on the blockchain. 
                They represent your achievements and follow you beyond Credora—
                potential employers and lenders can verify your track record.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Earned Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">
              Earned Badges ({earnedBadges.length})
            </h3>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {earnedBadges.map((badge, index) => (
              <motion.div
                key={badge.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="bg-card rounded-2xl border border-border p-6 text-center hover:shadow-lg transition-all hover:border-credora-emerald/50"
              >
                <div className="text-4xl mb-4">
                  {badge.icon}
                </div>
                <h4 className="font-medium mb-1">{badge.name}</h4>
                <p className="text-xs text-muted-foreground mb-3">
                  {badge.icon}
                </p>
                <span className="text-xs text-credora-emerald">
                  {badge.earnedAt ? `Earned ${new Date(badge.earnedAt).toLocaleDateString()}` : "Earned"}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </StudentLayout>
  );
}
