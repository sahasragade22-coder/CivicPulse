import { useEffect, useState } from "react";
import { api } from "../api/api";
import LineChart from "../components/LineChart";
import BarChart from "../components/BarChart";
 
export default function Trends() {
  const [trends, setTrends] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
 
  useEffect(() => {
    Promise.all([api.getTrends(), api.getStats()])
      .then(([t, s]) => { setTrends(t); setStats(s); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);
 
  if (loading) return <div className="page-loading">Loading trends…</div>;
 
  const countData = trends.map((t) => ({ date: t.date, value: t.count }));
 
  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Trends</h1>
        <span className="page-sub">Sentiment and volume over time</span>
      </div>
      <LineChart data={trends} title="Average Daily Sentiment (−1 to +1)" />
      <div style={{ marginTop: 24 }}>
        <BarChart data={countData} xKey="date" yKey="value" title="Daily Complaint Volume" />
      </div>
      {stats && (
        <div style={{ marginTop: 24 }}>
          <BarChart
            data={Object.entries(stats.categories).map(([name, value]) => ({ name, value }))}
            xKey="name" yKey="value" title="All-Time Category Breakdown"
          />
        </div>
      )}
    </div>
  );
}
 