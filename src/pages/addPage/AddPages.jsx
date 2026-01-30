import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./addPages.css";
import { getCurrentUser, isAuthenticated } from "../../contexts/AuthContext";
import Header from "../../components/header/Header";
import Menu from "../../components/menu/Menu";

const API_BASE = "https://site--outilbackend--fp64tcf5fhqm.code.run";

const AddPages = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [accountsError, setAccountsError] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [fileError, setFileError] = useState("");

  // ✅ Fonction utilitaire pour gérer les réponses API
  const handleApiResponse = async (response) => {
    const contentType = response.headers.get("content-type");

    // Vérifier si la réponse est du JSON
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.error("Réponse non-JSON reçue:", text.substring(0, 200));
      throw new Error(
        `Le serveur a renvoyé du ${contentType || "contenu inconnu"} au lieu de JSON. ` +
          `Status: ${response.status}. Vérifiez l'URL de l'API.`,
      );
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || data.message || `Erreur ${response.status}`,
      );
    }

    return data;
  };

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

        console.log(
          "🔍 Chargement des comptes depuis:",
          `${API_BASE}/admin/accounts`,
        );

        const response = await fetch(`${API_BASE}/admin/accounts`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        console.log("📡 Status:", response.status);
        console.log("📡 Content-Type:", response.headers.get("content-type"));

        const data = await handleApiResponse(response);

        if (!Array.isArray(data.accounts)) {
          throw new Error(
            "Format invalide: 'accounts' devrait être un tableau",
          );
        }

        const sortedAccounts = data.accounts.sort((a, b) =>
          a.username.localeCompare(b.username),
        );
        setAccounts(sortedAccounts);
      } catch (err) {
        console.error("❌ Erreur complète:", err);
        setAccountsError(err.message);
      } finally {
        setLoadingAccounts(false);
      }
    };

    checkAuthAndLoadAccounts();
  }, [navigate]);

  // State pour les pages
  const [formData, setFormData] = useState({
    pageName: "",
    Description: "",
    owner: "",
    assignedTo: "",
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

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);

    // Validation du nombre
    if (files.length > 5) {
      setFileError("Maximum 5 images autorisées");
      setSelectedFiles([]);
      e.target.value = "";
      return;
    }

    // Validation du type
    const invalidFiles = files.filter(
      (file) => !file.type.startsWith("image/"),
    );
    if (invalidFiles.length > 0) {
      setFileError("Seules les images sont autorisées");
      setSelectedFiles([]);
      e.target.value = "";
      return;
    }

    // Validation de la taille (ex: max 5MB par fichier)
    const maxSize = 5 * 1024 * 1024; // 5MB
    const oversizedFiles = files.filter((file) => file.size > maxSize);
    if (oversizedFiles.length > 0) {
      setFileError("Chaque image doit faire moins de 5MB");
      setSelectedFiles([]);
      e.target.value = "";
      return;
    }

    setFileError("");
    setSelectedFiles(files);
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    // Reset l'input file
    document.getElementById("images").value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFormError("");
    setSuccess("");
    setFileError("");

    // Validation
    if (!formData.pageName.trim()) {
      setFormError("Le nom de la page est requis");
      setLoading(false);
      return;
    }

    if (!formData.Description.trim()) {
      setFormError("La description est requise");
      setLoading(false);
      return;
    }

    if (!formData.owner) {
      setFormError("L'owner est requis");
      setLoading(false);
      return;
    }

    if (selectedFiles.length > 5) {
      setFileError("Maximum 5 images autorisées");
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const formDataToSend = new FormData();

      // Ajouter les champs texte
      formDataToSend.append("pageName", formData.pageName.trim());
      formDataToSend.append("Description", formData.Description.trim());
      formDataToSend.append("owner", formData.owner);

      if (formData.assignedTo) {
        formDataToSend.append("assignedTo", formData.assignedTo);
      }

      // Ajouter les fichiers
      selectedFiles.forEach((file) => {
        formDataToSend.append("images", file);
      });

      console.log("🚀 Envoi vers:", `${API_BASE}/admin/page`);
      console.log("📦 Données:", {
        pageName: formData.pageName,
        Description: formData.Description,
        owner: formData.owner,
        assignedTo: formData.assignedTo,
        imagesCount: selectedFiles.length,
      });

      const response = await fetch(`${API_BASE}/admin/page`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // ⚠️ Ne PAS mettre Content-Type pour FormData
          Accept: "application/json",
        },
        body: formDataToSend,
      });

      console.log("📡 Status:", response.status);
      console.log("📡 Content-Type:", response.headers.get("content-type"));

      const data = await handleApiResponse(response);

      setSuccess("Page créée avec succès !");
      setFormData({
        pageName: "",
        Description: "",
        owner: "",
        assignedTo: "",
      });
      setSelectedFiles([]);
      document.getElementById("images").value = "";

      // Optionnel: rediriger après succès
      // setTimeout(() => navigate("/pages"), 2000);
    } catch (err) {
      console.error("❌ Erreur création:", err);
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
            <div className="error-help">
              <p>
                💡 <strong>Solutions possibles :</strong>
              </p>
              <ul>
                <li>Vérifiez que le serveur backend est démarré</li>
                <li>
                  Vérifiez l'URL de l'API:{" "}
                  <code>{API_BASE}/admin/accounts</code>
                </li>
                <li>Vérifiez que la route existe sur le backend</li>
                <li>Vérifiez votre connexion internet</li>
              </ul>
            </div>
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
        <h2>Créer une nouvelle page</h2>

        {formError && <div className="alert alert-error">{formError}</div>}
        {fileError && <div className="alert alert-error">{fileError}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit} className="task-form">
          <div className="form-group">
            <label htmlFor="pageName">Nom de la page *</label>
            <input
              type="text"
              id="pageName"
              name="pageName"
              value={formData.pageName}
              onChange={handleChange}
              required
              placeholder="Entrez le nom de la page"
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
              placeholder="Entrez la description"
              rows="4"
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
            <label htmlFor="images">Images (max 5, 5MB chacune)</label>
            <input
              type="file"
              id="images"
              name="images"
              onChange={handleFileChange}
              accept="image/*"
              multiple
            />
            {selectedFiles.length > 0 && (
              <div className="file-preview">
                <p>{selectedFiles.length} image(s) sélectionnée(s)</p>
                <div className="preview-images">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="file-tag">
                      <span>{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="remove-file-btn"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? "Création en cours..." : "Créer la page"}
          </button>
        </form>
      </div>
    </>
  );
};

export default AddPages;
