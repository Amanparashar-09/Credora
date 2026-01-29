import { InvestorLayout } from "@/components/layouts/InvestorLayout";
import { motion } from "framer-motion";
import { useState } from "react";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, DollarSign, Calculator, ArrowUpRight, ArrowDownRight, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mock data - replace with real API data later
const historicalAPY = [
  { month: "Jul", apy: 10.2 },
  { month: "Aug", apy: 10.8 },
  { month: "Sep", apy: 11.2 },
  { month: "Oct", apy: 11.5 },
  { month: "Nov", apy: 11.8 },
  { month: "Dec", apy: 12.1 },
  { month: "Jan", apy: 12.4 },
];

const earningsHistory = [
  { month: "Jul", earnings: 150, investment: 10000 },
  { month: "Aug", earnings: 320, investment: 10000 },
  { month: "Sep", earnings: 510, investment: 15000 },
  { month: "Oct", earnings: 720, investment: 15000 },
  { month: "Nov", earnings: 940, investment: 18000 },
  { month: "Dec", earnings: 1180, investment: 18000 },
  { month: "Jan", earnings: 1440, investment: 18000 },
];

const comparativeData = [
  { month: "Jul", credora: 10.2, savings: 4.5, market: 7.8 },
  { month: "Aug", credora: 10.8, savings: 4.5, market: 8.1 },
  { month: "Sep", credora: 11.2, savings: 4.5, market: 7.5 },
  { month: "Oct", credora: 11.5, savings: 4.5, market: 8.3 },
  { month: "Nov", credora: 11.8, savings: 4.5, market: 7.9 },
  { month: "Dec", credora: 12.1, savings: 4.5, market: 8.0 },
  { month: "Jan", credora: 12.4, savings: 4.5, market: 8.2 },
];

const transactionHistory = [
  { date: "2026-01-28", type: "deposit", amount: 3000, apy: 12.4, txHash: "0x1a2b3c..." },
  { date: "2026-01-15", type: "earnings", amount: 186, apy: 12.3, txHash: "0x4d5e6f..." },
  { date: "2025-12-28", type: "deposit", amount: 5000, apy: 12.1, txHash: "0x7g8h9i..." },
  { date: "2025-12-15", type: "earnings", amount: 175, apy: 12.0, txHash: "0xjk1l2m..." },
  { date: "2025-11-20", type: "deposit", amount: 10000, apy: 11.8, txHash: "0xno3p4q..." },
];

export default function Analytics() {
  const [roiAmount, setRoiAmount] = useState("10000");
  const [roiPeriod, setRoiPeriod] = useState("12");
  const currentAPY = 12.4;

  const calculateROI = () => {
    const principal = parseFloat(roiAmount) || 0;
    const months = parseInt(roiPeriod) || 1;
    const monthlyRate = currentAPY / 100 / 12;
    const futureValue = principal * Math.pow(1 + monthlyRate, months);
    const earnings = futureValue - principal;
    return { futureValue, earnings };
  };

  const roi = calculateROI();

  return (
    <InvestorLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold mb-2">Investment Performance Analytics</h2>
          <p className="text-sm text-muted-foreground">
            Detailed insights into your portfolio performance and earnings
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Current APY</span>
                <TrendingUp className="w-4 h-4 text-credora-emerald" />
              </div>
              <p className="text-2xl font-bold text-credora-emerald">{currentAPY}%</p>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-credora-emerald">↑ 0.3%</span> vs last month
              </p>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Total Earnings</span>
                <DollarSign className="w-4 h-4 text-credora-blue" />
              </div>
              <p className="text-2xl font-bold">$1,440</p>
              <p className="text-xs text-muted-foreground mt-1">Since Jul 2025</p>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Avg Monthly</span>
                <Clock className="w-4 h-4 text-credora-amber" />
              </div>
              <p className="text-2xl font-bold">$205</p>
              <p className="text-xs text-muted-foreground mt-1">7 months average</p>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">vs Traditional</span>
                <ArrowUpRight className="w-4 h-4 text-credora-emerald" />
              </div>
              <p className="text-2xl font-bold text-credora-emerald">+175%</p>
              <p className="text-xs text-muted-foreground mt-1">vs 4.5% savings</p>
            </Card>
          </motion.div>
        </div>

        <Tabs defaultValue="charts" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="charts">Charts</TabsTrigger>
            <TabsTrigger value="calculator">ROI Calculator</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          {/* Charts Tab */}
          <TabsContent value="charts" className="space-y-6">
            {/* Historical APY Chart */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Historical Pool APY</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={historicalAPY}>
                    <defs>
                      <linearGradient id="colorAPY" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip 
                      contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                      formatter={(value: number) => [`${value}%`, 'APY']}
                    />
                    <Area type="monotone" dataKey="apy" stroke="#3b82f6" fillOpacity={1} fill="url(#colorAPY)" />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>
            </motion.div>

            {/* Your Earnings Over Time */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Your Earnings Over Time</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={earningsHistory}>
                    <defs>
                      <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip 
                      contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                      formatter={(value: number) => [`$${value}`, 'Earnings']}
                    />
                    <Area type="monotone" dataKey="earnings" stroke="#10b981" fillOpacity={1} fill="url(#colorEarnings)" />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>
            </motion.div>

            {/* Comparative Performance */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Comparative Performance</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={comparativeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip 
                      contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                      formatter={(value: number) => [`${value}%`, '']}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="credora" stroke="#3b82f6" strokeWidth={2} name="Credora Pool" />
                    <Line type="monotone" dataKey="savings" stroke="#9ca3af" strokeWidth={2} name="Savings (4.5%)" />
                    <Line type="monotone" dataKey="market" stroke="#f59e0b" strokeWidth={2} name="Market Index" />
                  </LineChart>
                </ResponsiveContainer>
                <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Credora Avg</p>
                    <p className="font-semibold text-credora-blue">11.4%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Savings Avg</p>
                    <p className="font-semibold text-muted-foreground">4.5%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Market Avg</p>
                    <p className="font-semibold text-credora-amber">8.0%</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          </TabsContent>

          {/* ROI Calculator Tab */}
          <TabsContent value="calculator">
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
          </TabsContent>

          {/* Transaction History Tab */}
          <TabsContent value="history">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Transaction History</h3>
                <div className="space-y-3">
                  {transactionHistory.map((tx, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            tx.type === "deposit"
                              ? "bg-credora-blue/10"
                              : "bg-credora-emerald/10"
                          }`}
                        >
                          {tx.type === "deposit" ? (
                            <ArrowDownRight className={`w-5 h-5 text-credora-blue`} />
                          ) : (
                            <ArrowUpRight className={`w-5 h-5 text-credora-emerald`} />
                          )}
                        </div>
                        <div>
                          <p className="font-medium capitalize">{tx.type}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(tx.date).toLocaleDateString()} • APY: {tx.apy}%
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-semibold ${
                            tx.type === "earnings" ? "text-credora-emerald" : ""
                          }`}
                        >
                          {tx.type === "earnings" ? "+" : ""}${tx.amount.toLocaleString()}
                        </p>
                        <a
                          href={`https://etherscan.io/tx/${tx.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-credora-blue hover:underline"
                        >
                          {tx.txHash}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </InvestorLayout>
  );
}
