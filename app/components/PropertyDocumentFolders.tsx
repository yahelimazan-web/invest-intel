"use client";

import { useState, useEffect, useRef } from "react";
import {
  FileText,
  Upload,
  Download,
  Trash2,
  Loader2,
  File,
  Image as ImageIcon,
  FolderOpen,
  Folder,
  CheckCircle2,
  AlertCircle,
  X,
  FolderPlus,
  Save,
} from "lucide-react";
import { cn } from "../lib/utils";
import {
  loadPropertyDocuments,
  deleteDocument,
  type PropertyDocument,
} from "../lib/documents-db";
import { useAuth } from "../lib/auth";
import { supabase } from "../lib/supabase";

// =============================================================================
// Document Folder Names (Fixed 4 folders)
// =============================================================================

const FIXED_DOCUMENT_FOLDERS = [
  { id: "purchase-contracts", name: "חוזי רכישה", icon: FileText, color: "emerald" },
  { id: "insurance", name: "ביטוח", icon: FileText, color: "blue" },
  { id: "rent-receipts", name: "קבלות שכר דירה", icon: FileText, color: "amber" },
  { id: "general", name: "כללי", icon: Folder, color: "purple" },
] as const;

type FixedFolderId = typeof FIXED_DOCUMENT_FOLDERS[number]["id"];
type FolderId = FixedFolderId | string; // Allow custom folder IDs

// =============================================================================
// Property Document Folders Component
// =============================================================================

interface PropertyDocumentFoldersProps {
  propertyId: string;
  propertyName?: string;
}

