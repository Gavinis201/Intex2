import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated, isAdmin } from '../services/authService';
import { useState, useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

const ProtectedRoute = ({
  children,
  adminOnly = false,
}: ProtectedRouteProps) => {
  const location = useLocation();
  const [isAdminUser, setIsAdminUser] = useState<boolean | null>(null);
  const [loading, setLoading] = useState<boolean>(adminOnly);

  useEffect(() => {
    const checkAdmin = async () => {
      if (adminOnly) {
        try {
          const adminStatus = await isAdmin();
          setIsAdminUser(adminStatus);
        } catch (error) {
          console.error('Error checking admin status:', error);
          setIsAdminUser(false);
        } finally {
          setLoading(false);
        }
      }
    };

    checkAdmin();
  }, [adminOnly]);

  if (!isAuthenticated()) {
    // Redirect to login page but save the attempted location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Show loading state while checking admin status
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Checking permissions...</p>
      </div>
    );
  }

  // If this route requires admin access, check if user is admin
  if (adminOnly && !isAdminUser) {
    // Redirect to homepage for non-admin users
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
