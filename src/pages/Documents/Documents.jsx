import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import axios from "axios";
import "./documents.css";
import Menu from "../../components/menu/Menu";
import Header from "../../components/header/Header";
import { useAuth } from "../../contexts/AuthContext";

// Import des icônes
import documentIcon from "../../assets/Dossier.svg";

const Documents = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // États pour les modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDocument, setEditingDocument] = useState(null);

  // États pour le formulaire
  const [formData, setFormData] = useState({
    title: "",
    type: "",
    url: "",
    assignedTo: "",
  });
  const [pdfFile, setPdfFile] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  // Vérifier si l'utilisateur est admin
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const token = Cookies.get("userToken");

        const response = await axios.get(
          "https://site--outilbackend--fp64tcf5fhqm.code.run/officials/my/assigned",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (response.data.success) {
          setDocuments(response.data.data);
        } else {
          setError("Erreur lors du chargement des documents");
        }
      } catch (err) {
        console.error("Erreur:", err);
        setError("Impossible de charger les documents");
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleDocumentClick = (documentId) => {
    navigate(`/officials/${documentId}`);
  };

  // Fonction pour obtenir l'URL du PDF ou un lien par défaut
  const getDocumentUrl = (doc) => {
    return doc.pdf?.url || doc.url || "https://www.exemple.com?=";
  };

  // Fonction pour formater le titre du document
  const getDocumentTitle = (doc, index) => {
    return doc.title || doc.type || `document ${index + 1}`;
  };

  // Ouvrir la modale de création
  const handleOpenCreateModal = () => {
    setFormData({
      title: "",
      type: "",
      url: "",
      assignedTo: "",
    });
    setPdfFile(null);
    setFormError(null);
    setShowCreateModal(true);
  };

  // Ouvrir la modale d'édition
  const handleOpenEditModal = (e, doc) => {
    e.stopPropagation();
    setEditingDocument(doc);
    setFormData({
      title: doc.title || "",
      type: doc.type || "",
      url: doc.pdf?.url || doc.url || "",
      assignedTo: doc.assignedTo?._id || "",
    });
    setPdfFile(null);
    setFormError(null);
    setShowEditModal(true);
  };

  // Fermer les modales
  const handleCloseModals = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setEditingDocument(null);
    setFormData({
      title: "",
      type: "",
      url: "",
      assignedTo: "",
    });
    setPdfFile(null);
    setFormError(null);
  };

  // Gérer les changements de formulaire
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Gérer le changement de fichier PDF
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== "application/pdf") {
        setFormError("Veuillez sélectionner un fichier PDF");
        return;
      }
      setPdfFile(file);
      setFormError(null);
    }
  };

  // Créer un nouveau document
  const handleCreateDocument = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    try {
      const token = Cookies.get("userToken");

      // Utiliser FormData pour envoyer le fichier
      const submitData = new FormData();
      submitData.append("title", formData.title);
      submitData.append("type", formData.type);
      if (formData.assignedTo) {
        submitData.append("assignedTo", formData.assignedTo);
      }
      if (pdfFile) {
        submitData.append("pdf", pdfFile);
      } else if (formData.url) {
        submitData.append("url", formData.url);
      }

      const response = await axios.post(
        "https://site--outilbackend--fp64tcf5fhqm.code.run/officials",
        submitData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );

      if (response.data.success) {
        setDocuments((prev) => [response.data.data, ...prev]);
        handleCloseModals();
      } else {
        setFormError(response.data.error || "Erreur lors de la création");
      }
    } catch (err) {
      console.error("Erreur:", err);
      setFormError(
        err.response?.data?.error || "Erreur lors de la création du document",
      );
    } finally {
      setFormLoading(false);
    }
  };

  // Modifier un document existant
  const handleEditDocument = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    try {
      const token = Cookies.get("userToken");

      // Utiliser FormData pour envoyer le fichier
      const submitData = new FormData();
      submitData.append("title", formData.title);
      submitData.append("type", formData.type);
      if (formData.assignedTo) {
        submitData.append("assignedTo", formData.assignedTo);
      }
      if (pdfFile) {
        submitData.append("pdf", pdfFile);
      } else if (formData.url) {
        submitData.append("url", formData.url);
      }

      const response = await axios.put(
        `https://site--outilbackend--fp64tcf5fhqm.code.run/officials/${editingDocument._id}`,
        submitData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );

      if (response.data.success) {
        setDocuments((prev) =>
          prev.map((doc) =>
            doc._id === editingDocument._id ? response.data.data : doc,
          ),
        );
        handleCloseModals();
      } else {
        setFormError(response.data.error || "Erreur lors de la modification");
      }
    } catch (err) {
      console.error("Erreur:", err);
      setFormError(
        err.response?.data?.error ||
          "Erreur lors de la modification du document",
      );
    } finally {
      setFormLoading(false);
    }
  };

  // Supprimer un document
  const handleDeleteDocument = async () => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce document ?")) {
      return;
    }

    setFormLoading(true);

    try {
      const token = Cookies.get("userToken");

      const response = await axios.delete(
        `https://site--outilbackend--fp64tcf5fhqm.code.run/officials/${editingDocument._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.data.success) {
        setDocuments((prev) =>
          prev.filter((doc) => doc._id !== editingDocument._id),
        );
        handleCloseModals();
      } else {
        setFormError(response.data.error || "Erreur lors de la suppression");
      }
    } catch (err) {
      console.error("Erreur:", err);
      setFormError(
        err.response?.data?.error || "Erreur lors de la suppression",
      );
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <>
      <Header />
      <Menu />
      <div className="page-docs">
        <div className="documents-container">
          {/* Breadcrumb / Navigation */}
          <div className="breadcrumb">
            <div className="breadcrumb-items">
              <span className="breadcrumb-item">
                <img
                  src={documentIcon}
                  alt="Documents"
                  className="breadcrumb-icon doc-icon"
                />
                <span className="breadcrumb-text">Documents</span>
              </span>
            </div>

            {/* Bouton Ajouter pour Admin */}
            {isAdmin && (
              <button
                className="btn-add-document"
                onClick={() => navigate("/addDocuments")}
                title="Ajouter un document"
              >
                <span>+</span>
              </button>
            )}
          </div>

          {/* Contenu principal */}
          {loading ? (
            <div className="loading-state">
              <div className="loader"></div>
              <p>Chargement des documents...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <p>{error}</p>
              <button onClick={() => window.location.reload()}>
                Réessayer
              </button>
            </div>
          ) : documents.length === 0 ? (
            <div className="empty-state">
              <p>Aucun document assigné</p>
            </div>
          ) : (
            <div className="documents-grid">
              {documents.map((doc, index) => (
                <div
                  key={doc._id}
                  className="document-card"
                  onClick={() => handleDocumentClick(doc._id)}
                >
                  <div className="document-card-header">
                    <h3 className="document-title">
                      {getDocumentTitle(doc, index)}
                    </h3>
                    {isAdmin && (
                      <button
                        className="btn-edit-document"
                        onClick={(e) => handleOpenEditModal(e, doc)}
                        title="Modifier le document"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                      </button>
                    )}
                  </div>
                  <a
                    href={getDocumentUrl(doc)}
                    className="document-link"
                    onClick={(e) => e.stopPropagation()}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {getDocumentUrl(doc)}
                  </a>
                  {doc.type && (
                    <span className="document-type">{doc.type}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Documents;
