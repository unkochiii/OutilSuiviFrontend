import "./reports.css";
import Header from "../../components/header/Header";
import Menu from "../../components/menu/Menu";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MdSearch,
  MdFilterList,
  MdRefresh,
  MdChevronLeft,
  MdChevronRight,
  MdVisibility,
  MdEdit,
  MdDelete,
  MdImage,
  MdPerson,
  MdCalendarToday,
  MdLocationOn,
  MdFlag,
  MdCheckCircle,
  MdPending,
} from "react-icons/md";

const API_BASE_URL = "https://site--outilbackend--fp64tcf5fhqm.code.run";

const Reports = () => {
  const navigate = useNavigate();

  // États
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Filtres
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  // Charger les reports
  const fetchReports = async () => {
    setLoading(true);
    setError(null);

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Non authentifié");
      setLoading(false);
      return;
    }

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      const response = await fetch(`${API_BASE_URL}/admin/rapport?${params}`, {
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
      setReports(result.data || []);
      setTotal(result.pagination?.total || 0);
      setTotalPages(result.pagination?.pages || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Charger au montage et quand page/limit changent
  useEffect(() => {
    fetchReports();
  }, [page, limit]);

  // Filtrer les reports côté client
  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      !search ||
      report.reportTitle?.toLowerCase().includes(search.toLowerCase()) ||
      report.content?.toLowerCase().includes(search.toLowerCase()) ||
      report.place?.toLowerCase().includes(search.toLowerCase()) ||
      report.owner?.projectName?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = !statusFilter || report.status === statusFilter;

    const matchesPriority =
      !priorityFilter || report.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Helpers
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
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

  const getStatusIcon = (status) => {
    return status === "resolved" ? <MdCheckCircle /> : <MdPending />;
  };

  // Actions
  const handleView = (id) => {
    navigate(`/report/${id}`);
  };

  const handleEdit = (id) => {
    navigate(`/reports/edit/${id}`);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer ce report définitivement ?")) return;

    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${API_BASE_URL}/admin/report/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Erreur suppression");

      fetchReports(); // Recharger
    } catch (err) {
      alert("Erreur: " + err.message);
    }
  };

  // Pagination
  const goToPage = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  return (
    <>
      <Menu />
      <Header />
      <main className="reports-container">
        <div className="reports-card">
          {/* En-tête */}
          <div className="reports-header">
            <div>
              <h1>Gestion des Reports</h1>
              <p>{total} report(s) au total</p>
            </div>
            <button
              className="refresh-btn"
              onClick={fetchReports}
              disabled={loading}
              title="Rafraîchir"
            >
              <MdRefresh className={loading ? "spin" : ""} />
            </button>
          </div>

          {/* Filtres */}
          <div className="reports-filters">
            <div className="search-box">
              <MdSearch />
              <input
                type="text"
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="filter-group">
              <MdFilterList />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="resolved">Résolu</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="">Toutes priorités</option>
                <option value="urgent">🔥 Urgent</option>
                <option value="important">⚠️ Important</option>
                <option value="secondaire">📌 Secondaire</option>
              </select>
            </div>
          </div>

          {/* Messages */}
          {error && <div className="error-banner">❌ {error}</div>}

          {/* Liste */}
          <div className="reports-list">
            {loading ? (
              <div className="loading-state">Chargement...</div>
            ) : filteredReports.length === 0 ? (
              <div className="empty-state">
                <p>Aucun report trouvé</p>
              </div>
            ) : (
              filteredReports.map((report) => (
                <div key={report._id} className="report-item">
                  {/* Image thumbnail */}
                  <div className="report-thumbnail">
                    {report.images?.length > 0 ? (
                      <img src={report.images[0].url} alt="Report" />
                    ) : (
                      <div className="no-image">
                        <MdImage />
                      </div>
                    )}
                  </div>

                  {/* Contenu */}
                  <div className="report-content">
                    <div className="report-header-row">
                      <h3 className="report-title">{report.reportTitle}</h3>
                      <div className="report-badges">
                        <span
                          className={`badge priority ${getPriorityColor(
                            report.priority,
                          )}`}
                        >
                          {report.priority}
                        </span>
                        <span
                          className={`badge status ${
                            report.status === "resolved"
                              ? "status-resolved"
                              : "status-pending"
                          }`}
                        >
                          {getStatusIcon(report.status)}
                          {report.status === "resolved"
                            ? "Résolu"
                            : "En attente"}
                        </span>
                      </div>
                    </div>

                    <p className="report-place">
                      <MdLocationOn />
                      {report.place}
                    </p>

                    <p className="report-excerpt">
                      {report.content?.substring(0, 120)}
                      {report.content?.length > 120 ? "..." : ""}
                    </p>

                    <div className="report-meta">
                      <span>
                        <MdPerson />
                        {report.owner?.projectName || "Inconnu"}
                      </span>
                      <span>
                        <MdCalendarToday />
                        {formatDate(report.createdAt)}
                      </span>
                      {report.assignedTo && (
                        <span className="assigned">
                          <MdFlag />
                          Assigné: {report.assignedTo.projectName}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="report-actions">
                    <button
                      onClick={() => handleView(report._id)}
                      title="Voir détail"
                    >
                      <MdVisibility />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {!loading && filteredReports.length > 0 && (
            <div className="pagination">
              <button onClick={() => goToPage(page - 1)} disabled={page <= 1}>
                <MdChevronLeft />
              </button>

              <span>
                Page {page} sur {totalPages}
              </span>

              <button
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages}
              >
                <MdChevronRight />
              </button>

              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
              >
                <option value={5}>5 / page</option>
                <option value={10}>10 / page</option>
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
              </select>
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default Reports;
