import { Navigate } from "react-router-dom";
import { useEmployeeSession } from "@/hooks/useEmployeeSession";
import { Loader2 } from "lucide-react";

interface EmployeeRouteProps {
  children: React.ReactNode;
}

const EmployeeRoute = ({ children }: EmployeeRouteProps) => {
  const { isEmployeeLoggedIn, loading } = useEmployeeSession();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isEmployeeLoggedIn) {
    return <Navigate to="/login-funcionario" replace />;
  }

  return <>{children}</>;
};

export default EmployeeRoute;
