import { useState, useEffect, useRef } from "react";
import { api } from "../api/api";
import DuplicateWarning from "../components/DuplicateWarning";

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
    latitude: null,
    longitude: null,
  });
  const [saved, setSaved] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [duplicates, setDuplicates] = useState([]);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [userAcknowledgedDuplicates, setUserAcknowledgedDuplicates] = useState(false);
  const duplicateCheckTimeout = useRef(null);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  // Debounced duplicate check
  useEffect(() => {
    if (duplicateCheckTimeout.current) clearTimeout(duplicateCheckTimeout.current);
    
    if (form.title.length > 5 && form.text.length > 10) {
      setCheckingDuplicates(true);
      duplicateCheckTimeout.current = setTimeout(async () => {
        try {
          const result = await api.checkDuplicates(
            form.title,
            form.text,
            form.category,
            form.latitude,
            form.longitude
          );
          setDuplicates(result.similar_complaints || []);
        } catch (err) {
          console.error("Error checking duplicates:", err);
        } finally {
          setCheckingDuplicates(false);
        }
      }, 1000);
    }
  }, [form.title, form.text, form.category, form.latitude, form.longitude]);

  const getLocation = () => {
    setLocationError(null);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setForm((prev) => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }));
        },
        (error) => setLocationError("Unable to get location. Please enter manually."),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      setLocationError("Geolocation not supported. Please enter coordinates manually.");
    }
  };

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
      // Update location if provided
      if (form.latitude && form.longitude) {
        await api.updateComplaintLocation(complaint.id, form.latitude, form.longitude);
      }
      setSaved(complaint);
      setDuplicates([]);
      setUserAcknowledgedDuplicates(false);
      setForm((prev) => ({ ...prev, title: "", text: "", address: "", photo_url: "", latitude: null, longitude: null }));
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
          {/* Show duplicate warning if found */}
          <DuplicateWarning 
            duplicates={duplicates}
            onIgnore={() => setUserAcknowledgedDuplicates(true)}
            onAcknowledge={() => setUserAcknowledgedDuplicates(true)}
          />
          
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
          
          <div style={{ backgroundColor: '#f5f5f5', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '10px', fontSize: '14px', fontWeight: '600' }}>📍 Location Coordinates (Optional - to show on map)</h3>
            <button 
              type="button" 
              onClick={getLocation} 
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginBottom: '10px',
                fontSize: '14px'
              }}
            >
              🗺️ Use My Current Location
            </button>
            {locationError && <p style={{ color: '#d32f2f', fontSize: '12px', margin: '5px 0' }}>{locationError}</p>}
            {form.latitude && form.longitude && (
              <p style={{ color: '#4caf50', fontSize: '12px', margin: '5px 0' }}>✓ Location set: {form.latitude.toFixed(4)}, {form.longitude.toFixed(4)}</p>
            )}
            <div className="form-row">
              <label>
                Latitude
                <input 
                  type="number" 
                  step="0.0001"
                  value={form.latitude || ""} 
                  onChange={(e) => update("latitude", e.target.value ? parseFloat(e.target.value) : null)} 
                  placeholder="e.g. 17.3850" 
                />
              </label>
              <label>
                Longitude
                <input 
                  type="number" 
                  step="0.0001"
                  value={form.longitude || ""} 
                  onChange={(e) => update("longitude", e.target.value ? parseFloat(e.target.value) : null)} 
                  placeholder="e.g. 78.4867" 
                />
              </label>
            </div>
          </div>
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
          <button 
            className="primary-action" 
            disabled={loading || (duplicates.length > 0 && !userAcknowledgedDuplicates)}
            style={duplicates.length > 0 && !userAcknowledgedDuplicates ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
          >
            {loading ? "Submitting..." : duplicates.length > 0 && !userAcknowledgedDuplicates ? "⚠️ Please acknowledge duplicates first" : "Submit Complaint"}
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
