import { Navigate } from "react-router-dom";
import Cookies from "js-cookie";

/**
 * Composant ProtectedRoute - Protège les routes nécessitant une authentification
 * Redirige vers /login si l'utilisateur n'est pas connecté
 */
const ProtectedRoute = ({ children }) => {
  const token = Cookies.get("userToken");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
