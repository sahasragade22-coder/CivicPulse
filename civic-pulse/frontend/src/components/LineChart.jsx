import {
  LineChart as ReLineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceLine, CartesianGrid,
} from "recharts";
 
export default function LineChart({ data, title }) {
  return (
    <div className="chart-card">
      {title && <h3 className="chart-title">{title}</h3>}
      <ResponsiveContainer width="100%" height={220}>
        <ReLineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid stroke="#1e3a4a" strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fill: "#8899aa", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => v.slice(5)} />
          <YAxis domain={[-1, 1]} tick={{ fill: "#8899aa", fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ background: "#0d1b2a", border: "1px solid #1e3a4a", borderRadius: 8 }} labelStyle={{ color: "#e0f0ff" }} itemStyle={{ color: "#00e5b0" }} />
          <ReferenceLine y={0} stroke="#1e3a4a" />
          <Line type="monotone" dataKey="avg_sentiment" stroke="#00e5b0" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: "#00e5b0" }} />
        </ReLineChart>
      </ResponsiveContainer>
    </div>
  );
}