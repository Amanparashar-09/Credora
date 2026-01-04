import { motion } from "framer-motion";
import { Wallet, ArrowRight, GraduationCap, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/lib/userContext";
import { useState } from "react";
import blockchainService from "@/services/blockchain.service";
import authService from "@/services/auth.service";
import { useToast } from "@/hooks/use-toast";

export default function ConnectWallet() {
  const navigate = useNavigate();
  const { setWalletAddress, setRole } = useUser();
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [step, setStep] = useState<"connect" | "role">("connect");
  const [currentAddress, setCurrentAddress] = useState<string>("");

  const handleConnect = async () => {
    setIsConnecting(true);
    
    try {
      // Connect to MetaMask
      const { address } = await blockchainService.connectWallet();
      setCurrentAddress(address);
      
      // Get nonce from backend
      const nonce = await authService.getNonce(address);
      
      // Sign nonce with wallet
      const message = `Credora authentication nonce: ${nonce}`;
      const signature = await blockchainService.signMessage(message);
      
      // Login with signature
      await authService.login({
        address,
        signature,
        nonce,
      });
      
      setWalletAddress(address);
      setStep("role");
      
      toast({
        title: "Wallet Connected",
        description: "Successfully authenticated with your wallet.",
      });
    } catch (error: any) {
      console.error("Connection failed:", error);
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect wallet. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleRoleSelect = (selectedRole: "student" | "investor") => {
    setRole(selectedRole);
    navigate(selectedRole === "student" ? "/student" : "/investor");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-credora-emerald/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-credora-blue/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 py-6">
        <Logo size="md" />
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          {step === "connect" ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="w-20 h-20 mx-auto mb-8 rounded-2xl bg-primary/5 flex items-center justify-center">
                <Wallet className="w-10 h-10 text-primary" />
              </div>
              <h1 className="text-3xl font-bold mb-4">Connect Your Wallet</h1>
              <p className="text-muted-foreground mb-8">
                Connect your digital wallet to access Credora. Your wallet is your identity—secure and private.
              </p>

              <div className="space-y-4">
                <Button
                  variant="default"
                  size="lg"
                  className="w-full justify-between"
                  onClick={handleConnect}
                  disabled={isConnecting}
                >
                  <span className="flex items-center gap-3">
                    <img
                      src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg"
                      alt="MetaMask"
                      className="w-6 h-6"
                    />
                    {isConnecting ? "Connecting..." : "MetaMask"}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  className="w-full justify-between"
                  onClick={handleConnect}
                  disabled={isConnecting}
                >
                  <span className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-credora-blue flex items-center justify-center">
                      <span className="text-accent-foreground text-xs font-bold">W</span>
                    </div>
                    WalletConnect
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  className="w-full justify-between"
                  onClick={handleConnect}
                  disabled={isConnecting}
                >
                  <span className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-credora-purple flex items-center justify-center">
                      <span className="text-accent-foreground text-xs font-bold">P</span>
                    </div>
                    Phantom
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>

              <p className="text-xs text-muted-foreground mt-8">
                By connecting, you agree to our{" "}
                <a href="#" className="underline hover:text-foreground">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="underline hover:text-foreground">
                  Privacy Policy
                </a>
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-credora-emerald/10 flex items-center justify-center">
                <span className="text-credora-emerald text-2xl">✓</span>
              </div>
              <h1 className="text-3xl font-bold mb-2">Wallet Connected</h1>
              <p className="text-muted-foreground mb-8">
                Choose how you want to use Credora. This is a one-time selection.
              </p>

              <div className="grid gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleRoleSelect("student")}
                  className="w-full p-6 rounded-2xl border border-border bg-card hover:border-credora-emerald/50 hover:bg-credora-emerald/5 transition-all text-left group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-credora-emerald/10 flex items-center justify-center group-hover:bg-credora-emerald/20 transition-colors">
                      <GraduationCap className="w-7 h-7 text-credora-emerald" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-1">I'm a Student</h3>
                      <p className="text-sm text-muted-foreground">
                        Get credit based on your skills, academics, and projects. Build your financial future.
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-credora-emerald transition-colors" />
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleRoleSelect("investor")}
                  className="w-full p-6 rounded-2xl border border-border bg-card hover:border-credora-blue/50 hover:bg-credora-blue/5 transition-all text-left group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-credora-blue/10 flex items-center justify-center group-hover:bg-credora-blue/20 transition-colors">
                      <TrendingUp className="w-7 h-7 text-credora-blue" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-1">I'm an Investor</h3>
                      <p className="text-sm text-muted-foreground">
                        Fund promising students and earn stable returns through diversified pools.
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-credora-blue transition-colors" />
                  </div>
                </motion.button>
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
