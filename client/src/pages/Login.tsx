import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth-context";
import BrandLogo from "../components/BrandLogo";

const EyeOnIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m5 12 4 4L19 6" />
  </svg>
);

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
      navigate(user.role === "ADMIN" ? "/admin/dashboard" : "/voter/dashboard");
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message ?? "Unable to reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const isReview = error.toLowerCase().includes("being reviewed");

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <aside className="auth-showcase" aria-label="CPSU E-Voting information">
          <div className="auth-showcase-brand">
            <span className="brand-mark"><BrandLogo /></span>
            <span>
              <strong>CPSU E-Voting</strong>
              <span>Central Philippine State University</span>
            </span>
          </div>

          <div className="auth-showcase-copy">
            <p className="auth-kicker">A better way to participate</p>
            <h2>Your voice has a place here.</h2>
            <p>Take part in campus decisions through a voting experience built to be clear, secure, and accessible from anywhere.</p>
            <ul className="auth-feature-list">
              <li><span><CheckIcon /></span> One verified account, one trusted ballot</li>
              <li><span><CheckIcon /></span> Private and anonymous by design</li>
              <li><span><CheckIcon /></span> Transparent results for the CPSU community</li>
            </ul>
          </div>

          <div className="auth-showcase-footer">
            <span><strong>Secure.</strong> Accessible. Transparent.</span>
            <span>Est. 1946</span>
          </div>
        </aside>

        <section className="auth-card" role="main">
          <div className="auth-accent" />
          <div className="auth-body">
            <div className="auth-logo-wrap">
              <div className="logo-ring"><BrandLogo /></div>
              <h1>Welcome back</h1>
              <p>Sign in to your voter account</p>
            </div>

            {error && (
              <div className={`auth-error${isReview ? " auth-warning" : ""}`} role="alert">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="field-group">
                <label htmlFor="email" className="field-label">Email address</label>
                <input id="email" type="email" className="field-input" placeholder="you@cpsu.edu.ph" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
              </div>

              <div className="field-group">
                <label htmlFor="password" className="field-label">Password</label>
                <div className="password-wrap">
                  <input id="password" type={showPassword ? "text" : "password"} className="field-input" placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required />
                  <button type="button" className="eye-btn" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"}>
                    {showPassword ? <EyeOffIcon /> : <EyeOnIcon />}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-primary" id="login-submit-btn" disabled={loading}>
                {loading ? <><span className="spinner" /> Signing in...</> : "Sign in"}
              </button>
            </form>

            <div className="auth-divider"><span>New to CPSU E-Voting?</span></div>
            <button type="button" className="btn-secondary" id="go-register-btn" onClick={() => navigate("/register")}>Create an account</button>
            <p className="auth-card-note" style={{ margin: "18px 0 0", color: "#9aa9b7", fontSize: ".72rem", textAlign: "center" }}>
              Your vote is encrypted and cannot be linked back to you.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
