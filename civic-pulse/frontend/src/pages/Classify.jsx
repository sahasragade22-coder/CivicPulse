import { useState } from "react";
import { api } from "../api/api";
 
const EXAMPLES = [
  "Large pothole on main road near Jubilee Hills causing accidents",
  "Water pipe burst near Banjara Hills, water flowing on street",
  "Street lights not working on SR Nagar main road for 3 weeks",
  "Garbage not collected from Ameerpet for a week, very foul smell",
  "Illegal construction blocking footpath in Begumpet",
  "Loud music from event hall disturbing residents every night",
  "Park in Nizampet has new benches, excellent work by GHMC!",
];
 
const CATEGORY_ICONS = {
  Road:"🛣️", Water:"💧", Electricity:"⚡", Garbage:"🗑️",
  Park:"🌳", Building:"🏗️", Noise:"🔊", Other:"❓",
};
 
export default function Classify() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
 
  const handleClassify = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await api.classify(text);
      setResult(res);
      setHistory((prev) => [res, ...prev].slice(0, 10));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
 
  const sentimentBar = result ? Math.round(((result.sentiment + 1) / 2) * 100) : 50;
  const sentimentColor = result?.sentiment > 0.1 ? "#00e5b0" : result?.sentiment < -0.1 ? "#ff1744" : "#ffd740";
 
  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">AI Classify</h1>
        <span className="page-sub">Live sentiment + category detection</span>
      </div>
      <div className="classify-grid">
        <div className="classify-input-panel">
          <label className="classify-label">Enter a complaint text</label>
          <textarea className="classify-textarea" value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a civic complaint here…" rows={5} />
          <div className="classify-examples">
            <span className="classify-examples-label">Try an example:</span>
            {EXAMPLES.map((ex, i) => (
              <button key={i} className="example-chip" onClick={() => setText(ex)}>{ex.slice(0, 50)}…</button>
            ))}
          </div>
          <button className="classify-btn" onClick={handleClassify} disabled={loading || !text.trim()}>
            {loading ? "Analyzing…" : "⚡ Analyze"}
          </button>
        </div>
        <div className="classify-result-panel">
          {result ? (
            <>
              <div className="result-card">
                <div className="result-label">Category</div>
                <div className="result-category">
                  <span className="result-cat-icon">{CATEGORY_ICONS[result.category] || "❓"}</span>
                  <span className="result-cat-text">{result.category}</span>
                </div>
              </div>
              <div className="result-card">
                <div className="result-label">Sentiment Score</div>
                <div className="result-score" style={{ color: sentimentColor }}>
                  {result.sentiment > 0 ? "+" : ""}{result.sentiment.toFixed(4)}
                </div>
                <div className="sentiment-bar-track">
                  <div className="sentiment-bar-fill" style={{ width: `${sentimentBar}%`, background: sentimentColor }} />
                  <div className="sentiment-bar-labels">
                    <span>−1 Negative</span><span>0 Neutral</span><span>+1 Positive</span>
                  </div>
                </div>
              </div>
              <div className="result-card">
                <div className="result-label">Input Text</div>
                <div className="result-text">"{result.text}"</div>
              </div>
            </>
          ) : (
            <div className="classify-placeholder">
              <div className="placeholder-icon">◎</div>
              <p>Enter a complaint and click Analyze to see AI results</p>
            </div>
          )}
        </div>
      </div>
      {history.length > 0 && (
        <div className="chart-card" style={{ marginTop: 24 }}>
          <h3 className="chart-title">Recent Classifications</h3>
          <div className="history-table">
            <div className="history-header"><span>Text</span><span>Category</span><span>Sentiment</span></div>
            {history.map((h, i) => (
              <div key={i} className="history-row">
                <span className="history-text">{h.text.slice(0, 60)}…</span>
                <span className="history-cat">{CATEGORY_ICONS[h.category]} {h.category}</span>
                <span className="history-sentiment" style={{ color: h.sentiment > 0 ? "#00e5b0" : h.sentiment < 0 ? "#ff6d00" : "#ffd740" }}>
                  {h.sentiment > 0 ? "+" : ""}{h.sentiment.toFixed(3)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
 
