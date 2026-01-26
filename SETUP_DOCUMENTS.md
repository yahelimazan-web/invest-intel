# Document Management System - Setup Instructions

## ✅ Implementation Complete

### Features Implemented:
1. ✅ Database schema with RLS policies
2. ✅ Document upload to Supabase Storage
3. ✅ OCR text extraction (PDF support)
4. ✅ AI embeddings for semantic search (Gemini)
5. ✅ Full-text search fallback
6. ✅ Document management UI component
7. ✅ Fixed edit button functionality in portfolio page

---

## 📋 Setup Steps

### 1. Run Database Migration

Execute the SQL migration file in your Supabase SQL Editor:

```bash
# File: supabase-documents-migration.sql
```

This creates:
- `property_documents` table
- RLS policies for user isolation
- Semantic search function
- Full-text search index

### 2. Create Supabase Storage Bucket

In Supabase Dashboard → Storage:

1. Create a new bucket named: `property-documents`
2. Set it to **Private** (not public)
3. Enable RLS policies

Add this storage policy in SQL Editor:

```sql
-- Allow users to upload to their own folder
CREATE POLICY "Users can upload own documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'property-documents' 
  AND (storage.foldername(name))[1] = current_setting('app.user_id', true)
);

-- Allow users to view their own documents
CREATE POLICY "Users can view own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'property-documents'
  AND (storage.foldername(name))[1] = current_setting('app.user_id', true)
);

-- Allow users to delete their own documents
CREATE POLICY "Users can delete own documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'property-documents'
  AND (storage.foldername(name))[1] = current_setting('app.user_id', true)
);
```

### 3. Install Required Packages

```bash
npm install pdf-parse
```

### 4. Enable Vector Extension (for embeddings)

In Supabase SQL Editor:

```sql
-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;
```

### 5. Environment Variables

Ensure `.env.local` contains:

```
GEMINI_API_KEY=your_gemini_api_key
RESEND_API_KEY=re_49LaB3sV_3bYFrrELbPy9hWCCkG2dzZ1a
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 🎯 Usage

### Upload Documents:
1. Go to Portfolio page
2. Select a property
3. Scroll to "מסמכים" section
4. Click "העלה מסמך"
5. Select PDF, image, or Word document

### Search Documents:
- **Text Search**: Type query and click "טקסט" button
- **Semantic Search**: Type query and click "AI" button (uses embeddings)

### View Documents:
- Click the eye icon to view document in new tab
- Documents are signed URLs (1 hour expiry)

---

## 🔒 Security

- ✅ RLS policies ensure users only see their own documents
- ✅ Storage bucket is private with user-specific folders
- ✅ All operations require user authentication
- ✅ File size limit: 10MB
- ✅ Allowed file types: PDF, Images, Word docs

---

## 📝 Notes

- OCR processing happens in background after upload
- Embeddings are generated automatically for semantic search
- If Gemini API is not available, falls back to text search
- Documents are stored in: `{userId}/{propertyId}/{filename}`

---

## 🐛 Troubleshooting

**Documents not uploading?**
- Check Supabase Storage bucket exists and is named `property-documents`
- Verify storage policies are set correctly
- Check file size (max 10MB)

**OCR not working?**
- Install `pdf-parse`: `npm install pdf-parse`
- Check GEMINI_API_KEY is set

**Semantic search not working?**
- Verify `pgvector` extension is enabled
- Check GEMINI_API_KEY is valid
- Falls back to text search automatically

---

## ✅ Status: Ready for Production!

All components are implemented and ready to use.
