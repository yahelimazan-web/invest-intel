"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  X,
  FileText,
  Upload,
  Download,
  Trash2,
  MoreVertical,
  FolderOpen,
  FolderPlus,
  ChevronRight,
  LayoutGrid,
  List,
  File,
  Image as ImageIcon,
} from "lucide-react";
import { cn } from "../lib/utils";
import { useAuth } from "../lib/auth";
import {
  loadPropertyDocuments,
  deleteDocument as deleteDocumentApi,
  renameDocument as renameDocumentApi,
  type PropertyDocument,
} from "../lib/documents-db";
import { supabase } from "../lib/supabase";
import {
  loadFileManagerState,
  addDocument as addDocumentSim,
  renameDocument as renameDocumentSim,
  deleteDocumentById as deleteDocumentSim,
  createFolder as createFolderSim,
  renameFolder as renameFolderSim,
  deleteFolder as deleteFolderSim,
  type FileManagerDocument,
  type FileManagerFolder,
  DEFAULT_FOLDERS,
} from "../lib/file-manager-store";

// =============================================================================
// Types
// =============================================================================

interface PropertyFileManagerProps {
  propertyId: string;
  propertyName: string;
  onClose: () => void;
  onFilesSelected?: (folderId: string, files: File[], displayName?: string) => void;
  onExtractedData?: (data: { monthlyRent?: number; purchasePrice?: number }) => void;
}

type ViewMode = "list" | "grid";

// =============================================================================
// Helpers
// =============================================================================

