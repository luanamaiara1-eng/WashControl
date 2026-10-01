export type AppointmentStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
export type PaymentMethod = 'cash' | 'pix' | 'credit_card' | 'debit_card' | 'credit' | 'debit' | 'transfer';

export interface Client {
  id: string;
  user_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: string;
  user_id: string;
  client_id: string;
  brand: string;
  model: string;
  plate: string;
  color: string | null;
  year: number | null;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  price: number;
  duration_minutes: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Employee {
  id: string;
  user_id: string;
  name: string;
  phone: string | null;
  role: string | null;
  is_active: boolean;
  commission_rate: number | null;
  fixed_salary: number | null;
  hire_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  user_id: string;
  client_id: string | null;
  vehicle_id: string | null;
  service_id: string | null;
  employee_id: string | null;
  scheduled_date: string;
  scheduled_time: string;
  status: AppointmentStatus;
  price: number | null;
  payment_method: PaymentMethod | null;
  notes: string | null;
  check_in_at: string | null;
  check_out_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  clients?: Client;
  vehicles?: Vehicle;
  services?: Service;
  employees?: Employee;
}
