import "./report.css";
import Header from "../../components/header/Header";
import Menu from "../../components/menu/Menu";
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  MdArrowBack,
  MdCalendarToday,
  MdPerson,
  MdLocationOn,
  MdFlag,
  MdCheckCircle,
  MdPending,
  MdEdit,
  MdDelete,
  MdImage,
  MdDownload,
} from "react-icons/md";

const API_BASE_URL = "https://site--outilbackend--fp64tcf5fhqm.code.run";

const Report = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger le report
  useEffect(() => {
    fetchReport();
  }, [id]);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Non authentifié");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/report/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Erreur ${response.status}`);
      }

      const result = await response.json();
      setReport(result.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helpers
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "urgent":
        return "priority-urgent";
      case "important":
        return "priority-important";
      default:
        return "priority-secondaire";
    }
  };

  const getPriorityLabel = (priority) => {
    const labels = {
      urgent: "🔥 Urgent",
      important: "⚠️ Important",
      secondaire: "📌 Secondaire",
    };
    return labels[priority] || priority;
  };

  // Actions
  const handleDelete = async () => {
    if (!window.confirm("Supprimer ce report définitivement ?")) return;

    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${API_BASE_URL}/admin/report/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Erreur suppression");

      navigate("/reports");
    } catch (err) {
      alert("Erreur: " + err.message);
    }
  };

  // Télécharger image
  const downloadImage = (url, filename) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename || "image.jpg";
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Rendu
  const renderLayout = (content) => (
    <>
      <Menu />
      <Header />
      <main className="report-detail-container">{content}</main>
    </>
  );

  if (loading) {
    return renderLayout(
      <div className="report-detail-card">
        <div className="loading-state">Chargement...</div>
      </div>,
    );
  }

  if (error) {
    return renderLayout(
      <div className="report-detail-card">
        <div className="error-state">
          <p>❌ {error}</p>
          <button onClick={() => navigate(-1)} className="back-btn">
            Retour
          </button>
        </div>
      </div>,
    );
  }

  if (!report) {
    return renderLayout(
      <div className="report-detail-card">
        <div className="error-state">Report introuvable</div>
      </div>,
    );
  }

  const isResolved = report.status === "resolved";

  return renderLayout(
    <div className="report-detail-card">
      {/* En-tête */}
      <div className="report-header">
        <div className="header-left">
          <button
            className="back-button"
            onClick={() => navigate(-1)}
            title="Retour"
          >
            <MdArrowBack />
          </button>
          <div>
            <h1>{report.reportTitle}</h1>
            <div className="header-meta">
              <span>
                <MdCalendarToday />
                {formatDate(report.createdAt)}
              </span>
              <span
                className={`status-badge ${isResolved ? "resolved" : "pending"}`}
              >
                {isResolved ? <MdCheckCircle /> : <MdPending />}
                {isResolved ? "Résolu" : "En attente"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="report-content">
        {/* Badges priorité */}
        <div className="priority-section">
          <span
            className={`priority-badge ${getPriorityColor(report.priority)}`}
          >
            {getPriorityLabel(report.priority)}
          </span>
        </div>

        {/* Informations */}
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">
              <MdPerson /> Créé par
            </span>
            <span className="info-value">
              {report.owner?.projectName || "Inconnu"}
            </span>
            <small>{report.owner?.email}</small>
          </div>

          <div className="info-item">
            <span className="info-label">
              <MdLocationOn /> Lieu
            </span>
            <span className="info-value">{report.place}</span>
          </div>

          <div className="info-item">
            <span className="info-label">
              <MdFlag /> Assigné à
            </span>
            <span className="info-value">
              {report.assignedTo?.projectName || "Non assigné"}
            </span>
            {report.assignedTo?.email && (
              <small>{report.assignedTo.email}</small>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="description-section">
          <h2>Description</h2>
          <div className="description-content">{report.content}</div>
        </div>

        {/* Images */}
        {report.images?.length > 0 && (
          <div className="images-section">
            <h2>
              <MdImage /> Images ({report.images.length})
            </h2>
            <div className="images-grid">
              {report.images.map((img, index) => (
                <div key={img.public_id || index} className="image-card">
                  <img
                    src={img.url}
                    alt={`Image ${index + 1}`}
                    onClick={() => window.open(img.url, "_blank")}
                  />
                  <button
                    className="download-btn"
                    onClick={() =>
                      downloadImage(
                        img.url,
                        `report-${id}-img-${index + 1}.jpg`,
                      )
                    }
                    title="Télécharger"
                  >
                    <MdDownload />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>,
  );
};

export default Report;
