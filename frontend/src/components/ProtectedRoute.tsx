import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated } from '../services/authService';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
    const location = useLocation();
    
    if (!isAuthenticated()) {
        // Redirect to home page but save the attempted location
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    return <>{children}</>;
}

export default ProtectedRoute; 