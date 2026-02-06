import "./modifTodo.css";
import Menu from "../../components/menu/Menu";
import Header from "../../components/header/Header";
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { MdArrowBack, MdSave, MdCheckCircle, MdCancel } from "react-icons/md";

const API_BASE_URL = "https://site--outilbackend--fp64tcf5fhqm.code.run";

const ModifTodo = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // États
  const [todo, setTodo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // User connecté (à adapter selon votre contexte/auth)
  const [currentUser, setCurrentUser] = useState(null);

  // Formulaire (pour admin)
  const [formData, setFormData] = useState({
    ToDoTitle: "",
    content: "",
    assignedTo: "",
    priority: "secondaire",
    status: "pending",
  });

  // Récupérer le user et le todo au chargement
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Non authentifié");
      setLoading(false);
      return;
    }

    // Décoder le token pour avoir les infos user
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setCurrentUser(payload);
    } catch {
      setError("Token invalide");
      setLoading(false);
      return;
    }

    fetchTodo();
  }, [id]);

  const fetchTodo = async () => {
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${API_BASE_URL}/ToDo/${id}`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      const result = await response.json();
      setTodo(result.data);

      // Initialiser le formulaire avec les données existantes
      setFormData({
        ToDoTitle: result.data.ToDoTitle || "",
        content: result.data.content || "",
        assignedTo: result.data.assignedTo?._id || "",
        priority: result.data.priority || "secondaire",
        status: result.data.status || "pending",
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 🔴 ADMIN : Modifier complètement le todo
  const handleAdminUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);

    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${API_BASE_URL}/admin/ToDo/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || `Erreur ${response.status}`);
      }

      const result = await response.json();
      setTodo(result.data);
      alert("ToDo modifié avec succès !");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // 🟢 USER : Résoudre le todo (validation)
  const handleResolve = async () => {
    if (!window.confirm("Confirmer la résolution de ce ToDo ?")) return;

    setSaving(true);
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${API_BASE_URL}/ToDo/${id}/validate`, {
        method: "PATCH",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || `Erreur ${response.status}`);
      }

      const result = await response.json();
      setTodo(result.data);
      alert("ToDo résolu avec succès !");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Gestion des changements du formulaire
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Helpers
  const formatDate = (dateString) => {
    if (!dateString) return "Non disponible";
    return new Date(dateString).toLocaleString("fr-FR");
  };

  // Déterminer le rôle
  const isAdmin =
    currentUser?.role === "admin" || currentUser?.role === "Admin";
  const isAssignedUser =
    todo?.assignedTo?._id === currentUser?._id ||
    todo?.assignedTo?._id === currentUser?.id;
  const canResolve = isAssignedUser && todo?.status === "pending";
  const canEdit = isAdmin;

  // Rendu
  const renderLayout = (content) => (
    <>
      <Menu />
      <Header />
      <main className="modif-todo-container">{content}</main>
    </>
  );

  if (loading) {
    return renderLayout(
      <div className="modif-todo-card">
        <div className="loading-state">Chargement...</div>
      </div>,
    );
  }

  if (error) {
    return renderLayout(
      <div className="modif-todo-card">
        <div className="error-state">
          <p>❌ {error}</p>
          <button onClick={() => navigate(-1)} className="back-btn">
            Retour
          </button>
        </div>
      </div>,
    );
  }

  if (!todo) {
    return renderLayout(
      <div className="modif-todo-card">
        <div className="error-state">ToDo introuvable</div>
      </div>,
    );
  }

  return renderLayout(
    <div className="modif-todo-card">
      {/* En-tête */}
      <div className="modif-todo-header">
        <button
          className="icon-btn back-btn"
          onClick={() => navigate(-1)}
          title="Retour"
        >
          <MdArrowBack size={24} />
        </button>
        <h1>{isAdmin ? "Modifier le ToDo" : "Détail du ToDo"}</h1>
        <div className="header-actions">
          {canResolve && (
            <button
              className="resolve-btn"
              onClick={handleResolve}
              disabled={saving}
              title="Résoudre ce ToDo"
            >
              <MdCheckCircle size={20} />
              {saving ? "Validation..." : "Résoudre"}
            </button>
          )}
        </div>
      </div>

      {/* Contenu */}
      <div className="modif-todo-content">
        {/* 🟢 VIEW MODE pour tous */}
        <div className="info-section">
          <h2>Informations</h2>
          <div className="info-grid">
            <div className="info-item">
              <span className="label">Créé par</span>
              <span>{todo.owner?.projectName || "Inconnu"}</span>
              <small>{todo.owner?.email}</small>
            </div>
            <div className="info-item">
              <span className="label">Assigné à</span>
              <span>{todo.assignedTo?.projectName || "Non assigné"}</span>
              <small>{todo.assignedTo?.email}</small>
            </div>
            <div className="info-item">
              <span className="label">Créé le</span>
              <span>{formatDate(todo.createdAt)}</span>
            </div>
            <div className="info-item">
              <span className="label">Statut actuel</span>
              <span className={`status-badge status-${todo.status}`}>
                {todo.status === "pending" ? "⏳ En attente" : "✅ Résolu"}
              </span>
            </div>
          </div>
        </div>

        {/* 🔴 EDIT MODE pour Admin */}
        {canEdit ? (
          <form onSubmit={handleAdminUpdate} className="edit-form">
            <h2>Modification</h2>

            <div className="form-group">
              <label htmlFor="ToDoTitle">Titre</label>
              <input
                type="text"
                id="ToDoTitle"
                name="ToDoTitle"
                value={formData.ToDoTitle}
                onChange={handleChange}
                required
                maxLength={300}
              />
            </div>

            <div className="form-group">
              <label htmlFor="content">Contenu</label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleChange}
                required
                rows={6}
                maxLength={5000}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="assignedTo">ID Utilisateur assigné</label>
                <input
                  type="text"
                  id="assignedTo"
                  name="assignedTo"
                  value={formData.assignedTo}
                  onChange={handleChange}
                  placeholder="ID MongoDB ou vide"
                />
              </div>

              <div className="form-group">
                <label htmlFor="priority">Priorité</label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                >
                  <option value="urgent">🔥 Urgent</option>
                  <option value="important">⚠️ Important</option>
                  <option value="secondaire">📌 Secondaire</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="status">Statut</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="pending">⏳ En attente</option>
                  <option value="resolved">✅ Résolu</option>
                </select>
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={() => navigate(-1)}
              >
                <MdCancel size={18} />
                Annuler
              </button>
              <button type="submit" className="save-btn" disabled={saving}>
                <MdSave size={18} />
                {saving ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </form>
        ) : (
          /* 🟢 READ ONLY pour User non-admin */
          <div className="readonly-section">
            <h2>Description</h2>
            <div className="readonly-content">
              <h3>{todo.ToDoTitle}</h3>
              <p>{todo.content}</p>
            </div>

            {!canResolve && todo.status === "resolved" && (
              <div className="resolved-notice">✅ Ce ToDo est déjà résolu</div>
            )}

            {!canResolve && todo.status === "pending" && !isAssignedUser && (
              <div className="readonly-notice">
                ℹ️ Ce ToDo ne vous est pas assigné
              </div>
            )}
          </div>
        )}
      </div>
    </div>,
  );
};

export default ModifTodo;
