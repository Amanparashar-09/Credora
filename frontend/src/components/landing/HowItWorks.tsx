import { motion } from "framer-motion";
import { 
  Wallet, 
  UserCheck, 
  FileText, 
  CreditCard, 
  PiggyBank, 
  BarChart3 
} from "lucide-react";

const studentSteps = [
  {
    icon: Wallet,
    title: "Connect Wallet",
    description: "Link your digital wallet securely to get started",
  },
  {
    icon: FileText,
    title: "Submit Profile",
    description: "Share your academics, GitHub, and achievements",
  },
  {
    icon: UserCheck,
    title: "Get Evaluated",
    description: "AI analyzes your potential and assigns a credit score",
  },
  {
    icon: CreditCard,
    title: "Access Credit",
    description: "Use your credit line with flexible repayment options",
  },
];

const investorSteps = [
  {
    icon: Wallet,
    title: "Connect Wallet",
    description: "Link your wallet to access investment pools",
  },
  {
    icon: PiggyBank,
    title: "Choose Pool",
    description: "Select risk tier and investment amount",
  },
  {
    icon: BarChart3,
    title: "Earn Returns",
    description: "Receive monthly yields from student repayments",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-6 lg:px-12 bg-secondary/30">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            How Credora Works
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            A transparent, fair, and secure process for both students and investors
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-16">
          {/* Student Flow */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-credora-emerald/10 flex items-center justify-center">
                <span className="text-credora-emerald font-semibold">S</span>
              </div>
              <h3 className="text-xl font-semibold">For Students</h3>
            </div>
            <div className="space-y-6">
              {studentSteps.map((step, index) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex gap-4 items-start"
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-card border border-border flex items-center justify-center shadow-sm">
                    <step.icon className="w-5 h-5 text-credora-emerald" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-muted-foreground">
                        Step {index + 1}
                      </span>
                    </div>
                    <h4 className="font-medium mb-1">{step.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Investor Flow */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-credora-blue/10 flex items-center justify-center">
                <span className="text-credora-blue font-semibold">I</span>
              </div>
              <h3 className="text-xl font-semibold">For Investors</h3>
            </div>
            <div className="space-y-6">
              {investorSteps.map((step, index) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex gap-4 items-start"
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-card border border-border flex items-center justify-center shadow-sm">
                    <step.icon className="w-5 h-5 text-credora-blue" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-muted-foreground">
                        Step {index + 1}
                      </span>
                    </div>
                    <h4 className="font-medium mb-1">{step.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
