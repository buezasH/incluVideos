import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireCaregiver?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireCaregiver = false,
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (requireCaregiver && user.role !== "Caregiver") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Access Restricted
          </h2>
          <p className="text-gray-600 mb-4">
            You need to be a Caregiver to access this feature.
          </p>
          <p className="text-sm text-gray-500">
            Contact your administrator if you need access to upload and edit
            videos.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
