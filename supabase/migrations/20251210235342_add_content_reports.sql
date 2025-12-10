-- Migration: Add content reports table for flagging inappropriate content

-- Create content_reports table
CREATE TABLE IF NOT EXISTS public.content_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('profile', 'stack')),
  content_id UUID NOT NULL,
  reason VARCHAR(50) NOT NULL CHECK (reason IN ('inappropriate', 'spam', 'misleading', 'copyright', 'other')),
  details TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_content_reports_status ON public.content_reports(status);
CREATE INDEX IF NOT EXISTS idx_content_reports_content ON public.content_reports(content_type, content_id);

-- Prevent duplicate reports from same user for same content
CREATE UNIQUE INDEX IF NOT EXISTS idx_content_reports_unique
  ON public.content_reports(reporter_id, content_type, content_id)
  WHERE reporter_id IS NOT NULL;

-- RLS policies
ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;

-- Anyone can insert reports (even anonymous)
CREATE POLICY "Anyone can create reports"
  ON public.content_reports FOR INSERT
  WITH CHECK (true);

-- Users can view their own reports
CREATE POLICY "Users can view own reports"
  ON public.content_reports FOR SELECT
  USING (reporter_id = auth.uid());

-- Admin can view all reports (add admin check later if needed)
-- For now, only allow users to see their own reports
