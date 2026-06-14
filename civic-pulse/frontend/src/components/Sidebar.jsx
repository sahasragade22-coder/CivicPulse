import { NavLink } from "react-router-dom";

const CITIZEN_ITEMS = [
  { to: "/raise-complaint", icon: "+", label: "Raise Complaint" },
  { to: "/my-complaints", icon: "T", label: "My Complaints" },
  { to: "/dashboard", icon: "D", label: "Dashboard" },
  { to: "/heatmap", icon: "M", label: "Heatmap" },
  { to: "/trends", icon: "T", label: "Trends" },
  { to: "/alerts", icon: "A", label: "Alerts" },
  { to: "/civic-score", icon: "S", label: "Civic Score" },
  { to: "/classify", icon: "AI", label: "AI Classify" },
];

const OFFICIAL_ITEMS = [
  { to: "/official-actions", icon: "!", label: "Official Action" },
  { to: "/dashboard", icon: "D", label: "Dashboard" },
  { to: "/heatmap", icon: "M", label: "Heatmap" },
  { to: "/trends", icon: "T", label: "Trends" },
  { to: "/alerts", icon: "A", label: "Alerts" },
  { to: "/civic-score", icon: "S", label: "Civic Score" },
  { to: "/classify", icon: "AI", label: "AI Classify" },
];

export default function Sidebar({ user, onLogout }) {
  const navItems = user?.role === "official" ? OFFICIAL_ITEMS : CITIZEN_ITEMS;

  return (
    <nav className="sidebar">
      <div className="sidebar-brand">
        <span className="brand-icon">CP</span>
        <div className="brand-text">
          <span className="brand-name">CIVIC</span>
          <span className="brand-sub">PULSE</span>
        </div>
      </div>
      <div className="sidebar-city">Hyderabad, TG</div>
      {user && (
        <div className="sidebar-user">
          <strong>{user.name}</strong>
          <span>{user.role}</span>
        </div>
      )}
      <ul className="nav-list">
        {navItems.map(({ to, icon, label }) => (
          <li key={to}>
            <NavLink
              to={to}
              className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            >
              <span className="nav-icon">{icon}</span>
              <span className="nav-label">{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
      <div className="sidebar-footer">
        <div className="live-status">
          <span className="pulse-dot" />
          <span>Live monitoring</span>
        </div>
        <button className="logout-btn" onClick={onLogout}>Logout</button>
      </div>
    </nav>
  );
}
