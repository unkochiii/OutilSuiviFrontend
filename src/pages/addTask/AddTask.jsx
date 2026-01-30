import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./addTask.css";
import { getCurrentUser, isAuthenticated } from "../../contexts/AuthContext";
import Header from "../../components/header/Header";
import Menu from "../../components/menu/Menu";

const AddTask = () => {
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

        // Tri alphabétique par username
        const sortedAccounts = data.accounts.sort((a, b) =>
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

  // State pour les tâches
  const [formData, setFormData] = useState({
    taskName: "",
    Duration: "",
    Description: "",
    Problem: "",
    Done: false,
    owner: "",
    assignedTo: "",
    dueDate: "",
    Site: "",
    Apk: "",
    Backend: "",
  });

  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFormError("");
    setSuccess("");

    // Validation
    if (
      !formData.taskName.trim() ||
      !formData.Duration.trim() ||
      !formData.Description.trim()
    ) {
      setFormError("Les champs obligatoires sont manquants");
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        "https://site--outilbackend--fp64tcf5fhqm.code.run/admin/task",
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
        throw new Error(data.error || "Erreur création tâche");
      }

      setSuccess("Tâche créée avec succès !");
      setFormData({
        taskName: "",
        Duration: "",
        Description: "",
        Problem: "",
        Done: false,
        owner: "",
        assignedTo: "",
        dueDate: "",
        Site: "",
        Apk: "",
        Backend: "",
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
        <h2>Créer une nouvelle tâche</h2>

        {formError && <div className="alert alert-error">{formError}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit} className="task-form">
          <div className="form-group">
            <label htmlFor="taskName">Nom de la tâche *</label>
            <input
              type="text"
              id="taskName"
              name="taskName"
              value={formData.taskName}
              onChange={handleChange}
              required
              placeholder="Entrez le nom de la tâche"
            />
          </div>

          <div className="form-group">
            <label htmlFor="Duration">Durée *</label>
            <input
              type="text"
              id="Duration"
              name="Duration"
              value={formData.Duration}
              onChange={handleChange}
              required
              placeholder="Ex: 2h, 3j, 1 semaine"
            />
          </div>

          <div className="form-group">
            <label htmlFor="Description">Description *</label>
            <textarea
              id="Description"
              name="Description"
              value={formData.Description}
              onChange={handleChange}
              required
              placeholder="Décrivez la tâche"
              rows="4"
            />
          </div>

          <div className="form-group">
            <label htmlFor="Problem">Problème (optionnel)</label>
            <textarea
              id="Problem"
              name="Problem"
              value={formData.Problem}
              onChange={handleChange}
              placeholder="Décrivez un problème éventuel"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label htmlFor="Site">Site (optionnel)</label>
            <input
              type="text"
              id="Site"
              name="Site"
              value={formData.Site}
              onChange={handleChange}
              placeholder="URL du site"
            />
          </div>

          <div className="form-group">
            <label htmlFor="Apk">APK (optionnel)</label>
            <input
              type="text"
              id="Apk"
              name="Apk"
              value={formData.Apk}
              onChange={handleChange}
              placeholder="Informations APK"
            />
          </div>

          <div className="form-group">
            <label htmlFor="Backend">Backend (optionnel)</label>
            <input
              type="text"
              id="Backend"
              name="Backend"
              value={formData.Backend}
              onChange={handleChange}
              placeholder="Informations backend"
            />
          </div>

          <div className="form-group">
            <label htmlFor="dueDate">Date d'échéance (optionnel)</label>
            <input
              type="date"
              id="dueDate"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="owner">Owner *</label>
            <select
              id="owner"
              name="owner"
              value={formData.owner}
              onChange={handleChange}
              required
            >
              <option value="">Sélectionner un owner...</option>
              {accounts.map((account) => (
                <option key={account._id} value={account._id}>
                  {account.username}
                </option>
              ))}
            </select>
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
            <label htmlFor="Done">
              <input
                type="checkbox"
                id="Done"
                name="Done"
                checked={formData.Done}
                onChange={handleChange}
              />
              Tâche terminée
            </label>
          </div>

          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? "Création en cours..." : "Créer la tâche"}
          </button>
        </form>
      </div>
    </>
  );
};

export default AddTask;
