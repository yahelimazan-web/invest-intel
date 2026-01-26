"use client";

import { useState } from "react";
import {
  Bell,
  X,
  AlertTriangle,
  TrendingUp,
  Newspaper,
  Wrench,
  Clock,
  Check,
  Trash2,
  Filter,
  MapPin,
} from "lucide-react";
import { ALERTS, PORTFOLIO_ASSETS, type Alert } from "../lib/data";
import { cn } from "../lib/utils";

interface AlertsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const ALERT_ICONS = {
  price: TrendingUp,
  news: Newspaper,
  policy: AlertTriangle,
  maintenance: Wrench,
};

const ALERT_COLORS = {
  price: "bg-emerald-500/20 text-emerald-400",
  news: "bg-blue-500/20 text-blue-400",
  policy: "bg-amber-500/20 text-amber-400",
  maintenance: "bg-red-500/20 text-red-400",
};

const PRIORITY_COLORS = {
  high: "border-red-500/50",
  medium: "border-amber-500/50",
  low: "border-slate-700",
};

export default function AlertsPanel({ isOpen, onClose }: AlertsPanelProps) {
  const [alerts, setAlerts] = useState<Alert[]>(ALERTS);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const filteredAlerts = filter === "unread" 
    ? alerts.filter((a) => !a.read) 
    : alerts;

  const unreadCount = alerts.filter((a) => !a.read).length;

  const markAsRead = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, read: true } : a))
    );
  };

  const markAllAsRead = () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
  };

  const deleteAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const getPropertyName = (propertyId?: string) => {
    if (!propertyId) return null;
    const property = PORTFOLIO_ASSETS.find((p) => p.id === propertyId);
    return property?.name || null;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-md bg-slate-900 border-r border-slate-800 h-full flex flex-col slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center relative">
              <Bell className="w-5 h-5 text-red-400" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <h2 className="font-bold text-white">התראות</h2>
              <p className="text-xs text-slate-500">{unreadCount} חדשות</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
            {[
              { id: "all", label: "הכל" },
              { id: "unread", label: "לא נקראו" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id as any)}
                className={cn(
                  "px-3 py-1 rounded text-xs font-medium transition-all",
                  filter === f.id
                    ? "bg-slate-700 text-white"
                    : "text-slate-500 hover:text-white"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              <Check className="w-3 h-3" />
              סמן הכל כנקרא
            </button>
          )}
        </div>

        {/* Alerts List */}
        <div className="flex-1 overflow-y-auto">
          {filteredAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <Bell className="w-12 h-12 text-slate-700 mb-4" />
              <p className="text-slate-400">אין התראות חדשות</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {filteredAlerts.map((alert) => {
                const Icon = ALERT_ICONS[alert.type];
                const propertyName = getPropertyName(alert.propertyId);

                return (
                  <div
                    key={alert.id}
                    className={cn(
                      "p-4 hover:bg-slate-800/50 transition-colors cursor-pointer border-r-2",
                      alert.read ? "opacity-60" : "",
                      PRIORITY_COLORS[alert.priority]
                    )}
                    onClick={() => markAsRead(alert.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                          ALERT_COLORS[alert.type]
                        )}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <p className="font-medium text-white text-sm">
                            {alert.title}
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteAlert(alert.id);
                            }}
                            className="p-1 hover:bg-slate-700 rounded text-slate-500 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="text-xs text-slate-400 mb-2">
                          {alert.message}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {alert.date}
                          </div>
                          {alert.postcode && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {alert.postcode}
                            </div>
                          )}
                          {propertyName && (
                            <span className="bg-slate-700 px-1.5 py-0.5 rounded">
                              {propertyName}
                            </span>
                          )}
                        </div>
                        {!alert.read && (
                          <span className="inline-block mt-2 w-2 h-2 bg-emerald-500 rounded-full pulse-glow" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 text-center">
          <button className="text-sm text-emerald-400 hover:text-emerald-300">
            הגדרות התראות
          </button>
        </div>
      </div>
    </div>
  );
}
