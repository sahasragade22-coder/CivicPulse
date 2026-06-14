export default function AlertItem({ alert }) {
  const severityClass = alert.severity === "high" ? "alert-high" : "alert-medium";
  return (
    <div className={`alert-item ${severityClass}`}>
      <div className="alert-badge">{alert.severity.toUpperCase()}</div>
      <div className="alert-content">
        <div className="alert-message">{alert.message}</div>
        <div className="alert-meta">
          <span>{alert.ward}</span>
          <span className="dot">·</span>
          <span>{alert.category}</span>
          {alert.count_7d != null && (
            <>
              <span className="dot">·</span>
              <span>{alert.count_7d} in 7 days</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}