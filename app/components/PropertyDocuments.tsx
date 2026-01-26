"use client";

import { useState, useEffect, useRef } from "react";
import {
  FileText,
  Upload,
  Search,
  Trash2,
  Eye,
  Loader2,
  File,
  Image as ImageIcon,
  FileCheck,
  Sparkles,
} from "lucide-react";
import { cn } from "../lib/utils";
import {
  loadPropertyDocuments,
  deleteDocument,
  searchDocumentsByText,
  type PropertyDocument,
} from "../lib/documents-db";
import { useAuth } from "../lib/auth";

// =============================================================================
// Property Documents Component
// =============================================================================

interface PropertyDocumentsProps {
  propertyId: string;
  folderId: string;
}

export default function PropertyDocuments({
  propertyId,
  folderId,
}: PropertyDocumentsProps) {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<PropertyDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PropertyDocument[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load documents on mount and when propertyId changes
  useEffect(() => {
    if (!user?.id || !propertyId) return;

    const loadDocs = async () => {
      setIsLoading(true);
      try {
        // Load all documents (no folder filter for backward compatibility)
        const docs = await loadPropertyDocuments(user.id, propertyId);
        setDocuments(docs);
      } catch (error) {
        console.error("Failed to load documents:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDocs();
  }, [user?.id, propertyId]);

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("propertyId", propertyId);
      formData.append("folderId", folderId);
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
        alert(`שגיאה בהעלאת הקובץ: ${result.error}`);
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("שגיאה בהעלאת הקובץ");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Handle document deletion
  const handleDelete = async (documentId: string) => {
    if (!user?.id) return;
    if (!confirm("האם אתה בטוח שברצונך למחוק את המסמך הזה?")) return;

    try {
      const success = await deleteDocument(user.id, documentId);
      if (success) {
        setDocuments(docs => docs.filter(d => d.id !== documentId));
        setSearchResults(results => results.filter(d => d.id !== documentId));
      } else {
        alert("שגיאה במחיקת המסמך");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("שגיאה במחיקת המסמך");
    }
  };

  // Handle search (with semantic option)
  const handleSearch = async (useSemantic: boolean = false) => {
    if (!user?.id || !searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch("/api/documents/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          propertyId,
          query: searchQuery,
          useSemantic,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setSearchResults(result.documents || []);
      } else {
        console.error("Search error:", result.error);
        // Fallback to local text search
        const results = await searchDocumentsByText(user.id, propertyId, searchQuery);
        setSearchResults(results);
      }
    } catch (error) {
      console.error("Search error:", error);
      // Fallback to local text search
      try {
        const results = await searchDocumentsByText(user.id, propertyId, searchQuery);
        setSearchResults(results);
      } catch (fallbackError) {
        console.error("Fallback search error:", fallbackError);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const displayDocs = searchQuery.trim() ? searchResults : documents;
  const hasDocs = displayDocs.length > 0;

  return (
    <div className="bg-[#151921] border border-[#2D333F] rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
            <FileText className="w-4 h-4 text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">מסמכים</h3>
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#00C805]/20 hover:bg-[#00C805]/30 border border-[#00C805]/50 text-[#00C805] rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              מעלה...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              העלה מסמך
            </>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="חפש במסמכים..."
              value={searchQuery}
              onChange={(e) => {
                const newValue = e.target.value;
                setSearchQuery(newValue);
                if (!newValue.trim()) {
                  setSearchResults([]);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isSearching && searchQuery.trim()) {
                  e.preventDefault();
                  handleSearch(false); // Text search on Enter
                }
              }}
              className="w-full pr-10 pl-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-[#00C805]"
              style={{ color: 'white' }}
              autoComplete="off"
              disabled={isSearching}
            />
          </div>
          {searchQuery.trim() && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSearch(false)}
                disabled={isSearching}
                className="px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-700 text-white rounded-lg transition-colors flex items-center gap-2"
                title="חיפוש טקסט"
              >
                {isSearching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                טקסט
              </button>
              <button
                type="button"
                onClick={() => handleSearch(true)}
                disabled={isSearching}
                className="px-3 py-2 bg-[#00C805] hover:bg-[#00D806] disabled:bg-slate-700 text-white rounded-lg transition-colors flex items-center gap-2"
                title="חיפוש סמנטי (AI)"
              >
                {isSearching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                AI
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Documents List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-[#00C805] animate-spin" />
          <span className="mr-2 text-sm text-slate-400">טוען מסמכים...</span>
        </div>
      ) : !hasDocs ? (
        <div className="text-center py-8">
          <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-400 mb-2">
            {searchQuery.trim() ? "לא נמצאו מסמכים התואמים לחיפוש" : "אין מסמכים עבור נכס זה"}
          </p>
          <p className="text-xs text-slate-500">
            העלה מסמכים כמו חוזים, דוחות EPC, תמונות ועוד
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayDocs.map((doc) => (
            <div
              key={doc.id}
              className="bg-[#1D2430] border border-[#2D333F] rounded-lg p-3 hover:border-[#00C805]/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                    {doc.file_type === "application/pdf" ? (
                      <FileText className="w-5 h-5 text-red-400" />
                    ) : doc.file_type.startsWith("image/") ? (
                      <ImageIcon className="w-5 h-5 text-blue-400" />
                    ) : (
                      <File className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white text-sm mb-1 truncate">
                      {doc.file_name}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span>
                        {(doc.file_size / 1024).toFixed(1)} KB
                      </span>
                      <span>
                        {new Date(doc.uploaded_at).toLocaleDateString("he-IL")}
                      </span>
                      {doc.summary && (
                        <span className="flex items-center gap-1 text-[#00C805]">
                          <Sparkles className="w-3 h-3" />
                          AI סיכום זמין
                        </span>
                      )}
                    </div>
                    {doc.summary && (
                      <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                        {doc.summary}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {doc.url && (
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 rounded transition-colors"
                      title="צפה במסמך"
                    >
                      <Eye className="w-4 h-4" />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(doc.id)}
                    className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                    title="מחק מסמך"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
