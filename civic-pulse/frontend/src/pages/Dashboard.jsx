import { useEffect, useState } from "react";
import { api } from "../api/api";
import StatCard from "../components/StatCard";
import BarChart from "../components/BarChart";
import LineChart from "../components/LineChart";
 
export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
 
  useEffect(() => {
    Promise.all([api.getStats(), api.getTrends()])
      .then(([s, t]) => { setStats(s); setTrends(t); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);
 
  if (loading) return <div className="page-loading">Loading dashboard…</div>;
 
  const categoryData = stats
    ? Object.entries(stats.categories).map(([name, value]) => ({ name, value }))
    : [];
 
  const sentimentLabel =
    stats?.avg_sentiment > 0.1 ? "😊 Generally Positive"
    : stats?.avg_sentiment < -0.1 ? "😟 Generally Negative"
    : "😐 Neutral";
 
  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <span className="page-sub">City-wide overview · Hyderabad</span>
      </div>
      <div className="stat-grid">
        <StatCard icon="◈" label="Total Complaints" value={stats?.total_complaints} accent="#00e5b0" />
        <StatCard icon="◉" label="Avg Sentiment" value={stats?.avg_sentiment?.toFixed(3)} sub={sentimentLabel} accent="#7c4dff" />
        <StatCard icon="◬" label="Top Ward" value={Object.keys(stats?.top_wards ?? {})[0]} accent="#ff6d00" />
        <StatCard icon="◆" label="Categories" value={Object.keys(stats?.categories ?? {}).length} accent="#00b8d4" />
      </div>
      <div className="charts-grid">
        <BarChart data={categoryData} xKey="name" yKey="value" title="Complaints by Category" />
        <LineChart data={trends} title="Sentiment Trend Over Time" />
      </div>
      <div className="chart-card" style={{ marginTop: 24 }}>
        <h3 className="chart-title">Top 5 Wards by Complaints</h3>
        <div className="ward-list">
          {Object.entries(stats?.top_wards ?? {}).map(([ward, count], i) => (
            <div key={ward} className="ward-row">
              <span className="ward-rank">#{i + 1}</span>
              <span className="ward-name">{ward}</span>
              <div className="ward-bar-wrap">
                <div className="ward-bar" style={{ width: `${(count / Math.max(...Object.values(stats.top_wards))) * 100}%` }} />
              </div>
              <span className="ward-count">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}