import { createContext, useContext } from "react";
import Cookies from "js-cookie";

const AuthContext = createContext();

export const AuthProvider = ({ children, setUser }) => {
  // Récupérer l'utilisateur depuis localStorage
  const user = JSON.parse(localStorage.getItem("user"));

  const value = {
    setUser,
    user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit être utilisé dans AuthProvider");
  }
  return context;
};

export const getCurrentUser = () => {
  return JSON.parse(localStorage.getItem("user"));
};

export const isAuthenticated = () => {
  const token = Cookies.get("userToken");
  return !!token;
};
