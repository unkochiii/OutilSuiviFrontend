import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./addImages.css";
import { getCurrentUser, isAuthenticated } from "../../contexts/AuthContext";
import Header from "../../components/header/Header";
import Menu from "../../components/menu/Menu";

const EditPages = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Chargement des données
  useEffect(() => {
    const loadData = async () => {
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

        // Chargement des comptes
        const accountsResponse = await fetch(
          "https://site--outilbackend--fp64tcf5fhqm.code.run/admin/accounts",
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const accountsData = await accountsResponse.json();
        if (!accountsResponse.ok) throw new Error(accountsData.error);

        const sortedAccounts = accountsData.accounts.sort((a, b) =>
          a.username.localeCompare(b.username),
        );
        setAccounts(sortedAccounts);

        // Chargement de la page à modifier
        const pageResponse = await fetch(
          `https://site--outilbackend--fp64tcf5fhqm.code.run/admin/page/${id}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const pageData = await pageResponse.json();
        if (!pageResponse.ok) throw new Error(pageData.error);

        setPage(pageData.data);
        setFormData({
          pageName: pageData.data.pageName,
          Description: pageData.data.Description,
          owner: pageData.data.owner._id,
          assignedTo: pageData.data.assignedTo?._id || "",
        });
        setExistingImages(pageData.data.images || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, navigate]);

  const [formData, setFormData] = useState({
    pageName: "",
    Description: "",
    owner: "",
    assignedTo: "",
  });
  const [existingImages, setExistingImages] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [fileError, setFileError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleExistingImageToggle = (public_id) => {
    setImagesToDelete((prev) =>
      prev.includes(public_id)
        ? prev.filter((id) => id !== public_id)
        : [...prev, public_id],
    );
  };

  const handleNewImagesChange = (e) => {
    const files = Array.from(e.target.files);
    const maxAllowed = 5 - (existingImages.length - imagesToDelete.length);

    if (files.length > maxAllowed) {
      setFileError(`Maximum ${maxAllowed} images supplémentaires autorisées`);
      e.target.value = "";
      return;
    }

    setFileError("");
    setNewImages(files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSubmitError("");
    setSuccess("");

    // Validation
    const maxAllowed = 5 - (existingImages.length - imagesToDelete.length);
    if (newImages.length > maxAllowed) {
      setFileError(`Maximum ${maxAllowed} images supplémentaires autorisées`);
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const formDataToSend = new FormData();

      // Champs texte
      formDataToSend.append("pageName", formData.pageName);
      formDataToSend.append("Description", formData.Description);
      formDataToSend.append("owner", formData.owner);
      if (formData.assignedTo) {
        formDataToSend.append("assignedTo", formData.assignedTo);
      }

      // Images à supprimer
      if (imagesToDelete.length > 0) {
        formDataToSend.append("imagesToDelete", JSON.stringify(imagesToDelete));
      }

      // Nouvelles images
      newImages.forEach((file) => {
        formDataToSend.append("images", file);
      });

      const response = await fetch(
        `https://site--outilbackend--fp64tcf5fhqm.code.run/admin/page/${id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formDataToSend,
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur mise à jour");
      }

      setSuccess("Page mise à jour avec succès !");
      // Rafraîchir les images existantes
      setExistingImages(data.data.images);
      setImagesToDelete([]);
      setNewImages([]);
      document.getElementById("newImages").value = "";
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <Menu />
        <div className="admin-task-container">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Chargement de la page...</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <Menu />
        <div className="admin-task-container">
          <div className="alert alert-error">
            <h3>❌ Erreur</h3>
            <p>{error}</p>
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
        <h2>Modifier la page</h2>

        {submitError && <div className="alert alert-error">{submitError}</div>}
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

          {/* Images existantes */}
          {existingImages.length > 0 && (
            <div className="form-group">
              <label>Images existantes (cochez pour supprimer)</label>
              <div className="existing-images">
                {existingImages.map((img) => (
                  <label key={img.public_id} className="image-checkbox">
                    <input
                      type="checkbox"
                      checked={imagesToDelete.includes(img.public_id)}
                      onChange={() => handleExistingImageToggle(img.public_id)}
                    />
                    <img src={img.url} alt="Image existante" width="100" />
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Nouvelles images */}
          <div className="form-group">
            <label htmlFor="newImages">
              Ajouter des images (max{" "}
              {5 - (existingImages.length - imagesToDelete.length)})
            </label>
            <input
              type="file"
              id="newImages"
              name="newImages"
              onChange={handleNewImagesChange}
              accept="image/*"
              multiple
            />
            {newImages.length > 0 && (
              <div className="file-preview">
                <p>{newImages.length} image(s) à ajouter</p>
              </div>
            )}
          </div>

          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? "Mise à jour en cours..." : "Mettre à jour la page"}
          </button>
        </form>
      </div>
    </>
  );
};

export default EditPages;
