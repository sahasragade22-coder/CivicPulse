import {
  BarChart as ReBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
 
const COLORS = ["#00e5b0","#00b8d4","#7c4dff","#ff6d00","#ff1744","#69f0ae","#ffd740"];
 
export default function BarChart({ data, xKey = "name", yKey = "value", title }) {
  return (
    <div className="chart-card">
      {title && <h3 className="chart-title">{title}</h3>}
      <ResponsiveContainer width="100%" height={220}>
        <ReBarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
          <XAxis dataKey={xKey} tick={{ fill: "#8899aa", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#8899aa", fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ background: "#0d1b2a", border: "1px solid #1e3a4a", borderRadius: 8 }} labelStyle={{ color: "#e0f0ff" }} itemStyle={{ color: "#00e5b0" }} />
          <Bar dataKey={yKey} radius={[4, 4, 0, 0]}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Bar>
        </ReBarChart>
      </ResponsiveContainer>
    </div>
  );
}