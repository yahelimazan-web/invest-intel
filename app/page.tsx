"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar, { type PageId, SIDEBAR_WIDTH } from "./components/Sidebar";
import TopHeader from "./components/TopHeader";
import Dashboard from "./components/pages/Dashboard";
import MyProperties from "./components/pages/MyProperties";
import MarketExplorer from "./components/pages/MarketExplorer";
import NewsPage from "./components/pages/NewsPage";
import AlertsPanel from "./components/AlertsPanel";
import AreaRadar from "./components/AreaRadar";
import ChatInterface from "./components/ChatInterface";
import { ALERTS } from "./lib/data";
import { useAuth, getUserData } from "./lib/auth";

export default function App() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  const [currentPage, setCurrentPage] = useState<PageId>("insights");
  const [isAlertsPanelOpen, setIsAlertsPanelOpen] = useState(false);
  const [isRadarOpen, setIsRadarOpen] = useState(false);
  const [radarAlertCount, setRadarAlertCount] = useState(0);
  
  // Redirect to landing if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/landing");
    }
  }, [authLoading, isAuthenticated, router]);
  
  // Count unread alerts
  const unreadCount = ALERTS.filter((a) => !a.read).length;

  // Check for radar deals on mount and periodically (user-specific)
  useEffect(() => {
    if (authLoading) return;
    
    const checkRadarDeals = () => {
      try {
        const userId = user?.id || null;
        const postcodes = getUserData<any[]>(userId, "investintel-watched-postcodes", []);
        let totalDeals = 0;
        postcodes.forEach((pc: any) => {
          if (pc.deals) {
            totalDeals += pc.deals.filter((d: any) => !d.seen).length;
          }
        });
        setRadarAlertCount(totalDeals);
      } catch (e) {
        console.error("Error checking radar deals:", e);
      }
    };

    checkRadarDeals();
    // Check every 30 seconds
    const interval = setInterval(checkRadarDeals, 30000);
    return () => clearInterval(interval);
  }, [authLoading, user?.id]);

  // Handle page navigation
  const handlePageChange = useCallback((page: PageId) => {
    setCurrentPage(page);
  }, []);

  const handleRadarDealClick = useCallback((_postcode?: string, _address?: string) => {
    setIsRadarOpen(false);
    setCurrentPage("insights");
  }, []);

  const PAGE_BREADCRUMBS: Record<PageId, { label: string; href?: string }[]> = {
    portfolio: [{ label: "InvestIntel", href: "/" }, { label: "תיק השקעות" }],
    insights: [{ label: "InvestIntel", href: "/" }, { label: "תובנות" }],
    settings: [{ label: "InvestIntel", href: "/" }, { label: "הגדרות" }],
  };

  const renderPage = () => {
    switch (currentPage) {
      case "portfolio":
        return <MyProperties />;
      case "insights":
        return <Dashboard />;
      case "settings":
        return (
          <div className="bento-card p-8 max-w-xl">
            <h2 className="text-xl font-semibold text-slate-900 mb-2">הגדרות</h2>
            <p className="text-slate-600">הגדרות מערכת יופיעו כאן.</p>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  // Show loading or redirect if not authenticated
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 text-sm">טוען...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      {/* Fixed sidebar: Portfolio, Insights, Settings - layout shifts with sidebar width */}
      <Sidebar currentPage={currentPage} onPageChange={handlePageChange} />

      {/* Main content area: margin matches sidebar so content does not sit under it */}
      <div
        className="min-h-screen flex flex-col transition-[margin-left] duration-300 ease-in-out"
        style={{ marginLeft: SIDEBAR_WIDTH }}
      >
        <TopHeader
          breadcrumbs={PAGE_BREADCRUMBS[currentPage]}
          notificationCount={unreadCount}
        />
        <main className="flex-1 p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Alerts Panel */}
      <AlertsPanel
        isOpen={isAlertsPanelOpen}
        onClose={() => setIsAlertsPanelOpen(false)}
      />

      {/* Area Radar Panel */}
      <AreaRadar
        isOpen={isRadarOpen}
        onClose={() => setIsRadarOpen(false)}
        onDealClick={handleRadarDealClick}
      />

      {/* AI Chat */}
      <ChatInterface isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}
