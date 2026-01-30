import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./addToDo.css";
import { getCurrentUser, isAuthenticated } from "../../contexts/AuthContext";
import Header from "../../components/header/Header";
import Menu from "../../components/menu/Menu";

const AddToDo = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [accountsError, setAccountsError] = useState("");

  // Vérification admin + chargement des comptes
  useEffect(() => {
    const checkAuthAndLoadAccounts = async () => {
      if (!isAuthenticated()) {
        navigate("/login");
        return;
      }

      const user = getCurrentUser();
      if (user?.role !== "admin") {
        navigate("/unauthorized");
        return;
      }

      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          "https://site--outilbackend--fp64tcf5fhqm.code.run/admin/accounts",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || `Erreur ${response.status}`);
        }

        if (!Array.isArray(data.accounts)) {
          throw new Error(
            "Format invalide: 'accounts' devrait être un tableau",
          );
        }

        // Filtrer et valider les comptes avant le tri
        const validAccounts = data.accounts.filter(
          (account) =>
            account &&
            typeof account.username === "string" &&
            account.username.trim() !== "",
        );

        // Log pour debug (à retirer en production)
        if (validAccounts.length !== data.accounts.length) {
          console.warn(
            `${data.accounts.length - validAccounts.length} compte(s) invalide(s) filtré(s)`,
          );
        }

        // Tri alphabétique par username
        const sortedAccounts = validAccounts.sort((a, b) =>
          a.username.localeCompare(b.username),
        );

        setAccounts(sortedAccounts);
      } catch (err) {
        setAccountsError(err.message);
      } finally {
        setLoadingAccounts(false);
      }
    };

    checkAuthAndLoadAccounts();
  }, [navigate]);

  // State pour les ToDo
  const [formData, setFormData] = useState({
    ToDoTitle: "",
    content: "",
    assignedTo: "",
    priority: "secondaire",
    status: "pending",
  });

  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFormError("");
    setSuccess("");

    // Validation
    if (!formData.ToDoTitle.trim() || !formData.content.trim()) {
      setFormError("Le titre et le contenu sont requis");
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "https://site--outilbackend--fp64tcf5fhqm.code.run/admin/ToDo",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur création ToDo");
      }

      setSuccess("ToDo créé avec succès !");
      setFormData({
        ToDoTitle: "",
        content: "",
        assignedTo: "",
        priority: "secondaire",
        status: "pending",
      });
    } catch (err) {
      setFormError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // États de chargement/erreur
  if (loadingAccounts) {
    return (
      <>
        <Header />
        <Menu />
        <div className="admin-task-container">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Chargement des comptes...</p>
          </div>
        </div>
      </>
    );
  }

  if (accountsError) {
    return (
      <>
        <Header />
        <Menu />
        <div className="admin-task-container">
          <div className="alert alert-error">
            <h3>❌ Erreur chargement des comptes</h3>
            <p>
              <strong>Détails :</strong> {accountsError}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="retry-btn"
            >
              🔄 Réessayer
            </button>
          </div>
        </div>
      </>
    );
  }

  if (accounts.length === 0) {
    return (
      <>
        <Header />
        <Menu />
        <div className="admin-task-container">
          <div className="alert alert-warning">
            <h3>⚠️ Aucun compte disponible</h3>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <Menu />
      <div className="admin-task-container">
        <h2>Créer un nouveau ToDo</h2>

        {formError && <div className="alert alert-error">{formError}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit} className="task-form">
          <div className="form-group">
            <label htmlFor="ToDoTitle">Titre du ToDo *</label>
            <input
              type="text"
              id="ToDoTitle"
              name="ToDoTitle"
              value={formData.ToDoTitle}
              onChange={handleChange}
              required
              placeholder="Entrez le titre"
            />
          </div>

          <div className="form-group">
            <label htmlFor="content">Contenu *</label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              required
              placeholder="Décrivez le ToDo"
              rows="4"
            />
          </div>

          <div className="form-group">
            <label htmlFor="assignedTo">Assigné à (optionnel)</label>
            <select
              id="assignedTo"
              name="assignedTo"
              value={formData.assignedTo}
              onChange={handleChange}
            >
              <option value="">Non assigné</option>
              {accounts.map((account) => (
                <option key={account._id} value={account._id}>
                  {account.username}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="priority">Priorité</label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
            >
              <option value="urgent">urgent</option>
              <option value="important">important</option>
              <option value="secondaire">secondaire</option>
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
              <option value="pending">pending</option>
              <option value="resolved">resolved</option>
            </select>
          </div>

          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? "Création en cours..." : "Créer le ToDo"}
          </button>
        </form>
      </div>
    </>
  );
};

export default AddToDo;
