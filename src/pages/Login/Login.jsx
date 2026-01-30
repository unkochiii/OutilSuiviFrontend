import "./login.css";
import handleChange from "../../assets/utils/handleChange";
import { useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import Logo from "../../assets/Logo.png";

const Login = ({ setUser }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    // 🔍 DEBUG
    console.log("=== TENTATIVE DE CONNEXION ===");
    console.log("Email saisi:", email);
    console.log("Password length:", password.length);
    console.log("Password value:", password); // À retirer en prod !

    // Validation frontend
    if (!email || !password) {
      console.log("❌ Validation échouée: champs vides");
      setErrorMessage("Email et mot de passe requis");
      return;
    }

    if (email.length < 3) {
      console.log("❌ Validation échouée: email trop court");
      setErrorMessage("Format d'email invalide");
      return;
    }

    if (password.length < 6) {
      console.log("❌ Validation échouée: password trop court");
      setErrorMessage("Mot de passe trop court (minimum 6 caractères)");
      return;
    }

    setIsLoading(true);
    console.log("✅ Validation OK, envoi de la requête...");

    try {
      const url = "https://site--outilbackend--fp64tcf5fhqm.code.run/login";
      const payload = { email, password };

      console.log("🌐 URL:", url);
      console.log("📦 Payload:", JSON.stringify(payload));

      const response = await axios.post(url, payload, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("✅ Réponse reçue:");
      console.log("Status:", response.status);
      console.log("Data:", response.data);

      if (response.data.success) {
        const { token, user } = response.data;

        console.log("✅ Login réussi !");
        console.log("Token reçu:", token?.substring(0, 30) + "...");
        console.log("User reçu:", user);

        // Stocker le token
        setUser(token, user);

        console.log("✅ Token stocké, redirection...");

        if (location.state?.from) {
          navigate(location.state.from);
        } else {
          navigate("/");
        }
      } else {
        console.log("❌ Réponse success: false");
        setErrorMessage("Une erreur inattendue est survenue");
      }
    } catch (error) {
      console.log("❌ ERREUR CATCH :");
      console.log("Error message:", error.message);
      console.log("Error response:", error.response);
      console.log("Error response status:", error.response?.status);
      console.log("Error response data:", error.response?.data);
      console.log("Error config:", error.config);

      if (error.response?.data?.error) {
        setErrorMessage(error.response.data.error);
      } else if (error.response?.status === 401) {
        setErrorMessage("Email ou mot de passe incorrect");
      } else {
        setErrorMessage("Erreur serveur interne");
      }
    } finally {
      setIsLoading(false);
      console.log("=== FIN TENTATIVE ===");
    }
  };

  return (
    <main className="mainn">
      <div className="container login">
        <img src={Logo} alt="logo" />
        <h1>Bienvenue !</h1>
        {errorMessage && <p className="error">{errorMessage}</p>}
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            id="email"
            value={email}
            placeholder="Email"
            onChange={(event) => handleChange(event, setEmail)}
            required
          />
          <input
            type="password"
            id="password"
            value={password}
            placeholder="Mot de passe"
            onChange={(event) => handleChange(event, setPassword)}
            required
          />
          <button className="sub" type="submit" disabled={isLoading}>
            {isLoading ? "Connexion en cours..." : "Se connecter"}
          </button>
        </form>
      </div>
    </main>
  );
};

export default Login;
