/**
 * File Manager Store — localStorage simulation for when Supabase is unavailable.
 * Manages folder hierarchy and documents per property ID.
 */

export interface FileManagerDocument {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  folder_id: string;
  uploaded_at: string;
  url?: string; // Not used in simulation
}

export interface FileManagerFolder {
  id: string;
  name: string;
  color?: string;
  isCustom: boolean;
}

const STORAGE_KEY_PREFIX = "investintel_property_files_";

// Default folders (matches document categories)
export const DEFAULT_FOLDERS: FileManagerFolder[] = [
  { id: "purchase", name: "Purchase Documents", isCustom: false },
  { id: "rental", name: "Tenancy Agreements", isCustom: false },
  { id: "receipts", name: "Receipts", isCustom: false },
];

function getStorageKey(propertyId: string): string {
  return `${STORAGE_KEY_PREFIX}${propertyId}`;
}

export interface FileManagerState {
  folders: FileManagerFolder[];
  documents: FileManagerDocument[];
}

export function loadFileManagerState(propertyId: string): FileManagerState {
  if (typeof window === "undefined") {
    return { folders: [...DEFAULT_FOLDERS], documents: [] };
  }
  try {
    const raw = localStorage.getItem(getStorageKey(propertyId));
    if (!raw) return { folders: [...DEFAULT_FOLDERS], documents: [] };
    const parsed = JSON.parse(raw) as { folders?: FileManagerFolder[]; documents?: FileManagerDocument[] };
    return {
      folders: parsed.folders?.length ? parsed.folders : [...DEFAULT_FOLDERS],
      documents: parsed.documents || [],
    };
  } catch {
    return { folders: [...DEFAULT_FOLDERS], documents: [] };
  }
}

export function saveFileManagerState(propertyId: string, state: FileManagerState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStorageKey(propertyId), JSON.stringify(state));
  } catch (e) {
    console.warn("[FileManager] Failed to save state:", e);
  }
}

export function addDocument(
  propertyId: string,
  folderId: string,
  file: { name: string; type: string; size: number }
): FileManagerDocument {
  const state = loadFileManagerState(propertyId);
  const doc: FileManagerDocument = {
    id: `doc_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    file_name: file.name,
    file_type: file.type,
    file_size: file.size,
    folder_id: folderId,
    uploaded_at: new Date().toISOString(),
  };
  state.documents.push(doc);
  saveFileManagerState(propertyId, state);
  return doc;
}

export function renameDocument(
  propertyId: string,
  documentId: string,
  newFileName: string
): boolean {
  const state = loadFileManagerState(propertyId);
  const doc = state.documents.find((d) => d.id === documentId);
  if (!doc) return false;
  doc.file_name = newFileName.trim();
  saveFileManagerState(propertyId, state);
  return true;
}

export function deleteDocumentById(propertyId: string, documentId: string): boolean {
  const state = loadFileManagerState(propertyId);
  const idx = state.documents.findIndex((d) => d.id === documentId);
  if (idx === -1) return false;
  state.documents.splice(idx, 1);
  saveFileManagerState(propertyId, state);
  return true;
}

export function createFolder(propertyId: string, name: string): FileManagerFolder {
  const state = loadFileManagerState(propertyId);
  const folder: FileManagerFolder = {
    id: `custom_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    name: name.trim(),
    isCustom: true,
  };
  state.folders.push(folder);
  saveFileManagerState(propertyId, state);
  return folder;
}

export function renameFolder(
  propertyId: string,
  folderId: string,
  newName: string
): boolean {
  const state = loadFileManagerState(propertyId);
  const folder = state.folders.find((f) => f.id === folderId);
  if (!folder || !folder.isCustom) return false;
  folder.name = newName.trim();
  // Update documents in this folder to use new folder_id if we were using folder name
  saveFileManagerState(propertyId, state);
  return true;
}

export function deleteFolder(propertyId: string, folderId: string): { success: boolean; hadDocuments: boolean } {
  const state = loadFileManagerState(propertyId);
  const folder = state.folders.find((f) => f.id === folderId);
  if (!folder) return { success: false, hadDocuments: false };
  if (!folder.isCustom) return { success: false, hadDocuments: false };
  const docsInFolder = state.documents.filter((d) => d.folder_id === folderId);
  state.folders = state.folders.filter((f) => f.id !== folderId);
  state.documents = state.documents.filter((d) => d.folder_id !== folderId);
  saveFileManagerState(propertyId, state);
  return { success: true, hadDocuments: docsInFolder.length > 0 };
}
