-- Create table for historical traffic data
CREATE TABLE public.traffic_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  location_name TEXT NOT NULL,
  latitude DECIMAL(10, 6) NOT NULL,
  longitude DECIMAL(10, 6) NOT NULL,
  congestion_level INTEGER NOT NULL CHECK (congestion_level >= 0 AND congestion_level <= 100),
  current_speed DECIMAL(5, 2),
  free_flow_speed DECIMAL(5, 2),
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  data_source TEXT DEFAULT 'tomtom'
);

-- Enable Row Level Security
ALTER TABLE public.traffic_history ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (traffic data is public)
CREATE POLICY "Anyone can read traffic history" 
ON public.traffic_history 
FOR SELECT 
USING (true);

-- Create policy for insert via edge functions (using service role)
CREATE POLICY "Service role can insert traffic data" 
ON public.traffic_history 
FOR INSERT 
WITH CHECK (true);

-- Create index for efficient time-based queries
CREATE INDEX idx_traffic_history_recorded_at ON public.traffic_history (recorded_at DESC);
CREATE INDEX idx_traffic_history_location ON public.traffic_history (location_name);

-- Enable realtime for traffic updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.traffic_history;