import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from "react";
import Cookies from "js-cookie";
import Login from "./pages/Login/Login";
import Home from "./pages/Home/Home";
import Aide from "./pages/Aide/Aide";
import Calendrier from "./pages/Calendrier/Calendrier";
import Contact from "./pages/Contact/Contact";
import Documents from "./pages/Documents/Documents";
import Images from "./pages/Images/Images";
import Notif from "./pages/Notif/Notifications";
import Previsions from "./pages/Previsions/Previsions";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import AddDocuments from "./pages/addDocuments/AddDocuments";
import AddPage from "./pages/addPage/AddPages";
import AddImages from "./pages/addImages/AddImages";
import AddProfile from "./pages/addProfile/AddProfile";
import AddRepport from "./pages/addRepport/AddRepport";
import AddTask from "./pages/addTask/AddTask";
import AddToDo from "./pages/addToDo/AddToDo";
import ModifDocuments from "./pages/modifieDocuments/modifDocuments";
import ModifImages from "./pages/modifieImages/modifImages";
import ModifProfile from "./pages/modifieProfile/modifProfile";
import ModifTask from "./pages/modifieTask/modifTask";
import ModifToDo from "./pages/modifieToDo/modifToDo";

import { AuthProvider } from "./contexts/AuthContext";

function App() {
  // ✅ Chercher le token dans Cookie OU localStorage
  const [token, setToken] = useState(
    Cookies.get("userToken") || localStorage.getItem("token") || null,
  );
  const [user, setUserData] = useState(
    JSON.parse(localStorage.getItem("user")) || null,
  );

  const setUser = (tokenValue, userData = null) => {
    if (tokenValue) {
      // ✅ Connexion - stocker dans Cookie ET localStorage
      Cookies.set("userToken", tokenValue, { expires: 30 });
      localStorage.setItem("token", tokenValue);
      localStorage.setItem("user", JSON.stringify(userData));
      setToken(tokenValue);
      setUserData(userData);
    } else {
      // ✅ Déconnexion - tout supprimer
      Cookies.remove("userToken");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      sessionStorage.clear();
      setToken(null);
      setUserData(null);
    }
  };

  return (
    <>
      <BrowserRouter>
        <AuthProvider setUser={setUser}>
          <Routes>
            <Route path="/login" element={<Login setUser={setUser} />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />
            <Route
              path="/aide"
              element={
                <ProtectedRoute>
                  <Aide />
                </ProtectedRoute>
              }
            />
            <Route
              path="/calendrier"
              element={
                <ProtectedRoute>
                  <Calendrier />
                </ProtectedRoute>
              }
            />
            <Route
              path="/contact"
              element={
                <ProtectedRoute>
                  <Contact />
                </ProtectedRoute>
              }
            />
            <Route
              path="/documents"
              element={
                <ProtectedRoute>
                  <Documents />
                </ProtectedRoute>
              }
            />
            <Route
              path="/images"
              element={
                <ProtectedRoute>
                  <Images />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <Notif />
                </ProtectedRoute>
              }
            />
            <Route
              path="/previsions"
              element={
                <ProtectedRoute>
                  <Previsions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/addDocuments"
              element={
                <ProtectedRoute>
                  <AddDocuments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/addImages"
              element={
                <ProtectedRoute>
                  <AddImages />
                </ProtectedRoute>
              }
            />
            <Route
              path="/addProfile"
              element={
                <ProtectedRoute>
                  <AddProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/addPage"
              element={
                <ProtectedRoute>
                  <AddPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/addRepport"
              element={
                <ProtectedRoute>
                  <AddRepport />
                </ProtectedRoute>
              }
            />
            <Route
              path="/addTask"
              element={
                <ProtectedRoute>
                  <AddTask />
                </ProtectedRoute>
              }
            />
            <Route
              path="/addToDo"
              element={
                <ProtectedRoute>
                  <AddToDo />
                </ProtectedRoute>
              }
            />
            <Route
              path="/modifieDocuments"
              element={
                <ProtectedRoute>
                  <ModifDocuments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/modifieImages"
              element={
                <ProtectedRoute>
                  <ModifImages />
                </ProtectedRoute>
              }
            />
            <Route
              path="/modifieProfile"
              element={
                <ProtectedRoute>
                  <ModifProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/modifieTask"
              element={
                <ProtectedRoute>
                  <ModifTask />
                </ProtectedRoute>
              }
            />
            <Route
              path="/modifieToDo"
              element={
                <ProtectedRoute>
                  <ModifToDo />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </>
  );
}

export default App;
