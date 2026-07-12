// Dynamically set backend URL based on where frontend is accessed from
const getBackendUrl = () => {
  const host = window.location.hostname;
  const protocol = window.location.protocol;
  return `${protocol}//${host}:5000`;
};

const BASE_URL = import.meta.env.VITE_API_URL || getBackendUrl();
 
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
  updateComplaintLocation: (id, latitude, longitude) =>
    request(`/api/complaints/${id}/location`, { method: "PATCH", body: JSON.stringify({ latitude, longitude }) }),
  assignComplaint: (id, officerId) =>
    request(`/api/complaints/${id}/assign`, { method: "PATCH", body: JSON.stringify({ officer_id: officerId }) }),
  addComplaintNotes: (id, notes) =>
    request(`/api/complaints/${id}/notes`, { method: "POST", body: JSON.stringify({ notes }) }),
  getComplaintsBySeverity: (severity) =>
    request(`/api/complaints/severity/${severity}`),
  getUserComplaints: (userId) =>
    request(`/api/user/${userId}/complaints`),
  getUserDashboard: (userId) =>
    request(`/api/user/${userId}/dashboard`),
  getOfficerDashboard: (officerId) =>
    request(`/api/officer/${officerId}/dashboard`),
  checkDuplicates: (title, text, category, latitude, longitude) =>
    request("/api/complaints/check-duplicates", { 
      method: "POST", 
      body: JSON.stringify({ title, text, category, latitude, longitude }) 
    }),
  getSimilarComplaints: (complaintId) =>
    request(`/api/complaints/${complaintId}/similar`),
  markAsDuplicate: (complaintId, originalComplaintId) =>
    request(`/api/complaints/${complaintId}/mark-duplicate`, { 
      method: "POST", 
      body: JSON.stringify({ original_complaint_id: originalComplaintId }) 
    }),
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
