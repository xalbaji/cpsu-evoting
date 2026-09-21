import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import BrandLogo from "../components/BrandLogo";
import { CPSU_MAIN_COURSES } from "../lib/courses";

const EyeOnIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg>
);

const YEAR_LEVELS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ studentId: "", firstName: "", middleInitial: "", lastName: "", suffix: "", email: "", password: "", confirmPassword: "", course: "", yearLevel: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (field: keyof typeof form) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) return setError("Passwords do not match.");
    if (form.password.length < 8) return setError("Password must be at least 8 characters.");

    setLoading(true);
    try {
      await api.post("/auth/register", { studentId: form.studentId, firstName: form.firstName, middleInitial: form.middleInitial, lastName: form.lastName, suffix: form.suffix, email: form.email, password: form.password, course: form.course, yearLevel: form.yearLevel });
      navigate("/login");
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message ?? "Unable to reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <aside className="auth-showcase" aria-label="CPSU E-Voting information">
          <div className="auth-showcase-brand">
            <span className="brand-mark"><BrandLogo /></span>
            <span><strong>CPSU E-Voting</strong><span>Central Philippine State University</span></span>
          </div>

          <div className="auth-showcase-copy">
            <p className="auth-kicker">Join the conversation</p>
            <h2>Make your vote count.</h2>
            <p>Set up your verified student account once, then take part in every election you are eligible for.</p>
            <ul className="auth-feature-list">
              <li><span><CheckIcon /></span> Simple registration for CPSU students</li>
              <li><span><CheckIcon /></span> Account verification protects every election</li>
              <li><span><CheckIcon /></span> A clear record of your participation</li>
            </ul>
          </div>

          <div className="auth-showcase-footer"><span><strong>Secure.</strong> Accessible. Transparent.</span><span>Est. 1946</span></div>
        </aside>

        <section className="auth-card" role="main">
          <div className="auth-accent" />
          <div className="auth-body">
            <div className="auth-logo-wrap">
              <div className="logo-ring"><BrandLogo /></div>
              <h1>Create your account</h1>
              <p>Register as a CPSU voter</p>
            </div>

            {error && (
              <div className="auth-error" role="alert">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="reg-grid">
              <div className="field-group" style={{ marginBottom: 0 }}>
                <label htmlFor="studentId" className="field-label">Student ID</label>
                <input id="studentId" type="text" className="field-input" placeholder="e.g. 2021-00001" value={form.studentId} onChange={set("studentId")} autoComplete="off" required />
              </div>

              <div className="reg-grid reg-grid-3" style={{ gap: "12px" }}>
                <div className="field-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="firstName" className="field-label">First name</label>
                  <input id="firstName" type="text" className="field-input" placeholder="Jimuel" value={form.firstName} onChange={set("firstName")} autoComplete="given-name" required />
                </div>
                <div className="field-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="middleInitial" className="field-label">M.I.</label>
                  <input id="middleInitial" type="text" className="field-input" placeholder="S." value={form.middleInitial} onChange={set("middleInitial")} maxLength={2} autoComplete="additional-name" style={{ textTransform: "uppercase" }} />
                </div>
                <div className="field-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="lastName" className="field-label">Last name</label>
                  <input id="lastName" type="text" className="field-input" placeholder="Sapansa" value={form.lastName} onChange={set("lastName")} autoComplete="family-name" required />
                </div>
              </div>

              <div className="field-group" style={{ marginBottom: 0 }}>
                <label htmlFor="suffix" className="field-label">Suffix <span style={{ fontWeight: 400, color: "#9aa9b7" }}>(optional)</span></label>
                <select id="suffix" className="field-input" value={form.suffix} onChange={set("suffix")} style={{ appearance: "none", cursor: "pointer" }}>
                  <option value="">None</option>
                  <option value="Jr.">Jr. (Junior)</option>
                  <option value="Sr.">Sr. (Senior)</option>
                  <option value="II">II</option>
                  <option value="III">III</option>
                  <option value="IV">IV</option>
                  <option value="V">V</option>
                </select>
              </div>

              <div className="field-group" style={{ marginBottom: 0 }}>
                <label htmlFor="reg-email" className="field-label">Email address</label>
                <input id="reg-email" type="email" className="field-input" placeholder="you@cpsu.edu.ph" value={form.email} onChange={set("email")} autoComplete="email" required />
              </div>

              <div className="reg-grid reg-grid-2" style={{ gap: "12px" }}>
                <div className="field-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="course" className="field-label">Course / program</label>
                  <select id="course" className="field-input" value={form.course} onChange={set("course")} style={{ appearance: "none", cursor: "pointer" }} required>
                    <option value="">Select course</option>
                    {CPSU_MAIN_COURSES.map((course) => (
                      <option key={course.code} value={course.code}>{course.code} — {course.name}</option>
                    ))}
                  </select>
                </div>
                <div className="field-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="yearLevel" className="field-label">Year level</label>
                  <select id="yearLevel" className="field-input" value={form.yearLevel} onChange={set("yearLevel")} style={{ appearance: "none", cursor: "pointer" }}>
                    <option value="">Select year</option>
                    {YEAR_LEVELS.map((year) => <option key={year} value={year}>{year}</option>)}
                  </select>
                </div>
              </div>

              <div className="reg-grid reg-grid-2" style={{ gap: "12px" }}>
                <div className="field-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="reg-password" className="field-label">Password</label>
                  <div className="password-wrap">
                    <input id="reg-password" type={showPassword ? "text" : "password"} className="field-input" placeholder="Min. 8 characters" value={form.password} onChange={set("password")} autoComplete="new-password" minLength={8} required />
                    <button type="button" className="eye-btn" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOffIcon /> : <EyeOnIcon />}</button>
                  </div>
                </div>
                <div className="field-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="confirmPassword" className="field-label">Confirm password</label>
                  <div className="password-wrap">
                    <input id="confirmPassword" type={showConfirm ? "text" : "password"} className="field-input" placeholder="Repeat password" value={form.confirmPassword} onChange={set("confirmPassword")} autoComplete="new-password" required />
                    <button type="button" className="eye-btn" onClick={() => setShowConfirm((visible) => !visible)} aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}>{showConfirm ? <EyeOffIcon /> : <EyeOnIcon />}</button>
                  </div>
                </div>
              </div>

              <button type="submit" className="btn-primary" id="register-submit-btn" disabled={loading}>
                {loading ? <><span className="spinner" /> Creating account...</> : "Create account"}
              </button>
            </form>

            <div className="auth-divider"><span>Already registered?</span></div>
            <button type="button" className="btn-secondary" id="go-login-btn" onClick={() => navigate("/login")}>Sign in to existing account</button>
            <p className="auth-card-note" style={{ margin: "16px 0 0", color: "#9aa9b7", fontSize: ".7rem", lineHeight: 1.5, textAlign: "center" }}>
              Your account will require administrator verification before you can vote.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
