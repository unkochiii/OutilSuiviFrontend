import { useState, useEffect } from "react";
import "./header.css";

const Header = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Récupérer les données utilisateur depuis localStorage (définies lors de la connexion)
        const user = JSON.parse(localStorage.getItem("user"));
        if (user) {
          console.log("Utilisateur chargé:", user);
          console.log("Est admin?", user.role === "admin" || user.isAdmin);
          setUser(user);
        }
      } catch (error) {
        console.error("Erreur lors du chargement du profil:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  // Formater la date en DD/MM/YYYY
  const formatDate = (dateString) => {
    if (!dateString) return "Non définie";
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  if (loading) {
    return <div className="header">Chargement...</div>;
  }

  return (
    <div className="header">
      {user && (
        <div className="header-info">
          {/* Nom du projet */}
          <div className="header-project">
            <span className="project-icon">✦</span>
            <span className="project-name">{user.projectName}</span>
          </div>

          {/* Séparateur */}
          <div className="header-separator">|</div>

          {/* Due Date */}
          <div className="header-due-date">
            <span className="calendar-icon">📅</span>
            <span className="due-date-label">Design due date</span>
            <span className="due-date-value">{user.dueDate}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Header;
