import { useState } from "react";
import { api } from "../api/api";

const CATEGORIES = ["Road", "Water", "Electricity", "Garbage", "Park", "Building", "Noise", "Other"];
const WARDS = [
  "Ameerpet", "Banjara Hills", "Begumpet", "Dilsukhnagar", "Gachibowli",
  "Jubilee Hills", "Kukatpally", "LB Nagar", "Madhapur", "Miyapur",
  "Secunderabad", "Tarnaka", "Uppal", "Other"
];

export default function RaiseComplaint({ user }) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    title: "",
    text: "",
    category: "Road",
    ward: "Ameerpet",
    address: "",
    photo_url: "",
    priority: "Normal",
    date: today,
  });
  const [saved, setSaved] = useState(null);
  const [loading, setLoading] = useState(false);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setSaved(null);
    try {
      const complaint = await api.addComplaint({
        ...form,
        citizen_name: user?.name,
        citizen_email: user?.email,
        status: "Open",
      });
      setSaved(complaint);
      setForm((prev) => ({ ...prev, title: "", text: "", address: "", photo_url: "" }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Raise Complaint</h1>
        <span className="page-sub">Submit drainage, road, garbage, power and public-space issues</span>
      </div>
      <div className="complaint-layout">
        <form className="issue-form" onSubmit={submit}>
          <label>
            Issue title
            <input value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="Open drain near school" required />
          </label>
          <div className="form-row">
            <label>
              Issue type
              <select value={form.category} onChange={(e) => update("category", e.target.value)}>
                {CATEGORIES.map((category) => <option key={category}>{category}</option>)}
              </select>
            </label>
            <label>
              Ward
              <select value={form.ward} onChange={(e) => update("ward", e.target.value)}>
                {WARDS.map((ward) => <option key={ward}>{ward}</option>)}
              </select>
            </label>
          </div>
          <label>
            Exact location
            <input value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="Street, landmark or colony name" required />
          </label>
          <label>
            Problem details
            <textarea value={form.text} onChange={(e) => update("text", e.target.value)} rows={6} placeholder="Explain what happened, how long it has been pending and who is affected." required />
          </label>
          <div className="form-row">
            <label>
              Priority
              <select value={form.priority} onChange={(e) => update("priority", e.target.value)}>
                <option>Normal</option>
                <option>Urgent</option>
                <option>Critical</option>
              </select>
            </label>
            <label>
              Photo link
              <input value={form.photo_url} onChange={(e) => update("photo_url", e.target.value)} placeholder="Optional image URL" />
            </label>
          </div>
          <button className="primary-action" disabled={loading}>
            {loading ? "Submitting..." : "Submit Complaint"}
          </button>
        </form>
        <aside className="issue-side">
          <h2>Complaint Status</h2>
          {saved ? (
            <div className="ticket-card">
              <span className="ticket-id">Ticket #{saved.id}</span>
              <strong>{saved.title || saved.category}</strong>
              <p>{saved.ward} - {saved.status}</p>
              <p>Your complaint is now visible to officials for action.</p>
            </div>
          ) : (
            <p>After submission, your ticket will be marked Open and sent to the official action queue.</p>
          )}
        </aside>
      </div>
    </div>
  );
}
