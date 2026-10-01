import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { format, startOfMonth, endOfMonth, subMonths, eachDayOfInterval, startOfWeek, endOfWeek } from "date-fns";

export const useServiceRanking = (startDate: Date, endDate: Date) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["service-ranking", user?.id, format(startDate, "yyyy-MM-dd"), format(endDate, "yyyy-MM-dd")],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("appointments")
        .select(`
          service_id,
          price,
          services (id, name, price)
        `)
        .eq("user_id", user.id)
        .eq("status", "completed")
        .gte("scheduled_date", format(startDate, "yyyy-MM-dd"))
        .lte("scheduled_date", format(endDate, "yyyy-MM-dd"));

      if (error) throw error;

      // Group by service
      const serviceMap: Record<string, { name: string; count: number; revenue: number }> = {};
      data?.forEach((a) => {
        const serviceId = a.service_id || "unknown";
        const serviceName = (a.services as any)?.name || "Serviço não especificado";
        if (!serviceMap[serviceId]) {
          serviceMap[serviceId] = { name: serviceName, count: 0, revenue: 0 };
        }
        serviceMap[serviceId].count++;
        serviceMap[serviceId].revenue += Number(a.price) || 0;
      });

      return Object.entries(serviceMap)
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.count - a.count);
    },
    enabled: !!user,
  });
};

export const useEmployeeRanking = (startDate: Date, endDate: Date) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["employee-ranking", user?.id, format(startDate, "yyyy-MM-dd"), format(endDate, "yyyy-MM-dd")],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("appointments")
        .select(`
          employee_id,
          price,
          employee_commission,
          employees (id, name, commission_rate)
        `)
        .eq("user_id", user.id)
        .eq("status", "completed")
        .gte("scheduled_date", format(startDate, "yyyy-MM-dd"))
        .lte("scheduled_date", format(endDate, "yyyy-MM-dd"));

      if (error) throw error;

      // Group by employee
      const employeeMap: Record<string, { name: string; count: number; revenue: number; commission: number }> = {};
      data?.forEach((a) => {
        const employeeId = a.employee_id || "unknown";
        const employeeName = (a.employees as any)?.name || "Funcionário não especificado";
        if (!employeeMap[employeeId]) {
          employeeMap[employeeId] = { name: employeeName, count: 0, revenue: 0, commission: 0 };
        }
        employeeMap[employeeId].count++;
        employeeMap[employeeId].revenue += Number(a.price) || 0;
        employeeMap[employeeId].commission += Number(a.employee_commission) || 0;
      });

      return Object.entries(employeeMap)
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.revenue - a.revenue);
    },
    enabled: !!user,
  });
};

export const useClientAnalysis = (startDate: Date, endDate: Date) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["client-analysis", user?.id, format(startDate, "yyyy-MM-dd"), format(endDate, "yyyy-MM-dd")],
    queryFn: async () => {
      if (!user) return { topClients: [], newClients: 0, returningClients: 0 };

      const { data: appointments, error: appointmentsError } = await supabase
        .from("appointments")
        .select(`
          client_id,
          price,
          scheduled_date,
          clients (id, name, created_at)
        `)
        .eq("user_id", user.id)
        .eq("status", "completed")
        .gte("scheduled_date", format(startDate, "yyyy-MM-dd"))
        .lte("scheduled_date", format(endDate, "yyyy-MM-dd"));

      if (appointmentsError) throw appointmentsError;

      // Group by client
      const clientMap: Record<string, { name: string; count: number; revenue: number; isNew: boolean }> = {};
      const newClientsSet = new Set<string>();
      const returningClientsSet = new Set<string>();

      appointments?.forEach((a) => {
        const clientId = a.client_id || "unknown";
        const clientName = (a.clients as any)?.name || "Cliente não especificado";
        const clientCreatedAt = (a.clients as any)?.created_at;
        const isNew = clientCreatedAt && new Date(clientCreatedAt) >= startDate;

        if (!clientMap[clientId]) {
          clientMap[clientId] = { name: clientName, count: 0, revenue: 0, isNew };
        }
        clientMap[clientId].count++;
        clientMap[clientId].revenue += Number(a.price) || 0;

        if (isNew) {
          newClientsSet.add(clientId);
        } else if (clientId !== "unknown") {
          returningClientsSet.add(clientId);
        }
      });

      const topClients = Object.entries(clientMap)
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      return {
        topClients,
        newClients: newClientsSet.size,
        returningClients: returningClientsSet.size,
      };
    },
    enabled: !!user,
  });
};

