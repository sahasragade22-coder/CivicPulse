import { useEffect, useMemo, useState } from "react";
import { api } from "../api/api";

const STATUSES = ["Open", "In Progress", "Resolved"];
const PERIODS = [
  { key: "all", label: "All" },
  { key: "day", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
];

function isWithinPeriod(complaint, period) {
  if (period === "all") return true;
  const rawDate = complaint.date || complaint.created_at;
  if (!rawDate) return false;
  const complaintDate = new Date(rawDate);
  const now = new Date();
  if (Number.isNaN(complaintDate.getTime())) return false;

  if (period === "day") {
    return complaintDate.toDateString() === now.toDateString();
  }

  const diffDays = (now - complaintDate) / (1000 * 60 * 60 * 24);
  if (period === "week") return diffDays <= 7;
  if (period === "month") return diffDays <= 30;
  return true;
}

export default function OfficialActions() {
  const [complaints, setComplaints] = useState([]);
  const [filter, setFilter] = useState("Open");
  const [period, setPeriod] = useState("all");
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.getComplaints().then(setComplaints).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const visible = useMemo(() => {
    return complaints.filter((complaint) => {
      return (complaint.status || "Open") === filter && isWithinPeriod(complaint, period);
    });
  }, [complaints, filter, period]);

  const counts = STATUSES.reduce((acc, status) => {
    acc[status] = complaints.filter((complaint) => {
      return (complaint.status || "Open") === status && isWithinPeriod(complaint, period);
    }).length;
    return acc;
  }, {});

  const changeStatus = async (id, status) => {
    const updated = await api.updateComplaintStatus(id, status);
    setComplaints((prev) => prev.map((item) => (item.id === id ? updated : item)));
  };

  if (loading) return <div className="page-loading">Loading official queue...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Official Action</h1>
        <span className="page-sub">Review citizen complaints and update resolution status</span>
      </div>
      <div className="status-tabs">
        {STATUSES.map((status) => (
          <button key={status} className={filter === status ? "active" : ""} onClick={() => setFilter(status)}>
            {status} <span>{counts[status] || 0}</span>
          </button>
        ))}
      </div>
      <div className="period-tabs">
        {PERIODS.map((item) => (
          <button key={item.key} className={period === item.key ? "active" : ""} onClick={() => setPeriod(item.key)}>
            {item.label}
          </button>
        ))}
      </div>
      <div className="ticket-list">
        {visible.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">OK</div>
            <p>No complaints in {filter}.</p>
          </div>
        ) : (
          visible.map((complaint) => (
            <article className="official-ticket" key={complaint.id}>
              <div className="ticket-topline">
                <span className={`priority-badge priority-${(complaint.priority || "Normal").toLowerCase()}`}>{complaint.priority || "Normal"}</span>
                <span>#{complaint.id}</span>
                <span>{complaint.category}</span>
                <span>{complaint.ward}</span>
              </div>
              <h2>{complaint.title || complaint.text.slice(0, 60)}</h2>
              <p>{complaint.text}</p>
              <div className="ticket-meta-grid">
                <span><strong>Location:</strong> {complaint.address || "Not specified"}</span>
                <span><strong>Citizen:</strong> {complaint.citizen_name || "Unknown"}</span>
                <span><strong>Date:</strong> {complaint.date}</span>
                <span><strong>Status:</strong> {complaint.status || "Open"}</span>
              </div>
              {complaint.photo_url && (
                <a className="photo-link" href={complaint.photo_url} target="_blank" rel="noreferrer">View submitted photo</a>
              )}
              <div className="ticket-actions">
                <label className="solved-check">
                  <input
                    type="checkbox"
                    checked={(complaint.status || "Open") === "Resolved"}
                    onChange={(event) => changeStatus(complaint.id, event.target.checked ? "Resolved" : "Open")}
                  />
                  Mark as solved
                </label>
                {(complaint.status || "Open") !== "Resolved" && (
                  <button onClick={() => changeStatus(complaint.id, "In Progress")}>
                    Move to In Progress
                  </button>
                )}
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
