import { useEffect, useState } from 'react';
import { api } from '../api/api';
import StatCard from '../components/StatCard';

export default function CitizenDashboard({ user }) {
  const [dashboard, setDashboard] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        if (!user || !user.id) {
          throw new Error('User not found');
        }

        // Fetch user dashboard data
        const dashboardData = await api.getUserDashboard(user.id);
        setDashboard(dashboardData);

        // Fetch user complaints
        const complaintsList = await api.getUserComplaints(user.id);
        setComplaints(complaintsList);
      } catch (err) {
        console.error('Error loading dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  if (loading) {
    return <div className="page-loading">Loading your dashboard…</div>;
  }

  if (!dashboard) {
    return <div className="page-loading">Unable to load dashboard data</div>;
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Resolved': return '#4caf50';
      case 'In Progress': return '#ff9800';
      case 'Open': return '#f44336';
      default: return '#999';
    }
  };

  const getSeverityIcon = (severity) => {
    const icons = {
      'Critical': '🚨',
      'High': '⚠️',
      'Medium': '📌',
      'Low': '✓'
    };
    return icons[severity] || '📌';
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">My Complaints Dashboard</h1>
        <span className="page-sub">Track and manage your filed complaints</span>
      </div>

      {/* Statistics Cards */}
      <div className="stat-grid">
        <StatCard 
          icon="📋" 
          label="Total Complaints" 
          value={dashboard.total_complaints}
          accent="#2196f3"
        />
        <StatCard 
          icon="✅" 
          label="Resolved" 
          value={dashboard.resolved_complaints}
          accent="#4caf50"
        />
        <StatCard 
          icon="⏳" 
          label="Pending" 
          value={dashboard.pending_complaints}
          accent="#ff9800"
        />
        <StatCard 
          icon="📊" 
          label="Resolution Rate" 
          value={`${dashboard.resolution_rate}%`}
          accent="#9c27b0"
        />
      </div>

      {/* Category & Severity Distribution */}
      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3 className="card-title">Complaints by Category</h3>
          <div className="category-list">
            {Object.entries(dashboard.category_distribution)
              .sort((a, b) => b[1] - a[1])
              .map(([category, count]) => (
                <div key={category} className="category-item">
                  <span className="category-name">{category}</span>
                  <div className="category-bar">
                    <div 
                      className="category-bar-fill"
                      style={{
                        width: `${(count / Math.max(...Object.values(dashboard.category_distribution))) * 100}%`
                      }}
                    />
                  </div>
                  <span className="category-count">{count}</span>
                </div>
              ))}
          </div>
        </div>

        <div className="dashboard-card">
          <h3 className="card-title">Severity Distribution</h3>
          <div className="severity-list">
            {['Critical', 'High', 'Medium', 'Low'].map(severity => (
              <div key={severity} className="severity-item">
                <span className="severity-icon">{getSeverityIcon(severity)}</span>
                <span className="severity-name">{severity}</span>
                <span className="severity-count">
                  {dashboard.severity_distribution[severity] || 0}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Complaints */}
      <div className="dashboard-card" style={{ marginTop: 24 }}>
        <h3 className="card-title">Recent Complaints</h3>
        {complaints.length === 0 ? (
          <div className="empty-state">
            <p>You haven't filed any complaints yet.</p>
          </div>
        ) : (
          <div className="complaints-table">
            {complaints.slice(0, 10).map(complaint => (
              <div key={complaint.id} className="complaint-row">
                <div className="row-badge">
                  <span className="row-id">#{complaint.id}</span>
                  <span className="row-icon">{getSeverityIcon(complaint.severity)}</span>
                </div>
                <div className="row-content">
                  <h4>{complaint.title || complaint.text.substring(0, 50)}</h4>
                  <p>
                    <span className="row-category">{complaint.category}</span>
                    <span className="row-separator">•</span>
                    <span className="row-ward">{complaint.ward}</span>
                    <span className="row-separator">•</span>
                    <span className="row-date">
                      {new Date(complaint.created_at).toLocaleDateString()}
                    </span>
                  </p>
                </div>
                <div className="row-status">
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(complaint.status) }}
                  >
                    {complaint.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          margin-bottom: 24px;
        }

        .dashboard-card {
          padding: 20px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .card-title {
          margin: 0 0 16px 0;
          font-size: 16px;
          font-weight: 600;
          color: #333;
        }

        .category-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .category-item {
          display: grid;
          grid-template-columns: 100px 1fr 60px;
          align-items: center;
          gap: 12px;
        }

        .category-name {
          font-size: 13px;
          font-weight: 500;
          color: #666;
        }

        .category-bar {
          height: 6px;
          background: #f0f0f0;
          border-radius: 3px;
          overflow: hidden;
        }

        .category-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #2196f3, #1976d2);
          border-radius: 3px;
          transition: width 0.3s ease;
        }

        .category-count {
          font-size: 13px;
          font-weight: 600;
          color: #2196f3;
          text-align: right;
        }

        .severity-list {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .severity-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px;
          background: #f9f9f9;
          border-radius: 6px;
        }

        .severity-icon {
          font-size: 18px;
        }

        .severity-name {
          flex: 1;
          font-size: 13px;
          font-weight: 500;
          color: #666;
        }

        .severity-count {
          font-weight: 600;
          color: #333;
          min-width: 24px;
          text-align: right;
        }

        .empty-state {
          text-align: center;
          padding: 40px 20px;
          color: #999;
        }

        .complaints-table {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .complaint-row {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 12px;
          background: #fafafa;
          border-radius: 6px;
          border-left: 3px solid #ddd;
          transition: all 0.2s;
        }

        .complaint-row:hover {
          background: #f0f0f0;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .row-badge {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          min-width: 45px;
        }

        .row-id {
          font-size: 11px;
          font-weight: 600;
          color: #666;
        }

        .row-icon {
          font-size: 18px;
        }

        .row-content {
          flex: 1;
          min-width: 0;
        }

        .row-content h4 {
          margin: 0 0 4px 0;
          font-size: 14px;
          font-weight: 600;
          color: #333;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .row-content p {
          margin: 0;
          font-size: 12px;
          color: #999;
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }

        .row-category {
          background: #e3f2fd;
          padding: 2px 6px;
          border-radius: 2px;
          font-weight: 500;
        }

        .row-separator {
          color: #ddd;
        }

        .row-ward {
          color: #666;
          font-size: 11px;
        }

        .row-date {
          color: #999;
          font-size: 11px;
        }

        .row-status {
          min-width: 100px;
          text-align: right;
        }

        .status-badge {
          display: inline-block;
          padding: 4px 10px;
          color: white;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }

        @media (max-width: 768px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }

          .severity-list {
            grid-template-columns: 1fr;
          }

          .complaint-row {
            flex-direction: column;
            align-items: flex-start;
          }

          .row-status {
            width: 100%;
            text-align: left;
          }
        }
      `}</style>
    </div>
  );
}
