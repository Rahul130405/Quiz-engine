import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/UI/Navbar";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import TopicsPage from "./pages/TopicsPage";
import QuizPage from "./pages/QuizPage";
import ResultsPage from "./pages/ResultsPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import HistoryPage from "./pages/HistoryPage";
import "./styles/global.css";

// Route guard — redirects to /login if not authenticated
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="spinner" style={{ marginTop: "4rem" }} />;
  return user ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <div className="app-shell">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/"           element={<HomePage />} />
          <Route path="/login"      element={user ? <Navigate to="/topics" /> : <LoginPage />} />
          <Route path="/register"   element={user ? <Navigate to="/topics" /> : <RegisterPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/topics"     element={<PrivateRoute><TopicsPage /></PrivateRoute>} />
          <Route path="/quiz/:topicId" element={<PrivateRoute><QuizPage /></PrivateRoute>} />
          <Route path="/results"    element={<PrivateRoute><ResultsPage /></PrivateRoute>} />
          <Route path="/leaderboard" element={<PrivateRoute><LeaderboardPage /></PrivateRoute>} />
          <Route path="/history"    element={<PrivateRoute><HistoryPage /></PrivateRoute>} />
          <Route path="*"           element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  // Theme persistence
  const [theme, setTheme] = useState(() => localStorage.getItem("qe_theme") || "dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("qe_theme", theme);
  }, [theme]);

  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        {/* Theme toggle — floating */}
        <button
          onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
          style={{
            position: "fixed", bottom: "1.5rem", right: "1.5rem",
            background: "var(--bg-2)", border: "1px solid var(--border)",
            borderRadius: "50%", width: 44, height: 44,
            fontSize: "1.2rem", display: "flex", alignItems: "center",
            justifyContent: "center", zIndex: 999,
            boxShadow: "var(--shadow)", cursor: "pointer",
            transition: "var(--transition)",
          }}
          title="Toggle theme"
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </button>
      </AuthProvider>
    </BrowserRouter>
  );
}
