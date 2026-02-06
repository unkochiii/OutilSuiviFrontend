import "./modiftask.css";
import Menu from "../../components/menu/Menu";
import Header from "../../components/header/Header";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";

// Fonction pour décoder le token JWT
const parseJwt = (token) => {
  if (!token) return null;
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join(""),
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

const Modiftask = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [accounts, setAccounts] = useState([]);

  const [formData, setFormData] = useState({
    taskName: "",
    Duration: "",
    Description: "",
    Problem: "",
    Progression: [],
    dueDate: "",
    owner: "",
    assignedTo: "",
    Site: { dev: { url: "" }, official: { url: "" } },
    Apk: { dev: { url: "", version: "" }, official: { url: "", version: "" } },
    Backend: { dev: { url: "" }, official: { url: "" } },
  });

  const [progressPercentage, setProgressPercentage] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  useEffect(() => {
    const fetchTaskAndAccounts = async () => {
      try {
        setLoading(true);
        const token = Cookies.get("userToken") || localStorage.getItem("token");

        if (!token) {
          navigate("/login");
          return;
        }

        const decodedToken = parseJwt(token);
        if (decodedToken && decodedToken.role === "admin") {
          setIsAdmin(true);
        } else {
          navigate("/home");
          return;
        }

        const [taskResponse, accountsResponse] = await Promise.all([
          axios.get(
            `https://site--outilbackend--fp64tcf5fhqm.code.run/task/${id}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          ),
          axios.get(
            "https://site--outilbackend--fp64tcf5fhqm.code.run/admin/accounts",
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          ),
        ]);

        if (taskResponse.data.success) {
          const taskData = taskResponse.data.data;
          setTask(taskData);
          setFormData({
            taskName: taskData.taskName || "",
            Duration: taskData.Duration || "",
            Description: taskData.Description || "",
            Problem: taskData.Problem || "",
            Progression: taskData.Progression || [],
            dueDate: taskData.dueDate ? taskData.dueDate.split("T")[0] : "",
            owner: taskData.owner?._id || taskData.owner || "",
            assignedTo: taskData.assignedTo?._id || taskData.assignedTo || "",
            Site: {
              dev: { url: taskData.Site?.dev?.url || "" },
              official: { url: taskData.Site?.official?.url || "" },
            },
            Apk: {
              dev: {
                url: taskData.Apk?.dev?.url || "",
                version: taskData.Apk?.dev?.version || "",
              },
              official: {
                url: taskData.Apk?.official?.url || "",
                version: taskData.Apk?.official?.version || "",
              },
            },
            Backend: {
              dev: { url: taskData.Backend?.dev?.url || "" },
              official: { url: taskData.Backend?.official?.url || "" },
            },
          });

          // Pré-remplir avec la dernière progression
          if (taskData.Progression && taskData.Progression.length > 0) {
            const lastProgress =
              taskData.Progression[taskData.Progression.length - 1];
            setProgressPercentage(lastProgress.percentage?.toString() || "");
          }
        } else {
          setError("Tâche non trouvée");
        }

        if (accountsResponse.data.success) {
          const accountData = accountsResponse.data.data;
          setAccounts(Array.isArray(accountData) ? accountData : []);
        } else {
          setAccounts([]);
          console.warn(
            "Failed to fetch accounts:",
            accountsResponse.data.error,
          );
        }
      } catch (err) {
        console.error("Erreur:", err);
        setError(
          err.response?.data?.error || "Erreur lors du chargement des données",
        );
        setAccounts([]);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchTaskAndAccounts();
    }
  }, [id, navigate]);

  const handleNestedChange = (category, env, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [env]: {
          ...prev[category][env],
          [field]: value,
        },
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      const token = Cookies.get("userToken") || localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      // 1. Préparer l'entrée de progression si renseignée
      const progressionEntry = progressPercentage
        ? {
            date: new Date().toISOString(),
            percentage: Math.max(
              0,
              Math.min(100, parseInt(progressPercentage)),
            ),
          }
        : null;

      // 2. Extraire Progression pour le protéger du nettoyage
      const { Progression, ...dataToClean } = formData;

      // 3. Nettoyer les autres objets imbriqués (Site, Apk, Backend)
      Object.keys(dataToClean).forEach((key) => {
        if (typeof dataToClean[key] === "object" && dataToClean[key] !== null) {
          Object.keys(dataToClean[key]).forEach((subKey) => {
            if (
              typeof dataToClean[key][subKey] === "object" &&
              dataToClean[key][subKey] !== null
            ) {
              Object.keys(dataToClean[key][subKey]).forEach((field) => {
                if (
                  !dataToClean[key][subKey][field] &&
                  dataToClean[key][subKey][field] !== false
                ) {
                  delete dataToClean[key][subKey][field];
                }
              });
              if (Object.keys(dataToClean[key][subKey]).length === 0) {
                delete dataToClean[key][subKey];
              }
            }
          });
          if (Object.keys(dataToClean[key]).length === 0) {
            delete dataToClean[key];
          }
        }
      });

      // 4. Recombiner avec Progression et ajouter la nouvelle entrée si nécessaire
      const dataToSend = {
        ...dataToClean,
        Progression: progressionEntry
          ? [...Progression, progressionEntry]
          : Progression,
      };

      // 5. LOG DEBUG - Vérifiez ce qui est envoyé
      console.log(
        "📤 Données envoyées au backend:",
        JSON.stringify(dataToSend, null, 2),
      );

      const response = await axios.put(
        `https://site--outilbackend--fp64tcf5fhqm.code.run/admin/task/${id}`,
        dataToSend,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      // 6. LOG DEBUG - Vérifiez la réponse du backend
      console.log("📥 Réponse du backend:", response.data);

      if (response.data.success) {
        alert("Tâche modifiée avec succès !");
        navigate(`/task/${id}`);
      } else {
        setError(response.data.error || "Erreur lors de la modification");
      }
    } catch (err) {
      console.error("❌ Erreur lors de la soumission:", err);
      setError(
        err.response?.data?.error ||
          "Erreur lors de la modification de la tâche",
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Menu />
        <Header />
        <main className="modiftask-container">
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
        <main className="modiftask-container">
          <div className="error">
            <p>{error}</p>
            <button onClick={() => navigate(`/task/${id}`)}>Retour</button>
          </div>
        </main>
      </>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <>
      <Menu />
      <Header />
      <main className="modiftask-container">
        <div className="modiftask-card">
          <h1>Modifier la tâche</h1>

          <form onSubmit={handleSubmit} className="modiftask-form">
            {/* Informations générales */}
            <section className="form-section">
              <h2>Informations générales</h2>

              <div className="form-group">
                <label htmlFor="taskName">Nom de la tâche *</label>
                <input
                  type="text"
                  id="taskName"
                  name="taskName"
                  value={formData.taskName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="Duration">Durée</label>
                <input
                  type="text"
                  id="Duration"
                  name="Duration"
                  value={formData.Duration}
                  onChange={handleChange}
                  placeholder="ex: 5 jours"
                />
              </div>

              <div className="form-group">
                <label htmlFor="dueDate">Date d'échéance</label>
                <input
                  type="date"
                  id="dueDate"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="owner">Propriétaire</label>
                <select
                  id="owner"
                  name="owner"
                  value={formData.owner}
                  onChange={handleChange}
                >
                  <option value="">Sélectionner un propriétaire</option>
                  {accounts?.map((account) => (
                    <option key={account._id} value={account._id}>
                      {account.accountName} ({account.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="assignedTo">Assigné à</label>
                <select
                  id="assignedTo"
                  name="assignedTo"
                  value={formData.assignedTo}
                  onChange={handleChange}
                >
                  <option value="">Non assigné</option>
                  {accounts?.map((account) => (
                    <option key={account._id} value={account._id}>
                      {account.accountName} ({account.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Champ Progression */}
              <div className="form-group">
                <label htmlFor="progressPercentage">Progression (%)</label>
                <input
                  type="number"
                  id="progressPercentage"
                  name="progressPercentage"
                  min="0"
                  max="100"
                  value={progressPercentage}
                  onChange={(e) => setProgressPercentage(e.target.value)}
                  placeholder="0-100"
                />
                <small>Laissez vide pour ne pas modifier la progression</small>
              </div>
            </section>

            {/* Description et Problème */}
            <section className="form-section">
              <h2>Description</h2>
              <div className="form-group">
                <textarea
                  id="Description"
                  name="Description"
                  value={formData.Description}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Description de la tâche..."
                />
              </div>

              <h2>Note / Problème</h2>
              <div className="form-group">
                <textarea
                  id="Problem"
                  name="Problem"
                  value={formData.Problem}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Note ou problème spécifique..."
                />
              </div>
            </section>

            {/* Site Web */}
            <section className="form-section">
              <h2>Site Web</h2>
              <div className="env-section">
                <h3>Development</h3>
                <div className="form-group">
                  <label htmlFor="site-dev-url">URL</label>
                  <input
                    type="url"
                    id="site-dev-url"
                    value={formData.Site.dev.url}
                    onChange={(e) =>
                      handleNestedChange("Site", "dev", "url", e.target.value)
                    }
                    placeholder="https://dev.example.com"
                  />
                </div>
              </div>
              <div className="env-section">
                <h3>Official</h3>
                <div className="form-group">
                  <label htmlFor="site-official-url">URL</label>
                  <input
                    type="url"
                    id="site-official-url"
                    value={formData.Site.official.url}
                    onChange={(e) =>
                      handleNestedChange(
                        "Site",
                        "official",
                        "url",
                        e.target.value,
                      )
                    }
                    placeholder="https://example.com"
                  />
                </div>
              </div>
            </section>

            {/* Application (APK) */}
            <section className="form-section">
              <h2>Application (APK)</h2>
              <div className="env-section">
                <h3>Snapshot (Dev)</h3>
                <div className="form-group">
                  <label htmlFor="apk-dev-url">URL APK</label>
                  <input
                    type="url"
                    id="apk-dev-url"
                    value={formData.Apk.dev.url}
                    onChange={(e) =>
                      handleNestedChange("Apk", "dev", "url", e.target.value)
                    }
                    placeholder="https://..."
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="apk-dev-version">Version</label>
                  <input
                    type="text"
                    id="apk-dev-version"
                    value={formData.Apk.dev.version}
                    onChange={(e) =>
                      handleNestedChange(
                        "Apk",
                        "dev",
                        "version",
                        e.target.value,
                      )
                    }
                    placeholder="ex: v1.0.0"
                  />
                </div>
              </div>
              <div className="env-section">
                <h3>Release (Official)</h3>
                <div className="form-group">
                  <label htmlFor="apk-official-url">URL APK</label>
                  <input
                    type="url"
                    id="apk-official-url"
                    value={formData.Apk.official.url}
                    onChange={(e) =>
                      handleNestedChange(
                        "Apk",
                        "official",
                        "url",
                        e.target.value,
                      )
                    }
                    placeholder="https://..."
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="apk-official-version">Version</label>
                  <input
                    type="text"
                    id="apk-official-version"
                    value={formData.Apk.official.version}
                    onChange={(e) =>
                      handleNestedChange(
                        "Apk",
                        "official",
                        "version",
                        e.target.value,
                      )
                    }
                    placeholder="ex: v1.0.0"
                  />
                </div>
              </div>
            </section>

            {/* Backend */}
            <section className="form-section">
              <h2>Backend</h2>
              <div className="env-section">
                <h3>Development</h3>
                <div className="form-group">
                  <label htmlFor="backend-dev-url">API URL</label>
                  <input
                    type="url"
                    id="backend-dev-url"
                    value={formData.Backend.dev.url}
                    onChange={(e) =>
                      handleNestedChange(
                        "Backend",
                        "dev",
                        "url",
                        e.target.value,
                      )
                    }
                    placeholder="https://api-dev.example.com"
                  />
                </div>
              </div>
              <div className="env-section">
                <h3>Production</h3>
                <div className="form-group">
                  <label htmlFor="backend-official-url">API URL</label>
                  <input
                    type="url"
                    id="backend-official-url"
                    value={formData.Backend.official.url}
                    onChange={(e) =>
                      handleNestedChange(
                        "Backend",
                        "official",
                        "url",
                        e.target.value,
                      )
                    }
                    placeholder="https://api.example.com"
                  />
                </div>
              </div>
            </section>

            {/* Boutons */}
            <div className="form-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => navigate(`/task/${id}`)}
              >
                Annuler
              </button>
              <button type="submit" className="btn-save" disabled={loading}>
                {loading
                  ? "Enregistrement..."
                  : "Enregistrer les modifications"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
};

export default Modiftask;