function getFileIcon(fileType: string) {
  if (fileType.includes("pdf")) return FileText;
  if (fileType.includes("image") || fileType.includes("jpeg") || fileType.includes("png")) return ImageIcon;
  if (fileType.includes("word") || fileType.includes("document")) return FileText;
  return File;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileExtension(fileName: string): string {
  const parts = fileName.split(".");
  return parts.length > 1 ? parts.pop()!.toUpperCase() : "";
}

// =============================================================================
// Component
// =============================================================================

export default function PropertyFileManager({
  propertyId,
  propertyName,
  onClose,
  onFilesSelected,
  onExtractedData,
}: PropertyFileManagerProps) {
  const { user } = useAuth();
  const userId = user?.id ?? "anon";

  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<PropertyDocument[]>([]);
  const [simulatedDocs, setSimulatedDocs] = useState<FileManagerDocument[]>([]);
  const [folders, setFolders] = useState<FileManagerFolder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [useSimulation, setUseSimulation] = useState(false);

  // Modals state
  const [optionsMenuDoc, setOptionsMenuDoc] = useState<PropertyDocument | FileManagerDocument | null>(null);
  const [renameDoc, setRenameDoc] = useState<PropertyDocument | FileManagerDocument | null>(null);
  const [renameDocNewName, setRenameDocNewName] = useState("");
  const [createFolderModal, setCreateFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [renameFolderModal, setRenameFolderModal] = useState<FileManagerFolder | null>(null);
  const [renameFolderNewName, setRenameFolderNewName] = useState("");
  const [deleteFolderModal, setDeleteFolderModal] = useState<FileManagerFolder | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [optionsMenuPos, setOptionsMenuPos] = useState<{ x: number; y: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const optionsMenuRef = useRef<HTMLDivElement>(null);

  // Load data
  const loadData = useCallback(async () => {
    if (!propertyId) return;

    setIsLoading(true);
    try {
      const state = loadFileManagerState(propertyId);
      let foldersList = state.folders;

      if (supabase && user?.id) {
        const docs = await loadPropertyDocuments(user.id, propertyId);
        if (docs.length > 0) {
          setDocuments(docs);
          setSimulatedDocs([]);
          setUseSimulation(false);

          // Build folder list from documents + optional custom folders from Supabase
          const docFolderIds = new Set(docs.map((d) => d.folder_id));
          const defaultIds = new Set(DEFAULT_FOLDERS.map((f) => f.id));
          const extraIds = [...docFolderIds].filter((id) => !defaultIds.has(id));

          try {
            await supabase.rpc("set_user_context", { user_id_param: user.id });
          } catch {
            /* ignore */
          }
          const { data: foldersData } = await supabase
            .from("property_document_folders")
            .select("*")
            .eq("user_id", user.id)
            .eq("property_id", propertyId)
            .order("created_at", { ascending: true });

          if (foldersData?.length) {
            const customFolders: FileManagerFolder[] = foldersData.map((f: any) => ({
              id: f.folder_id,
              name: f.folder_name || f.folder_id,
              color: f.folder_color,
              isCustom: true,
            }));
            const customIds = new Set(customFolders.map((f) => f.id));
            foldersList = [
              ...DEFAULT_FOLDERS,
              ...customFolders.filter((f) => !defaultIds.has(f.id)),
              ...extraIds
                .filter((id) => !customIds.has(id))
                .map((id) => ({ id, name: id.replace(/_/g, " "), isCustom: false })),
            ];
          } else {
            foldersList = [
              ...DEFAULT_FOLDERS,
              ...extraIds.map((id) => ({ id, name: id.replace(/_/g, " "), isCustom: false })),
            ];
          }
        } else {
          setDocuments([]);
          setSimulatedDocs(state.documents);
          setUseSimulation(true);
        }
      } else {
        setDocuments([]);
        setSimulatedDocs(state.documents);
        setUseSimulation(true);
      }
      setFolders(foldersList);
    } catch (e) {
      console.error("[PropertyFileManager] Load error:", e);
      const state = loadFileManagerState(propertyId);
      setFolders(state.folders);
      setSimulatedDocs(state.documents);
      setDocuments([]);
      setUseSimulation(true);
    } finally {
      setIsLoading(false);
    }
  }, [propertyId, user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const currentFolder = currentFolderId
    ? folders.find((f) => f.id === currentFolderId)
    : null;

  const breadcrumbItems = [
    { id: null, label: "Root" },
    ...(currentFolder ? [{ id: currentFolder.id, label: currentFolder.name }] : []),
  ];

  const allDocs = useSimulation ? simulatedDocs : documents;
  const displayFiles = currentFolderId
    ? allDocs.filter((d) => d.folder_id === currentFolderId)
    : [];

  const displayFolders = currentFolderId
    ? [] // In folder view, no subfolders for now (flat hierarchy)
    : folders;

  const getFileCountForFolder = (folderId: string) =>
    allDocs.filter((d) => d.folder_id === folderId).length;

  const showRootContent = !currentFolderId;

  const handleUpload = useCallback(
    async (files: FileList | File[]) => {
      const fileList = Array.isArray(files) ? files : Array.from(files);
      if (fileList.length === 0) return;
      const targetFolderId = currentFolderId || "receipts";

      setIsUploading(true);
      setMessage(null);

      try {
        if (useSimulation) {
          for (const file of fileList) {
            addDocumentSim(propertyId, targetFolderId, {
              name: file.name,
              type: file.type,
              size: file.size,
            });
          }
          setSimulatedDocs(loadFileManagerState(propertyId).documents);
          setMessage({ type: "success", text: `${fileList.length} file(s) added` });
        } else if (user?.id) {
          for (const file of fileList) {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("propertyId", propertyId);
            formData.append("folderId", targetFolderId);
            formData.append("userId", user.id);
            formData.append("tags", JSON.stringify([]));

            const res = await fetch("/api/documents/upload", { method: "POST", body: formData });
            const result = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(result.error || "Upload failed");

            // Trigger OCR for extraction; when done, notify parent for auto-population
            if (result.documentId) {
              fetch("/api/documents/ocr", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  documentId: result.documentId,
                  userId: user.id,
                  propertyId,
                }),
              })
                .then((r) => r.json())
                .then((ocr) => {
                  if (ocr.success && ocr.extractedData && (ocr.extractedData.monthlyRent || ocr.extractedData.purchasePrice)) {
                    onExtractedData?.(ocr.extractedData);
                    const parts: string[] = [];
                    if (ocr.extractedData.monthlyRent) parts.push(`Rent £${ocr.extractedData.monthlyRent}/mo`);
                    if (ocr.extractedData.purchasePrice) parts.push(`Price £${ocr.extractedData.purchasePrice.toLocaleString()}`);
                    setMessage({ type: "success", text: `Data extracted: ${parts.join(", ")} — property updated` });
                  }
                })
                .catch(() => {});
            }
          }
          await loadData();
          setMessage({ type: "success", text: `${fileList.length} file(s) uploaded` });
        }

        onFilesSelected?.(targetFolderId, fileList);

        setTimeout(() => setMessage(null), 3000);
      } catch (err: any) {
        setMessage({ type: "error", text: err?.message || "Upload failed" });
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [propertyId, currentFolderId, useSimulation, user?.id, loadData, onFilesSelected]
  );

  const handleDownload = useCallback(
    async (doc: PropertyDocument | FileManagerDocument) => {
      if ("url" in doc && doc.url) {
        window.open(doc.url, "_blank");
        return;
      }
      if (supabase && user?.id && "storage_path" in doc) {
        try {
          const { data } = await supabase.storage
            .from("property-documents")
            .createSignedUrl((doc as PropertyDocument).storage_path, 3600);
          if (data?.signedUrl) window.open(data.signedUrl, "_blank");
        } catch {
          setMessage({ type: "error", text: "Download failed" });
        }
      } else {
        setMessage({ type: "error", text: "Download not available for simulated files" });
      }
    },
    [user?.id]
  );

  const handleDeleteFile = useCallback(
    async (doc: PropertyDocument | FileManagerDocument) => {
      if ("storage_path" in doc && user?.id) {
        const ok = await deleteDocumentApi(user.id, doc.id);
        if (ok) {
          await loadData();
          setMessage({ type: "success", text: "File deleted" });
        } else {
          setMessage({ type: "error", text: "Delete failed" });
        }
      } else {
        deleteDocumentSim(propertyId, doc.id);
        setSimulatedDocs(loadFileManagerState(propertyId).documents);
        setMessage({ type: "success", text: "File deleted" });
      }
      setOptionsMenuDoc(null);
      setOptionsMenuPos(null);
      setTimeout(() => setMessage(null), 3000);
    },
    [propertyId, user?.id, loadData]
  );

  const handleRenameFile = useCallback(
    async (doc: PropertyDocument | FileManagerDocument, newName: string) => {
      const trimmed = newName.trim();
      if (!trimmed) return;

      if ("storage_path" in doc && user?.id) {
        const result = await renameDocumentApi(user.id, doc.id, trimmed);
        if (result.success) {
          await loadData();
          setMessage({ type: "success", text: "File renamed" });
        } else {
          setMessage({ type: "error", text: result.error || "Rename failed" });
        }
      } else {
        renameDocumentSim(propertyId, doc.id, trimmed);
        setSimulatedDocs(loadFileManagerState(propertyId).documents);
        setMessage({ type: "success", text: "File renamed" });
      }
      setRenameDoc(null);
      setRenameDocNewName("");
      setTimeout(() => setMessage(null), 3000);
    },
    [propertyId, user?.id, loadData]
  );

  const handleCreateFolder = useCallback(async () => {
    if (!newFolderName.trim()) return;
    const name = newFolderName.trim();

    if (useSimulation) {
      createFolderSim(propertyId, name);
      setFolders(loadFileManagerState(propertyId).folders);
    } else if (supabase && user?.id) {
      try {
        const folderId = `custom_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        await supabase.rpc("set_user_context", { user_id_param: user.id });
        const { error } = await supabase.from("property_document_folders").insert({
          user_id: user.id,
          property_id: propertyId,
          folder_id: folderId,
          folder_name: name,
          folder_color: "cyan",
        });
        if (error) throw error;
        setFolders((prev) => [...prev, { id: folderId, name, isCustom: true }]);
      } catch (e: any) {
        setMessage({ type: "error", text: e?.message || "Failed to create folder" });
        return;
      }
    }
    setCreateFolderModal(false);
    setNewFolderName("");
    setMessage({ type: "success", text: "Folder created" });
    setTimeout(() => setMessage(null), 3000);
  }, [propertyId, newFolderName, useSimulation, user?.id]);

  const handleRenameFolder = useCallback(async () => {
    if (!renameFolderModal || !renameFolderNewName.trim()) return;
    const name = renameFolderNewName.trim();

    if (useSimulation) {
      renameFolderSim(propertyId, renameFolderModal.id, name);
      setFolders(loadFileManagerState(propertyId).folders);
    } else if (renameFolderModal.isCustom && supabase && user?.id) {
      try {
        await supabase.rpc("set_user_context", { user_id_param: user.id });
        const { error } = await supabase
          .from("property_document_folders")
          .update({ folder_name: name })
          .eq("user_id", user.id)
          .eq("property_id", propertyId)
          .eq("folder_id", renameFolderModal.id);
        if (error) throw error;
        setFolders((prev) =>
          prev.map((f) => (f.id === renameFolderModal.id ? { ...f, name } : f))
        );
      } catch (e: any) {
        setMessage({ type: "error", text: e?.message || "Failed to rename folder" });
        return;
      }
    }
    setRenameFolderModal(null);
    setRenameFolderNewName("");
    setMessage({ type: "success", text: "Folder renamed" });
    setTimeout(() => setMessage(null), 3000);
  }, [propertyId, renameFolderModal, renameFolderNewName, useSimulation, user?.id]);

  const handleDeleteFolder = useCallback(async () => {
    if (!deleteFolderModal) return;

    if (useSimulation) {
      const result = deleteFolderSim(propertyId, deleteFolderModal.id);
      setFolders(loadFileManagerState(propertyId).folders);
      setSimulatedDocs(loadFileManagerState(propertyId).documents);
      setMessage({
        type: "success",
        text: result.hadDocuments ? "Folder and its files deleted" : "Folder deleted",
      });
    } else if (deleteFolderModal.isCustom && supabase && user?.id) {
      try {
        await supabase.rpc("set_user_context", { user_id_param: user.id });
        await supabase
          .from("property_document_folders")
          .delete()
          .eq("user_id", user.id)
          .eq("property_id", propertyId)
          .eq("folder_id", deleteFolderModal.id);
        setFolders((prev) => prev.filter((f) => f.id !== deleteFolderModal.id));
        await loadData();
        setMessage({ type: "success", text: "Folder deleted" });
      } catch (e: any) {
        setMessage({ type: "error", text: e?.message || "Failed to delete folder" });
        return;
      }
    }
    setDeleteFolderModal(null);
    setCurrentFolderId(null);
    setTimeout(() => setMessage(null), 3000);
  }, [propertyId, deleteFolderModal, useSimulation, user?.id, loadData]);

  const closeOptionsMenu = () => {
    setOptionsMenuDoc(null);
    setOptionsMenuPos(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      dir="ltr"
      aria-modal="true"
      role="dialog"
      aria-labelledby="file-manager-title"
    >
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 shrink-0">
          <div className="min-w-0 flex-1">
            <h2 id="file-manager-title" className="text-lg font-semibold text-slate-900 truncate">
              {propertyName} — File Manager
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Manage documents and folders</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Breadcrumb */}
        <div className="px-5 py-2 border-b border-slate-100 flex items-center gap-2 text-sm">
          {breadcrumbItems.map((item, i) => (
            <span key={item.id ?? "root"} className="flex items-center gap-2">
              {i > 0 && <ChevronRight className="w-4 h-4 text-slate-400" />}
              <button
                type="button"
                onClick={() => item.id === null ? setCurrentFolderId(null) : setCurrentFolderId(item.id!)}
                className={cn(
                  "font-medium transition-colors",
                  item.id === currentFolderId || (item.id === null && !currentFolderId)
                    ? "text-teal-600"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                {item.label}
              </button>
            </span>
          ))}
        </div>

        {/* Toolbar */}
        <div className="px-5 py-2 flex items-center justify-between gap-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={cn(
                "p-2 rounded-lg transition-colors",
                viewMode === "list" ? "bg-teal-100 text-teal-600" : "text-slate-400 hover:text-slate-600"
              )}
              aria-label="List view"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-2 rounded-lg transition-colors",
                viewMode === "grid" ? "bg-teal-100 text-teal-600" : "text-slate-400 hover:text-slate-600"
              )}
              aria-label="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            {showRootContent && (
              <button
                type="button"
                onClick={() => setCreateFolderModal(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
              >
                <FolderPlus className="w-4 h-4" />
                New Folder
              </button>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload
                </>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              className="sr-only"
              onChange={(e) => {
                const files = e.target.files;
                if (files?.length) handleUpload(files);
                e.target.value = "";
              }}
            />
          </div>
        </div>

        {/* Message */}
        {message && (
          <div
            className={cn(
              "mx-5 mt-2 px-4 py-2 rounded-lg text-sm flex items-center gap-2",
              message.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
            )}
          >
            {message.text}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : showRootContent ? (
            <div className="flex flex-wrap gap-2">
              {displayFolders.map((folder) => (
                <div
                  key={folder.id}
                  className={cn(
                    "group flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-teal-300 hover:bg-teal-50/50 transition-all cursor-pointer min-w-[200px]",
                    viewMode === "grid" ? "flex-1" : ""
                  )}
                  onClick={() => setCurrentFolderId(folder.id)}
                >
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <FolderOpen className="w-6 h-6 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">{folder.name}</p>
                    <p className="text-xs text-slate-500">
                      {getFileCountForFolder(folder.id)} files
                    </p>
                  </div>
                  {folder.isCustom && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRenameFolderModal(folder);
                          setRenameFolderNewName(folder.name);
                        }}
                        className="p-1.5 text-slate-400 hover:text-teal-600 rounded"
                      >
                        Rename
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteFolderModal(folder);
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className={cn("gap-4", viewMode === "list" ? "flex flex-col" : "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4")}>
              {displayFiles.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-12 text-slate-500">
                  <FileText className="w-12 h-12 mb-4 opacity-40" />
                  <p className="text-sm font-medium">No files in this folder</p>
                  <p className="text-xs mt-1">Upload files or drag and drop</p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-4 flex items-center gap-2 px-4 py-2 text-sm font-medium text-teal-600 hover:bg-teal-50 rounded-lg"
                  >
                    <Upload className="w-4 h-4" />
                    Upload
                  </button>
                </div>
              ) : (
                displayFiles.map((doc) => {
                  const Icon = getFileIcon(doc.file_type);
                  const isOptionsOpen = optionsMenuDoc?.id === doc.id;

                  return (
                    <div
                      key={doc.id}
                      className={cn(
                        "group relative flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-teal-200 hover:bg-slate-50/50 transition-all",
                        viewMode === "list" ? "flex-row" : "flex-col"
                      )}
                    >
                      <div className={cn("flex items-center", viewMode === "list" ? "flex-1 min-w-0" : "flex-col")}>
                        <div className={cn("p-2 rounded-lg flex-shrink-0", viewMode === "list" ? "bg-slate-100" : "bg-slate-100 w-full")}>
                          <Icon className={cn("text-slate-600", viewMode === "list" ? "w-5 h-5" : "w-8 h-8 mx-auto")} />
                        </div>
                        <div className={cn("min-w-0", viewMode === "list" ? "ml-3 flex-1" : "mt-2 text-center")}>
                          <p className="font-medium text-slate-900 truncate text-sm">{doc.file_name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {formatFileSize(doc.file_size)} • {getFileExtension(doc.file_name)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleDownload(doc)}
                          className="p-2 text-slate-400 hover:text-teal-600 rounded-lg transition-colors"
                          aria-label="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={(e) => {
                              setOptionsMenuDoc(doc);
                              setOptionsMenuPos({ x: e.clientX, y: e.clientY });
                            }}
                            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
                            aria-label="Options"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          {isOptionsOpen && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={closeOptionsMenu} />
                              <div
                                ref={optionsMenuRef}
                                className="fixed z-50 bg-white rounded-lg shadow-lg border border-slate-200 py-1 min-w-[140px]"
                                style={{ left: optionsMenuPos?.x ?? 0, top: (optionsMenuPos?.y ?? 0) + 8 }}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleDownload(doc);
                                    closeOptionsMenu();
                                  }}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                >
                                  <Download className="w-4 h-4" />
                                  Download
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRenameDoc(doc);
                                    setRenameDocNewName(doc.file_name);
                                    closeOptionsMenu();
                                  }}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                >
                                  Rename
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (window.confirm(`Delete "${doc.file_name}"?`)) handleDeleteFile(doc);
                                    closeOptionsMenu();
                                  }}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {currentFolderId && (
            <button
              type="button"
              onClick={() => setCurrentFolderId(null)}
              className="mt-4 flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-teal-600"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
              Back to Root
            </button>
          )}
        </div>
      </div>

      {/* Rename File Modal */}
      {renameDoc && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="font-semibold text-slate-900 mb-4">Rename file</h3>
            <input
              type="text"
              value={renameDocNewName}
              onChange={(e) => setRenameDocNewName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900"
              placeholder="New name"
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => {
                  setRenameDoc(null);
                  setRenameDocNewName("");
                }}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleRenameFile(renameDoc, renameDocNewName)}
                disabled={!renameDocNewName.trim()}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Folder Modal */}
      {createFolderModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="font-semibold text-slate-900 mb-4">Create folder</h3>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900"
              placeholder="e.g. Tax 2024, Maintenance Receipts"
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => {
                  setCreateFolderModal(false);
                  setNewFolderName("");
                }}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim()}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Folder Modal */}
      {renameFolderModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="font-semibold text-slate-900 mb-4">Rename folder</h3>
            <input
              type="text"
              value={renameFolderNewName}
              onChange={(e) => setRenameFolderNewName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900"
              placeholder="Folder name"
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => {
                  setRenameFolderModal(null);
                  setRenameFolderNewName("");
                }}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRenameFolder}
                disabled={!renameFolderNewName.trim()}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Folder Modal */}
      {deleteFolderModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="font-semibold text-slate-900 mb-2">Delete folder</h3>
            <p className="text-sm text-slate-600 mb-4">
              Delete &quot;{deleteFolderModal.name}&quot;? This will also remove all files inside.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteFolderModal(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteFolder}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
