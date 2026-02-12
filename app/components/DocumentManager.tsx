"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  FileText,
  Upload,
  X,
  Trash2,
  Eye,
  Download,
  File,
  Image as ImageIcon,
  FileCheck,
  AlertCircle,
  FolderOpen,
  Plus,
} from "lucide-react";
import { cn } from "../lib/utils";

// =============================================================================
// Types
// =============================================================================

export interface DocumentMetadata {
  id: string;
  name: string;
  type: "pdf" | "image" | "other";
  mimeType: string;
  size: number;
  uploadedAt: string;
  propertyId: string;
  propertyAddress: string;
  postcode: string;
  dataUrl?: string; // For small files, store base64
  extractedText?: string; // For PDFs, extracted text content
}

interface DocumentManagerProps {
  propertyId: string;
  propertyAddress: string;
  postcode: string;
  onDocumentSelect?: (doc: DocumentMetadata) => void;
  compact?: boolean;
}

// =============================================================================
// Helper Functions
// =============================================================================

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileIcon = (type: string) => {
  if (type === "pdf") return FileText;
  if (type === "image") return ImageIcon;
  return File;
};

// Simple PDF text extraction (basic approach for browser)
const extractTextFromPDF = async (dataUrl: string): Promise<string> => {
  try {
    // For now, return a placeholder - in production, use pdf.js or server-side extraction
    // The AI chat will work with available property data even without PDF text
    return "PDF content extraction requires server-side processing. Property data from EPC and Land Registry is available for analysis.";
  } catch (error) {
    console.error("PDF extraction error:", error);
    return "";
  }
};

// =============================================================================
// Document Manager Component
// =============================================================================

