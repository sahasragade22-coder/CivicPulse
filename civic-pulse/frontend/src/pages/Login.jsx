import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { api } from "../api/api";

export default function Login({ user, onLogin }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/raise-complaint" replace />;

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const account =
        mode === "signup"
          ? await api.signup({ ...form, role: "citizen" })
          : await api.login({ email: form.email, password: form.password });
      if (account.role === "official") {
        setError("Officials must use the official login page.");
        return;
      }
      onLogin(account);
      navigate("/raise-complaint", { replace: true });
    } catch (err) {
      setError(mode === "signup" ? "Could not create account." : "Invalid email or password.");
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
            <h1>Civic Pulse</h1>
            <p>Report local issues and track action.</p>
          </div>
        </div>
        <div className="auth-tabs">
          <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>Login</button>
          <button className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")}>Create Account</button>
        </div>
        <form className="auth-form" onSubmit={submit}>
          {mode === "signup" && (
            <label>
              Full name
              <input value={form.name} onChange={(e) => update("name", e.target.value)} required />
            </label>
          )}
          <label>
            Email
            <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required />
          </label>
          <label>
            Password
            <input type="password" value={form.password} onChange={(e) => update("password", e.target.value)} required />
          </label>
          {error && <div className="form-error">{error}</div>}
          <button className="primary-action" disabled={loading}>
            {loading ? "Please wait..." : mode === "signup" ? "Create Account" : "Login"}
          </button>
          <Link className="auth-link" to="/official-login">Official login</Link>
        </form>
      </div>
    </div>
  );
}
