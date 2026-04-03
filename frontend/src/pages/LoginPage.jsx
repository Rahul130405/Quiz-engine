import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function AuthForm({ mode }) {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm]     = useState({ name: "", email: "", password: "" });
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const isLogin = mode === "login";

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isLogin) {
        await login(form.email, form.password);
      } else {
        await register(form.name, form.email, form.password);
      }
      navigate("/topics");
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in" style={{ maxWidth: 440, margin: "3rem auto" }}>
      <div className="card" style={{ padding: "2.5rem" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>⚡</div>
          <h1 style={{ fontSize: "1.75rem", marginBottom: "0.4rem" }}>
            {isLogin ? "Welcome back" : "Create account"}
          </h1>
          <p style={{ color: "var(--text-2)", fontSize: "0.9rem" }}>
            {isLogin ? "Sign in to continue your learning journey" : "Start quizzing in under a minute"}
          </p>
        </div>

        {error && (
          <div style={{
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
            borderRadius: "var(--radius-sm)", padding: "0.75rem 1rem",
            color: "var(--error)", fontSize: "0.9rem", marginBottom: "1.25rem",
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {!isLogin && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                className="form-input"
                name="name" type="text"
                placeholder="Ada Lovelace"
                value={form.name}
                onChange={handleChange}
                required minLength={2}
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="form-input"
              name="email" type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label className="form-label">Password</label>
              {isLogin && (
                <Link to="/reset-password" style={{ fontSize: "0.82rem", color: "var(--accent)" }}>
                  Forgot password?
                </Link>
              )}
            </div>
            <input
              className="form-input"
              name="password" type="password"
              placeholder={isLogin ? "Your password" : "Min. 6 characters"}
              value={form.password}
              onChange={handleChange}
              required minLength={6}
            />
          </div>

          {isLogin && (
            <p style={{ fontSize: "0.82rem", color: "var(--text-3)" }}>
              Demo: demo@quizengine.dev / demo1234
            </p>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ marginTop: "0.5rem", justifyContent: "center", padding: "0.85rem" }}
          >
            {loading ? "Please wait…" : isLogin ? "Sign In" : "Create Account"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "1.5rem", color: "var(--text-2)", fontSize: "0.9rem" }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <Link
            to={isLogin ? "/register" : "/login"}
            style={{ color: "var(--accent)", fontWeight: 600 }}
          >
            {isLogin ? "Sign up" : "Sign in"}
          </Link>
        </p>
      </div>
    </div>
  );
}

export function LoginPage()    { return <AuthForm mode="login" />; }
export function RegisterPage() { return <AuthForm mode="register" />; }
export default LoginPage;
