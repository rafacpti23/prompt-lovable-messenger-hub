-- Fix campaign status check constraint
ALTER TABLE campaigns DROP CONSTRAINT IF EXISTS campaigns_status_check;
ALTER TABLE campaigns ADD CONSTRAINT campaigns_status_check CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed', 'paused'));

-- Create media repository table for user media assets
CREATE TABLE IF NOT EXISTS public.media_repository (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  description TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.media_repository ENABLE ROW LEVEL SECURITY;

-- Create policies for media repository
CREATE POLICY "Users can view their own media" 
ON public.media_repository 
FOR SELECT 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can upload their own media" 
ON public.media_repository 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own media" 
ON public.media_repository 
FOR UPDATE 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own media" 
ON public.media_repository 
FOR DELETE 
USING (auth.uid()::text = user_id::text);

-- Create storage bucket for media files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('user-media', 'user-media', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for user media
CREATE POLICY "Users can view their media files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'user-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their media files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'user-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their media files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'user-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their media files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'user-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Update trigger for media repository
CREATE OR REPLACE FUNCTION public.update_media_repository_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_media_repository_updated_at
  BEFORE UPDATE ON public.media_repository
  FOR EACH ROW
  EXECUTE FUNCTION public.update_media_repository_updated_at();