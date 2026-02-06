import "./task.css";
import Header from "../../components/header/Header";
import Menu from "../../components/menu/Menu";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import Taask from "../../assets/task.jpg";

// Fonction utilitaire pour décoder le token JWT
const parseJwt = (token) => {
  if (!token) return null;
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join(""),
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

const Task = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const fetchTask = async () => {
      try {
        setLoading(true);
        const token = Cookies.get("userToken") || localStorage.getItem("token");

        if (!token) {
          navigate("/login");
          return;
        }

        // Vérifier si l'utilisateur est admin
        const decodedToken = parseJwt(token);
        if (decodedToken && decodedToken.role === "admin") {
          setIsAdmin(true);
        }

        const response = await axios.get(
          `https://site--outilbackend--fp64tcf5fhqm.code.run/task/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (response.data.success) {
          setTask(response.data.data);
        } else {
          setError("Tâche non trouvée");
        }
      } catch (err) {
        console.error("Erreur:", err);
        setError(
          err.response?.data?.error || "Erreur lors du chargement de la tâche",
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchTask();
    }
  }, [id, navigate]);

  // Calculer la progression
  const getProgress = () => {
    if (!task?.Progression || task.Progression.length === 0) return 0;
    return task.Progression[task.Progression.length - 1].percentage;
  };

  // Formater la date
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Formater l'heure
  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Obtenir le nom du document (APK le plus récent)
  const getDocumentName = () => {
    if (task?.Apk?.dev?.url) {
      const version = task.Apk.dev.version || "v1";
      return `${task.taskName?.replace(/\s+/g, "_").toLowerCase()}_${version}.apk`;
    }
    if (task?.Apk?.official?.url) {
      const version = task.Apk.official.version || "v1";
      return `${task.taskName?.replace(/\s+/g, "_").toLowerCase()}_${version}.apk`;
    }
    return null;
  };

  // Vérifier si une section a des données
  const hasSiteData = () => {
    return task?.Site?.dev?.url || task?.Site?.official?.url;
  };

  const hasApkData = () => {
    return task?.Apk?.dev?.url || task?.Apk?.official?.url;
  };

  const hasBackendData = () => {
    return task?.Backend?.dev?.url || task?.Backend?.official?.url;
  };

  const hasResources = () => {
    return hasSiteData() || hasApkData() || hasBackendData();
  };

  if (loading) {
    return (
      <>
        <Menu />
        <Header />
        <main className="task-detail">
          <div className="task-loading">Chargement...</div>
        </main>
      </>
    );
  }

  if (error || !task) {
    return (
      <>
        <Menu />
        <Header />
        <main className="task-detail">
          <div className="task-error">
            <p>{error || "Tâche non trouvée"}</p>
            <button onClick={() => navigate("/home")}>Retour</button>
          </div>
        </main>
      </>
    );
  }

  const progress = getProgress();
  const documentName = getDocumentName();
  const hasDescription = task.Description?.trim();
  const hasProblem = task.Problem?.trim();

  return (
    <>
      <Menu />
      <Header />
      <main className="task-detail">
        {/* Image header */}
        <div className="task-image-header">
          <img src={Taask} alt="Task header" />
        </div>

        {/* Contenu principal */}
        <div className="task-content">
          {/* Titre avec bouton admin */}
          <div className="task-header-row">
            <h1 className="task-title">{task.taskName || "Sans titre"}</h1>
            {isAdmin && (
              <button
                className="admin-edit-button"
                onClick={() => navigate(`/modifieTask/${id}`)}
                title="Modifier la tâche"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                Modifier
              </button>
            )}
          </div>

          {/* Date et heure */}
          <div className="task-date-time">
            <span className="task-date">
              due date : {formatDate(task.dueDate)}
            </span>
          </div>

          {/* Métadonnées */}
          <div className="task-metadata">
            {/* Duration */}
            <div className="metadata-row">
              <div className="metadata-label">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                Duration
              </div>
              <div className="metadata-value">
                {task.Duration || "Non défini"}
              </div>
            </div>

            {/* Document */}
            {documentName && (
              <div className="metadata-row">
                <div className="metadata-label">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                  </svg>
                  Document
                </div>
                <div className="metadata-value document-link">
                  <a
                    href={task.Apk?.dev?.url || task.Apk?.official?.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {documentName}
                    <svg
                      className="external-link-icon"
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                      <polyline points="15 3 21 3 21 9"></polyline>
                      <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>
                  </a>
                </div>
              </div>
            )}

            {/* Progress */}
            <div className="metadata-row">
              <div className="metadata-label">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="12" y1="2" x2="12" y2="6"></line>
                  <line x1="12" y1="18" x2="12" y2="22"></line>
                  <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                  <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                  <line x1="2" y1="12" x2="6" y2="12"></line>
                  <line x1="18" y1="12" x2="22" y2="12"></line>
                  <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                  <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
                </svg>
                Progress
              </div>
              <div className="metadata-value progress-value">
                <span>{progress}%</span>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {hasDescription && (
            <div className="task-description">
              <p>{task.Description}</p>
            </div>
          )}

          {/* Section Ressources */}
          {hasResources() && (
            <div className="task-resources">
              <h2 className="resources-title">Ressources</h2>

              {/* Site Web */}
              {hasSiteData() && (
                <div className="resource-category">
                  <span className="category-badge site-badge">Site web</span>

                  {task.Site?.dev?.url && (
                    <div className="resource-row">
                      <div className="resource-label">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                        </svg>
                        URL development
                      </div>
                      <div className="resource-value">
                        <a
                          href={task.Site.dev.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {task.Site.dev.url}
                          <svg
                            className="external-link-icon"
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                            <polyline points="15 3 21 3 21 9"></polyline>
                            <line x1="10" y1="14" x2="21" y2="3"></line>
                          </svg>
                        </a>
                      </div>
                    </div>
                  )}

                  {task.Site?.official?.url && (
                    <div className="resource-row">
                      <div className="resource-label">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                        </svg>
                        URL officiel
                      </div>
                      <div className="resource-value">
                        <a
                          href={task.Site.official.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {task.Site.official.url}
                          <svg
                            className="external-link-icon"
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                            <polyline points="15 3 21 3 21 9"></polyline>
                            <line x1="10" y1="14" x2="21" y2="3"></line>
                          </svg>
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Application (APK) */}
              {hasApkData() && (
                <div className="resource-category">
                  <span className="category-badge app-badge">Application</span>

                  {/* Note pour l'application */}
                  {hasProblem && (
                    <div className="resource-note">
                      <h4>Note</h4>
                      <p>{task.Problem}</p>
                    </div>
                  )}

                  {task.Apk?.dev?.url && (
                    <div className="resource-row">
                      <div className="resource-label">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                        </svg>
                        Snapshot APK
                        {task.Apk.dev.version && (
                          <span className="version-tag">
                            {task.Apk.dev.version}
                          </span>
                        )}
                      </div>
                      <div className="resource-value">
                        <a
                          href={task.Apk.dev.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {task.Apk.dev.url}
                          <svg
                            className="external-link-icon"
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                            <polyline points="15 3 21 3 21 9"></polyline>
                            <line x1="10" y1="14" x2="21" y2="3"></line>
                          </svg>
                        </a>
                      </div>
                    </div>
                  )}

                  {task.Apk?.official?.url && (
                    <div className="resource-row">
                      <div className="resource-label">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                        </svg>
                        Release APK
                        {task.Apk.official.version && (
                          <span className="version-tag">
                            {task.Apk.official.version}
                          </span>
                        )}
                      </div>
                      <div className="resource-value">
                        <a
                          href={task.Apk.official.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {task.Apk.official.url}
                          <svg
                            className="external-link-icon"
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                            <polyline points="15 3 21 3 21 9"></polyline>
                            <line x1="10" y1="14" x2="21" y2="3"></line>
                          </svg>
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Backend */}
              {hasBackendData() && (
                <div className="resource-category">
                  <span className="category-badge backend-badge">Backend</span>

                  {task.Backend?.dev?.url && (
                    <div className="resource-row">
                      <div className="resource-label">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                        </svg>
                        API Development
                      </div>
                      <div className="resource-value">
                        <a
                          href={task.Backend.dev.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {task.Backend.dev.url}
                          <svg
                            className="external-link-icon"
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                            <polyline points="15 3 21 3 21 9"></polyline>
                            <line x1="10" y1="14" x2="21" y2="3"></line>
                          </svg>
                        </a>
                      </div>
                    </div>
                  )}

                  {task.Backend?.official?.url && (
                    <div className="resource-row">
                      <div className="resource-label">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                        </svg>
                        API Production
                      </div>
                      <div className="resource-value">
                        <a
                          href={task.Backend.official.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {task.Backend.official.url}
                          <svg
                            className="external-link-icon"
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                            <polyline points="15 3 21 3 21 9"></polyline>
                            <line x1="10" y1="14" x2="21" y2="3"></line>
                          </svg>
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Statut Done */}
          {task.Done && (
            <div className="task-status-done">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              Tâche terminée
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default Task;
