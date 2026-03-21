-- Create garbage_reports table for user reports
CREATE TABLE public.garbage_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  location_name TEXT NOT NULL,
  description TEXT,
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  report_type TEXT NOT NULL DEFAULT 'dumping' CHECK (report_type IN ('dumping', 'overflow', 'burning', 'hazardous', 'other')),
  status TEXT NOT NULL DEFAULT 'reported' CHECK (status IN ('reported', 'in_progress', 'resolved')),
  reported_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.garbage_reports ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read garbage reports
CREATE POLICY "Anyone can read garbage reports"
  ON public.garbage_reports
  FOR SELECT
  USING (true);

-- Allow anyone to insert garbage reports (no auth required)
CREATE POLICY "Anyone can report garbage issues"
  ON public.garbage_reports
  FOR INSERT
  WITH CHECK (true);

-- Create index for location queries
CREATE INDEX idx_garbage_reports_location ON public.garbage_reports (latitude, longitude);
CREATE INDEX idx_garbage_reports_status ON public.garbage_reports (status);