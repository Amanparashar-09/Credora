import { motion } from "framer-motion";
import { 
  Brain, 
  Shield, 
  Clock, 
  Award, 
  LineChart, 
  Lock,
  Sparkles,
  BadgeCheck
} from "lucide-react";

const studentFeatures = [
  {
    icon: Brain,
    title: "AI-Powered Evaluation",
    description: "Your skills, projects, and potential matter more than traditional credit scores",
  },
  {
    icon: Clock,
    title: "Flexible Repayment",
    description: "Pay in small slices aligned with your internships and placements",
  },
  {
    icon: Award,
    title: "Build Reputation",
    description: "Earn on-chain reputation badges that follow you beyond college",
  },
  {
    icon: Sparkles,
    title: "Zero Collateral",
    description: "No assets needed—your potential is your collateral",
  },
];

const investorFeatures = [
  {
    icon: LineChart,
    title: "Predictable Returns",
    description: "Earn 8-12% APY backed by future earning potential",
  },
  {
    icon: Shield,
    title: "Risk Diversification",
    description: "Invest across multiple students and risk tiers",
  },
  {
    icon: BadgeCheck,
    title: "Transparent Analytics",
    description: "Real-time dashboards with repayment tracking",
  },
  {
    icon: Lock,
    title: "Secured Investment",
    description: "Smart contracts ensure transparent fund management",
  },
];

export function Features() {
  return (
    <>
      {/* For Students */}
      <section id="for-students" className="py-24 px-6 lg:px-12">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col lg:flex-row items-center gap-16"
          >
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-credora-emerald/10 text-credora-emerald text-sm font-medium mb-6">
                For Students
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Your skills deserve credit,{" "}
                <span className="text-credora-emerald">literally</span>
              </h2>
              <p className="text-muted-foreground mb-8">
                Traditional banks don't see your GitHub commits, your GPA, or your side projects. 
                We do. Get credit based on who you're becoming, not where you've been.
              </p>
              <div className="grid sm:grid-cols-2 gap-6">
                {studentFeatures.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex gap-3"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-credora-emerald/10 flex items-center justify-center">
                      <feature.icon className="w-5 h-5 text-credora-emerald" />
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">{feature.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
            <div className="flex-1">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="bg-card rounded-2xl border border-border p-6 shadow-xl">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-sm text-muted-foreground">Credit Limit</p>
                      <p className="text-3xl font-bold">₹2,50,000</p>
                    </div>
                    <div className="w-16 h-16 rounded-2xl bg-credora-emerald/10 flex items-center justify-center">
                      <span className="text-2xl font-bold text-credora-emerald">A+</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Reputation Score</span>
                      <span className="font-medium">847/900</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full w-[94%] bg-credora-emerald rounded-full" />
                    </div>
                    <div className="grid grid-cols-3 gap-4 pt-4">
                      <div className="text-center p-3 bg-secondary/50 rounded-xl">
                        <p className="text-lg font-semibold">9.2</p>
                        <p className="text-xs text-muted-foreground">GPA</p>
                      </div>
                      <div className="text-center p-3 bg-secondary/50 rounded-xl">
                        <p className="text-lg font-semibold">156</p>
                        <p className="text-xs text-muted-foreground">Commits</p>
                      </div>
                      <div className="text-center p-3 bg-secondary/50 rounded-xl">
                        <p className="text-lg font-semibold">3</p>
                        <p className="text-xs text-muted-foreground">Internships</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-credora-emerald/10 rounded-full blur-2xl" />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* For Investors */}
      <section id="for-investors" className="py-24 px-6 lg:px-12 bg-secondary/30">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col lg:flex-row-reverse items-center gap-16"
          >
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-credora-blue/10 text-credora-blue text-sm font-medium mb-6">
                For Investors
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Invest in{" "}
                <span className="text-credora-blue">future talent</span>,
                earn stable returns
              </h2>
              <p className="text-muted-foreground mb-8">
                Fund the next generation of engineers, designers, and entrepreneurs. 
                Diversified pools mean lower risk, transparent returns mean peace of mind.
              </p>
              <div className="grid sm:grid-cols-2 gap-6">
                {investorFeatures.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex gap-3"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-credora-blue/10 flex items-center justify-center">
                      <feature.icon className="w-5 h-5 text-credora-blue" />
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">{feature.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
            <div className="flex-1">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="bg-card rounded-2xl border border-border p-6 shadow-xl">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-sm text-muted-foreground">Portfolio Value</p>
                      <p className="text-3xl font-bold">₹15,00,000</p>
                    </div>
                    <div className="px-3 py-1.5 rounded-lg bg-credora-emerald/10 text-credora-emerald text-sm font-medium">
                      +12.4% APY
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Earnings</span>
                      <span className="font-medium text-credora-emerald">₹1,86,000</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 pt-4">
                      <div className="text-center p-3 bg-secondary/50 rounded-xl">
                        <p className="text-lg font-semibold">24</p>
                        <p className="text-xs text-muted-foreground">Students</p>
                      </div>
                      <div className="text-center p-3 bg-secondary/50 rounded-xl">
                        <p className="text-lg font-semibold">Low</p>
                        <p className="text-xs text-muted-foreground">Risk</p>
                      </div>
                      <div className="text-center p-3 bg-secondary/50 rounded-xl">
                        <p className="text-lg font-semibold">6mo</p>
                        <p className="text-xs text-muted-foreground">Lock-in</p>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-border">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Next payout</span>
                        <span className="font-medium">₹15,500 in 5 days</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-credora-blue/10 rounded-full blur-2xl" />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
