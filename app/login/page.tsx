"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Building2,
  TrendingUp,
  Map,
} from "lucide-react";
import { useAuth } from "../lib/auth";
import { cn } from "../lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const { login, signup, isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      router.push("/");
    }
  }, [isAuthenticated, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      let result;
      
      if (mode === "login") {
        result = await login(email, password);
      } else {
        result = await signup(email, password, name);
      }

      if (result.success) {
        setSuccess(mode === "login" ? "Signed in successfully!" : "Account created successfully!");
        setTimeout(() => {
          router.push("/");
        }, 500);
      } else {
        setError(result.error || "An error occurred");
      }
    } catch (e) {
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#00C805] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0E14] flex" dir="ltr">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#151921] via-[#0B0E14] to-[#151921] p-12 flex-col justify-between relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 right-20 w-96 h-96 bg-[#00C805] rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-cyan-500 rounded-full blur-3xl" />
        </div>
        
        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-14 h-14 bg-gradient-to-br from-[#00C805] to-[#00A004] rounded-2xl flex items-center justify-center shadow-lg shadow-[#00C805]/30">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">InvestIntel</h1>
              <p className="text-slate-400">UK Real Estate Intelligence</p>
            </div>
          </div>
          
          <h2 className="text-4xl font-bold text-white mb-6 leading-tight">
            UK Real Estate<br />
            <span className="text-[#00C805]">Intelligence Platform</span>
          </h2>
          
          <p className="text-lg text-slate-400 mb-12 max-w-md">
            Live data from Land Registry, EPC and Bank of England.
            Smart AI analysis to identify profitable deals.
          </p>
          
          {/* Features */}
          <div className="space-y-6">
            {[
              { icon: Building2, title: "Property analysis", desc: "EPC, price history, yields" },
              { icon: Map, title: "Market radar", desc: "Identify below-market deals" },
              { icon: TrendingUp, title: "Macro data", desc: "BoE data, inflation, trends" },
            ].map((feature) => (
              <div key={feature.title} className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#00C805]/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-6 h-6 text-[#00C805]" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{feature.title}</h3>
                  <p className="text-sm text-slate-400">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Footer */}
        <div className="relative z-10">
          <p className="text-sm text-slate-500">
            © 2026 InvestIntel. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-12 h-12 bg-gradient-to-br from-[#00C805] to-[#00A004] rounded-xl flex items-center justify-center shadow-lg shadow-[#00C805]/30">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">InvestIntel</h1>
              <p className="text-sm text-slate-400">מודיעין נדל״ן</p>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-[#151921] border border-[#2D333F] rounded-2xl p-8">
            {/* Tabs */}
            <div className="flex gap-2 mb-8 bg-[#0B0E14] rounded-xl p-1">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError(null);
                }}
                className={cn(
                  "flex-1 py-3 rounded-lg font-medium transition-all",
                  mode === "login"
                    ? "bg-[#00C805] text-white"
                    : "text-slate-400 hover:text-white"
                )}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setError(null);
                }}
                className={cn(
                  "flex-1 py-3 rounded-lg font-medium transition-all",
                  mode === "signup"
                    ? "bg-[#00C805] text-white"
                    : "text-slate-400 hover:text-white"
                )}
              >
                Sign up
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="mb-6 p-4 bg-[#00C805]/10 border border-[#00C805]/30 rounded-lg flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#00C805] flex-shrink-0" />
                <p className="text-sm text-[#00C805]">{success}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name Field (signup only) */}
              {mode === "signup" && (
                <div>
                  <label className="text-sm text-slate-400 block mb-2">Full name</label>
                  <div className="relative">
                    <User className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Smith"
                      className="w-full bg-[#0B0E14] border border-[#2D333F] rounded-xl py-3.5 pr-12 pl-4 text-white placeholder-slate-500 focus:outline-none focus:border-[#00C805] focus:ring-2 focus:ring-[#00C805]/20 transition-all"
                      style={{ color: 'white' }}
                      required={mode === "signup"}
                    />
                  </div>
                </div>
              )}

              {/* Email Field */}
              <div>
                <label className="text-sm text-slate-400 block mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full bg-[#0B0E14] border border-[#2D333F] rounded-xl py-3.5 pr-12 pl-4 text-white placeholder-slate-500 focus:outline-none focus:border-[#00C805] focus:ring-2 focus:ring-[#00C805]/20 transition-all"
                    style={{ color: 'white' }}
                    required
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="text-sm text-slate-400 block mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === "signup" ? "At least 6 characters" : "Your password"}
                    className="w-full bg-[#0B0E14] border border-[#2D333F] rounded-xl py-3.5 pr-12 pl-12 text-white placeholder-slate-500 focus:outline-none focus:border-[#00C805] focus:ring-2 focus:ring-[#00C805]/20 transition-all"
                    style={{ color: 'white' }}
                    required
                    minLength={6}
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-gradient-to-r from-[#00C805] to-[#00A004] hover:from-[#00D806] hover:to-[#00B505] text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#00C805]/20"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {mode === "login" ? "Sign in" : "Create account"}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            {/* Switch Mode Text */}
            <p className="mt-6 text-center text-sm text-slate-400">
              {mode === "login" ? (
                <>
                  Don&apos;t have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signup");
                      setError(null);
                    }}
                    className="text-[#00C805] hover:text-[#00E806] font-medium"
                  >
                    Sign up now
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      setError(null);
                    }}
                    className="text-[#00C805] hover:text-[#00E806] font-medium"
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </div>

          {/* Demo Note */}
          <p className="mt-6 text-center text-xs text-slate-500">
            Data is stored locally in your browser.
            <br />
            No email verification required.
          </p>
        </div>
      </div>
    </div>
  );
}