export const useRevenueOverTime = (startDate: Date, endDate: Date) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["revenue-over-time", user?.id, format(startDate, "yyyy-MM-dd"), format(endDate, "yyyy-MM-dd")],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("appointments")
        .select("scheduled_date, price")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .gte("scheduled_date", format(startDate, "yyyy-MM-dd"))
        .lte("scheduled_date", format(endDate, "yyyy-MM-dd"));

      if (error) throw error;

      // Group by date
      const dateMap: Record<string, number> = {};
      data?.forEach((a) => {
        const date = a.scheduled_date;
        dateMap[date] = (dateMap[date] || 0) + (Number(a.price) || 0);
      });

      // Fill in missing dates
      const days = eachDayOfInterval({ start: startDate, end: endDate });
      return days.map((day) => {
        const dateStr = format(day, "yyyy-MM-dd");
        return {
          date: dateStr,
          label: format(day, "dd/MM"),
          revenue: dateMap[dateStr] || 0,
        };
      });
    },
    enabled: !!user,
  });
};

export const useMonthlyComparison = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["monthly-comparison-report", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const months = [];
      for (let i = 5; i >= 0; i--) {
        const month = subMonths(new Date(), i);
        const start = format(startOfMonth(month), "yyyy-MM-dd");
        const end = format(endOfMonth(month), "yyyy-MM-dd");

        const { data } = await supabase
          .from("appointments")
          .select("price")
          .eq("user_id", user.id)
          .eq("status", "completed")
          .gte("scheduled_date", start)
          .lte("scheduled_date", end);

        const revenue = data?.reduce((acc, a) => acc + (Number(a.price) || 0), 0) || 0;
        const count = data?.length || 0;

        months.push({
          month: format(month, "MMM/yy"),
          revenue,
          count,
        });
      }

      return months;
    },
    enabled: !!user,
  });
};

export const useStatusBreakdown = (startDate: Date, endDate: Date) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["status-breakdown", user?.id, format(startDate, "yyyy-MM-dd"), format(endDate, "yyyy-MM-dd")],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("appointments")
        .select("status")
        .eq("user_id", user.id)
        .gte("scheduled_date", format(startDate, "yyyy-MM-dd"))
        .lte("scheduled_date", format(endDate, "yyyy-MM-dd"));

      if (error) throw error;

      const statusMap: Record<string, number> = {};
      data?.forEach((a) => {
        statusMap[a.status] = (statusMap[a.status] || 0) + 1;
      });

      const statusLabels: Record<string, string> = {
        scheduled: "Agendados",
        in_progress: "Em Andamento",
        completed: "Finalizados",
        cancelled: "Cancelados",
        no_show: "Não Compareceu",
      };

      return Object.entries(statusMap).map(([status, count]) => ({
        status,
        label: statusLabels[status] || status,
        count,
      }));
    },
    enabled: !!user,
  });
};

export const useWeekdayAnalysis = (startDate: Date, endDate: Date) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["weekday-analysis", user?.id, format(startDate, "yyyy-MM-dd"), format(endDate, "yyyy-MM-dd")],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("appointments")
        .select("scheduled_date, price")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .gte("scheduled_date", format(startDate, "yyyy-MM-dd"))
        .lte("scheduled_date", format(endDate, "yyyy-MM-dd"));

      if (error) throw error;

      const weekdayMap: Record<number, { count: number; revenue: number }> = {
        0: { count: 0, revenue: 0 },
        1: { count: 0, revenue: 0 },
        2: { count: 0, revenue: 0 },
        3: { count: 0, revenue: 0 },
        4: { count: 0, revenue: 0 },
        5: { count: 0, revenue: 0 },
        6: { count: 0, revenue: 0 },
      };

      data?.forEach((a) => {
        const day = new Date(a.scheduled_date).getDay();
        weekdayMap[day].count++;
        weekdayMap[day].revenue += Number(a.price) || 0;
      });

      const weekdayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

      return Object.entries(weekdayMap).map(([day, data]) => ({
        day: parseInt(day),
        label: weekdayLabels[parseInt(day)],
        ...data,
      }));
    },
    enabled: !!user,
  });
};