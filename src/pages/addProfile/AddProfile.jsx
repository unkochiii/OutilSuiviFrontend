import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Pour la redirection si non authentifié
import "./addProfile.css";
import Header from "../../components/header/Header";
import Menu from "../../components/menu/Menu";

const AddProfile = () => {
  console.log("🔧 AddProfile - Composant initialisé");

  const navigate = useNavigate();

  // États pour les champs du formulaire
  const [projectName, setProjectName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("user");
  const [dueDate, setDueDate] = useState("");

  // États pour la gestion UI
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errors, setErrors] = useState({});

  // Récupérer le token JWT
  const getAuthToken = () => {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    console.log(
      "🔑 AddProfile - Récupération du token:",
      token ? "✅ Token trouvé" : "❌ Token manquant",
    );
    return token;
  };

  // Réinitialiser les messages quand l'utilisateur modifie les champs
  useEffect(() => {
    console.log("🔄 AddProfile - Champ modifié, reset des messages");
    if (successMessage) setSuccessMessage("");
    if (Object.keys(errors).length > 0) setErrors({});
  }, [projectName, email, role, dueDate]);

  // Validation du formulaire
  const validateForm = () => {
    console.log("✅ AddProfile - Début validation formulaire", {
      email,
      dueDate,
    });

    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = "L'email est requis";
      console.warn("❌ AddProfile - Email manquant");
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "L'email n'est pas valide";
      console.warn("❌ AddProfile - Format email invalide");
    }

    // dueDate est optionnelle, mais si fournie, doit être future
    if (dueDate && new Date(dueDate) <= new Date()) {
      newErrors.dueDate = "La date d'échéance doit être dans le futur";
      console.warn("❌ AddProfile - Date d'échéance invalide", { dueDate });
    }

    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    console.log(
      `✅ AddProfile - Validation ${isValid ? "✔️ valide" : "❌ invalide"}`,
      newErrors,
    );
    return isValid;
  };

  // Soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("🚀 AddProfile - Soumission formulaire déclenchée");

    if (!validateForm()) {
      console.log("⛔ AddProfile - Validation échouée, soumission annulée");
      return;
    }

    setLoading(true);
    setSuccessMessage("");
    setErrors({});

    const token = getAuthToken();
    if (!token) {
      console.error(
        "🔴 AddProfile - Aucun token disponible, redirection login",
      );
      setErrors({ general: "Vous devez être connecté pour créer un compte" });
      setTimeout(() => navigate("/login"), 2000);
      setLoading(false);
      return;
    }

    const payload = {
      projectName: projectName.trim() || "Mon Projet",
      email: email.toLowerCase().trim(),
      role,
      dueDate: dueDate || undefined,
    };

    console.log("📤 AddProfile - Préparation envoi", {
      ...payload,
      email: "🔒 [MASQUÉ]",
      token: `${token.substring(0, 20)}...`, // Log partiel du token pour vérification
    });

    try {
      const url =
        "https://site--outilbackend--fp64tcf5fhqm.code.run/admin/accounts";
      console.log("🌐 AddProfile - URL API:", url);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // ⭐ IMPORTANT: Ajout du token
        },
        body: JSON.stringify(payload),
      });

      console.log("📥 AddProfile - Réponse reçue", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      // Vérifier si la réponse contient du contenu
      let data = {};
      const contentType = response.headers.get("content-type");
      const contentLength = response.headers.get("content-length");

      console.log("📄 AddProfile - Headers réponse", {
        contentType,
        contentLength,
        hasContent:
          contentLength !== "0" && contentType?.includes("application/json"),
      });

      if (contentLength !== "0" && contentType?.includes("application/json")) {
        try {
          data = await response.json();
          console.log("📄 AddProfile - JSON parsé avec succès", data);
        } catch (jsonError) {
          console.error("❌ AddProfile - Erreur parsing JSON:", jsonError);
          data = { error: "Réponse invalide du serveur" };
        }
      } else {
        console.log("⚠️ AddProfile - Réponse vide ou non-JSON");
      }

      if (!response.ok) {
        console.error("❌ AddProfile - Erreur HTTP", {
          status: response.status,
          data,
          tokenPreview: `${token.substring(0, 10)}...`,
        });

        // Gestion des erreurs spécifiques
        if (response.status === 401) {
          console.error("🔐 AddProfile - Erreur 401: Token invalide ou expiré");
          setErrors({ general: "Session expirée. Veuillez vous reconnecter." });
          localStorage.removeItem("token");
          sessionStorage.removeItem("token");
          setTimeout(() => navigate("/login"), 2000);
        } else if (response.status === 409) {
          console.warn("⚠️ AddProfile - Conflit 409: Email déjà utilisé");
          setErrors({ email: "Cet email est déjà utilisé" });
        } else if (response.status === 400) {
          console.warn("⚠️ AddProfile - Bad Request 400:", data.error);
          setErrors({ general: data.error || "Données invalides" });
        } else {
          console.error(
            "❌ AddProfile - Erreur serveur inconnue:",
            response.status,
          );
          setErrors({
            general: `Erreur serveur (${response.status}). Veuillez réessayer.`,
          });
        }
        return;
      }

      // Succès
      console.log("✨ AddProfile - ✅ Compte créé avec succès !", {
        accountId: data.account?.id,
        projectName: data.account?.projectName,
      });

      setSuccessMessage(data.message || "Compte créé avec succès !");

      // Réinitialiser le formulaire
      console.log("🔄 AddProfile - Réinitialisation du formulaire");
      setProjectName("");
      setEmail("");
      setRole("user");
      setDueDate("");
    } catch (error) {
      console.error("❌ AddProfile - ❌ Erreur réseau/exception:", {
        message: error.message,
        name: error.name,
        stack: error.stack,
      });
      setErrors({
        general: "Erreur de connexion au serveur. Vérifiez votre connexion.",
      });
    } finally {
      setLoading(false);
      console.log("🏁 AddProfile - Fin de la requête");
    }
  };

  console.log("🎨 AddProfile - Rendu du composant", {
    loading,
    hasSuccess: !!successMessage,
    hasErrors: Object.keys(errors).length > 0,
  });

  return (
    <>
      <Header />
      <main>
        <Menu />
        <div className="page-addprofile">
          <div className="add-profile-container">
            <h1>Créer un nouveau compte</h1>

            {successMessage && (
              <div className="success-message">
                {successMessage}
                <br />
                <small>
                  Le mot de passe a été envoyé à l'adresse email indiquée.
                </small>
              </div>
            )}

            {errors.general && (
              <div className="error-message general-error">
                {errors.general}
              </div>
            )}

            <form onSubmit={handleSubmit} className="add-profile-form">
              <div className="form-group">
                <label htmlFor="projectName">Nom du projet</label>
                <input
                  type="text"
                  id="projectName"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Mon Projet"
                  disabled={loading}
                  aria-invalid={errors.projectName ? "true" : "false"}
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  disabled={loading}
                  required
                  aria-invalid={errors.email ? "true" : "false"}
                />
                {errors.email && (
                  <span className="error-text">{errors.email}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="role">Rôle</label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  disabled={loading}
                  aria-invalid={errors.role ? "true" : "false"}
                >
                  <option value="user">Utilisateur</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="dueDate">Date d'échéance</label>
                <input
                  type="date"
                  id="dueDate"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  disabled={loading}
                  aria-invalid={errors.dueDate ? "true" : "false"}
                />
                {errors.dueDate && (
                  <span className="error-text">{errors.dueDate}</span>
                )}
              </div>

              <button
                type="submit"
                className="submit-button"
                disabled={loading}
              >
                {loading ? "Création en cours..." : "Créer le compte"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </>
  );
};

export default AddProfile;
