"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  TrendingUp,
  Building2,
  MapPin,
  BarChart3,
  Shield,
  Zap,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Radar,
} from "lucide-react";
import { useAuth } from "../lib/auth";

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#00C805] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400 text-sm">טוען...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white" dir="rtl">
      {/* Navigation */}
      <nav className="border-b border-[#2D333F] bg-[#151921]/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-[#00C805] to-[#00A004] rounded-lg">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">InvestIntel</h1>
              <p className="text-xs text-slate-400">מודיעין נדלן מקצועי</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
            >
              התחברות
            </Link>
            <Link
              href="/login"
              className="px-6 py-2.5 bg-gradient-to-r from-[#00C805] to-[#00A004] hover:from-[#00D806] hover:to-[#00B505] text-white font-semibold rounded-xl transition-all shadow-lg shadow-[#00C805]/20"
            >
              התחל עכשיו
              <ArrowRight className="w-4 h-4 inline-block mr-2" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#00C805]/5 via-transparent to-transparent"></div>
        <div className="max-w-7xl mx-auto px-6 py-24 lg:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#151921] border border-[#2D333F] rounded-full text-sm text-[#00C805] mb-6">
              <Sparkles className="w-4 h-4" />
              <span>פלטפורמת מודיעין נדלן מתקדמת</span>
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-white to-slate-300 bg-clip-text text-transparent">
              מודיעין נדלן מקצועי
              <br />
              <span className="text-[#00C805]">למשקיעים חכמים</span>
            </h1>
            <p className="text-xl text-slate-400 mb-8 max-w-2xl mx-auto">
              כלי ניתוח מתקדם לנדל"ן בריטי עם נתונים חיים, ניתוח AI, ומעקב תיק השקעות מקצועי
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link
                href="/login"
                className="px-8 py-4 bg-gradient-to-r from-[#00C805] to-[#00A004] hover:from-[#00D806] hover:to-[#00B505] text-white font-semibold rounded-xl transition-all shadow-lg shadow-[#00C805]/30 text-lg"
              >
                התחל בחינם
                <ArrowRight className="w-5 h-5 inline-block mr-2" />
              </Link>
              <Link
                href="/login"
                className="px-8 py-4 bg-[#151921] border border-[#2D333F] hover:border-[#00C805]/50 text-white font-semibold rounded-xl transition-all text-lg"
              >
                צפה בדמו
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-[#151921]/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">כל מה שצריך לניתוח נדל"ן מקצועי</h2>
            <p className="text-slate-400 text-lg">כלים מתקדמים לניתוח, מעקב והחלטות השקעה</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-[#151921] border border-[#2D333F] rounded-xl p-6 hover:border-[#00C805]/50 transition-all">
              <div className="p-3 bg-[#00C805]/20 rounded-lg w-fit mb-4">
                <BarChart3 className="w-6 h-6 text-[#00C805]" />
              </div>
              <h3 className="text-xl font-semibold mb-2">נתונים חיים</h3>
              <p className="text-slate-400">
                גישה לנתונים ממשלתיים עדכניים: Land Registry, EPC, Crime Stats, ועוד
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-[#151921] border border-[#2D333F] rounded-xl p-6 hover:border-[#00C805]/50 transition-all">
              <div className="p-3 bg-[#00C805]/20 rounded-lg w-fit mb-4">
                <Zap className="w-6 h-6 text-[#00C805]" />
              </div>
              <h3 className="text-xl font-semibold mb-2">ניתוח AI</h3>
              <p className="text-slate-400">
                שאל את ה-AI על כל נכס, קבל המלצות השקעה מבוססות נתונים
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-[#151921] border border-[#2D333F] rounded-xl p-6 hover:border-[#00C805]/50 transition-all">
              <div className="p-3 bg-[#00C805]/20 rounded-lg w-fit mb-4">
                <Building2 className="w-6 h-6 text-[#00C805]" />
              </div>
              <h3 className="text-xl font-semibold mb-2">ניהול תיק</h3>
              <p className="text-slate-400">
                מעקב מלא אחר נכסים, חישובי ROI, תשואות, וניתוח ביצועים
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-[#151921] border border-[#2D333F] rounded-xl p-6 hover:border-[#00C805]/50 transition-all">
              <div className="p-3 bg-[#00C805]/20 rounded-lg w-fit mb-4">
                <Radar className="w-6 h-6 text-[#00C805]" />
              </div>
              <h3 className="text-xl font-semibold mb-2">רדאר שוק</h3>
              <p className="text-slate-400">
                זיהוי עסקאות מתחת למחיר השוק, התראות בזמן אמת
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-[#151921] border border-[#2D333F] rounded-xl p-6 hover:border-[#00C805]/50 transition-all">
              <div className="p-3 bg-[#00C805]/20 rounded-lg w-fit mb-4">
                <MapPin className="w-6 h-6 text-[#00C805]" />
              </div>
              <h3 className="text-xl font-semibold mb-2">מפות אינטראקטיביות</h3>
              <p className="text-slate-400">
                מפות מפורטות עם POI, תחבורה, בתי ספר, וניתוח סביבתי
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-[#151921] border border-[#2D333F] rounded-xl p-6 hover:border-[#00C805]/50 transition-all">
              <div className="p-3 bg-[#00C805]/20 rounded-lg w-fit mb-4">
                <Shield className="w-6 h-6 text-[#00C805]" />
              </div>
              <h3 className="text-xl font-semibold mb-2">אבטחה מלאה</h3>
              <p className="text-slate-400">
                נתונים מוצפנים, גישה פרטית לכל משתמש, גיבוי אוטומטי
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="bg-gradient-to-br from-[#151921] to-[#0B0E14] border border-[#2D333F] rounded-2xl p-12">
            <h2 className="text-3xl font-bold mb-4">מוכן להתחיל?</h2>
            <p className="text-slate-400 mb-8 text-lg">
              הצטרף למשקיעים שמשתמשים במודיעין נדלן מקצועי לקבלת החלטות טובות יותר
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#00C805] to-[#00A004] hover:from-[#00D806] hover:to-[#00B505] text-white font-semibold rounded-xl transition-all shadow-lg shadow-[#00C805]/30 text-lg"
            >
              צור חשבון בחינם
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#2D333F] bg-[#151921]/30 py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-[#00C805] to-[#00A004] rounded-lg">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-slate-400 text-sm">© 2026 InvestIntel. כל הזכויות שמורות.</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-400">
              <Link href="/login" className="hover:text-[#00C805] transition-colors">
                תנאי שימוש
              </Link>
              <Link href="/login" className="hover:text-[#00C805] transition-colors">
                מדיניות פרטיות
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
