-- =============================================================================
-- Document Management System - Database Schema
-- =============================================================================

-- Create documents table
CREATE TABLE IF NOT EXISTS property_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  property_id TEXT NOT NULL,
  folder_id TEXT NOT NULL,
  
  -- File metadata
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL, -- 'pdf', 'image', 'contract', etc.
  file_size BIGINT NOT NULL, -- in bytes
  storage_path TEXT NOT NULL, -- path in Supabase Storage
  
  -- OCR and AI
  extracted_text TEXT, -- OCR text content
  embedding VECTOR(1536), -- OpenAI/Gemini embedding for semantic search
  summary TEXT, -- AI-generated summary
  
  -- Metadata
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tags TEXT[], -- Array of tags for categorization
  
  -- Foreign key relationship (soft reference to property)
  CONSTRAINT fk_property FOREIGN KEY (user_id, folder_id, property_id) 
    REFERENCES property_folders(user_id, folder_id, properties) 
    ON DELETE CASCADE
);

-- Create index for semantic search
CREATE INDEX IF NOT EXISTS idx_documents_embedding ON property_documents 
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Create index for property lookup
CREATE INDEX IF NOT EXISTS idx_documents_property ON property_documents (user_id, property_id);

-- Create index for full-text search
CREATE INDEX IF NOT EXISTS idx_documents_text_search ON property_documents 
  USING gin(to_tsvector('english', coalesce(extracted_text, '')));

-- Enable Row Level Security
ALTER TABLE property_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own documents
CREATE POLICY "Users can view own documents"
  ON property_documents
  FOR SELECT
  USING (
    user_id = current_setting('app.user_id', true)
    OR user_id = current_setting('app.user_id', false)
  );

-- RLS Policy: Users can only insert their own documents
CREATE POLICY "Users can insert own documents"
  ON property_documents
  FOR INSERT
  WITH CHECK (
    user_id = current_setting('app.user_id', true)
    OR user_id = current_setting('app.user_id', false)
  );

-- RLS Policy: Users can only update their own documents
CREATE POLICY "Users can update own documents"
  ON property_documents
  FOR UPDATE
  USING (
    user_id = current_setting('app.user_id', true)
    OR user_id = current_setting('app.user_id', false)
  );

-- RLS Policy: Users can only delete their own documents
CREATE POLICY "Users can delete own documents"
  ON property_documents
  FOR DELETE
  USING (
    user_id = current_setting('app.user_id', true)
    OR user_id = current_setting('app.user_id', false)
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_documents_timestamp
  BEFORE UPDATE ON property_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_documents_updated_at();

-- Function for semantic search (cosine similarity)
CREATE OR REPLACE FUNCTION search_documents_by_semantics(
  user_id_param TEXT,
  property_id_param TEXT,
  query_embedding VECTOR(1536),
  similarity_threshold FLOAT DEFAULT 0.7,
  limit_results INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  file_name TEXT,
  file_type TEXT,
  extracted_text TEXT,
  summary TEXT,
  similarity FLOAT,
  uploaded_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.file_name,
    d.file_type,
    d.extracted_text,
    d.summary,
    1 - (d.embedding <=> query_embedding) AS similarity,
    d.uploaded_at
  FROM property_documents d
  WHERE 
    d.user_id = user_id_param
    AND d.property_id = property_id_param
    AND d.embedding IS NOT NULL
    AND (1 - (d.embedding <=> query_embedding)) >= similarity_threshold
  ORDER BY similarity DESC
  LIMIT limit_results;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT ALL ON property_documents TO authenticated;
GRANT EXECUTE ON FUNCTION search_documents_by_semantics TO authenticated;
