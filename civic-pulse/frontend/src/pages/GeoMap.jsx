import { useEffect, useState } from 'react';
import { api } from '../api/api';
import ComplaintMap from '../components/ComplaintMap';

const CATEGORIES = ["Road", "Water", "Electricity", "Garbage", "Park", "Building", "Noise", "Other"];
const SEVERITY_LEVELS = ["Critical", "High", "Medium", "Low"];
const WARDS = [
  "Ameerpet", "Banjara Hills", "Begumpet", "Dilsukhnagar", "Gachibowli",
  "Jubilee Hills", "Kukatpally", "LB Nagar", "Madhapur", "Miyapur",
  "Secunderabad", "Tarnaka", "Uppal", "Other"
];

export default function GeoMap() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSeverity, setSelectedSeverity] = useState(null);
  const [selectedWard, setSelectedWard] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    withLocation: 0,
    byCategory: {},
    bySeverity: {}
  });

  useEffect(() => {
    const loadComplaints = async () => {
      try {
        setLoading(true);
        const data = await api.getComplaints();
        setComplaints(data);

        // Calculate statistics
        const withLocation = data.filter(c => c.latitude && c.longitude);
        const byCat = {};
        const bySev = {};

        withLocation.forEach(c => {
          const cat = c.category || 'Other';
          const sev = c.severity || 'Medium';
          byCat[cat] = (byCat[cat] || 0) + 1;
          bySev[sev] = (bySev[sev] || 0) + 1;
        });

        setStats({
          total: data.length,
          withLocation: withLocation.length,
          byCategory: byCat,
          bySeverity: bySev
        });
      } catch (err) {
        console.error('Error loading complaints:', err);
      } finally {
        setLoading(false);
      }
    };

    loadComplaints();
  }, []);

  // Filter complaints based on selections
  const filteredComplaints = complaints.filter(c => {
    if (!c.latitude || !c.longitude) return false;
    if (selectedCategory && c.category !== selectedCategory) return false;
    if (selectedSeverity && c.severity !== selectedSeverity) return false;
    if (selectedWard && c.ward !== selectedWard) return false;
    return true;
  });

  if (loading) {
    return <div className="page-loading">Loading map data…</div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Geographic Map</h1>
        <span className="page-sub">
          Complaints by location · {stats.withLocation} of {stats.total} complaints have coordinates
        </span>
      </div>

      <div className="map-filters">
        <div className="filter-group">
          <label>Category</label>
          <select 
            value={selectedCategory || ''}
            onChange={(e) => setSelectedCategory(e.target.value || null)}
          >
            <option value="">All Categories</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>
                {cat} ({stats.byCategory[cat] || 0})
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Severity</label>
          <select 
            value={selectedSeverity || ''}
            onChange={(e) => setSelectedSeverity(e.target.value || null)}
          >
            <option value="">All Levels</option>
            {SEVERITY_LEVELS.map(sev => (
              <option key={sev} value={sev}>
                {sev} ({stats.bySeverity[sev] || 0})
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Ward</label>
          <select 
            value={selectedWard || ''}
            onChange={(e) => setSelectedWard(e.target.value || null)}
          >
            <option value="">All Wards</option>
            {WARDS.map(ward => (
              <option key={ward} value={ward}>{ward}</option>
            ))}
          </select>
        </div>

        <button 
          className="filter-reset"
          onClick={() => {
            setSelectedCategory(null);
            setSelectedSeverity(null);
            setSelectedWard(null);
          }}
        >
          Reset Filters
        </button>
      </div>

      <div className="map-container">
        <ComplaintMap 
          complaints={complaints}
          selectedCategory={selectedCategory}
          selectedSeverity={selectedSeverity}
          selectedWard={selectedWard}
        />
      </div>

      <div className="map-stats">
        <div className="stat-group">
          <h3>By Category</h3>
          <ul>
            {Object.entries(stats.byCategory)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([cat, count]) => (
                <li key={cat}>
                  <span>{cat}</span>
                  <strong>{count}</strong>
                </li>
              ))}
          </ul>
        </div>

        <div className="stat-group">
          <h3>By Severity</h3>
          <ul>
            {Object.entries(stats.bySeverity)
              .sort((a, b) => {
                const order = { 'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3 };
                return (order[a[0]] || 999) - (order[b[0]] || 999);
              })
              .map(([sev, count]) => (
                <li key={sev}>
                  <span>{sev}</span>
                  <strong>{count}</strong>
                </li>
              ))}
          </ul>
        </div>
      </div>

      <style>{`
        .map-filters {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
          padding: 16px;
          background: #f9f9f9;
          border-radius: 8px;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .filter-group label {
          font-size: 12px;
          font-weight: 600;
          color: #666;
          text-transform: uppercase;
        }

        .filter-group select {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 13px;
          background: white;
          cursor: pointer;
        }

        .filter-reset {
          align-self: flex-end;
          padding: 8px 16px;
          background: #666;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 13px;
          transition: background 0.2s;
        }

        .filter-reset:hover {
          background: #333;
        }

        .map-container {
          margin-bottom: 24px;
          padding: 16px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .map-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .stat-group {
          padding: 16px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .stat-group h3 {
          margin: 0 0 12px 0;
          font-size: 14px;
          font-weight: 600;
          color: #333;
        }

        .stat-group ul {
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .stat-group li {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #eee;
          font-size: 13px;
        }

        .stat-group li:last-child {
          border-bottom: none;
        }

        .stat-group strong {
          background: #f0f0f0;
          padding: 2px 8px;
          border-radius: 3px;
          font-weight: 600;
          color: #d32f2f;
        }
      `}</style>
    </div>
  );
}
