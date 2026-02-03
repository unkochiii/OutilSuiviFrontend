import "./modifimages.css";
import Header from "../../components/header/Header";
import Menu from "../../components/menu/Menu";
import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const ModifImages = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Récupérer l'ID de la page depuis l'URL
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  // Vérifier si admin
  const isAdmin = user?.role === "admin";

  // États
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  // Champs du formulaire
  const [formData, setFormData] = useState({
    pageName: "",
    Description: "",
    owner: "",
    assignedTo: "",
  });

  // Images existantes et nouvelles
  const [existingImages, setExistingImages] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [newImagesPreview, setNewImagesPreview] = useState([]);

  // Redirection si pas admin
  useEffect(() => {
    if (user && !isAdmin) {
      navigate("/images");
    }
  }, [user, isAdmin, navigate]);

  // Récupérer les données de la page
  useEffect(() => {
    const fetchPage = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `https://site--outilbackend--fp64tcf5fhqm.code.run/admin/page/${id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );

        if (!response.ok) {
          throw new Error("Page non trouvée");
        }

        const data = await response.json();
        const pageData = data.data;

        setPage(pageData);
        setFormData({
          pageName: pageData.pageName || "",
          Description: pageData.Description || "",
          owner: pageData.owner?._id || "",
          assignedTo: pageData.assignedTo?._id || "",
        });
        setExistingImages(pageData.images || []);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error("Erreur:", err);
      } finally {
        setLoading(false);
      }
    };

    if (id && isAdmin) {
      fetchPage();
    }
  }, [id, isAdmin]);

  // Gestion des changements de champs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Marquer une image existante pour suppression
  const toggleDeleteImage = (publicId) => {
    setImagesToDelete((prev) =>
      prev.includes(publicId)
        ? prev.filter((id) => id !== publicId)
        : [...prev, publicId],
    );
  };

  // Ajouter de nouvelles images
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const maxNew = 5 - (existingImages.length - imagesToDelete.length);

    if (files.length > maxNew) {
      alert(`Vous ne pouvez ajouter que ${maxNew} image(s) maximum.`);
      // Limiter aux fichiers autorisés
      const allowedFiles = files.slice(0, maxNew);
      processNewFiles(allowedFiles);
    } else {
      processNewFiles(files);
    }
  };

  const processNewFiles = (files) => {
    // Créer les previews
    const previews = files.map((file) => URL.createObjectURL(file));
    setNewImagesPreview((prev) => [...prev, ...previews]);
    setNewImages((prev) => [...prev, ...files]);
  };

  // Supprimer une nouvelle image (avant upload)
  const removeNewImage = (index) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
    setNewImagesPreview((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  // Calcul du nombre d'images final
  const finalImageCount =
    existingImages.length - imagesToDelete.length + newImages.length;

  // Soumettre le formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (finalImageCount > 5) {
      alert("Maximum 5 images autorisées.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const formDataToSend = new FormData();
      formDataToSend.append("pageName", formData.pageName);
      formDataToSend.append("Description", formData.Description);
      formDataToSend.append("owner", formData.owner);
      formDataToSend.append(
        "assignedTo",
        formData.assignedTo === "null" ? "null" : formData.assignedTo,
      );

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
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: formDataToSend,
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la modification");
      }

      const data = await response.json();
      setSuccessMessage("Page modifiée avec succès !");
      setPage(data.data);
      setExistingImages(data.data.images || []);
      setImagesToDelete([]);
      setNewImages([]);
      setNewImagesPreview([]);

      // Redirection après 2 secondes
      setTimeout(() => {
        navigate("/images");
      }, 2000);
    } catch (err) {
      setError(err.message);
      console.error("Erreur:", err);
    } finally {
      setSaving(false);
    }
  };

  // Annuler et retourner
  const handleCancel = () => {
    // Nettoyer les previews
    newImagesPreview.forEach((url) => URL.revokeObjectURL(url));
    navigate("/images");
  };

  if (!isAdmin) {
    return null; // Redirection gérée par useEffect
  }

  if (loading) {
    return (
      <>
        <Menu />
        <Header />
        <main className="modif-images">
          <div className="loading-container">
            <div className="loading">Chargement...</div>
          </div>
        </main>
      </>
    );
  }

  if (error && !page) {
    return (
      <>
        <Menu />
        <Header />
        <main className="modif-images">
          <div className="error-container">
            <div className="error">Erreur: {error}</div>
            <button className="btn-back" onClick={() => navigate("/images")}>
              Retour aux images
            </button>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Menu />
      <Header />
      <main className="modif-images">
        <div className="modif-container">
          <h1>Modifier la page</h1>

          {successMessage && (
            <div className="success-message">{successMessage}</div>
          )}
          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="modif-form">
            {/* Informations de base */}
            <section className="form-section">
              <h2>Informations</h2>

              <div className="form-group">
                <label htmlFor="pageName">Nom de la page *</label>
                <input
                  type="text"
                  id="pageName"
                  name="pageName"
                  value={formData.pageName}
                  onChange={handleChange}
                  required
                  placeholder="Nom de la page"
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
                  rows={4}
                  placeholder="Description de la page"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="owner">Propriétaire (ID) *</label>
                  <input
                    type="text"
                    id="owner"
                    name="owner"
                    value={formData.owner}
                    onChange={handleChange}
                    required
                    placeholder="ID du propriétaire"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="assignedTo">Assigné à (ID)</label>
                  <input
                    type="text"
                    id="assignedTo"
                    name="assignedTo"
                    value={formData.assignedTo}
                    onChange={handleChange}
                    placeholder="ID ou 'null'"
                  />
                  <small>Laissez vide ou 'null' pour désassigner</small>
                </div>
              </div>
            </section>

            {/* Gestion des images */}
            <section className="form-section">
              <h2>
                Images
                <span
                  className={`image-counter ${
                    finalImageCount > 5 ? "error" : ""
                  }`}
                >
                  {finalImageCount}/5
                </span>
              </h2>

              {/* Images existantes */}
              {existingImages.length > 0 && (
                <div className="images-subsection">
                  <h3>Images existantes</h3>
                  <p className="images-help">
                    Cliquez sur une image pour la marquer à supprimer
                  </p>
                  <div className="images-grid existing">
                    {existingImages.map((image) => {
                      const isMarkedForDelete = imagesToDelete.includes(
                        image.public_id,
                      );
                      return (
                        <div
                          key={image.public_id}
                          className={`image-card ${
                            isMarkedForDelete ? "marked-delete" : ""
                          }`}
                          onClick={() => toggleDeleteImage(image.public_id)}
                        >
                          <img src={image.url} alt="" loading="lazy" />
                          {isMarkedForDelete && (
                            <div className="delete-overlay">
                              <span>🗑️</span>
                              <p>À supprimer</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {imagesToDelete.length > 0 && (
                    <p className="delete-info">
                      {imagesToDelete.length} image(s) marquée(s) pour
                      suppression
                    </p>
                  )}
                </div>
              )}

              {/* Nouvelles images */}
              <div className="images-subsection">
                <h3>Ajouter de nouvelles images</h3>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*"
                  multiple
                  hidden
                  disabled={finalImageCount >= 5}
                />
                <button
                  type="button"
                  className="btn-add-images"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={finalImageCount >= 5}
                >
                  📷 Sélectionner des images
                </button>
                <p className="images-help">Maximum 5 images au total</p>

                {newImagesPreview.length > 0 && (
                  <div className="images-grid new">
                    {newImagesPreview.map((preview, index) => (
                      <div key={index} className="image-card new-image">
                        <img src={preview} alt="" />
                        <button
                          type="button"
                          className="remove-new-image"
                          onClick={() => removeNewImage(index)}
                          title="Retirer"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Actions */}
            <div className="form-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={handleCancel}
                disabled={saving}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="btn-save"
                disabled={saving || finalImageCount > 5}
              >
                {saving
                  ? "Enregistrement..."
                  : "💾 Enregistrer les modifications"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
};

export default ModifImages;
