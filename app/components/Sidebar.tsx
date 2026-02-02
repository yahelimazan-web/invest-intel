"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Map,
  Newspaper,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  LogOut,
  User,
  HelpCircle,
  FolderOpen,
  Radar,
} from "lucide-react";
import { cn } from "../lib/utils";
import { useAuth } from "../lib/auth";

export type PageId = "dashboard" | "properties" | "explorer" | "news";

interface SidebarProps {
  currentPage: PageId;
  onPageChange: (page: PageId) => void;
  notificationCount?: number;
  radarAlertCount?: number;
  onAlertsClick?: () => void;
  onRadarClick?: () => void;
}

const NAV_ITEMS: Array<{
  id: PageId;
  label: string;
  icon: typeof LayoutDashboard;
  description: string;
}> = [
  {
    id: "dashboard",
    label: "דשבורד",
    icon: LayoutDashboard,
    description: "סקירה כללית",
  },
  {
    id: "properties",
    label: "הנכסים שלי",
    icon: Building2,
    description: "ניהול תיק נכסים",
  },
  {
    id: "explorer",
    label: "סייר שוק",
    icon: Map,
    description: "חקור הזדמנויות",
  },
  {
    id: "news",
    label: "חדשות ומאקרו",
    icon: Newspaper,
    description: "עדכוני שוק",
  },
];

export default function Sidebar({
  currentPage,
  onPageChange,
  notificationCount = 0,
  radarAlertCount = 0,
  onAlertsClick,
  onRadarClick,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, isAuthenticated } = useAuth();
  const isPortfolioPage = pathname === "/portfolio";

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <aside
      className={cn(
        "fixed right-0 top-0 h-full bg-slate-900 border-l border-slate-800 z-40 transition-all duration-300 flex flex-col",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="font-bold text-white">InvestIntel</h1>
              <p className="text-xs text-slate-500">מודיעין נדל״ן</p>
            </div>
          )}
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
        >
          {isCollapsed ? (
            <ChevronLeft className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <div className="space-y-1 px-2">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                currentPage === item.id
                  ? "bg-emerald-500/10 text-white border-r-2 border-emerald-500"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5 flex-shrink-0",
                currentPage === item.id ? "text-emerald-400" : ""
              )} />
              {!isCollapsed && (
                <div className="text-right">
                  <p className="font-medium">{item.label}</p>
                  <p className="text-xs text-slate-500">{item.description}</p>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="my-4 mx-4 border-t border-slate-800" />

        {/* Secondary nav */}
        <div className="space-y-1 px-2">
          {/* Portfolio Link */}
          <Link 
            href="/portfolio"
            className={cn(
              "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors",
              isPortfolioPage
                ? "text-pink-400 bg-pink-500/20 border border-pink-500/30"
                : "text-slate-400 hover:text-pink-400 hover:bg-pink-500/10"
            )}
          >
            <FolderOpen className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span>תיק השקעות</span>}
          </Link>
          
          {/* Market Radar */}
          <button 
            type="button"
            onClick={onRadarClick}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors relative"
          >
            <Radar className={cn(
              "w-5 h-5 flex-shrink-0",
              radarAlertCount > 0 && "text-cyan-400"
            )} />
            {!isCollapsed && <span>רדאר שוק</span>}
            {radarAlertCount > 0 && (
              <>
                {/* Pulse animation for deals */}
                <span className={cn(
                  "absolute bg-cyan-500 rounded-full animate-ping opacity-75",
                  isCollapsed ? "top-1 right-1 w-3 h-3" : "right-3 top-2.5 w-2 h-2"
                )} />
                <span className={cn(
                  "bg-cyan-500 text-white text-xs font-bold rounded-full flex items-center justify-center",
                  isCollapsed ? "absolute top-1 right-1 w-4 h-4" : "mr-auto w-5 h-5"
                )}>
                  {radarAlertCount > 9 ? "9+" : radarAlertCount}
                </span>
              </>
            )}
          </button>
          
          <button 
            type="button"
            onClick={onAlertsClick}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors relative"
          >
            <Bell className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span>התראות</span>}
            {notificationCount > 0 && (
              <span className={cn(
                "bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center",
                isCollapsed ? "absolute top-1 right-1 w-4 h-4" : "mr-auto w-5 h-5"
              )}>
                {notificationCount > 9 ? "9+" : notificationCount}
              </span>
            )}
          </button>
          <button type="button" className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors">
            <Settings className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span>הגדרות</span>}
          </button>
          <button type="button" className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors">
            <HelpCircle className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && <span>עזרה</span>}
          </button>
        </div>
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-slate-800">
        {isAuthenticated && user ? (
          <div className={cn(
            "flex items-center gap-3",
            isCollapsed ? "justify-center" : ""
          )}>
            <div className="w-10 h-10 bg-gradient-to-br from-[#00C805] to-[#00A004] rounded-full flex items-center justify-center shadow-md shadow-[#00C805]/20">
              <span className="text-white font-bold text-sm">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-white truncate">{user.name}</p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
              </div>
            )}
            {!isCollapsed && (
              <button 
                type="button"
                onClick={handleLogout}
                className="p-2 hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                title="התנתק"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <Link
            href="/login"
            className={cn(
              "flex items-center gap-3 w-full",
              isCollapsed ? "justify-center" : ""
            )}
          >
            <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-slate-400" />
            </div>
            {!isCollapsed && (
              <div className="flex-1">
                <p className="font-medium text-sm text-[#00C805]">התחבר / הירשם</p>
                <p className="text-xs text-slate-500">לשמירת נתונים</p>
              </div>
            )}
          </Link>
        )}
      </div>
    </aside>
  );
}
