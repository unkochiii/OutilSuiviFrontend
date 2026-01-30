import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./addDocuments.css";
import { getCurrentUser, isAuthenticated } from "../../contexts/AuthContext";
import Menu from "../../components/menu/Menu";
import Header from "../../components/header/Header";
const AddDocuments = () => {
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

        // Tri alphabétique des comptes par username
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

  // State pour les documents officiels
  const [formData, setFormData] = useState({
    documentName: "",
    pdf: {
      url: "",
      fileName: "",
    },
    owner: "",
    assignedTo: "",
  });

  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Gestion des champs imbriqués (pdf.url, pdf.fileName)
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFormError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        "https://site--outilbackend--fp64tcf5fhqm.code.run/admin/officials",
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
        throw new Error(data.error || "Erreur création document");
      }

      setSuccess("Document créé avec succès !");
      setFormData({
        documentName: "",
        pdf: {
          url: "",
          fileName: "",
        },
        owner: "",
        assignedTo: "",
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
      <div className="admin-task-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Chargement des comptes...</p>
        </div>
      </div>
    );
  }

  if (accountsError) {
    return (
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
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="admin-task-container">
        <div className="alert alert-warning">
          <h3>⚠️ Aucun compte disponible</h3>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <Menu />
      <div className="admin-task-container">
        <h2>Créer un nouveau document officiel</h2>

        {formError && <div className="alert alert-error">{formError}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit} className="task-form">
          <div className="form-group">
            <label htmlFor="documentName">Nom du document *</label>
            <input
              type="text"
              id="documentName"
              name="documentName"
              value={formData.documentName}
              onChange={handleChange}
              required
              placeholder="Entrez le nom du document"
            />
          </div>

          <div className="form-group">
            <label htmlFor="pdf.url">URL du PDF *</label>
            <input
              type="url"
              id="pdf.url"
              name="pdf.url"
              value={formData.pdf.url}
              onChange={handleChange}
              required
              placeholder="https://example.com/document.pdf"
            />
          </div>

          {/* <div className="form-group">
            <label htmlFor="pdf.fileName">Nom du fichier PDF (optionnel)</label>
            <input
              type="text"
              id="pdf.fileName"
              name="pdf.fileName"
              value={formData.pdf.fileName}
              onChange={handleChange}
              placeholder="document.pdf"
            />
          </div> */}

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
            <label htmlFor="assignedTo">Assigné à *</label>
            <select
              id="assignedTo"
              name="assignedTo"
              value={formData.assignedTo}
              onChange={handleChange}
              required
            >
              <option value="">Non assigné</option>
              {accounts.map((account) => (
                <option key={account._id} value={account._id}>
                  {account.username}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? "Création en cours..." : "Créer le document"}
          </button>
        </form>
      </div>
    </>
  );
};

export default AddDocuments;
