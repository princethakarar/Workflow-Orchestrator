import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRoleBasedPath } from '../utils/jwtHelper';

const PrivateRoute = ({ children, allowedRoles = null }) => {
  const { user, loading } = useAuth();

  // Wait for the useEffect in AuthContext to finish checking localStorage
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  // Not authenticated - redirect to home page (Welcome Page)
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Check role-based authorization if allowedRoles is specified
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to user's role-appropriate dashboard
    const redirectPath = getRoleBasedPath(user.role);
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

export default PrivateRoute;