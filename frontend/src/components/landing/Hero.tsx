import { motion } from "framer-motion";
import { ArrowRight, Shield, TrendingUp, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { useNavigate } from "react-router-dom";

export function Hero() {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-secondary/30" />
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-credora-emerald/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-credora-blue/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 lg:px-12 py-6">
        <Logo size="md" />
        <div className="hidden md:flex items-center gap-8">
          <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
            How it Works
          </a>
          <a href="#for-students" className="text-muted-foreground hover:text-foreground transition-colors">
            For Students
          </a>
          <a href="#for-investors" className="text-muted-foreground hover:text-foreground transition-colors">
            For Investors
          </a>
          <a href="#security" className="text-muted-foreground hover:text-foreground transition-colors">
            Security
          </a>
        </div>
        <Button variant="hero" onClick={() => navigate("/connect")}>
          Get Started
          <ArrowRight className="w-4 h-4" />
        </Button>
      </nav>

      {/* Hero Content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-6 lg:px-12">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-credora-emerald/10 text-credora-emerald text-sm font-medium">
              <Shield className="w-4 h-4" />
              Bank-grade security for your future
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6"
          >
            Credit for your{" "}
            <span className="text-credora-emerald">potential</span>,
            <br />
            not your past
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
          >
            We evaluate students based on skills, academic performance, and projects—not credit history. 
            Investors fund tomorrow's talent through transparent liquidity pools.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <Button
              variant="hero"
              size="xl"
              onClick={() => navigate("/connect")}
              className="w-full sm:w-auto"
            >
              <GraduationCap className="w-5 h-5" />
              I'm a Student
            </Button>
            <Button
              variant="investor"
              size="xl"
              onClick={() => navigate("/connect")}
              className="w-full sm:w-auto"
            >
              <TrendingUp className="w-5 h-5" />
              I'm an Investor
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto"
          >
            {[
              { label: "Students Funded", value: "12,500+" },
              { label: "Total Disbursed", value: "₹45Cr+" },
              { label: "Avg. Interest Rate", value: "8.5%" },
              { label: "Default Rate", value: "<2%" },
            ].map((stat, index) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl md:text-3xl font-bold text-foreground">
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
