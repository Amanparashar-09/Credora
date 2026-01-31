import { InvestorLayout } from "@/components/layouts/InvestorLayout";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Calculator } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import investorService from "@/services/investor.service";
import type { InvestorDashboard as DashboardData } from "@/types/api.types";

export default function Analytics() {
  const [roiAmount, setRoiAmount] = useState("10000");
  const [roiPeriod, setRoiPeriod] = useState("12");
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const data = await investorService.getDashboard();
        setDashboardData(data);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const currentAPY = dashboardData?.returns.currentAPY || 0;

  const calculateROI = () => {
    const principal = parseFloat(roiAmount) || 0;
    const months = parseInt(roiPeriod) || 1;
    const monthlyRate = currentAPY / 100 / 12;
    const futureValue = principal * Math.pow(1 + monthlyRate, months);
    const earnings = futureValue - principal;
    return { futureValue, earnings };
  };

  const roi = calculateROI();

  if (isLoading) {
    return (
      <InvestorLayout>
        <div className="flex items-center justify-center h-96">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </InvestorLayout>
    );
  }

  return (
    <InvestorLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold mb-2">ROI Calculator</h2>
          <p className="text-sm text-muted-foreground">
            Project your future earnings based on current pool APY
          </p>
        </div>

        {/* ROI Calculator - Only showing real APY data */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-credora-blue/10 flex items-center justify-center">
                    <Calculator className="w-6 h-6 text-credora-blue" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">ROI Calculator</h3>
                    <p className="text-sm text-muted-foreground">Project your future earnings</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Investment Amount ($)</label>
                      <Input
                        type="number"
                        value={roiAmount}
                        onChange={(e) => setRoiAmount(e.target.value)}
                        placeholder="10000"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Time Period (months)</label>
                      <Input
                        type="number"
                        value={roiPeriod}
                        onChange={(e) => setRoiPeriod(e.target.value)}
                        placeholder="12"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Current APY</label>
                      <Input
                        type="text"
                        value={`${currentAPY}%`}
                        disabled
                        className="w-full bg-muted"
                      />
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-credora-blue/5 to-credora-purple/5 rounded-xl p-6 border border-credora-blue/20">
                    <h4 className="font-semibold mb-4">Projected Results</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Initial Investment</span>
                        <span className="font-semibold">${parseFloat(roiAmount || "0").toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Time Period</span>
                        <span className="font-semibold">{roiPeriod} months</span>
                      </div>
                      <div className="h-px bg-border my-3" />
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Total Earnings</span>
                        <span className="font-semibold text-credora-emerald text-lg">
                          +${roi.earnings.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Future Value</span>
                        <span className="font-bold text-credora-blue text-xl">
                          ${roi.futureValue.toFixed(2)}
                        </span>
                      </div>
                      <div className="mt-4 p-3 bg-credora-emerald/10 rounded-lg border border-credora-emerald/20">
                        <p className="text-xs text-center text-credora-emerald font-medium">
                          {((roi.earnings / parseFloat(roiAmount || "1")) * 100).toFixed(1)}% ROI
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    <strong>Note:</strong> This calculator uses the current pool APY of {currentAPY}% and assumes compound interest. 
                    Actual returns may vary based on pool performance and market conditions.
                  </p>
                </div>
              </Card>
        </motion.div>
      </div>
    </InvestorLayout>
  );
}
