import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UserProvider } from "@/lib/userContext";
import Index from "./pages/Index";
import ConnectWallet from "./pages/ConnectWallet";
import StudentDashboard from "./pages/student/Dashboard";
import StudentOnboarding from "./pages/student/Onboarding";
import CreditDetails from "./pages/student/CreditDetails";
import Slices from "./pages/student/Slices";
import Reputation from "./pages/student/Reputation";
import StudentSettings from "./pages/student/Settings";
import InvestorDashboard from "./pages/investor/Dashboard";
import LiquidityPools from "./pages/investor/Pools";
import Invest from "./pages/investor/Invest";
import Returns from "./pages/investor/Returns";
import Analytics from "./pages/investor/Analytics";
import InvestorSettings from "./pages/investor/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <UserProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/connect" element={<ConnectWallet />} />
            <Route path="/student" element={<StudentDashboard />} />
            <Route path="/student/onboarding" element={<StudentOnboarding />} />
            <Route path="/student/credit" element={<CreditDetails />} />
            <Route path="/student/slices" element={<Slices />} />
            <Route path="/student/reputation" element={<Reputation />} />
            <Route path="/student/settings" element={<StudentSettings />} />
            <Route path="/investor" element={<InvestorDashboard />} />
            <Route path="/investor/pools" element={<LiquidityPools />} />
            <Route path="/investor/invest" element={<Invest />} />
            <Route path="/investor/returns" element={<Returns />} />
            <Route path="/investor/analytics" element={<Analytics />} />
            <Route path="/investor/settings" element={<InvestorSettings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </UserProvider>
  </QueryClientProvider>
);

export default App;
