import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated } from '../services/authService';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const location = useLocation();
  
  if (!isAuthenticated()) {
    // Redirect to login page but save the attempted location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute; 