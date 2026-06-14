import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Heatmap from "./pages/Heatmap";
import Trends from "./pages/Trends";
import Alerts from "./pages/Alerts";
import CivicScore from "./pages/CivicScore";
import Classify from "./pages/Classify";
import Login from "./pages/Login";
import RaiseComplaint from "./pages/RaiseComplaint";
import OfficialActions from "./pages/OfficialActions";
import MyComplaints from "./pages/MyComplaints";
import OfficialLogin from "./pages/OfficialLogin";
 
export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("civic_user");
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (user) localStorage.setItem("civic_user", JSON.stringify(user));
    else localStorage.removeItem("civic_user");
  }, [user]);

  const logout = () => setUser(null);
  const homePath = user?.role === "official" ? "/official-actions" : "/raise-complaint";

  return (
    <Router>
      {!user ? (
        <Routes>
          <Route path="/login" element={<Login user={user} onLogin={setUser} />} />
          <Route path="/official-login" element={<OfficialLogin user={user} onLogin={setUser} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      ) : (
        <div className="app-layout">
          <Sidebar user={user} onLogout={logout} />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Navigate to={homePath} replace />} />
              <Route path="/login" element={<Navigate to={homePath} replace />} />
              <Route path="/official-login" element={<Navigate to={homePath} replace />} />
              <Route path="/raise-complaint" element={user.role === "official" ? <Navigate to="/official-actions" replace /> : <RaiseComplaint user={user} />} />
              <Route path="/my-complaints" element={user.role === "official" ? <Navigate to="/official-actions" replace /> : <MyComplaints user={user} />} />
              <Route path="/official-actions" element={user.role === "official" ? <OfficialActions /> : <Navigate to="/raise-complaint" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/heatmap" element={<Heatmap />} />
              <Route path="/trends" element={<Trends />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/civic-score" element={<CivicScore />} />
              <Route path="/classify" element={<Classify />} />
              <Route path="*" element={<Navigate to={homePath} replace />} />
            </Routes>
          </main>
        </div>
      )}
    </Router>
  );
}
 
