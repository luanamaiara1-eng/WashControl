import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { Employee } from "@/types/database";
import { toast } from "sonner";

export const useEmployees = (includeInactive = false) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["employees", user?.id, includeInactive],
    queryFn: async () => {
      if (!user) return [];
      
      let query = supabase
        .from("employees")
        .select("*")
        .eq("user_id", user.id)
        .order("name", { ascending: true });

      if (!includeInactive) {
        query = query.eq("is_active", true);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Employee[];
    },
    enabled: !!user,
  });
};

// Get employee stats with completed services count and total commission
export const useEmployeeStats = (employeeId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["employee-stats", employeeId, user?.id],
    queryFn: async () => {
      if (!user || !employeeId) return null;
      
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("user_id", user.id)
        .eq("employee_id", employeeId)
        .eq("status", "completed");

      if (error) throw error;

      const completedServices = data?.length || 0;
      const totalCommission = data?.reduce((acc, apt) => acc + (Number(apt.employee_commission) || 0), 0) || 0;
      const totalRevenue = data?.reduce((acc, apt) => acc + (Number(apt.price) || 0), 0) || 0;

      return {
        completedServices,
        totalCommission,
        totalRevenue,
      };
    },
    enabled: !!user && !!employeeId,
  });
};

// Get all employees with their stats
export const useEmployeesWithStats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["employees-with-stats", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      // Get all employees
      const { data: employees, error: empError } = await supabase
        .from("employees")
        .select("*")
        .eq("user_id", user.id)
        .order("name", { ascending: true });

      if (empError) throw empError;

      // Get all completed appointments
      const { data: appointments, error: aptError } = await supabase
        .from("appointments")
        .select("employee_id, price, employee_commission")
        .eq("user_id", user.id)
        .eq("status", "completed");

      if (aptError) throw aptError;

      // Get all employee-related transactions (expenses paid to employees)
      const { data: employeeTransactions, error: txError } = await supabase
        .from("transactions")
        .select("employee_id, amount, type, category")
        .eq("user_id", user.id)
        .eq("type", "expense")
        .eq("category", "Funcionário")
        .not("employee_id", "is", null);

      if (txError) throw txError;

      // Calculate stats for each employee
      const employeesWithStats = employees?.map((emp) => {
        const empAppointments = appointments?.filter(apt => apt.employee_id === emp.id) || [];
        const empTransactions = employeeTransactions?.filter(tx => tx.employee_id === emp.id) || [];
        
        // Total from appointment commissions
        const appointmentCommissions = empAppointments.reduce((acc, apt) => acc + (Number(apt.employee_commission) || 0), 0);
        
        // Total from direct payments (transactions with category "Funcionário")
        const directPayments = empTransactions.reduce((acc, tx) => acc + (Number(tx.amount) || 0), 0);
        
        return {
          ...emp,
          completedServices: empAppointments.length,
          totalCommission: appointmentCommissions + directPayments,
          directPayments: directPayments,
          totalRevenue: empAppointments.reduce((acc, apt) => acc + (Number(apt.price) || 0), 0),
        };
      }) || [];

      return employeesWithStats;
    },
    enabled: !!user,
  });
};

interface CreateEmployeeData {
  name: string;
  phone?: string;
  role?: string;
  commission_rate?: number;
  fixed_salary?: number;
  hire_date?: string;
}

export const useCreateEmployee = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateEmployeeData) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { data: result, error } = await supabase
        .from("employees")
        .insert({
          ...data,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return result as Employee;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["employees-with-stats"] });
      toast.success("Funcionário criado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar funcionário: " + error.message);
    },
  });
};

interface UpdateEmployeeData {
  id: string;
  name?: string;
  phone?: string;
  role?: string;
  commission_rate?: number;
  fixed_salary?: number;
  hire_date?: string;
  is_active?: boolean;
}

export const useUpdateEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateEmployeeData) => {
      const { data: result, error } = await supabase
        .from("employees")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return result as Employee;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["employees-with-stats"] });
      toast.success("Funcionário atualizado!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar funcionário: " + error.message);
    },
  });
};

export const useDeleteEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("employees")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["employees-with-stats"] });
      toast.success("Funcionário removido!");
    },
    onError: (error) => {
      toast.error("Erro ao remover funcionário: " + error.message);
    },
  });
};
