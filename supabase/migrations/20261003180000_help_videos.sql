-- Biblioteca de vídeos e tutoriais gerenciada pelo Super Admin
CREATE TABLE IF NOT EXISTS public.help_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'Começando',
  video_url TEXT,
  thumbnail_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.help_videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active help videos" ON public.help_videos;
CREATE POLICY "Public can view active help videos"
ON public.help_videos FOR SELECT
USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can insert help videos" ON public.help_videos;
CREATE POLICY "Admins can insert help videos"
ON public.help_videos FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update help videos" ON public.help_videos;
CREATE POLICY "Admins can update help videos"
ON public.help_videos FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete help videos" ON public.help_videos;
CREATE POLICY "Admins can delete help videos"
ON public.help_videos FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO storage.buckets (id, name, public)
VALUES ('help-videos', 'help-videos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public can view help videos" ON storage.objects;
CREATE POLICY "Public can view help videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'help-videos');

DROP POLICY IF EXISTS "Admins can upload help videos" ON storage.objects;
CREATE POLICY "Admins can upload help videos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'help-videos' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update help videos files" ON storage.objects;
CREATE POLICY "Admins can update help videos files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'help-videos' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'help-videos' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete help videos files" ON storage.objects;
CREATE POLICY "Admins can delete help videos files"
ON storage.objects FOR DELETE
USING (bucket_id = 'help-videos' AND public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS help_videos_active_order_idx
ON public.help_videos (is_active, sort_order, created_at);

DROP TRIGGER IF EXISTS update_help_videos_updated_at ON public.help_videos;
CREATE OR REPLACE FUNCTION public.update_help_videos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_help_videos_updated_at
BEFORE UPDATE ON public.help_videos
FOR EACH ROW EXECUTE FUNCTION public.update_help_videos_updated_at();
