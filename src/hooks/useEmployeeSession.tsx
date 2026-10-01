import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export type BusinessRole = "proprietario" | "funcionario";

interface EmployeeSessionData {
  employeeAccountId: string;
  ownerUserId: string;
  employeeId: string | null;
  employeeName: string | null;
  role: BusinessRole;
}

interface EmployeeSessionContextType {
  employeeSession: EmployeeSessionData | null;
  isEmployeeLoggedIn: boolean;
  loading: boolean;
  loginWithCode: (code: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const EmployeeSessionContext = createContext<EmployeeSessionContextType | undefined>(undefined);

const EMPLOYEE_SESSION_KEY = "employee_session";

export const EmployeeSessionProvider = ({ children }: { children: ReactNode }) => {
  const [employeeSession, setEmployeeSession] = useState<EmployeeSessionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session in localStorage
    const stored = localStorage.getItem(EMPLOYEE_SESSION_KEY);
    if (stored) {
      try {
        setEmployeeSession(JSON.parse(stored));
      } catch {
        localStorage.removeItem(EMPLOYEE_SESSION_KEY);
      }
    }
    setLoading(false);
  }, []);

  const loginWithCode = async (code: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.rpc("validate_access_code", {
        code: code.toUpperCase(),
      });

      if (error) {
        console.error("Error validating access code:", error);
        return { success: false, error: "Erro ao validar código de acesso" };
      }

      if (!data || data.length === 0) {
        return { success: false, error: "Código de acesso inválido ou inativo" };
      }

      const result = data[0];
      const sessionData: EmployeeSessionData = {
        employeeAccountId: result.employee_account_id,
        ownerUserId: result.owner_user_id,
        employeeId: result.employee_id,
        employeeName: result.employee_name,
        role: result.role as BusinessRole,
      };

      setEmployeeSession(sessionData);
      localStorage.setItem(EMPLOYEE_SESSION_KEY, JSON.stringify(sessionData));

      return { success: true };
    } catch (error) {
      console.error("Error during login:", error);
      return { success: false, error: "Erro ao fazer login" };
    }
  };

  const logout = () => {
    setEmployeeSession(null);
    localStorage.removeItem(EMPLOYEE_SESSION_KEY);
  };

  return (
    <EmployeeSessionContext.Provider
      value={{
        employeeSession,
        isEmployeeLoggedIn: !!employeeSession,
        loading,
        loginWithCode,
        logout,
      }}
    >
      {children}
    </EmployeeSessionContext.Provider>
  );
};

export const useEmployeeSession = () => {
  const context = useContext(EmployeeSessionContext);
  if (context === undefined) {
    throw new Error("useEmployeeSession must be used within an EmployeeSessionProvider");
  }
  return context;
};
