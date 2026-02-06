import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import axios from "axios";
import "./menu.css";
import BlackLogo from "../../assets/BlackLogo.png";
import home from "../../assets/Home.svg";
import project from "../../assets/Project.svg";
import dossier from "../../assets/Dossier.svg";
import notif from "../../assets/Bell.svg";
import previsions from "../../assets/Previsions.svg";
import calendrier from "../../assets/Calendar.svg";
import images from "../../assets/Images.svg";
import contrat from "../../assets/Contract.svg";
import devis from "../../assets/Devis.svg";
import cahier from "../../assets/Cahier.svg";
import reportIcon from "../../assets/report.svg"; // ← Ajoutez cette icône
import { useAuth } from "../../contexts/AuthContext";

const Menu = () => {
  const navigate = useNavigate();
  const { setUser, user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeIcon, setActiveIcon] = useState("home");
  const [openMenus, setOpenMenus] = useState({
    projet: true,
    documents: true,
  });
  const [assignedOfficials, setAssignedOfficials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const toggleMenu = (menu) => {
    setOpenMenus((prev) => ({
      ...prev,
      [menu]: !prev[menu],
    }));
  };

  // Charger les documents assignés
  useEffect(() => {
    const fetchAssignedOfficials = async () => {
      if (!openMenus.documents || !user) return;

      setLoading(true);
      setError(null);

      try {
        const token = Cookies.get("userToken");
        const response = await axios.get(
          "https://site--outilbackend--fp64tcf5fhqm.code.run/officials/my/assigned",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (response.data.success) {
          setAssignedOfficials(response.data.data);
        } else {
          setError("Erreur lors du chargement des documents");
        }
      } catch (error) {
        console.error("Erreur récupération documents:", error);
        setError("Impossible de charger les documents assignés");
      } finally {
        setLoading(false);
      }
    };

    fetchAssignedOfficials();
  }, [openMenus.documents, user]);

  const handleIconClick = (iconName) => {
    if (!isExpanded) {
      if (iconName === "home") {
        setActiveIcon(iconName);
        setIsExpanded(true);
      } else if (iconName === "project") {
        navigate("/images");
      } else if (iconName === "dossier") {
        navigate("/documents");
      }
      return;
    }

    setActiveIcon(iconName);
    setIsExpanded(!isExpanded);
  };

  const handleLogout = async () => {
    const token = Cookies.get("userToken");

    if (token) {
      try {
        await axios.post(
          "https://site--outilbackend--fp64tcf5fhqm.code.run/logout",
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
      } catch (error) {
        console.log("Logout serveur:", error.message);
      }
    }

    Cookies.remove("userToken");
    Cookies.remove("user");
    localStorage.clear();
    sessionStorage.clear();

    setUser(null);
    navigate("/login");
  };

  const getIconForDocument = (official) => {
    const type = official.type?.toLowerCase() || "";
    if (type.includes("contrat")) return contrat;
    if (type.includes("devis")) return devis;
    if (type.includes("cahier")) return cahier;
    return dossier;
  };

  const formatDocumentTitle = (official) => {
    return official.documentName || official.type || "Document";
  };

  // Déterminer si admin
  const isAdmin = user?.role === "admin";

  return (
    <div className="sidebar-container">
      {/* Barre d'icônes sombre */}
      <div className="menu">
        <img className="logo" src={BlackLogo} alt="Logo" />
        <div className="icons">
          <div
            className={`icon-wrapper ${activeIcon === "home" ? "active" : ""}`}
            onClick={() => handleIconClick("home")}
          >
            <img className="icon" src={home} alt="home" />
          </div>
          <div
            className={`icon-wrapper ${activeIcon === "project" ? "active" : ""}`}
            onClick={() => handleIconClick("project")}
          >
            <img className="icon" src={project} alt="project" />
          </div>
          <div
            className={`icon-wrapper ${activeIcon === "dossier" ? "active" : ""}`}
            onClick={() => handleIconClick("dossier")}
          >
            <img className="icon" src={dossier} alt="dossier" />
          </div>
        </div>
      </div>

      {/* Panel étendu blanc */}
      <div className={`expanded-panel ${isExpanded ? "open" : ""}`}>
        <div className="panel-content">
          <div>
            <h2 className="section-title">Home</h2>

            {/* Navigation principale */}
            <nav className="main-nav">
              <a href="notifications" className="nav-item">
                <img src={notif} alt="notifications" className="nav-icon" />
                <span>Notifications</span>
              </a>

              <a href="/" className="nav-item">
                <img src={previsions} alt="previsions" className="nav-icon" />
                <span>Previsions</span>
              </a>

              <a href="calendrier" className="nav-item">
                <img src={calendrier} alt="calendrier" className="nav-icon" />
                <span>Calendrier</span>
              </a>

              {/* ============================================
                  NOUVEAU : LIEN REPORT SELON LE RÔLE
                  ============================================ */}
              {isAdmin ? (
                // Admin : voir tous les reports
                <a href="/reports" className="nav-item admin-report-link">
                  <img src={reportIcon} alt="reports" className="nav-icon" />
                  <span>Tous les reports</span>
                </a>
              ) : (
                // User : créer un report
                <a href="/addRepport" className="nav-item user-report-link">
                  <img
                    src={reportIcon}
                    alt="add report"
                    className="nav-icon colored"
                  />
                  <span>Signaler un problème</span>
                </a>
              )}
            </nav>

            {/* Section Projet */}
            <div className="nav-section">
              <button
                className="section-header"
                onClick={() => toggleMenu("projet")}
              >
                <img src={project} alt="projet" className="nav-icon" />
                <strong>Projet</strong>
                <span className={`chevron ${openMenus.projet ? "open" : ""}`}>
                  ›
                </span>
              </button>

              <div className={`submenu ${openMenus.projet ? "open" : ""}`}>
                <a href="images" className="nav-item sub-item">
                  <img src={images} alt="images" className="nav-icon colored" />
                  <span>Images</span>
                </a>
              </div>
            </div>

            {/* Section Documents */}
            <div className="nav-section">
              <button
                className="section-header"
                onClick={() => toggleMenu("documents")}
              >
                <img src={dossier} alt="documents" className="nav-icon" />
                <strong>Documents</strong>
                <span
                  className={`chevron ${openMenus.documents ? "open" : ""}`}
                >
                  ›
                </span>
              </button>

              <div className={`submenu ${openMenus.documents ? "open" : ""}`}>
                {loading ? (
                  <div className="nav-item sub-item">
                    <span>Chargement...</span>
                  </div>
                ) : error ? (
                  <div className="nav-item sub-item">
                    <span className="error-text">Erreur de chargement</span>
                  </div>
                ) : assignedOfficials.length === 0 ? (
                  <div className="nav-item sub-item">
                    <span>Aucun document assigné</span>
                  </div>
                ) : (
                  assignedOfficials.map((official) => (
                    <a
                      key={official._id}
                      href={`/officials/${official._id}`}
                      className="nav-item sub-item"
                    >
                      <img
                        src={getIconForDocument(official)}
                        alt={official.type}
                        className="nav-icon colored"
                      />
                      <span>{formatDocumentTitle(official)}</span>
                    </a>
                  ))
                )}
              </div>
            </div>

            {/* Liens simples */}
            <div className="simple-links">
              <a href="contact" className="nav-item">
                <span>Contact</span>
                <span className="arrow">›</span>
              </a>
              <a href="aide" className="nav-item">
                <span>Centre d'aide</span>
                <span className="arrow">›</span>
              </a>
            </div>

            {/* Section Administration */}
            {isAdmin && (
              <div className="admin-section">
                <h3 className="section-title">Administration</h3>
                <a href="/addProfile" className="nav-item admin-link">
                  <span>➕ Ajouter un profil</span>
                  <span className="arrow">›</span>
                </a>
              </div>
            )}
          </div>

          {/* Déconnexion */}
          <div className="logout-section">
            <button
              className="nav-item logout"
              onClick={handleLogout}
              type="button"
            >
              <span>Se déconnecter</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Menu;
