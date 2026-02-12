"use client";

import { Search, Bell, User, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../lib/auth";
import { cn } from "../lib/utils";

interface TopHeaderProps {
  breadcrumbs?: { label: string; href?: string }[];
  notificationCount?: number;
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
}

const PAGE_TITLES: Record<string, string> = {
  dashboard: "Dashboard",
  properties: "My Properties",
  explorer: "Market Explorer",
  news: "News & Macro",
};

export default function TopHeader({
  breadcrumbs,
  notificationCount = 0,
  searchPlaceholder = "Search properties, postcodes...",
}: TopHeaderProps) {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();

  const defaultBreadcrumbs = (): { label: string; href?: string }[] => {
    if (pathname === "/portfolio") return [{ label: "My Portfolio" }];
    return [{ label: "InvestIntel", href: "/" }, { label: "Overview" }];
  };

  const crumbs = breadcrumbs ?? defaultBreadcrumbs();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 shadow-sm">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-600" aria-label="Breadcrumb">
        {crumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-2">
            {i > 0 && <ChevronRight className="h-4 w-4 text-slate-400" />}
            {crumb.href ? (
              <Link href={crumb.href} className="hover:text-teal-600 font-medium transition-colors">
                {crumb.label}
              </Link>
            ) : (
              <span className="font-semibold text-slate-900">{crumb.label}</span>
            )}
          </span>
        ))}
      </nav>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden sm:block w-64 lg:w-80">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder={searchPlaceholder}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pr-10 pl-4 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>

        {/* Notifications */}
        <button
          type="button"
          className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {notificationCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {notificationCount > 9 ? "9+" : notificationCount}
            </span>
          )}
        </button>

        {/* User profile */}
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/50 pl-2 pr-3 py-1.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 text-white">
            {isAuthenticated && user ? (
              <span className="text-sm font-semibold">{user.name?.charAt(0).toUpperCase() ?? "?"}</span>
            ) : (
              <User className="h-4 w-4" />
            )}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-sm font-medium text-slate-900">{user?.name ?? "Guest"}</p>
            <p className="text-xs text-slate-500 truncate max-w-[120px]">{user?.email ?? ""}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
