const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
 
async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}
 
export const api = {
  getComplaints: (ward) =>
    request(`/api/complaints${ward ? `?ward=${encodeURIComponent(ward)}` : ""}`),
  addComplaint: (data) =>
    request("/api/complaints", { method: "POST", body: JSON.stringify(data) }),
  updateComplaintStatus: (id, status) =>
    request(`/api/complaints/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  login: (data) =>
    request("/api/auth/login", { method: "POST", body: JSON.stringify(data) }),
  officialLogin: (data) =>
    request("/api/auth/official-login", { method: "POST", body: JSON.stringify(data) }),
  signup: (data) =>
    request("/api/auth/signup", { method: "POST", body: JSON.stringify(data) }),
  classify: (text) =>
    request("/api/classify", { method: "POST", body: JSON.stringify({ text }) }),
  getAlerts: () => request("/api/alerts"),
  getCivicScores: () => request("/api/civic-scores"),
  getTrends: () => request("/api/trends"),
  getStats: () => request("/api/stats"),
};
