import "./addRepport.css";
import Menu from "../../components/menu/Menu";
import Header from "../../components/header/Header";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MdAddPhotoAlternate,
  MdDelete,
  MdSend,
  MdLocationOn,
} from "react-icons/md";

const API_BASE_URL = "https://site--outilbackend--fp64tcf5fhqm.code.run";

const AddRepport = () => {
  const navigate = useNavigate();

  // États du formulaire
  const [formData, setFormData] = useState({
    reportTitle: "",
    place: "",
    content: "",
    priority: "secondaire",
    assignedTo: "",
  });

  const [images, setImages] = useState([]); // Fichiers à uploader
  const [imagePreviews, setImagePreviews] = useState([]); // URLs pour preview
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Liste des utilisateurs pour assignation (optionnel)
  const [users, setUsers] = useState([]);

  // Charger les utilisateurs disponibles
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      // Adaptez cette URL selon votre endpoint
      const response = await fetch(`${API_BASE_URL}/accounts`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const result = await response.json();
        setUsers(result.data || []);
      }
    } catch {
      // Silencieux - l'assignation est optionnelle
    }
  };

  // Gestion des changements de champs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  // Gestion des images
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);

    if (files.length + images.length > 2) {
      setError("Maximum 2 images autorisées");
      return;
    }

    // Validation
    const validFiles = files.filter((file) => {
      if (!file.type.startsWith("image/")) {
        setError(`${file.name} n'est pas une image`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        // 5MB
        setError(`${file.name} dépasse 5MB`);
        return false;
      }
      return true;
    });

    // Créer les previews
    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });

    setImages((prev) => [...prev, ...validFiles]);
    setError(null);
  };

  // Supprimer une image
  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Non authentifié");
      setLoading(false);
      return;
    }

    // Validation
    if (
      !formData.reportTitle.trim() ||
      !formData.place.trim() ||
      !formData.content.trim()
    ) {
      setError("Titre, lieu et description sont requis");
      setLoading(false);
      return;
    }

    try {
      // Construction du FormData pour l'upload
      const submitData = new FormData();
      submitData.append("reportTitle", formData.reportTitle.trim());
      submitData.append("place", formData.place.trim());
      submitData.append("content", formData.content.trim());
      submitData.append("priority", formData.priority);

      if (formData.assignedTo) {
        submitData.append("assignedTo", formData.assignedTo);
      }

      // Ajouter les images
      images.forEach((image) => {
        submitData.append("images", image);
      });

      const response = await fetch(`${API_BASE_URL}/report`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // Ne PAS mettre Content-Type - le navigateur le gère pour FormData
        },
        body: submitData,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Erreur ${response.status}`);
      }

      const result = await response.json();
      setSuccess(true);

      // Redirection après 1.5s
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Rendu
  return (
    <>
      <Menu />
      <Header />
      <main className="add-report-container">
        <div className="add-report-card">
          {/* En-tête */}
          <div className="add-report-header">
            <h1>Nouveau Report</h1>
            <p>Décrivez le problème et joignez des photos si nécessaire</p>
          </div>

          {/* Messages */}
          {success && (
            <div className="success-message">
              ✅ Report créé avec succès ! Redirection...
            </div>
          )}

          {error && <div className="error-message">❌ {error}</div>}

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="report-form">
            {/* Images */}
            <div className="form-section">
              <label className="section-label">Photos (max 2)</label>

              <div className="images-grid">
                {/* Previews existantes */}
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="image-preview">
                    <img src={preview} alt={`Preview ${index + 1}`} />
                    <button
                      type="button"
                      className="remove-image"
                      onClick={() => removeImage(index)}
                      title="Supprimer"
                    >
                      <MdDelete />
                    </button>
                  </div>
                ))}

                {/* Bouton d'ajout */}
                {images.length < 2 && (
                  <label className="image-add-btn">
                    <MdAddPhotoAlternate size={32} />
                    <span>Ajouter photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      hidden
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Champs texte */}
            <div className="form-section">
              <div className="form-group">
                <label htmlFor="reportTitle">Titre du report *</label>
                <input
                  type="text"
                  id="reportTitle"
                  name="reportTitle"
                  value={formData.reportTitle}
                  onChange={handleChange}
                  placeholder="Ex: Fuite d'eau salle des machines"
                  maxLength={300}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="place">
                  <MdLocationOn /> Lieu *
                </label>
                <input
                  type="text"
                  id="place"
                  name="place"
                  value={formData.place}
                  onChange={handleChange}
                  placeholder="Ex: page d'accueil/ page dashboard..."
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="content">Description détaillée *</label>
                <textarea
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  placeholder="Décrivez le problème en détail..."
                  rows={5}
                  maxLength={5000}
                  required
                />
              </div>
            </div>

            {/* Options */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="priority">Priorité</label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                >
                  <option value="secondaire">📌 Secondaire</option>
                  <option value="important">⚠️ Important</option>
                  <option value="urgent">🔥 Urgent</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="assignedTo">Assigner à (optionnel)</label>
                <select
                  id="assignedTo"
                  name="assignedTo"
                  value={formData.assignedTo}
                  onChange={handleChange}
                >
                  <option value="">-- Non assigné --</option>
                  {users.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.projectName || user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="form-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={() => navigate(-1)}
                disabled={loading}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="submit-btn"
                disabled={loading || success}
              >
                <MdSend />
                {loading ? "Envoi..." : "Créer le report"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
};

export default AddRepport;
