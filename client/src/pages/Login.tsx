import { useState } from "react";
import type { FormEvent } from "react";

import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import BrandLogo from "../components/BrandLogo";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await login(email, password);
      if (user.role === "ADMIN") {
        navigate("/admin/dashboard");
      } else {
        navigate("/voter/dashboard");
      }
    } catch (error: any) {
      setError(
        error?.response?.data?.message ??
          "Unable to reach the server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          background-image: url("/cpsu.jpg");
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          position: relative;
        }
        .login-page::before {
          content: "";
          position: absolute;
          inset: 0;
          background-color: rgba(15, 23, 42, 0.55);
        }
        .login-card {
          width: 100%;
          max-width: 420px;
          background-color: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 1rem;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.08);
          overflow: hidden;
          position: relative;
          z-index: 10;
        }
        .login-accent-bar {
          height: 4px;
          background-color: #0d9488;
          width: 100%;
        }
        .login-body {
          padding: 2.5rem 2rem 2rem;
        }
        .login-header {
          text-align: center;
          margin-bottom: 2rem;
        }
        .login-header .brand-wrap {
          display: flex;
          justify-content: center;
          margin-bottom: 1.25rem;
        }
        .login-header p {
          color: #64748b;
          font-size: 0.95rem;
          font-weight: 500;
          margin: 0;
          letter-spacing: 0.01em;
        }
        .login-error {
          background-color: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          margin-bottom: 1.25rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .login-error::before {
          content: "⚠";
          font-size: 1rem;
        }
        .field-group {
          margin-bottom: 1rem;
          position: relative;
        }
        .field-group label {
          display: block;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #334155;
          margin-bottom: 0.375rem;
          letter-spacing: 0.01em;
        }
        .field-input {
          width: 100%;
          padding: 0.75rem 1rem;
          font-size: 0.9375rem;
          color: #0f172a;
          background-color: #ffffff;
          border: 1.5px solid #cbd5e1;
          border-radius: 0.625rem;
          outline: none;
          transition: all 0.2s ease;
          box-sizing: border-box;
        }
        .field-input::placeholder {
          color: #94a3b8;
        }
        .field-input:hover {
          border-color: #94a3b8;
        }
        .field-input:focus {
          border-color: #0d9488;
          background-color: #f0fdfa;
          box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.08);
        }
        .password-field {
          position: relative;
        }
        .password-field .field-input {
          padding-right: 2.75rem;
        }
        .eye-toggle {
          position: absolute;
          right: 0.625rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.375rem;
          color: #94a3b8;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 0.375rem;
          transition: all 0.2s ease;
        }
        .eye-toggle:hover {
          color: #0d9488;
          background-color: #f0fdfa;
        }
        .btn-primary {
          width: 100%;
          padding: 0.875rem;
          margin-top: 0.5rem;
          border: none;
          border-radius: 0.625rem;
          background-color: #0d9488;
          color: #ffffff;
          font-size: 0.9375rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }
        .btn-primary:hover {
          background-color: #0f766e;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(13, 148, 136, 0.2);
        }
        .btn-primary:active {
          transform: translateY(0);
        }
        .btn-primary:disabled {
          background-color: #99f6e4;
          color: #0f766e;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
        .btn-secondary {
          width: 100%;
          padding: 0.875rem;
          margin-top: 0.75rem;
          border: 1.5px solid #ccfbf1;
          border-radius: 0.625rem;
          background-color: #f0fdfa;
          color: #0f766e;
          font-size: 0.9375rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-secondary:hover {
          background-color: #ccfbf1;
          border-color: #99f6e4;
        }
        .spinner {
          width: 1rem;
          height: 1rem;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .divider {
          display: flex;
          align-items: center;
          margin: 1.25rem 0;
          color: #94a3b8;
          font-size: 0.8125rem;
        }
        .divider::before,
        .divider::after {
          content: "";
          flex: 1;
          height: 1px;
          background-color: #e2e8f0;
        }
        .divider span {
          padding: 0 0.75rem;
        }
      `}</style>

      <div className="login-page">
        <div className="login-card">
          <div className="login-accent-bar" />

          <div className="login-body">
            <div className="login-header">
              <div className="brand-wrap">
                <BrandLogo />
              </div>
              <p>Sign in to continue</p>
            </div>

            {error && <div className="login-error">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="field-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  className="field-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="field-group">
                <label htmlFor="password">Password</label>
                <div className="password-field">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    className="field-input"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="eye-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12z" />
                        <circle cx="12" cy="12" r="3" />
                        <path d="m2 2 20 20" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </button>

              <div className="divider">
                <span>or</span>
              </div>

              <button
                type="button"
                className="btn-secondary"
                onClick={() => navigate("/register")}
              >
                Create Account
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}