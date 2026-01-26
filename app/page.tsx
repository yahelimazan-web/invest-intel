"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar, { type PageId } from "./components/Sidebar";
import Dashboard from "./components/pages/Dashboard";
import MyProperties from "./components/pages/MyProperties";
import MarketExplorer from "./components/pages/MarketExplorer";
import NewsPage from "./components/pages/NewsPage";
import AlertsPanel from "./components/AlertsPanel";
import AreaRadar from "./components/AreaRadar";
import { ALERTS } from "./lib/data";
import { useAuth, getUserData } from "./lib/auth";

export default function App() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  const [currentPage, setCurrentPage] = useState<PageId>("dashboard");
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

  // Handle radar deal click - navigate to explorer with the property
  const handleRadarDealClick = useCallback((postcode: string, address: string) => {
    setIsRadarOpen(false);
    setCurrentPage("explorer");
    // Could pass the postcode to MarketExplorer via context/state if needed
  }, []);

  // Render current page
  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard />;
      case "properties":
        return <MyProperties />;
      case "explorer":
        return <MarketExplorer />;
      case "news":
        return <NewsPage />;
      default:
        return <Dashboard />;
    }
  };

  // Show loading or redirect if not authenticated
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#00C805] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400 text-sm">טוען...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-[#0B0E14]" dir="rtl">
      {/* Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onPageChange={handlePageChange}
        notificationCount={unreadCount}
        radarAlertCount={radarAlertCount}
        onAlertsClick={() => setIsAlertsPanelOpen(true)}
        onRadarClick={() => setIsRadarOpen(true)}
      />

      {/* Main Content */}
      <main className="mr-64 min-h-screen">
        <div className="p-6 h-full">
          {renderPage()}
        </div>
      </main>

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
    </div>
  );
}
