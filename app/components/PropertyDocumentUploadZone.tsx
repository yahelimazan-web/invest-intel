"use client";

import { useCallback, useState } from "react";
import { X, FileText, FileCheck, Receipt } from "lucide-react";
import { cn } from "../lib/utils";

export type DocumentCategory = "purchase" | "rental" | "receipts";

const CATEGORIES: Array<{
  id: DocumentCategory;
  label: string;
  icon: typeof FileText;
  ariaLabel: string;
}> = [
  { id: "purchase", label: "Purchase documents", icon: FileText, ariaLabel: "Upload purchase documents" },
  { id: "rental", label: "Tenancy agreements", icon: FileCheck, ariaLabel: "Upload tenancy agreement" },
  { id: "receipts", label: "Receipts", icon: Receipt, ariaLabel: "Upload receipts" },
];

const QUICK_LABEL_PURCHASE = "Purchase contract";
const QUICK_LABEL_RENTAL = "Tenancy agreement";

interface PropertyDocumentUploadZoneProps {
  propertyName: string;
  onClose: () => void;
  onFilesSelected?: (category: DocumentCategory, files: File[], displayName?: string) => void;
}

export default function PropertyDocumentUploadZone({
  propertyName,
  onClose,
  onFilesSelected,
}: PropertyDocumentUploadZoneProps) {
  const [dragging, setDragging] = useState<DocumentCategory | null>(null);
  const [dropped, setDropped] = useState<Partial<Record<DocumentCategory, number>>>({});
  const [pendingFiles, setPendingFiles] = useState<File[] | null>(null);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customName, setCustomName] = useState("");

  const applyAndClose = useCallback(
    (category: DocumentCategory, files: File[], displayName?: string) => {
      onFilesSelected?.(category, files, displayName);
      setDropped((prev) => ({ ...prev, [category]: (prev[category] ?? 0) + files.length }));
      setPendingFiles(null);
      setShowCustomInput(false);
      setCustomName("");
      onClose();
    },
    [onFilesSelected, onClose]
  );

  const handleQuickLabel = useCallback(
    (label: string, category: DocumentCategory) => {
      if (!pendingFiles?.length) return;
      applyAndClose(category, pendingFiles, label);
    },
    [pendingFiles, applyAndClose]
  );

  const handleCustomSubmit = useCallback(() => {
    if (!pendingFiles?.length || !customName.trim()) return;
    applyAndClose("receipts", pendingFiles, customName.trim());
  }, [pendingFiles, customName, applyAndClose]);

  const handleDragOver = useCallback((e: React.DragEvent, category: DocumentCategory) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(category);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, category: DocumentCategory) => {
      e.preventDefault();
      e.stopPropagation();
      setDragging(null);
      const files = Array.from(e.dataTransfer.files);
      if (files.length) setPendingFiles(files);
    },
    []
  );

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length) setPendingFiles(files);
    e.target.value = "";
  }, []);

  const hasPending = pendingFiles != null && pendingFiles.length > 0;
  const fileName = hasPending ? pendingFiles[0].name : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" dir="ltr" aria-modal="true" role="dialog" aria-labelledby="upload-zone-title">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div className="min-w-0">
            <h2 id="upload-zone-title" className="text-lg font-semibold text-slate-900 truncate">
              Documents — {propertyName}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">After upload: Purchase contract • Tenancy agreement • Custom name</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {hasPending && (
            <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/50 p-4">
              <p className="text-sm font-medium text-slate-700">Choose label for file</p>
              <p className="text-xs text-slate-500 truncate" title={fileName}>
                {fileName}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLabel(QUICK_LABEL_PURCHASE, "purchase")}
                  className="chip-button"
                >
                  {QUICK_LABEL_PURCHASE}
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLabel(QUICK_LABEL_RENTAL, "rental")}
                  className="chip-button"
                >
                  {QUICK_LABEL_RENTAL}
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLabel("Documents", "receipts")}
                  className="chip-button bg-teal-600 text-white border-teal-600 hover:bg-teal-700 hover:border-teal-700"
                >
                  Keep All
                </button>
                <button
                  type="button"
                  onClick={() => setShowCustomInput(true)}
                  className="chip-button"
                  aria-expanded={showCustomInput}
                >
                  Custom name
                </button>
              </div>
              {showCustomInput && (
                <div className="flex flex-col gap-2 pt-2">
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Enter document name"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
                    aria-label="Custom name"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleCustomSubmit}
                    disabled={!customName.trim()}
                    className="self-end chip-button bg-slate-900 text-white border-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    Save
                  </button>
                </div>
              )}
            </div>
          )}

          {CATEGORIES.map(({ id, label, icon: Icon, ariaLabel }) => (
            <div key={id} className="space-y-1.5">
              <label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Icon className="w-4 h-4 text-slate-400" aria-hidden />
                {label}
              </label>
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-4 text-center transition-colors",
                  dragging === id
                    ? "border-teal-400 bg-teal-50/50"
                    : "border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-100/50"
                )}
                onDragOver={(e) => handleDragOver(e, id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, id)}
                aria-label={ariaLabel}
              >
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  className="sr-only"
                  id={`upload-${id}`}
                  onChange={handleFileInput}
                />
                <label
                  htmlFor={`upload-${id}`}
                  className="cursor-pointer text-sm text-slate-500 hover:text-teal-600 block"
                >
                  {dropped[id] ? `${dropped[id]} files uploaded` : "Drag here or click to select"}
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
