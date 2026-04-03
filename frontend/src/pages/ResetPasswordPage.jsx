import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../utils/api";

function ResetPasswordPage() {
  const [step, setStep] = useState(1); // 1: Email, 2: New Password
  const [email, setEmail] = useState("");
  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/forgot-password", { email });
      setMessage(res.data.message);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || "User not found.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) {
      return setError("Passwords do not match");
    }
    if (form.password.length < 6) {
      return setError("Password must be at least 6 characters");
    }
    
    setLoading(true);
    try {
      const res = await api.post("/auth/reset-password", { email, password: form.password });
      setMessage(res.data.message);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in" style={{ maxWidth: 440, margin: "3rem auto" }}>
      <div className="card" style={{ padding: "2.5rem" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🔑</div>
          <h1 style={{ fontSize: "1.75rem", marginBottom: "0.4rem" }}>
            {step === 1 ? "Forgot Password" : "Reset Password"}
          </h1>
          <p style={{ color: "var(--text-2)", fontSize: "0.9rem" }}>
            {step === 1 
              ? "Enter your email to find your account" 
              : "Set a new password for your account"}
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

        {message && !error && (
          <div style={{
            background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)",
            borderRadius: "var(--radius-sm)", padding: "0.75rem 1rem",
            color: "var(--success)", fontSize: "0.9rem", marginBottom: "1.25rem",
          }}>
            {message}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleEmailSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: "0.85rem" }}>
              {loading ? "Verifying..." : "Verify Email"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                className="form-input"
                type="password"
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input
                className="form-input"
                type="password"
                placeholder="Confirm password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: "0.85rem" }}>
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}

        <p style={{ textAlign: "center", marginTop: "1.5rem", color: "var(--text-2)", fontSize: "0.9rem" }}>
          Remembered your password?{" "}
          <Link to="/login" style={{ color: "var(--accent)", fontWeight: 600 }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default ResetPasswordPage;
