import "./document.css";
import Header from "../../components/header/Header";
import Menu from "../../components/menu/Menu";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom"; // ⚠️ IMPORTANT !

const API_URL = "https://site--outilbackend--fp64tcf5fhqm.code.run";
const Document = () => {
  const { id } = useParams();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");

        const response = await fetch(`${API_URL}/officials/${id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Erreur lors du chargement du document",
          );
        }

        // 🔍 AJOUT DE LOGS POUR DÉBOGUER
        console.log("Document récupéré:", data.data);
        console.log("URL du PDF:", data.data?.pdf?.url);

        setDocument(data.data);
      } catch (err) {
        setError(err.message || "Erreur lors du chargement du document");
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [id]);

  // 🔧 FONCTION POUR CONVERTIR LES URLs GOOGLE DRIVE
  const getPdfUrl = (url) => {
    if (!url) return null;

    // Si c'est une URL Google Drive, la convertir en format embed
    if (url.includes("drive.google.com")) {
      // Extraire l'ID du fichier
      const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (match) {
        const fileId = match[1];
        return `https://drive.google.com/file/d/${fileId}/preview`;
      }
    }

    // Si c'est un fichier local stocké sur votre serveur
    if (!url.startsWith("http")) {
      return `${API_URL}${url}`;
    }

    return url;
  };

  const handleDownload = async () => {
    try {
      const token = localStorage.getItem("token");

      // Si c'est une URL Google Drive, ouvrir dans un nouvel onglet
      if (document.pdf?.url?.includes("drive.google.com")) {
        window.open(document.pdf.url, "_blank");
        return;
      }

      // Sinon télécharger depuis votre API
      const response = await fetch(`${API_URL}/officials/${id}/pdf`, {
        method: "GET",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) throw new Error("Téléchargement échoué");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      const contentDisposition = response.headers.get("content-disposition");
      let filename = document.documentName || "document.pdf";

      if (contentDisposition) {
        const matches = contentDisposition.match(/filename="(.+)"/);
        if (matches) {
          filename = matches[1];
        }
      }

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Erreur téléchargement:", err);
      alert("Impossible de télécharger le PDF. Vérifiez les permissions.");
    }
  };

  if (loading) {
    return (
      <>
        <Menu />
        <Header />
        <main className="document-main">
          <div className="loading">Chargement...</div>
        </main>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Menu />
        <Header />
        <main className="document-main">
          <div className="error">{error}</div>
        </main>
      </>
    );
  }

  if (!document) return null;

  const pdfUrl = getPdfUrl(document.pdf?.url);

  return (
    <>
      <Menu />
      <Header />
      <main className="document-main">
        <div className="document-header">
          <h1>{document.documentName || "Document officiel"}</h1>
          <div className="document-meta">
            <span>
              Créé le :{" "}
              {new Date(document.pdf?.uploadedAt).toLocaleDateString("fr-FR")}
            </span>
          </div>
        </div>

        <div className="document-info">
          <div className="info-item">
            <strong>Propriétaire</strong>
            <span>{document.owner?.projectName || document.owner?.email}</span>
          </div>
          {document.assignedTo && (
            <div className="info-item">
              <strong>Assigné à</strong>
              <span>
                {document.assignedTo?.projectName || document.assignedTo?.email}
              </span>
            </div>
          )}
        </div>

        {/* 🔧 AFFICHAGE DU PDF CORRIGÉ */}
        <div className="pdf-viewer">
          {pdfUrl ? (
            <>
              <iframe
                src={pdfUrl}
                title="PDF Viewer"
                width="100%"
                height="800px"
                style={{ border: "none" }}
              />
              {/* 🔍 DEBUG: Afficher l'URL pour vérifier */}
              <small
                style={{ color: "#666", marginTop: "10px", display: "block" }}
              >
                URL: {pdfUrl}
              </small>
            </>
          ) : (
            <div className="no-pdf">
              <p>❌ Aucun PDF disponible pour ce document</p>
            </div>
          )}
        </div>

        <div className="document-actions">
          {document.pdf?.url && (
            <button onClick={handleDownload} className="btn-download">
              ⬇️ Télécharger le PDF
            </button>
          )}
        </div>
      </main>
    </>
  );
};

export default Document;
