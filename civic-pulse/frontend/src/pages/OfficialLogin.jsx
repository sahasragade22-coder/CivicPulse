import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { api } from "../api/api";

const OFFICIAL_DOMAIN = "@ghmc.gov.in";

export default function OfficialLogin({ user, onLogin }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to={user.role === "official" ? "/official-actions" : "/raise-complaint"} replace />;

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (!form.email.toLowerCase().endsWith(OFFICIAL_DOMAIN)) {
      setError(`Officials must use an email ending with ${OFFICIAL_DOMAIN}`);
      return;
    }
    setLoading(true);
    try {
      const account =
        mode === "signup"
          ? await api.signup({ ...form, role: "official" })
          : await api.officialLogin({ email: form.email, password: form.password });
      onLogin(account);
      navigate("/official-actions", { replace: true });
    } catch (err) {
      setError(mode === "signup" ? "Could not create official account." : "Invalid official login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-panel">
        <div className="auth-brand">
          <span className="brand-icon">CP</span>
          <div>
            <h1>Official Portal</h1>
            <p>Use your GHMC email to review and resolve complaints.</p>
          </div>
        </div>
        <div className="auth-tabs">
          <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>Official Login</button>
          <button className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")}>Create Official</button>
        </div>
        <form className="auth-form" onSubmit={submit}>
          {mode === "signup" && (
            <label>
              Official name
              <input value={form.name} onChange={(e) => update("name", e.target.value)} required />
            </label>
          )}
          <label>
            Official email
            <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="name@ghmc.gov.in" required />
          </label>
          <label>
            Password
            <input type="password" value={form.password} onChange={(e) => update("password", e.target.value)} required />
          </label>
          {error && <div className="form-error">{error}</div>}
          <button className="primary-action" disabled={loading}>
            {loading ? "Please wait..." : mode === "signup" ? "Create Official Account" : "Login as Official"}
          </button>
          <Link className="auth-link" to="/login">Citizen login</Link>
        </form>
      </div>
    </div>
  );
}