export default function DocumentManager({
  propertyId,
  propertyAddress,
  postcode,
  onDocumentSelect,
  compact = false,
}: DocumentManagerProps) {
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<DocumentMetadata | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load documents from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("investintel_documents");
      if (saved) {
        const allDocs: DocumentMetadata[] = JSON.parse(saved);
        // Filter for current property
        const propertyDocs = allDocs.filter((d) => d.propertyId === propertyId);
        setDocuments(propertyDocs);
      }
    } catch (e) {
      console.error("Failed to load documents:", e);
    }
  }, [propertyId]);

  // Save documents to localStorage
  const saveDocuments = useCallback(
    (newDocs: DocumentMetadata[]) => {
      try {
        const saved = localStorage.getItem("investintel_documents");
        const allDocs: DocumentMetadata[] = saved ? JSON.parse(saved) : [];

        // Remove old docs for this property, add new ones
        const otherDocs = allDocs.filter((d) => d.propertyId !== propertyId);
        const updated = [...otherDocs, ...newDocs];

        localStorage.setItem("investintel_documents", JSON.stringify(updated));
        setDocuments(newDocs);
      } catch (e) {
        console.error("Failed to save documents:", e);
        setError("שגיאה בשמירת המסמכים");
      }
    },
    [propertyId],
  );

  // Handle file selection
  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      setIsUploading(true);
      setError(null);

      const newDocs: DocumentMetadata[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Validate file type
        const isPdf = file.type === "application/pdf";
        const isImage = file.type.startsWith("image/");

        if (!isPdf && !isImage) {
          setError(`סוג קובץ לא נתמך: ${file.name}`);
          continue;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          setError(`הקובץ גדול מדי (מקסימום 5MB): ${file.name}`);
          continue;
        }

        try {
          // Read file as base64
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });

          // Extract text from PDF if applicable
          let extractedText = "";
          if (isPdf) {
            extractedText = await extractTextFromPDF(dataUrl);
          }

          const doc: DocumentMetadata = {
            id: `doc-${Date.now()}-${i}`,
            name: file.name,
            type: isPdf ? "pdf" : isImage ? "image" : "other",
            mimeType: file.type,
            size: file.size,
            uploadedAt: new Date().toISOString(),
            propertyId,
            propertyAddress,
            postcode,
            dataUrl,
            extractedText,
          };

          newDocs.push(doc);
        } catch (e) {
          console.error("Error processing file:", e);
          setError(`שגיאה בעיבוד הקובץ: ${file.name}`);
        }
      }

      if (newDocs.length > 0) {
        saveDocuments([...documents, ...newDocs]);
      }

      setIsUploading(false);
    },
    [documents, propertyId, propertyAddress, postcode, saveDocuments],
  );

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  // Delete document
  const deleteDocument = useCallback(
    (docId: string) => {
      const updated = documents.filter((d) => d.id !== docId);
      saveDocuments(updated);
      if (selectedDoc?.id === docId) {
        setSelectedDoc(null);
      }
    },
    [documents, selectedDoc, saveDocuments],
  );

  // View document
  const viewDocument = useCallback(
    (doc: DocumentMetadata) => {
      if (doc.dataUrl) {
        // Open in new tab
        const newWindow = window.open();
        if (newWindow) {
          if (doc.type === "pdf") {
            newWindow.document.write(`
            <html>
              <head><title>${doc.name}</title></head>
              <body style="margin:0;padding:0;">
                <iframe src="${doc.dataUrl}" style="width:100%;height:100vh;border:none;"></iframe>
              </body>
            </html>
          `);
          } else if (doc.type === "image") {
            newWindow.document.write(`
            <html>
              <head><title>${doc.name}</title></head>
              <body style="margin:0;padding:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#0f172a;">
                <img src="${doc.dataUrl}" style="max-width:100%;max-height:100vh;" />
              </body>
            </html>
          `);
          }
        }
      }
      setSelectedDoc(doc);
      onDocumentSelect?.(doc);
    },
    [onDocumentSelect],
  );

  // Compact view for sidebar
  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-blue-400" />
            מסמכים ({documents.length})
          </span>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4 text-slate-300" />
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,image/*"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />

        {documents.length > 0 && (
          <div className="space-y-1">
            {documents.slice(0, 3).map((doc) => {
              const Icon = getFileIcon(doc.type);
              return (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => viewDocument(doc)}
                  className="w-full flex items-center gap-2 p-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg transition-colors text-right"
                >
                  <Icon className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span className="text-xs text-slate-300 truncate flex-1">
                    {doc.name}
                  </span>
                </button>
              );
            })}
            {documents.length > 3 && (
              <p className="text-xs text-slate-500 text-center">
                +{documents.length - 3} נוספים
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900/50 px-4 py-3 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-blue-400" />
            <span className="font-semibold text-white">מסמכים</span>
            <span className="text-xs text-slate-500">({documents.length})</span>
          </div>
        </div>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "p-4 border-2 border-dashed m-4 rounded-xl transition-all cursor-pointer",
          isDragging
            ? "border-emerald-500 bg-emerald-500/10"
            : "border-slate-600 hover:border-slate-500 bg-slate-900/30",
        )}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,image/*"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />

        <div className="text-center py-4">
          {isUploading ? (
            <>
              <div className="w-10 h-10 mx-auto mb-2 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
              <p className="text-sm text-slate-400">מעלה קבצים...</p>
            </>
          ) : (
            <>
              <Upload
                className={cn(
                  "w-10 h-10 mx-auto mb-2",
                  isDragging ? "text-emerald-400" : "text-slate-500",
                )}
              />
              <p className="text-sm text-slate-300">
                גרור קבצים לכאן או לחץ להעלאה
              </p>
              <p className="text-xs text-slate-500 mt-1">
                PDF, תמונות (מקסימום 5MB)
              </p>
            </>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-4 mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
          <button
            type="button"
            onClick={() => setError(null)}
            className="mr-auto p-1 hover:bg-red-500/20 rounded transition-colors"
          >
            <X className="w-4 h-4 text-red-400" />
          </button>
        </div>
      )}

      {/* Documents List */}
      {documents.length > 0 && (
        <div className="px-4 pb-4">
          <div className="space-y-2">
            {documents.map((doc) => {
              const Icon = getFileIcon(doc.type);
              return (
                <div
                  key={doc.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg transition-all",
                    selectedDoc?.id === doc.id
                      ? "bg-blue-500/20 border border-blue-500/30"
                      : "bg-slate-900/50 hover:bg-slate-800/50",
                  )}
                >
                  <div
                    className={cn(
                      "p-2 rounded-lg",
                      doc.type === "pdf" ? "bg-red-500/20" : "bg-blue-500/20",
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-5 h-5",
                        doc.type === "pdf" ? "text-red-400" : "text-blue-400",
                      )}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {doc.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatFileSize(doc.size)} •{" "}
                      {new Date(doc.uploadedAt).toLocaleDateString("he-IL")}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => viewDocument(doc)}
                      className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
                      title="צפייה"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteDocument(doc.id)}
                      className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-slate-400 hover:text-red-400"
                      title="מחיקה"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {documents.length === 0 && !isUploading && (
        <div className="px-4 pb-4 text-center">
          <p className="text-sm text-slate-500">אין מסמכים עדיין</p>
        </div>
      )}
    </div>
  );
}

// Export document getter for AI chat
export function getPropertyDocuments(propertyId: string): DocumentMetadata[] {
  try {
    const saved = localStorage.getItem("investintel_documents");
    if (saved) {
      const allDocs: DocumentMetadata[] = JSON.parse(saved);
      return allDocs.filter((d) => d.propertyId === propertyId);
    }
  } catch (e) {
    console.error("Failed to get documents:", e);
  }
  return [];
}
