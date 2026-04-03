import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [strength, setStrength] = useState(0);
  const navigate = useNavigate();

  // Password strength logic
  useEffect(() => {
    let score = 0;
    if (!password) {
      setStrength(0);
      return;
    }
    if (password.length < 6) {
      score = 1; // Weak
    } else {
      score = 2; // Fair
      if (password.length >= 8 && /\d/.test(password)) {
        score = 3; // Good
        if (password.length >= 10 && /[^A-Za-z0-9]/.test(password)) {
          score = 4; // Strong
        }
      }
    }
    setStrength(score);
  }, [password]);

  const getStrengthColor = (index) => {
    if (index >= strength) return "#374151"; // Default gray
    if (strength === 1) return "#ef4444"; // Red
    if (strength === 2) return "#f59e0b"; // Amber
    if (strength === 3) return "#3b82f6"; // Blue
    if (strength === 4) return "#22c55e"; // Green
    return "#374151";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5001/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Registration failed");
        return;
      }
      if (data.token) {
        localStorage.setItem("token", data.token);
        navigate("/topics"); // Standard flow after register
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }
  };

  return (
    <div className="register-container">
      <style>{`
        :root {
          --bg-card: #111214;
          --bg-input: #1a1d21;
          --border: #2a2d32;
          --text-primary: #ffffff;
          --text-secondary: #9CA3AF;
          --input-placeholder: #555a63;
          --text-muted: #555a63;
          --strength-bg: #2a2d32;
        }

        [data-theme="light"] {
          --bg-card: #ffffff;
          --bg-input: #f0f1f4;
          --border: #e2e4ea;
          --text-primary: #0d0f14;
          --text-secondary: #9ca3af;
          --input-placeholder: #9ca3af;
          --text-muted: #9ca3af;
          --strength-bg: #e2e4ea;
        }

        .register-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg);
          font-family: 'Inter', system-ui, sans-serif;
          padding: 20px;
        }
        .register-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 40px 36px;
          width: 100%;
          max-width: 400px;
          backdrop-filter: blur(12px);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }
        .logo-section {
          text-align: center;
          margin-bottom: 24px;
        }
        .logo {
          font-size: 28px;
          margin-bottom: 8px;
          display: block;
        }
        .wordmark {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          color: var(--text-primary);
          font-size: 1.5rem;
          letter-spacing: -0.02em;
        }
        .heading {
          font-size: 22px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 4px 0;
          text-align: center;
        }
        .subtitle {
          font-size: 13px;
          color: var(--text-secondary);
          margin: 0 0 32px 0;
          text-align: center;
        }
        .form-group {
          margin-bottom: 20px;
          position: relative;
        }
        .input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          pointer-events: none;
        }
        .form-input {
          width: 100%;
          padding: 12px 14px 12px 40px;
          background: var(--bg-input);
          border: 1px solid var(--border);
          border-radius: 10px;
          color: var(--text-primary);
          font-size: 14px;
          transition: all 0.2s ease;
        }
        .form-input::placeholder {
          color: var(--input-placeholder);
        }
        .form-input:focus {
          border-color: #7C3AED;
          box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.15);
          outline: none;
        }
        .strength-meter {
          display: flex;
          gap: 4px;
          margin-top: 8px;
          height: 3px;
        }
        .strength-bar {
          flex: 1;
          height: 100%;
          border-radius: 2px;
          transition: background 0.3s ease;
          background: var(--strength-bg);
        }
        .submit-btn {
          width: 100%;
          padding: 13px;
          background: linear-gradient(90deg, #7C3AED, #a855f7);
          border: none;
          border-radius: 10px;
          color: #fff;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-top: 12px;
        }
        .submit-btn:hover {
          opacity: 0.92;
          transform: translateY(-1px);
          box-shadow: 0 10px 15px -3px rgba(124, 58, 237, 0.3);
        }
        .submit-btn:active {
          transform: scale(0.98);
        }
        .footer-text {
          font-size: 13px;
          text-align: center;
          margin-top: 24px;
          color: var(--text-secondary);
        }
        .login-link {
          color: #a855f7;
          text-decoration: none;
          font-weight: 600;
          transition: color 0.2s;
        }
        .login-link:hover {
          color: #7C3AED;
        }
      `}</style>

      <div className="register-card">
        <div className="logo-section">
          <span className="logo">⚡</span>
          <span className="wordmark">QuizEngine</span>
        </div>

        <h2 className="heading">Create account</h2>
        <p className="subtitle">Join and start learning today</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <div className="input-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            </div>
            <input
              className="form-input"
              type="text"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <div className="input-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
            </div>
            <input
              className="form-input"
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <div className="input-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            </div>
            <input
              className="form-input"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div className="strength-meter">
              {[0, 1, 2, 3].map((i) => (
                <div 
                  key={i} 
                  className="strength-bar" 
                  style={{ background: getStrengthColor(i) }}
                />
              ))}
            </div>
          </div>

          <button className="submit-btn" type="submit">
            Create account →
          </button>
        </form>

        <p className="footer-text">
          Already have an account? <Link to="/login" className="login-link">Log in</Link>
        </p>
      </div>
    </div>
  );
}
