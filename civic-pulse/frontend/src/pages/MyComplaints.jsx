import { useEffect, useMemo, useState } from "react";
import { api } from "../api/api";

export default function MyComplaints({ user }) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getComplaints().then(setComplaints).catch(console.error).finally(() => setLoading(false));
  }, []);

  const mine = useMemo(() => {
    return complaints.filter((complaint) => complaint.citizen_email === user?.email);
  }, [complaints, user]);

  if (loading) return <div className="page-loading">Loading your complaints...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">My Complaints</h1>
        <span className="page-sub">Track the issues you raised and their current status</span>
      </div>
      <div className="ticket-list">
        {mine.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">0</div>
            <p>You have not raised any complaints yet.</p>
          </div>
        ) : (
          mine.map((complaint) => (
            <article className="official-ticket" key={complaint.id}>
              <div className="ticket-topline">
                <span className={`status-pill status-${(complaint.status || "Open").toLowerCase().replaceAll(" ", "-")}`}>
                  {complaint.status || "Open"}
                </span>
                <span>#{complaint.id}</span>
                <span>{complaint.category}</span>
                <span>{complaint.ward}</span>
              </div>
              <h2>{complaint.title || complaint.text.slice(0, 60)}</h2>
              <p>{complaint.text}</p>
              <div className="ticket-meta-grid">
                <span><strong>Location:</strong> {complaint.address || "Not specified"}</span>
                <span><strong>Date:</strong> {complaint.date}</span>
                <span><strong>Priority:</strong> {complaint.priority || "Normal"}</span>
                <span><strong>Ticket:</strong> #{complaint.id}</span>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
