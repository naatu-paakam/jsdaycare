import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Role } from "@/lib/types";

interface Props {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    // Redirect parents to their portal
    if (profile.role === "parent") return <Navigate to="/parent" replace />;
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
}
