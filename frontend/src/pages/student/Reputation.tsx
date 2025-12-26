import { motion } from "framer-motion";
import { StudentLayout } from "@/components/layouts/StudentLayout";
import { Award, Star, Lock, Trophy, Zap, Target, Clock, Code } from "lucide-react";

const badges = [
  {
    id: 1,
    name: "First Credit",
    description: "Successfully accessed your first credit line",
    icon: "🎯",
    earned: true,
    earnedDate: "Oct 15, 2024",
  },
  {
    id: 2,
    name: "On-Time Champion",
    description: "Made 3 consecutive on-time payments",
    icon: "⏰",
    earned: true,
    earnedDate: "Dec 10, 2024",
  },
  {
    id: 3,
    name: "Code Warrior",
    description: "100+ GitHub commits linked",
    icon: "💻",
    earned: true,
    earnedDate: "Nov 20, 2024",
  },
  {
    id: 4,
    name: "Academic Star",
    description: "Maintain 9.0+ CGPA",
    icon: "⭐",
    earned: true,
    earnedDate: "Oct 15, 2024",
  },
  {
    id: 5,
    name: "Top 10%",
    description: "Among top 10% students by reputation",
    icon: "🏆",
    earned: false,
    progress: 72,
  },
  {
    id: 6,
    name: "Full Repayment",
    description: "Complete a full credit repayment cycle",
    icon: "✅",
    earned: false,
    progress: 40,
  },
  {
    id: 7,
    name: "Skill Master",
    description: "Add 5+ verified skills",
    icon: "🚀",
    earned: false,
    progress: 60,
  },
  {
    id: 8,
    name: "Community Star",
    description: "Refer 3 friends to Credora",
    icon: "🌟",
    earned: false,
    progress: 33,
  },
];

export default function Reputation() {
  const earnedBadges = badges.filter((b) => b.earned);
  const pendingBadges = badges.filter((b) => !b.earned);

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
              <h2 className="text-5xl font-bold mb-2">847</h2>
              <p className="text-accent-foreground/70">out of 900 possible points</p>
            </div>
            <div className="flex-1 max-w-md">
              <div className="h-4 bg-accent-foreground/20 rounded-full overflow-hidden mb-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "94%" }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="h-full bg-accent-foreground rounded-full"
                />
              </div>
              <div className="flex justify-between text-sm text-accent-foreground/70">
                <span>0</span>
                <span>Top 6% of students</span>
                <span>900</span>
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
          <h3 className="font-semibold text-lg mb-4">
            Earned Badges ({earnedBadges.length})
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {earnedBadges.map((badge, index) => (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="bg-card rounded-2xl border border-border p-6 text-center hover:shadow-lg transition-all hover:border-credora-emerald/50 group"
              >
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">
                  {badge.icon}
                </div>
                <h4 className="font-medium mb-1">{badge.name}</h4>
                <p className="text-xs text-muted-foreground mb-3">
                  {badge.description}
                </p>
                <span className="text-xs text-credora-emerald">
                  Earned {badge.earnedDate}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Pending Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="font-semibold text-lg mb-4">
            Badges to Unlock ({pendingBadges.length})
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {pendingBadges.map((badge, index) => (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="bg-card rounded-2xl border border-border p-6 text-center opacity-75"
              >
                <div className="relative">
                  <div className="text-4xl mb-4 grayscale">{badge.icon}</div>
                  <Lock className="w-4 h-4 text-muted-foreground absolute top-0 right-0" />
                </div>
                <h4 className="font-medium mb-1">{badge.name}</h4>
                <p className="text-xs text-muted-foreground mb-3">
                  {badge.description}
                </p>
                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-credora-amber rounded-full"
                    style={{ width: `${badge.progress}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground mt-2 block">
                  {badge.progress}% complete
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </StudentLayout>
  );
}