export default function PropertyDocumentFolders({
  propertyId,
  propertyName,
}: PropertyDocumentFoldersProps) {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<PropertyDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState<{ [folderId: string]: boolean }>({});
  const [expandedFolders, setExpandedFolders] = useState<Set<FolderId>>(new Set());
  const [uploadMessage, setUploadMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [customFolders, setCustomFolders] = useState<Array<{ id: string; name: string; color: string }>>([]);
  const [showAddFolderModal, setShowAddFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderColor, setNewFolderColor] = useState("cyan");
  const fileInputRefs = useRef<{ [folderId: string]: HTMLInputElement | null }>({});

  // Load all documents and custom folders on mount
  useEffect(() => {
    if (!user?.id || !propertyId) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load documents
        const docs = await loadPropertyDocuments(user.id, propertyId);
        setDocuments(docs);

        // Load custom folders from Supabase
        if (supabase) {
          try {
            await supabase.rpc('set_user_context', { user_id_param: user.id });
          } catch (rpcError) {
            console.warn("[PropertyDocumentFolders] set_user_context RPC not available");
          }

          const { data: foldersData, error: foldersError } = await supabase
            .from("property_document_folders")
            .select("*")
            .eq("user_id", user.id)
            .eq("property_id", propertyId)
            .order("created_at", { ascending: true });

          if (!foldersError && foldersData) {
            setCustomFolders(foldersData.map((f: any) => ({
              id: f.folder_id,
              name: f.folder_name,
              color: f.folder_color || "cyan",
            })));
          }
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user?.id, propertyId]);

  // Toggle folder expansion
  const toggleFolder = (folderId: FolderId) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  // Get documents for a specific folder
  const getFolderDocuments = (folderId: FolderId): PropertyDocument[] => {
    return documents.filter((doc) => doc.folder_id === folderId);
  };

  // Handle file upload
  const handleFileUpload = async (folderId: FolderId, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    
    if (!allowedTypes.includes(file.type)) {
      setUploadMessage({ type: "error", text: "סוג קובץ לא נתמך. אפשר להעלות: PDF, תמונות, Word" });
      setTimeout(() => setUploadMessage(null), 3000);
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadMessage({ type: "error", text: "גודל הקובץ חורג מ-10MB" });
      setTimeout(() => setUploadMessage(null), 3000);
      return;
    }

    setIsUploading((prev) => ({ ...prev, [folderId]: true }));
    setUploadMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("propertyId", propertyId);
      formData.append("folderId", folderId); // Use folder ID as folder name
      formData.append("userId", user.id);

      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        // Reload documents
        const updatedDocs = await loadPropertyDocuments(user.id, propertyId);
        setDocuments(updatedDocs);
        
        setUploadMessage({ type: "success", text: "הקובץ הועלה בהצלחה!" });
        setTimeout(() => setUploadMessage(null), 3000);

        // Trigger OCR processing in background
        if (result.documentId) {
          fetch("/api/documents/ocr", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              documentId: result.documentId,
              userId: user.id,
            }),
          }).catch(console.error);
        }
      } else {
        setUploadMessage({ type: "error", text: result.error || "שגיאה בהעלאת הקובץ" });
        setTimeout(() => setUploadMessage(null), 3000);
      }
    } catch (error) {
      console.error("Failed to upload document:", error);
      setUploadMessage({ type: "error", text: "שגיאה בהעלאת הקובץ. נסה שוב." });
      setTimeout(() => setUploadMessage(null), 3000);
    } finally {
      setIsUploading((prev) => ({ ...prev, [folderId]: false }));
      // Reset file input
      if (fileInputRefs.current[folderId]) {
        fileInputRefs.current[folderId]!.value = "";
      }
    }
  };

  // Handle file download
  const handleDownload = async (doc: PropertyDocument) => {
    if (!doc.url) {
      // Generate signed URL if not available
      if (!supabase || !user?.id) return;
      
      try {
        const { data } = await supabase.storage
          .from("property-documents")
          .createSignedUrl(doc.storage_path, 3600);
        
        if (data?.signedUrl) {
          window.open(data.signedUrl, '_blank');
        }
      } catch (error) {
        console.error("Failed to generate download URL:", error);
        alert("שגיאה בהורדת הקובץ");
      }
    } else {
      window.open(doc.url, '_blank');
    }
  };

  // Handle file delete
  const handleDelete = async (doc: PropertyDocument) => {
    if (!user?.id) return;
    
    const confirmed = window.confirm(`האם אתה בטוח שברצונך למחוק את "${doc.file_name}"?`);
    if (!confirmed) return;

    try {
      const success = await deleteDocument(user.id, doc.id);
      if (success) {
        // Reload documents
        const updatedDocs = await loadPropertyDocuments(user.id, propertyId);
        setDocuments(updatedDocs);
        setUploadMessage({ type: "success", text: "הקובץ נמחק בהצלחה!" });
        setTimeout(() => setUploadMessage(null), 3000);
      } else {
        setUploadMessage({ type: "error", text: "שגיאה במחיקת הקובץ" });
        setTimeout(() => setUploadMessage(null), 3000);
      }
    } catch (error) {
      console.error("Failed to delete document:", error);
      setUploadMessage({ type: "error", text: "שגיאה במחיקת הקובץ. נסה שוב." });
      setTimeout(() => setUploadMessage(null), 3000);
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Get file icon
  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return FileText;
    if (fileType.includes('image')) return ImageIcon;
    return File;
  };

  // Get folder color classes
  const getFolderColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; border: string; text: string }> = {
      emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400" },
      blue: { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400" },
      amber: { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400" },
      purple: { bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-400" },
      cyan: { bg: "bg-cyan-500/10", border: "border-cyan-500/30", text: "text-cyan-400" },
      pink: { bg: "bg-pink-500/10", border: "border-pink-500/30", text: "text-pink-400" },
      red: { bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-400" },
      orange: { bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-400" },
    };
    return colors[color] || colors.emerald;
  };

  // Handle create custom folder
  const handleCreateCustomFolder = async () => {
    if (!newFolderName.trim() || !user?.id || !propertyId) return;

    try {
      if (supabase) {
        try {
          await supabase.rpc('set_user_context', { user_id_param: user.id });
        } catch (rpcError) {
          console.warn("[PropertyDocumentFolders] set_user_context RPC not available");
        }

        const folderId = `custom_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        
        const { error } = await supabase
          .from("property_document_folders")
          .insert({
            user_id: user.id,
            property_id: propertyId,
            folder_id: folderId,
            folder_name: newFolderName.trim(),
            folder_color: newFolderColor,
          });

        if (error) {
          console.error("Failed to create folder:", error);
          setUploadMessage({ type: "error", text: "שגיאה ביצירת תיקייה" });
          setTimeout(() => setUploadMessage(null), 3000);
          return;
        }

        setCustomFolders((prev) => [...prev, { id: folderId, name: newFolderName.trim(), color: newFolderColor }]);
        setNewFolderName("");
        setNewFolderColor("cyan");
        setShowAddFolderModal(false);
        setUploadMessage({ type: "success", text: "תיקייה נוצרה בהצלחה!" });
        setTimeout(() => setUploadMessage(null), 3000);
      }
    } catch (error) {
      console.error("Failed to create folder:", error);
      setUploadMessage({ type: "error", text: "שגיאה ביצירת תיקייה. נסה שוב." });
      setTimeout(() => setUploadMessage(null), 3000);
    }
  };

  // Get all folders (fixed + custom)
  const getAllFolders = () => {
    const allFolders = [
      ...FIXED_DOCUMENT_FOLDERS.map(f => ({ ...f, isCustom: false })),
      ...customFolders.map(f => ({ 
        id: f.id, 
        name: f.name, 
        icon: Folder, 
        color: f.color, 
        isCustom: true 
      })),
    ];
    return allFolders;
  };

  return (
    <div className="space-y-4" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">מסמכי הנכס</h3>
        <div className="flex items-center gap-2">
          {propertyName && (
            <p className="text-sm text-slate-400">{propertyName}</p>
          )}
          <button
            type="button"
            onClick={() => setShowAddFolderModal(true)}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
            style={{ pointerEvents: 'auto' }}
          >
            <FolderPlus className="w-4 h-4" />
            הוסף תיקייה
          </button>
        </div>
      </div>

      {/* Upload Message */}
      {uploadMessage && (
        <div className={`p-3 rounded-lg flex items-center gap-2 ${
          uploadMessage.type === "success"
            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
            : "bg-red-500/20 text-red-400 border border-red-500/30"
        }`}>
          {uploadMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <span className="text-sm">{uploadMessage.text}</span>
          <button
            type="button"
            onClick={() => setUploadMessage(null)}
            className="mr-auto text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-[#00C805] animate-spin" />
          <span className="mr-2 text-sm text-slate-400">טוען מסמכים...</span>
        </div>
      ) : (
        /* Document Folders */
        <div className="space-y-3">
          {getAllFolders().map((folder) => {
            const folderDocs = getFolderDocuments(folder.id);
            const isExpanded = expandedFolders.has(folder.id);
            const colorClasses = getFolderColorClasses(folder.color);
            const FolderIcon = folder.icon;

            return (
              <div
                key={folder.id}
                className={cn(
                  "bg-slate-800/50 rounded-xl border transition-all",
                  colorClasses.border
                )}
              >
                {/* Folder Header */}
                <button
                  type="button"
                  onClick={() => toggleFolder(folder.id)}
                  className={cn(
                    "w-full p-4 flex items-center justify-between hover:bg-slate-700/30 transition-colors rounded-t-xl",
                    isExpanded && "rounded-b-none"
                  )}
                  style={{ pointerEvents: 'auto' }}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg", colorClasses.bg)}>
                      <FolderIcon className={cn("w-5 h-5", colorClasses.text)} />
                    </div>
                    <div className="text-right">
                      <h4 className="font-semibold text-white">{folder.name}</h4>
                      <p className="text-xs text-slate-400">
                        {folderDocs.length} {folderDocs.length === 1 ? "קובץ" : "קבצים"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <FolderOpen className="w-4 h-4 text-slate-400" />
                    ) : (
                      <Folder className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Folder Content */}
                {isExpanded && (
                  <div className="p-4 border-t border-slate-700 space-y-3">
                    {/* Upload Button */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRefs.current[folder.id]?.click()}
                        disabled={isUploading[folder.id]}
                        className={cn(
                          "flex-1 px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium",
                          isUploading[folder.id]
                            ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                            : "bg-[#00C805] hover:bg-[#00D806] text-white"
                        )}
                        style={{ pointerEvents: isUploading[folder.id] ? 'none' : 'auto' }}
                      >
                        {isUploading[folder.id] ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            מעלה...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            העלה קובץ
                          </>
                        )}
                      </button>
                      <input
                        ref={(el) => (fileInputRefs.current[folder.id] = el)}
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        onChange={(e) => handleFileUpload(folder.id, e)}
                        className="hidden"
                      />
                    </div>

                    {/* Documents List */}
                    {folderDocs.length === 0 ? (
                      <div className="text-center py-6 text-slate-400 text-sm">
                        <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>אין קבצים בתיקייה זו</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {folderDocs.map((doc) => {
                          const FileIcon = getFileIcon(doc.file_type);
                          const uploadDate = new Date(doc.uploaded_at);
                          const formattedDate = uploadDate.toLocaleDateString('he-IL', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          });

                          return (
                            <div
                              key={doc.id}
                              className="bg-slate-700/50 rounded-lg p-3 flex items-center justify-between hover:bg-slate-700 transition-colors"
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <FileIcon className="w-5 h-5 text-slate-400 flex-shrink-0" />
                                <div className="flex-1 min-w-0 text-right">
                                  <p className="text-sm font-medium text-white truncate">
                                    {doc.file_name}
                                  </p>
                                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                                    <span>{formatFileSize(doc.file_size)}</span>
                                    <span>•</span>
                                    <span>{formattedDate}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleDownload(doc)}
                                  className="p-2 text-slate-400 hover:text-[#00C805] transition-colors"
                                  title="הורד"
                                  style={{ pointerEvents: 'auto' }}
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(doc)}
                                  className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                                  title="מחק"
                                  style={{ pointerEvents: 'auto' }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Custom Folder Modal */}
      {showAddFolderModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" dir="rtl">
          <div 
            className="bg-[#151921] border border-[#2D333F] rounded-xl w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#2D333F]">
              <h2 className="text-xl font-bold text-white">הוסף תיקייה חדשה</h2>
              <button
                type="button"
                onClick={() => {
                  setShowAddFolderModal(false);
                  setNewFolderName("");
                  setNewFolderColor("cyan");
                }}
                className="text-slate-400 hover:text-white transition-colors"
                style={{ pointerEvents: 'auto' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4">
              {/* Folder Name */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  שם התיקייה *
                </label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="למשל: תחזוקה, חשבונות..."
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-[#00C805] transition-colors"
                  style={{ color: 'white' }}
                  autoComplete="off"
                  autoFocus
                />
              </div>

              {/* Folder Color */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  צבע
                </label>
                <div className="flex gap-2 flex-wrap">
                  {["emerald", "blue", "amber", "purple", "cyan", "pink", "red", "orange"].map((color) => {
                    const colorClasses = getFolderColorClasses(color);
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewFolderColor(color)}
                        className={cn(
                          "w-10 h-10 rounded-lg transition-all",
                          colorClasses.bg,
                          newFolderColor === color
                            ? "ring-2 ring-white ring-offset-2 ring-offset-slate-800"
                            : ""
                        )}
                        style={{ pointerEvents: 'auto' }}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-[#2D333F]">
              <button
                type="button"
                onClick={() => {
                  setShowAddFolderModal(false);
                  setNewFolderName("");
                  setNewFolderColor("cyan");
                }}
                className="px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors"
                style={{ pointerEvents: 'auto' }}
              >
                ביטול
              </button>
              <button
                type="button"
                onClick={handleCreateCustomFolder}
                disabled={!newFolderName.trim()}
                className="px-6 py-2 bg-[#00C805] hover:bg-[#00D806] text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ pointerEvents: !newFolderName.trim() ? 'none' : 'auto' }}
              >
                <Save className="w-4 h-4" />
                שמור
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
