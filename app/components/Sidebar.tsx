"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  LineChart,
  Bot,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  LogOut,
  User,
} from "lucide-react";
import { cn } from "../lib/utils";
import { useAuth } from "../lib/auth";

export type PageId = "dashboard" | "portfolio" | "market-analysis" | "ai-analyst";

interface SidebarProps {
  currentPage: PageId;
  onPageChange: (page: PageId) => void;
}

const NAV_ITEMS: Array<{
  id: PageId;
  label: string;
  icon: typeof LayoutDashboard;
  description: string;
}> = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, description: "Overview" },
  { id: "portfolio", label: "My Portfolio", icon: Briefcase, description: "Properties" },
  { id: "market-analysis", label: "Market Insights", icon: LineChart, description: "Market data" },
  { id: "ai-analyst", label: "AI Analyst", icon: Bot, description: "Smart analysis" },
];

const SIDEBAR_WIDTH = 256;
const SIDEBAR_WIDTH_COLLAPSED = 80;

export { SIDEBAR_WIDTH, SIDEBAR_WIDTH_COLLAPSED };

export default function Sidebar({ currentPage, onPageChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuth();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const width = isCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH;

  return (
    <aside
      className="fixed left-0 top-0 h-full bg-slate-900 border-r border-slate-800 z-40 flex flex-col transition-[width] duration-300 ease-in-out"
      style={{ width }}
      aria-label="Main navigation"
      suppressHydrationWarning
    >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/20 shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <h1 className="font-bold text-white truncate">InvestIntel</h1>
                <p className="text-xs text-slate-500">UK Real Estate Intelligence</p>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white shrink-0"
            aria-label={isCollapsed ? "Expand menu" : "Collapse menu"}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navigation - Home, Properties, Analysis, Settings */}
        <nav className="flex-1 py-4 overflow-y-auto px-2">
          <div className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = currentPage === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onPageChange(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                    isActive
                      ? "bg-teal-500/10 text-white border-l-2 border-teal-500"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon
                    className={cn("w-5 h-5 flex-shrink-0", isActive ? "text-teal-400" : "")}
                    aria-hidden
                  />
                  {!isCollapsed && (
                    <div className="text-left min-w-0">
                      <p className="font-medium truncate">{item.label}</p>
                      <p className="text-xs text-slate-500 truncate">{item.description}</p>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-slate-800 shrink-0">
          {isAuthenticated && user ? (
            <div className={cn("flex items-center gap-3", isCollapsed ? "justify-center" : "")}>
              <div className="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-sm">
                  {user.name?.charAt(0).toUpperCase() ?? "?"}
                </span>
              </div>
              {!isCollapsed && (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-white truncate">{user.name}</p>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="p-2 hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                    title="Log out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          ) : (
            <a
              href="/login"
              className={cn(
                "flex items-center gap-3 w-full rounded-lg p-2 hover:bg-slate-800/50 transition-colors",
                isCollapsed ? "justify-center" : ""
              )}
            >
              <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-slate-400" />
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-teal-400">Sign in / Sign up</p>
                  <p className="text-xs text-slate-500">To save your data</p>
                </div>
              )}
            </a>
          )}
        </div>
      </aside>
  );
}
