-- Add commission fields to employees table
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS fixed_salary DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS hire_date DATE;

-- Add employee_commission to appointments for tracking
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS employee_commission DECIMAL(10,2);