import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";
import { motion } from "framer-motion";
import {
  Home,
  User,
  CreditCard,
  History,
  Award,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/lib/userContext";
import authService from "@/services/auth.service";
import { getProfile } from "@/services/studentProfile.service";

interface StudentLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { icon: Home, label: "Dashboard", path: "/student" },
  { icon: User, label: "Profile & Onboarding", path: "/student/onboarding" },
  { icon: CreditCard, label: "Credit Details", path: "/student/credit" },
  { icon: History, label: "Slices & EMIs", path: "/student/slices" },
  { icon: Award, label: "Reputation", path: "/student/reputation" },
  { icon: Settings, label: "Settings", path: "/student/settings" },
];

export function StudentLayout({ children }: StudentLayoutProps) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { walletAddress } = useUser();
  const [studentName, setStudentName] = useState<string>("Student");

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const profile = await getProfile();
        // Use name if available, otherwise fall back to "Student"
        if (profile && profile.name) {
          setStudentName(profile.name);
        } else {
          setStudentName("Student");
        }
      } catch (error) {
        console.error("Failed to fetch student profile:", error);
        setStudentName("Student");
      }
    };

    fetchStudentData();
  }, []);

  const handleLogout = () => {
    authService.logout();
    window.location.href = "/";
  };

  const formatAddress = (address: string) => {
    if (!address) return "Not Connected";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:sticky top-0 inset-y-0 left-0 z-50 w-72 h-screen bg-card border-r border-border flex flex-col transition-transform duration-300 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-6 flex items-center justify-between">
          <Logo size="md" />
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                  isActive
                    ? "bg-credora-emerald/10 text-credora-emerald"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="student-nav-indicator"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-credora-emerald"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors w-full"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Disconnect</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-semibold text-lg">Welcome back, {studentName}</h1>
              <p className="text-sm text-muted-foreground">
                Student Dashboard
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-credora-emerald/10 text-credora-emerald text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-credora-emerald" />
              {formatAddress(walletAddress)}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
