import { motion } from "framer-motion";
import { StudentLayout } from "@/components/layouts/StudentLayout";
import {
  CreditCard,
  TrendingUp,
  Info,
  Brain,
  CheckCircle,
  AlertCircle,
  Github,
  GraduationCap,
  Briefcase,
  DollarSign,
  Percent,
  Shield,
  RefreshCw,
  Upload,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { getProfile, refreshScore, syncBorrowingData, StudentProfile } from "@/services/studentProfile.service";
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface LocalTransaction {
  id: string;
  type: 'borrow' | 'repay';
  amount: string;
  timestamp: string;
  txHash: string;
  status: 'completed' | 'pending' | 'failed';
}

export default function CreditDetails() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<LocalTransaction[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Load transactions from localStorage
  const loadTransactions = () => {
    try {
      const stored = localStorage.getItem('credora_transactions');
      if (stored) {
        const parsed = JSON.parse(stored) as LocalTransaction[];
        // Sort by timestamp descending (newest first)
        setTransactions(parsed.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ));
      }
    } catch (err) {
      console.error('Failed to load transactions:', err);
    }
  };

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      
      // First sync borrowing data from blockchain
      try {
        await syncBorrowingData();
      } catch (syncErr) {
        console.error("Failed to sync borrowing data:", syncErr);
      }
      
      // Then fetch updated profile
      const data = await getProfile();
      setProfile(data);
    } catch (err) {
      const error = err as Error;
      console.error("Failed to fetch profile:", err);
      if (!profile) {
        toast({
          title: "No Profile Found",
          description: "Please complete your profile to view credit details",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    loadTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefreshScore = async () => {
    try {
      setIsRefreshing(true);
      
      // Sync borrowing data from blockchain first
      try {
        await syncBorrowingData();
      } catch (syncErr) {
        console.error("Failed to sync borrowing data:", syncErr);
      }
      
      // Then refresh credit score
      const updatedProfile = await refreshScore();
      
      // Fetch complete profile to get updated values
      const fullProfile = await getProfile();
      setProfile(fullProfile);
      
      sonnerToast.success('Credit data refreshed successfully');
    } catch (err) {
      const error = err as Error;
      sonnerToast.error(error.message);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getRiskColor = (tier: string) => {
    switch (tier) {
      case 'LOW':
        return 'bg-green-500';
      case 'MEDIUM':
        return 'bg-yellow-500';
      case 'HIGH':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 65) return 'text-blue-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getGrade = (score: number) => {
    if (score >= 80) return 'A+';
    if (score >= 65) return 'A';
    if (score >= 50) return 'B';
    return 'C';
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

  if (!profile) {
    return (
      <StudentLayout>
        <div className="max-w-2xl mx-auto mt-12">
          <div className="bg-card rounded-2xl border border-border p-8 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">No Credit Profile Found</h2>
            <p className="text-muted-foreground mb-6">
              Complete your profile to get your credit score and buying power
            </p>
            <Button onClick={() => navigate('/student/onboarding')}>
              <Upload className="mr-2 h-4 w-4" />
              Submit Profile
            </Button>
          </div>
        </div>
      </StudentLayout>
    );
  }

  // Generate credit factors based on score
  const creditFactors = [
    {
      factor: "Academic Performance",
      score: Math.min(100, Math.floor((profile.gpa / 10) * 100)),
      impact: "High" as const,
      description: `Based on your GPA of ${profile.gpa.toFixed(2)}`,
    },
    {
      factor: "GitHub Activity",
      score: Math.min(100, Math.floor(profile.creditScore / 8.5)),
      impact: "High" as const,
      description: `Quality and consistency of code contributions (@${profile.githubUsername})`,
    },
    {
      factor: "Professional Experience",
      score: Math.min(100, profile.internships * 25),
      impact: "Medium" as const,
      description: `${profile.internships} internship${profile.internships !== 1 ? 's' : ''} completed`,
    },
    {
      factor: "Payment History",
      score: (profile.defaultCount ?? 0) === 0 ? 100 : Math.max(0, 100 - ((profile.defaultCount ?? 0) * 20)),
      impact: "High" as const,
      description: `${profile.defaultCount ?? 0} default${(profile.defaultCount ?? 0) !== 1 ? 's' : ''} on record`,
    },
  ];

  return (
    <StudentLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header with Refresh Button */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Credit Details & Buying Power</h1>
            <p className="text-muted-foreground">
              Your credit score and borrowing capacity based on AI analysis
            </p>
          </div>
          <Button
            onClick={handleRefreshScore}
            disabled={isRefreshing}
            variant="outline"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Limits
          </Button>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl border border-border p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Credit Score</p>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className={`text-3xl font-bold ${getScoreColor(profile.creditScore)}`}>
              {profile.creditScore}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Out of 100</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-2xl border border-border p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Available Credit</p>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold text-green-600">
              ${parseFloat(profile.availableCredit).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Ready to borrow</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-2xl border border-border p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Interest Rate</p>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold">{profile.interestRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">Annual rate</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card rounded-2xl border border-border p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Risk Tier</p>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </div>
            <Badge className={getRiskColor(profile.riskTier)}>
              {profile.riskTier}
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">Risk assessment</p>
          </motion.div>
        </div>

        {/* Profile Overview Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card rounded-2xl border border-border p-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-xl">Profile Overview</h3>
              <p className="text-sm text-muted-foreground">Your complete credit profile at a glance</p>
            </div>
            <Button 
              onClick={() => navigate('/student/onboarding')}
              size="sm"
              variant="outline"
            >
              <Upload className="mr-2 h-4 w-4" />
              Update Profile
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Personal Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-3">
                <GraduationCap className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wide">Academic Information</span>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">GPA</p>
                  <p className="text-lg font-semibold">{profile.gpa.toFixed(2)} / 10.0</p>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                    <div
                      className="bg-credora-emerald h-1.5 rounded-full"
                      style={{ width: `${(profile.gpa / 10) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Academic Performance</p>
                  <p className="text-sm font-medium">
                    {profile.gpa >= 8.5 ? 'Outstanding' : profile.gpa >= 7.5 ? 'Excellent' : profile.gpa >= 6.5 ? 'Good' : 'Average'}
                  </p>
                </div>
              </div>
            </div>

            {/* Professional Experience */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-3">
                <Briefcase className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wide">Professional Experience</span>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Internships Completed</p>
                  <p className="text-lg font-semibold">{profile.internships}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Experience Level</p>
                  <p className="text-sm font-medium">
                    {profile.internships >= 3 ? 'Highly Experienced' : profile.internships >= 2 ? 'Experienced' : profile.internships >= 1 ? 'Entry Level' : 'Fresher'}
                  </p>
                </div>
              </div>
            </div>

            {/* Technical Skills */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-3">
                <Github className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wide">Technical Profile</span>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">GitHub Profile</p>
                  <a
                    href={`https://github.com/${profile.githubUsername}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1"
                  >
                    @{profile.githubUsername}
                    <ArrowUpRight className="h-3 w-3" />
                  </a>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Code Quality</p>
                  <p className="text-sm font-medium">
                    {profile.creditScore >= 80 ? 'Exceptional' : profile.creditScore >= 65 ? 'High Quality' : profile.creditScore >= 50 ? 'Good' : 'Developing'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Credit Score Breakdown */}
          <div className="mt-8 pt-6 border-t">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-credora-emerald" />
              Credit Score Breakdown
            </h4>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-secondary/30 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground">Academic Score</p>
                  <CheckCircle className="h-3 w-3 text-credora-emerald" />
                </div>
                <p className="text-2xl font-bold">{Math.min(100, Math.floor((profile.gpa / 10) * 100))}</p>
                <p className="text-xs text-muted-foreground mt-1">Based on GPA</p>
              </div>
              <div className="bg-secondary/30 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground">Technical Score</p>
                  <CheckCircle className="h-3 w-3 text-credora-blue" />
                </div>
                <p className="text-2xl font-bold">{Math.min(100, Math.floor(profile.creditScore / 8.5))}</p>
                <p className="text-xs text-muted-foreground mt-1">GitHub activity</p>
              </div>
              <div className="bg-secondary/30 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground">Experience Score</p>
                  <CheckCircle className="h-3 w-3 text-credora-amber" />
                </div>
                <p className="text-2xl font-bold">{Math.min(100, profile.internships * 25)}</p>
                <p className="text-xs text-muted-foreground mt-1">Work experience</p>
              </div>
              <div className="bg-secondary/30 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground">Payment History</p>
                  <CheckCircle className={`h-3 w-3 ${(profile.defaultCount ?? 0) === 0 ? 'text-credora-emerald' : 'text-red-500'}`} />
                </div>
                <p className="text-2xl font-bold">{(profile.defaultCount ?? 0) === 0 ? 100 : Math.max(0, 100 - ((profile.defaultCount ?? 0) * 20))}</p>
                <p className="text-xs text-muted-foreground mt-1">{profile.defaultCount ?? 0} defaults</p>
              </div>
            </div>
          </div>

          {/* Profile Completeness */}
          <div className="mt-6 bg-credora-blue/5 border border-credora-blue/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-credora-blue flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium mb-1">Profile Last Updated</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(profile.lastUpdated).toLocaleString()} • Keep your profile updated to maintain accurate credit assessments
                </p>
              </div>
            </div>
          </div>
        </motion.div>

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
                  <h2 className="text-3xl font-bold">${parseFloat(profile.maxBorrowingLimit).toLocaleString()}</h2>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="p-4 rounded-xl bg-secondary/50">
                  <p className="text-xs text-muted-foreground mb-1">Current Borrowed</p>
                  <p className="text-xl font-semibold">${parseFloat(profile.currentBorrowed).toLocaleString()}</p>
                </div>
                <div className="p-4 rounded-xl bg-secondary/50">
                  <p className="text-xs text-muted-foreground mb-1">Available Credit</p>
                  <p className="text-xl font-semibold text-green-600">${parseFloat(profile.availableCredit).toLocaleString()}</p>
                </div>
              </div>
              {/* Credit Utilization */}
              <div className="mt-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Credit Utilization</span>
                  <span className="text-sm font-medium">
                    {((parseFloat(profile.currentBorrowed) / parseFloat(profile.maxBorrowingLimit)) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min((parseFloat(profile.currentBorrowed) / parseFloat(profile.maxBorrowingLimit)) * 100, 100)}%`
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="flex-1 lg:max-w-xs">
              <div className="bg-credora-emerald/5 border border-credora-emerald/20 rounded-2xl p-6 text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-credora-emerald/10 flex items-center justify-center">
                  <span className="text-3xl font-bold text-credora-emerald">{getGrade(profile.creditScore)}</span>
                </div>
                <h3 className="font-semibold mb-1">Credit Grade</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Based on your credit score of {profile.creditScore}
                </p>
                {/* Profile Info */}
                <div className="space-y-3 text-left mt-6">
                  <div className="flex items-center gap-2">
                    <Github className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={`https://github.com/${profile.githubUsername}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      @{profile.githubUsername}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">GPA: {profile.gpa.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{profile.internships} Internship{profile.internships !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                <Button 
                  onClick={() => navigate('/student/onboarding')}
                  className="mt-6 w-full"
                  size="sm"
                  variant="outline"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Update Profile
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
              Based on our AI analysis, you've been assigned a credit limit of{" "}
              <strong>${parseFloat(profile.maxBorrowingLimit).toLocaleString()}</strong>. Your {profile.gpa >= 8 ? 'strong' : 'solid'} academic record ({profile.gpa.toFixed(2)} GPA), 
              consistent GitHub activity (@{profile.githubUsername}), and {profile.internships}{" "}
              verified internship{profile.internships !== 1 ? 's' : ''} indicate {profile.creditScore >= 80 ? 'exceptional' : profile.creditScore >= 65 ? 'high' : 'good'} earning potential post-graduation. 
              Your interest rate of <strong>{profile.interestRate}% p.a.</strong> reflects your{" "}
              <strong>{profile.riskTier}</strong> risk tier based on comprehensive profile analysis.
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

        {/* Borrowing History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card rounded-2xl border border-border p-8"
        >
          <h3 className="font-semibold mb-6">Borrowing History</h3>
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Borrowed</p>
              <p className="text-2xl font-semibold">
                ${parseFloat(profile.totalBorrowed || '0').toLocaleString()}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Repaid</p>
              <p className="text-2xl font-semibold text-green-600">
                ${parseFloat(profile.totalRepaid || '0').toLocaleString()}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Defaults</p>
              <p className="text-2xl font-semibold text-red-600">
                {profile.defaultCount ?? 0}
              </p>
            </div>
          </div>

          {/* Transaction History */}
          <div className="border-t pt-6">
            <h4 className="text-sm font-medium mb-4">Recent Transactions</h4>
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No transactions yet</p>
                <p className="text-xs mt-1">Your borrow and repay history will appear here</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {transactions.slice(0, 10).map((tx) => (
                  <div 
                    key={tx.id} 
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center",
                        tx.type === 'borrow' ? 'bg-blue-500/10' : 'bg-green-500/10'
                      )}>
                        {tx.type === 'borrow' ? (
                          <ArrowUpRight className="h-4 w-4 text-blue-500" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium capitalize">{tx.type}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.timestamp).toLocaleDateString()} at {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        "text-sm font-semibold",
                        tx.type === 'borrow' ? 'text-blue-600' : 'text-green-600'
                      )}>
                        {tx.type === 'borrow' ? '+' : '-'}${parseFloat(tx.amount).toLocaleString()}
                      </p>
                      <a
                        href={`https://hoodi.etherscan.io/tx/${tx.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground hover:text-blue-500 hover:underline"
                      >
                        {tx.txHash.slice(0, 8)}...{tx.txHash.slice(-6)}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 pt-6 border-t">
            <p className="text-xs text-muted-foreground">
              Last updated: {new Date(profile.lastUpdated).toLocaleString()}
            </p>
          </div>
        </motion.div>

        {/* How to Improve */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
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
