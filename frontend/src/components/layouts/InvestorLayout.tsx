import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";
import { motion } from "framer-motion";
import {
  Home,
  Droplets,
  TrendingUp,
  DollarSign,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface InvestorLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { icon: Home, label: "Dashboard", path: "/investor" },
  { icon: Droplets, label: "Liquidity Pools", path: "/investor/pools" },
  { icon: TrendingUp, label: "Invest", path: "/investor/invest" },
  { icon: DollarSign, label: "Returns & Withdraw", path: "/investor/returns" },
  { icon: BarChart3, label: "Risk Analytics", path: "/investor/analytics" },
  { icon: Settings, label: "Settings", path: "/investor/settings" },
];

export function InvestorLayout({ children }: InvestorLayoutProps) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex">
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
          "fixed lg:static inset-y-0 left-0 z-50 w-72 bg-card border-r border-border flex flex-col transition-transform duration-300 lg:translate-x-0",
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
                    ? "bg-credora-blue/10 text-credora-blue"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="investor-nav-indicator"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-credora-blue"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Disconnect</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border px-6 py-4 flex items-center justify-between">
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
              <h1 className="font-semibold text-lg">Welcome back, Investor</h1>
              <p className="text-sm text-muted-foreground">
                Portfolio Overview
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-credora-blue/10 text-credora-blue text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-credora-blue" />
              0x8765...4321
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
