-- Create accounts receivable table
CREATE TABLE public.accounts_receivable (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  description TEXT,
  due_date DATE,
  is_received BOOLEAN NOT NULL DEFAULT false,
  received_at TIMESTAMP WITH TIME ZONE,
  payment_method TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.accounts_receivable ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own receivables"
ON public.accounts_receivable
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own receivables"
ON public.accounts_receivable
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own receivables"
ON public.accounts_receivable
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own receivables"
ON public.accounts_receivable
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_accounts_receivable_updated_at
BEFORE UPDATE ON public.accounts_receivable
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();