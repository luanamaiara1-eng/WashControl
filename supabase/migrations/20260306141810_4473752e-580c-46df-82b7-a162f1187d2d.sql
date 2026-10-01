
-- Create employee_earnings table
CREATE TABLE public.employee_earnings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  earning_date DATE NOT NULL DEFAULT CURRENT_DATE,
  type TEXT NOT NULL CHECK (type IN ('daily', 'commission', 'bonus', 'extra')),
  description TEXT,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create employee_payments table
CREATE TABLE public.employee_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create employee_advances table
CREATE TABLE public.employee_advances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  advance_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.employee_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_advances ENABLE ROW LEVEL SECURITY;

-- RLS policies for employee_earnings
CREATE POLICY "Users can view their own earnings" ON public.employee_earnings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own earnings" ON public.employee_earnings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own earnings" ON public.employee_earnings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own earnings" ON public.employee_earnings FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for employee_payments
CREATE POLICY "Users can view their own payments" ON public.employee_payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own payments" ON public.employee_payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own payments" ON public.employee_payments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own payments" ON public.employee_payments FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for employee_advances
CREATE POLICY "Users can view their own advances" ON public.employee_advances FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own advances" ON public.employee_advances FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own advances" ON public.employee_advances FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own advances" ON public.employee_advances FOR DELETE USING (auth.uid() = user_id);
