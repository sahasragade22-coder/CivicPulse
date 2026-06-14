import { useEffect, useState } from "react";
import { api } from "../api/api";
import AlertItem from "../components/AlertItem";
 
export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
 
  useEffect(() => {
    api.getAlerts().then(setAlerts).catch(console.error).finally(() => setLoading(false));
  }, []);
 
  if (loading) return <div className="page-loading">Scanning for spikes…</div>;
 
  const high = alerts.filter((a) => a.severity === "high");
  const medium = alerts.filter((a) => a.severity === "medium");
 
  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Alerts</h1>
        <span className="page-sub">Spike detection · {alerts.length} active alerts</span>
      </div>
      {alerts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✓</div>
          <p>No unusual spikes detected.</p>
        </div>
      ) : (
        <>
          {high.length > 0 && (
            <section className="alert-section">
              <h2 className="section-label">🔴 High Severity ({high.length})</h2>
              {high.map((a, i) => <AlertItem key={i} alert={a} />)}
            </section>
          )}
          {medium.length > 0 && (
            <section className="alert-section">
              <h2 className="section-label">🟠 Medium Severity ({medium.length})</h2>
              {medium.map((a, i) => <AlertItem key={i} alert={a} />)}
            </section>
          )}
        </>
      )}
    </div>
  );
}
 