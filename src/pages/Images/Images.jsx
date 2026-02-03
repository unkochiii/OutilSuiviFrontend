import "./images.css";
import Menu from "../../components/menu/Menu";
import Header from "../../components/header/Header";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const Images = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // État pour la visionneuse d'images
  const [selectedImage, setSelectedImage] = useState(null);

  // Vérifier si l'utilisateur est admin
  const isAdmin = user?.role === "admin";

  // Récupérer les pages (toutes pour admin, assignées pour les autres)
  useEffect(() => {
    const fetchPages = async () => {
      try {
        setLoading(true);

        // URL différente selon le rôle
        const url = isAdmin
          ? `https://site--outilbackend--fp64tcf5fhqm.code.run/admin/pages`
          : `https://site--outilbackend--fp64tcf5fhqm.code.run/page/my/assigned`;

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (!response.ok) {
          throw new Error("Erreur lors du chargement des pages");
        }

        const data = await response.json();
        setPages(isAdmin ? data.data || [] : data.data || []);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error("Erreur:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchPages();
    }
  }, [user, isAdmin]);

  // Récupérer les détails de la page sélectionnée
  const handlePageClick = async (pageId) => {
    try {
      const url = isAdmin
        ? `https://site--outilbackend--fp64tcf5fhqm.code.run/admin/page/${pageId}`
        : `https://site--outilbackend--fp64tcf5fhqm.code.run/page/${pageId}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Erreur lors du chargement de la page");
      }

      const data = await response.json();
      setSelectedPage(data.data);
    } catch (err) {
      console.error("Erreur:", err);
      setError(err.message);
    }
  };

  // Supprimer une page (admin seulement)
  const handleDeletePage = async (pageId, e) => {
    e.stopPropagation();

    // Confirmation avant suppression
    const confirmed = window.confirm(
      "Êtes-vous sûr de vouloir supprimer cette page ?\n\nCette action est irréversible et supprimera également toutes les images associées.",
    );

    if (!confirmed) return;

    try {
      setDeleting(true);

      const response = await fetch(
        `https://site--outilbackend--fp64tcf5fhqm.code.run/admin/page/${pageId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la suppression");
      }

      // Supprimer la page de la liste locale
      setPages((prevPages) => prevPages.filter((p) => p._id !== pageId));

      // Si la page supprimée était sélectionnée, la désélectionner
      if (selectedPage?._id === pageId) {
        setSelectedPage(null);
      }

      console.log("✅ Page supprimée:", pageId);
    } catch (err) {
      console.error("❌ Erreur suppression:", err);
      alert("Erreur lors de la suppression: " + err.message);
    } finally {
      setDeleting(false);
    }
  };

  // Ouvrir l'image en plein écran
  const openImageViewer = (image) => {
    setSelectedImage(image);
  };

  // Fermer la visionneuse
  const closeImageViewer = () => {
    setSelectedImage(null);
  };

  return (
    <>
      <Header />
      <Menu />
      <div className="page-images">
        <div className="images-container">
          {/* Panneau gauche - Liste des pages */}
          <div className="pages-list-panel">
            <div className="panel-header">
              <h2>{isAdmin ? "Toutes les Pages" : "Mes Pages"}</h2>
              {isAdmin && (
                <button
                  className="btn-add-page"
                  onClick={() => navigate("/addPage")}
                  title="Ajouter une page"
                >
                  <span>+</span>
                </button>
              )}
            </div>

            {loading ? (
              <div className="loading">Chargement...</div>
            ) : error ? (
              <div className="error">Erreur: {error}</div>
            ) : pages.length === 0 ? (
              <div className="no-pages">
                {isAdmin ? "Aucune page créée" : "Aucune page assignée"}
              </div>
            ) : (
              <ul className="pages-list">
                {pages.map((page) => (
                  <li
                    key={page._id}
                    className={`page-item ${
                      selectedPage?._id === page._id ? "active" : ""
                    } ${isAdmin ? "has-actions" : ""}`}
                    onClick={() => handlePageClick(page._id)}
                  >
                    <div className="page-item-content">
                      <h3>{page.pageName || "Sans titre"}</h3>

                      {/* Info owner pour les admins */}
                      {isAdmin && page.owner && (
                        <span className="owner-info">
                          👤 {page.owner.firstName} {page.owner.lastName}
                        </span>
                      )}

                      {/* Info assignedTo pour les admins */}
                      {isAdmin && page.assignedTo ? (
                        <span className="assigned-info">
                          → {page.assignedTo.firstName}{" "}
                          {page.assignedTo.lastName}
                        </span>
                      ) : (
                        isAdmin && (
                          <span className="assigned-info unassigned">
                            → Non assignée
                          </span>
                        )
                      )}

                      {/* Indicateur du nombre d'images */}
                      {page.images?.length > 0 && (
                        <span className="images-count">
                          📷 {page.images.length}
                        </span>
                      )}
                    </div>

                    {/* Actions admin: modifier et supprimer */}
                    {isAdmin && (
                      <div className="page-actions">
                        <button
                          className="btn-edit-page"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/modifieImages/${page._id}`); // ✅ ID passé dans l'URL
                          }}
                          title="Modifier la page"
                          disabled={deleting}
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
                        <button
                          className="btn-delete-page"
                          onClick={(e) => handleDeletePage(page._id, e)}
                          title="Supprimer la page"
                          disabled={deleting}
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
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                          </svg>
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Panneau droit - Détails de la page */}
          <div className="page-details-panel">
            {selectedPage ? (
              <div className="page-details">
                <div className="page-details-header">
                  <h2>{selectedPage.pageName || "Sans titre"}</h2>
                  {/* Bouton supprimer dans le détail aussi (admin seulement) */}
                  {isAdmin && (
                    <button
                      className="btn-delete-detail"
                      onClick={() =>
                        handleDeletePage(selectedPage._id, {
                          stopPropagation: () => {},
                        })
                      }
                      disabled={deleting}
                      title="Supprimer cette page"
                    >
                      {deleting ? "Suppression..." : "🗑️ Supprimer"}
                    </button>
                  )}
                </div>

                {/* Infos admin supplémentaires */}
                {isAdmin && (
                  <div className="admin-details">
                    <div className="detail-item">
                      <span className="label">Créée par:</span>
                      <span className="value">
                        {selectedPage.owner?.firstName &&
                        selectedPage.owner?.lastName
                          ? `${selectedPage.owner.firstName} ${selectedPage.owner.lastName} (${selectedPage.owner.email})`
                          : selectedPage.owner?.projectName
                            ? `${selectedPage.owner.projectName} (${selectedPage.owner.email})`
                            : "Inconnu"}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Assignée à:</span>
                      <span className="value">
                        {selectedPage.assignedTo?.firstName &&
                        selectedPage.assignedTo?.lastName
                          ? `${selectedPage.assignedTo.firstName} ${selectedPage.assignedTo.lastName} (${selectedPage.assignedTo.email})`
                          : selectedPage.assignedTo?.projectName
                            ? `${selectedPage.assignedTo.projectName} (${selectedPage.assignedTo.email})`
                            : "Non assignée"}
                      </span>
                    </div>
                  </div>
                )}

                <div className="details-content">
                  {selectedPage.Description && (
                    <div className="detail-item full-width">
                      <span className="label">Description:</span>
                      <p className="value">{selectedPage.Description}</p>
                    </div>
                  )}
                </div>

                {/* Section Images */}
                <div className="images-section">
                  <h3>
                    Images
                    <span className="images-badge">
                      {selectedPage.images?.length || 0}
                    </span>
                  </h3>

                  {selectedPage.images && selectedPage.images.length > 0 ? (
                    <div className="images-grid">
                      {selectedPage.images.map((image, index) => (
                        <div
                          key={image.public_id || index}
                          className="image-card"
                          onClick={() => openImageViewer(image)}
                        >
                          <img
                            src={image.url}
                            alt={`Image ${index + 1}`}
                            loading="lazy"
                          />
                          <div className="image-overlay">
                            <span className="zoom-icon">🔍</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="no-images">
                      <span className="no-images-icon">🖼️</span>
                      <p>Aucune image pour cette page</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="no-selection">
                <span className="no-selection-icon">👆</span>
                <p>Sélectionnez une page pour voir les détails</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Visionneuse d'images en plein écran */}
      {selectedImage && (
        <div className="image-viewer-overlay" onClick={closeImageViewer}>
          <div
            className="image-viewer-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="close-viewer-btn" onClick={closeImageViewer}>
              ✕
            </button>
            <img src={selectedImage.url} alt="Image en plein écran" />
            <div className="image-viewer-info">
              <p>ID: {selectedImage.public_id}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Images;
