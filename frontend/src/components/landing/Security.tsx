import { motion } from "framer-motion";
import { Shield, Lock, Eye, FileCheck, Server, Fingerprint } from "lucide-react";

const securityFeatures = [
  {
    icon: Lock,
    title: "End-to-End Encryption",
    description: "All data is encrypted in transit and at rest using bank-grade AES-256",
  },
  {
    icon: Fingerprint,
    title: "Biometric Authentication",
    description: "Multi-factor authentication with biometric support for maximum security",
  },
  {
    icon: Eye,
    title: "Privacy First",
    description: "Your data is never sold. You control what you share and with whom",
  },
  {
    icon: FileCheck,
    title: "RBI Compliant",
    description: "Fully compliant with Reserve Bank of India digital lending guidelines",
  },
  {
    icon: Server,
    title: "Secure Infrastructure",
    description: "Hosted on SOC 2 Type II certified infrastructure with 99.99% uptime",
  },
  {
    icon: Shield,
    title: "Fraud Protection",
    description: "AI-powered fraud detection monitors every transaction in real-time",
  },
];

export function Security() {
  return (
    <section id="security" className="py-24 px-6 lg:px-12">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/5 text-primary text-sm font-medium mb-6">
            <Shield className="w-4 h-4" />
            Security & Trust
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Bank-grade security,
            <br />
            built for the digital age
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Your trust is our foundation. We employ the highest security standards 
            to protect your data and funds.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {securityFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-card rounded-2xl border border-border p-6 hover:shadow-lg transition-shadow"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 flex flex-wrap items-center justify-center gap-8 pt-8 border-t border-border"
        >
          <div className="flex items-center gap-2 text-muted-foreground">
            <Shield className="w-5 h-5" />
            <span className="text-sm font-medium">SOC 2 Certified</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Lock className="w-5 h-5" />
            <span className="text-sm font-medium">256-bit SSL</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <FileCheck className="w-5 h-5" />
            <span className="text-sm font-medium">RBI Registered</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Server className="w-5 h-5" />
            <span className="text-sm font-medium">99.99% Uptime</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
