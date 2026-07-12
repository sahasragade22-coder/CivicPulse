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

export default function OfficialActions({ socket }) {
  const [complaints, setComplaints] = useState([]);
  const [filter, setFilter] = useState("Open");
  const [period, setPeriod] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [notes, setNotes] = useState("");
  const [showNotesModal, setShowNotesModal] = useState(false);

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

  const handleAddNotes = async () => {
    if (!selectedComplaint || !notes.trim()) return;
    try {
      await api.addComplaintNotes(selectedComplaint.id, notes);
      setComplaints((prev) => prev.map((item) => {
        if (item.id === selectedComplaint.id) {
          return { ...item, resolution_notes: notes };
        }
        return item;
      }));
      setNotes("");
      setShowNotesModal(false);
      alert("Notes added successfully!");
    } catch (err) {
      console.error("Error adding notes:", err);
      alert("Failed to add notes");
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'Critical': return '#f44336';
      case 'High': return '#ff9800';
      case 'Medium': return '#ffc107';
      case 'Low': return '#4caf50';
      default: return '#999';
    }
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
                <span 
                  className="severity-badge"
                  style={{ backgroundColor: getSeverityColor(complaint.severity || 'Medium') }}
                >
                  {complaint.severity || 'Medium'}
                </span>
                <span className={`priority-badge priority-${(complaint.priority || "Normal").toLowerCase()}`}>
                  {complaint.priority || "Normal"}
                </span>
                <span>#{complaint.id}</span>
                <span>{complaint.category}</span>
                <span>{complaint.ward}</span>
              </div>
              <h2>{complaint.title || complaint.text.slice(0, 60)}</h2>
              <p>{complaint.text}</p>
              <div className="ticket-meta-grid">
                <span><strong>Location:</strong> {complaint.address || "Not specified"}</span>
                <span><strong>Citizen:</strong> {complaint.citizen_name || "Unknown"}</span>
                <span><strong>Email:</strong> {complaint.citizen_email || "No email"}</span>
                <span><strong>Date:</strong> {complaint.date}</span>
                <span><strong>Status:</strong> {complaint.status || "Open"}</span>
                <span><strong>Sentiment:</strong> {(complaint.sentiment * 100).toFixed(0)}%</span>
              </div>

              {complaint.resolution_notes && (
                <div className="resolution-notes">
                  <strong>Resolution Notes:</strong>
                  <p>{complaint.resolution_notes}</p>
                </div>
              )}

              {complaint.photo_url && (
                <a className="photo-link" href={complaint.photo_url} target="_blank" rel="noreferrer">
                  📷 View submitted photo
                </a>
              )}
              
              <div className="ticket-actions">
                <button
                  className="action-btn add-notes-btn"
                  onClick={() => {
                    setSelectedComplaint(complaint);
                    setNotes(complaint.resolution_notes || "");
                    setShowNotesModal(true);
                  }}
                >
                  📝 Add Notes
                </button>
                <label className="solved-check">
                  <input
                    type="checkbox"
                    checked={(complaint.status || "Open") === "Resolved"}
                    onChange={(event) => changeStatus(complaint.id, event.target.checked ? "Resolved" : "Open")}
                  />
                  Mark as resolved
                </label>
                {(complaint.status || "Open") !== "Resolved" && (
                  <button 
                    className="action-btn progress-btn"
                    onClick={() => changeStatus(complaint.id, "In Progress")}
                  >
                    Move to In Progress
                  </button>
                )}
              </div>
            </article>
          ))
        )}
      </div>

      {/* Notes Modal */}
      {showNotesModal && (
        <div className="modal-overlay" onClick={() => setShowNotesModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Add Resolution Notes</h3>
            <p className="modal-subtitle">Complaint #{selectedComplaint?.id}</p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about the resolution, action taken, etc..."
              rows={6}
              className="modal-textarea"
            />
            <div className="modal-actions">
              <button 
                className="btn-cancel"
                onClick={() => setShowNotesModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn-save"
                onClick={handleAddNotes}
              >
                Save Notes
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .severity-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          color: white;
          margin-right: 8px;
        }

        .resolution-notes {
          margin: 12px 0;
          padding: 12px;
          background: #f0f7ff;
          border-left: 3px solid #2196f3;
          border-radius: 4px;
          font-size: 13px;
        }

        .resolution-notes strong {
          color: #2196f3;
        }

        .resolution-notes p {
          margin: 6px 0 0 0;
          color: #666;
          line-height: 1.5;
        }

        .action-btn {
          padding: 8px 12px;
          background: #2196f3;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 13px;
          transition: background 0.2s;
          margin-right: 8px;
        }

        .action-btn:hover {
          background: #1976d2;
        }

        .add-notes-btn {
          background: #2196f3;
        }

        .progress-btn {
          background: #ff9800;
        }

        .progress-btn:hover {
          background: #f57c00;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 8px;
          padding: 24px;
          max-width: 500px;
          width: 90%;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        }

        .modal-content h3 {
          margin: 0 0 8px 0;
          font-size: 18px;
          color: #333;
        }

        .modal-subtitle {
          margin: 0 0 16px 0;
          font-size: 12px;
          color: #999;
        }

        .modal-textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          font-size: 13px;
          resize: vertical;
          margin-bottom: 16px;
        }

        .modal-textarea:focus {
          outline: none;
          border-color: #2196f3;
          box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.1);
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .btn-cancel, .btn-save {
          padding: 10px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .btn-cancel {
          background: #f0f0f0;
          color: #333;
        }

        .btn-cancel:hover {
          background: #e0e0e0;
        }

        .btn-save {
          background: #4caf50;
          color: white;
        }

        .btn-save:hover {
          background: #388e3c;
        }
      `}</style>
    </div>
  );
}
