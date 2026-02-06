import "./todo.css";
import Header from "../../components/header/Header";
import Menu from "../../components/menu/Menu";
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { MdArrowBack, MdEdit, MdDelete } from "react-icons/md"; // Ajout des imports manquants

// Constante pour l'URL de l'API (évite la duplication et facilite les changements d'environnement)
const API_BASE_URL = "https://site--outilbackend--fp64tcf5fhqm.code.run";

const TodoDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [todo, setTodo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) {
      setError("Aucun ID de ToDo fourni");
      setLoading(false);
      return;
    }

    const fetchTodo = async () => {
      // 🔑 RÉCUPÉREZ VOTRE TOKEN ICI
      const token = localStorage.getItem("token"); // ou votre méthode

      if (!token) {
        setError("Non authentifié - token manquant");
        setLoading(false);
        return;
      }

      const url = `${API_BASE_URL}/ToDo/${id}`;
      console.log("🚀 URL:", url);
      console.log("🔑 Token présent:", !!token);

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(url, {
          // ❌ PLUS BESOIN de credentials: "include" pour Bearer
          // credentials: "include",

          // ✅ HEADER AUTHORIZATION OBLIGATOIRE
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`, // ← CLÉ !
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.status === 401) {
          throw new Error("Session expirée - reconnectez-vous");
        }

        if (!response.ok) {
          throw new Error(`Erreur HTTP ${response.status}`);
        }

        const result = await response.json();
        setTodo(result.data);
      } catch (err) {
        console.error("❌ Erreur:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTodo();
  }, [id]);

  const handleDelete = async () => {
    if (!id) {
      setError("Aucun ID de ToDo fourni");
      return;
    }

    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce ToDo ?")) {
      try {
        const response = await fetch(`${API_BASE_URL}/ToDo/${id}`, {
          method: "DELETE",
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(
            `Erreur HTTP ${response.status}: ${response.statusText}`,
          );
        }

        // Succès : redirection vers la liste
        navigate("/todos");
      } catch (err) {
        console.error("Erreur lors de la suppression:", err);
        setError(err.message);
        // Afficher une notification à l'utilisateur serait un plus ici
      }
    }
  };

  // Fonction utilitaire pour formater les dates de manière plus robuste
  const formatDate = (dateString) => {
    if (!dateString) return "Non disponible";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Date invalide";
      return date.toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Date invalide";
    }
  };

  // Rendu conditionnel avec réduction de duplication
  const renderLayout = (content) => (
    <>
      <Menu />
      <Header />
      <main className="todo-detail-container">{content}</main>
    </>
  );

  if (loading) {
    return renderLayout(<div className="loading-state">Chargement...</div>);
  }

  if (error) {
    return renderLayout(
      <div className="error-state">
        <p>❌ Erreur : {error}</p>
        <button
          onClick={() => window.location.reload()}
          className="retry-button"
          type="button"
        >
          Réessayer
        </button>
      </div>,
    );
  }

  if (!todo) {
    return renderLayout(<div className="error-state">ToDo introuvable</div>);
  }

  // Navigation sécurisée pour les propriétés imbriquées
  const ownerName = todo.owner?.projectName || "Non spécifié";
  const ownerEmail = todo.owner?.email || "Non spécifié";
  const assignedToName = todo.assignedTo?.projectName || "Non assigné";
  const assignedToEmail = todo.assignedTo?.email || "";

  return renderLayout(
    <div className="todo-detail-card">
      {/* En-tête avec actions */}
      <div className="todo-detail-header">
        <button
          className="back-button"
          onClick={() => navigate(-1)}
          aria-label="Retour"
          title="Retour"
          type="button"
        >
          <MdArrowBack size={24} />
        </button>
        <h1>{todo.title}</h1>
        <div className="action-buttons">
          <button
            className="edit-button"
            onClick={() => navigate(`/modifieToDo/${todo._id}`)}
            aria-label="Modifier le ToDo"
            title="Modifier"
            type="button"
          >
            <MdEdit size={20} />
          </button>
          <button
            className="delete-button"
            onClick={handleDelete}
            aria-label="Supprimer le ToDo"
            title="Supprimer"
            type="button"
          >
            <MdDelete size={20} />
          </button>
        </div>
      </div>

      {/* Informations principales */}
      <div className="todo-info-grid">
        <div className="info-item">
          <span className="label">Statut</span>
          <span className={`status-badge status-${todo.status}`}>
            {todo.status}
          </span>
        </div>
        <div className="info-item">
          <span className="label">Priorité</span>
          <span className={`priority-badge priority-${todo.priority}`}>
            {todo.priority || "Non définie"}
          </span>
        </div>
        <div className="info-item">
          <span className="label">Créé le</span>
          <span>{formatDate(todo.createdAt)}</span>
        </div>
        <div className="info-item">
          <span className="label">Mis à jour le</span>
          <span>{formatDate(todo.updatedAt)}</span>
        </div>
      </div>

      {/* Description */}
      <div className="description-section">
        <h2>Description</h2>
        <p className="description-content">
          {todo.content || "Aucune description"}
        </p>
      </div>

      {/* Personnes */}
      <div className="people-section">
        <div className="person-card">
          <h3>Créateur</h3>
          <p className="person-name">{ownerName}</p>
          <p className="person-email">{ownerEmail}</p>
        </div>
        {todo.assignedTo && (
          <div className="person-card">
            <h3>Assigné à</h3>
            <p className="person-name">{assignedToName}</p>
            <p className="person-email">{assignedToEmail}</p>
          </div>
        )}
      </div>
    </div>,
  );
};

export default TodoDetail;
