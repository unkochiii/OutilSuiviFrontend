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

  // État pour la visionneuse d'images
  const [selectedImage, setSelectedImage] = useState(null);

  // Vérifier si l'utilisateur est admin
  const isAdmin = user?.role === "admin";

  // Récupérer les pages assignées à l'utilisateur
  useEffect(() => {
    const fetchPages = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `https://site--outilbackend--fp64tcf5fhqm.code.run/page/my/assigned`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );

        if (!response.ok) {
          throw new Error("Erreur lors du chargement des pages");
        }

        const data = await response.json();
        setPages(data.data || []);
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
  }, [user]);

  // Récupérer les détails de la page sélectionnée
  const handlePageClick = async (pageId) => {
    try {
      const response = await fetch(
        `https://site--outilbackend--fp64tcf5fhqm.code.run/page/${pageId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

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
              <h2>Mes Pages</h2>
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
              <div className="no-pages">Aucune page assignée</div>
            ) : (
              <ul className="pages-list">
                {pages.map((page) => (
                  <li
                    key={page._id}
                    className={`page-item ${
                      selectedPage?._id === page._id ? "active" : ""
                    }`}
                    onClick={() => handlePageClick(page._id)}
                  >
                    <div className="page-item-content">
                      <h3>{page.pageName || "Sans titre"}</h3>

                      {/* Indicateur du nombre d'images */}
                      {page.images?.length > 0 && (
                        <span className="images-count">
                          📷 {page.images.length}
                        </span>
                      )}
                    </div>
                    {isAdmin && (
                      <button
                        className="btn-edit-page"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate("/addImages");
                        }}
                        title="Modifier la page"
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
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Panneau droit - Détails de la page */}
          <div className="page-details-panel">
            {selectedPage ? (
              <div className="page-details">
                <h2>{selectedPage.pageName || "Sans titre"}</h2>

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
