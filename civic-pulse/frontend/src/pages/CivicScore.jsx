import { useEffect, useState } from "react";
import { api } from "../api/api";
 
export default function CivicScore() {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
 
  useEffect(() => {
    api.getCivicScores().then(setScores).catch(console.error).finally(() => setLoading(false));
  }, []);
 
  if (loading) return <div className="page-loading">Computing civic scores…</div>;
 
  const getScoreColor = (score) =>
    score >= 70 ? "#00e5b0" : score >= 45 ? "#ffd740" : "#ff1744";
  const getScoreLabel = (score) =>
    score >= 70 ? "Healthy" : score >= 45 ? "Moderate" : "Critical";
 
  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Civic Score</h1>
        <span className="page-sub">Ward health ranking · {scores.length} wards</span>
      </div>
      <div className="score-legend">
        <span style={{ color: "#00e5b0" }}>● Healthy (70+)</span>
        <span style={{ color: "#ffd740" }}>● Moderate (45–69)</span>
        <span style={{ color: "#ff1744" }}>● Critical (&lt;45)</span>
      </div>
      <div className="score-table">
        <div className="score-table-header">
          <span>Rank</span><span>Ward</span><span>Score</span>
          <span>Complaints</span><span>Avg Sentiment</span><span>Status</span><span>Categories</span>
        </div>
        {scores.map((s) => (
          <div key={s.ward} className="score-row">
            <span className="score-rank">#{s.rank}</span>
            <span className="score-ward">{s.ward}</span>
            <span className="score-value" style={{ color: getScoreColor(s.score) }}>{s.score}</span>
            <span className="score-complaints">{s.total_complaints}</span>
            <span className="score-sentiment" style={{ color: s.avg_sentiment > 0 ? "#00e5b0" : "#ff6d00" }}>
              {s.avg_sentiment > 0 ? "+" : ""}{s.avg_sentiment}
            </span>
            <span className="score-status" style={{ color: getScoreColor(s.score), border: `1px solid ${getScoreColor(s.score)}` }}>
              {getScoreLabel(s.score)}
            </span>
            <span className="score-categories">
              {s.categories.slice(0, 3).join(", ")}{s.categories.length > 3 ? ` +${s.categories.length - 3}` : ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}