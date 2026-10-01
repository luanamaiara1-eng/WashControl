-- Table for cash drawer (opening balance)
CREATE TABLE public.cash_drawer (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  drawer_date DATE NOT NULL,
  opening_balance NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, drawer_date)
);

-- Enable RLS
ALTER TABLE public.cash_drawer ENABLE ROW LEVEL SECURITY;

-- Policies for cash_drawer
CREATE POLICY "Users can view their own cash drawer" 
ON public.cash_drawer 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own cash drawer" 
ON public.cash_drawer 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cash drawer" 
ON public.cash_drawer 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cash drawer" 
ON public.cash_drawer 
FOR DELETE 
USING (auth.uid() = user_id);

-- Table for custom categories
CREATE TABLE public.custom_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  color TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, name, type)
);

-- Enable RLS
ALTER TABLE public.custom_categories ENABLE ROW LEVEL SECURITY;

-- Policies for custom_categories
CREATE POLICY "Users can view their own categories" 
ON public.custom_categories 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own categories" 
ON public.custom_categories 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories" 
ON public.custom_categories 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories" 
ON public.custom_categories 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for updated_at on both tables
CREATE TRIGGER update_cash_drawer_updated_at
BEFORE UPDATE ON public.cash_drawer
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_custom_categories_updated_at
BEFORE UPDATE ON public.custom_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();