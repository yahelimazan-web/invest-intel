"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

export type PropertyStatus = "rented" | "needs_attention";
export type PropertyCountry = "UK";

export interface PropertyEnrichment {
  epcRating: string | null;
  lastSoldPrice: number | null;
  lastSoldDate: string | null;
  propertyType: string | null;
  streetViewUrl: string | null;
  /** Google Static Map when API key exists */
  staticMapUrl: string | null;
  /** OSM tile URL from geocode (no key required) */
  osmMapUrl: string | null;
}

export interface PortfolioProperty {
  id: string;
  title: string;
  address: string;
  /** UK postcode (e.g. L18) for EPC/Land Registry lookups */
  postcode?: string;
  image: string | null;
  monthlyRent: number;
  annualYieldPercent: number;
  purchasePrice: number;
  purchasePriceCurrency: "GBP";
  purchaseDate: string; // YYYY-MM-DD for input
  status: PropertyStatus;
  country: PropertyCountry;
}

const STATUS_OPTIONS: { value: PropertyStatus; label: string }[] = [
  { value: "rented", label: "Rented" },
  { value: "needs_attention", label: "Needs attention" },
];

interface PropertyEditModalProps {
  property: PortfolioProperty;
  onSave: (updated: PortfolioProperty) => void;
  onClose: () => void;
}

export default function PropertyEditModal({ property, onSave, onClose }: PropertyEditModalProps) {
  const [form, setForm] = useState<PortfolioProperty>({ ...property });

  useEffect(() => {
    setForm({ ...property });
  }, [property]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
      dir="ltr"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-property-title"
    >
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
          <h2 id="edit-property-title" className="text-lg font-semibold text-slate-900">
            Edit property
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="e.g. 42 Penny Lane, Liverpool"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="Street and number"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Postcode (UK)</label>
            <input
              type="text"
              value={form.postcode ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, postcode: e.target.value || undefined }))}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="e.g. L18"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Monthly cashflow (£)</label>
              <input
                type="number"
                min={0}
                step={100}
                value={form.monthlyRent || ""}
                onChange={(e) => setForm((p) => ({ ...p, monthlyRent: Number(e.target.value) || 0 }))}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Annual yield %</label>
              <input
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={form.annualYieldPercent ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, annualYieldPercent: Number(e.target.value) || 0 }))}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Purchase price (£)</label>
            <input
              type="number"
              min={0}
              step={1000}
              value={form.purchasePrice || ""}
              onChange={(e) => setForm((p) => ({ ...p, purchasePrice: Number(e.target.value) || 0 }))}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Purchase date</label>
            <input
              type="date"
              value={form.purchaseDate}
              onChange={(e) => setForm((p) => ({ ...p, purchaseDate: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as PropertyStatus }))}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-teal-600 text-white font-medium hover:bg-teal-700 transition-colors"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
