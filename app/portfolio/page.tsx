"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * My Portfolio — redirects to main app with portfolio view.
 * The full implementation (property cards, document upload, FAB) lives in app/page.tsx when currentPage === "portfolio".
 */
export default function PortfolioRoutePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/?view=portfolio");
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center" dir="ltr">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-600 text-sm">Loading portfolio...</p>
      </div>
    </div>
  );
}
