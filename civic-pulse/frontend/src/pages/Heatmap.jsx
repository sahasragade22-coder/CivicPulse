import { useEffect, useRef, useState } from "react";
import { api } from "../api/api";
 
const WARD_COORDS = {
  "Jubilee Hills":[17.432,78.408],"Banjara Hills":[17.415,78.448],"SR Nagar":[17.449,78.44],
  "Ameerpet":[17.436,78.449],"Kukatpally":[17.484,78.399],"Madhapur":[17.447,78.392],
  "Begumpet":[17.445,78.466],"Himayatnagar":[17.407,78.473],"Gachibowli":[17.44,78.348],
  "Kondapur":[17.46,78.362],"Secunderabad":[17.443,78.499],"Dilsukhnagar":[17.369,78.527],
  "Tarnaka":[17.437,78.535],"LB Nagar":[17.349,78.558],"Jeedimetla":[17.508,78.434],
  "Malakpet":[17.382,78.504],"Uppal":[17.4,78.56],"Tolichowki":[17.404,78.423],
  "Somajiguda":[17.424,78.456],"Nizampet":[17.502,78.379],"Santoshnagar":[17.362,78.489],
  "Mehdipatnam":[17.395,78.437],"Saidabad":[17.367,78.513],"Kothapet":[17.375,78.543],
  "Abids":[17.387,78.474],"Attapur":[17.382,78.426],"Vanasthalipuram":[17.351,78.543],
  "Chandrayangutta":[17.375,78.487],"Falaknuma":[17.331,78.474],"Amberpet":[17.413,78.517],
  "Nacharam":[17.411,78.543],"Malkajgiri":[17.458,78.527],"Yapral":[17.475,78.555],
  "ECIL":[17.472,78.562],"Hafizpet":[17.492,78.366],"Nagole":[17.383,78.566],
  "Saroornagar":[17.35,78.56],"Musheerabad":[17.438,78.488],"Boduppal":[17.41,78.585],
  "Kompally":[17.54,78.466],"Patancheru":[17.527,78.261],"Alwal":[17.506,78.508],
  "Moosapet":[17.456,78.421],"Miyapur":[17.496,78.352],"Bahadurpally":[17.556,78.468],
  "Suraram":[17.526,78.454],"Dundigal":[17.576,78.464],"Quthbullapur":[17.517,78.434],
  "Medchal":[17.629,78.481],"Ghatkesar":[17.454,78.641],"Pocharam":[17.431,78.614],
  "Shamshabad":[17.244,78.423],"Keesara":[17.504,78.637],"Bibinagar":[17.464,78.706],
  "Bhongir":[17.508,78.884],
};
 
export default function Heatmap() {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const [complaints, setComplaints] = useState([]);
 
  useEffect(() => {
    api.getComplaints().then(setComplaints).catch(console.error);
  }, []);
 
  useEffect(() => {
    if (!window.L || mapInstance.current) return;
    mapInstance.current = window.L.map(mapRef.current, { center: [17.44, 78.45], zoom: 11 });
    window.L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: "© CartoDB", maxZoom: 19,
    }).addTo(mapInstance.current);
  }, []);
 
  useEffect(() => {
    if (!window.L || !mapInstance.current || !complaints.length) return;
    const wardCounts = {};
    complaints.forEach((c) => { wardCounts[c.ward] = (wardCounts[c.ward] || 0) + 1; });
    const maxCount = Math.max(...Object.values(wardCounts), 1);
    Object.entries(wardCounts).forEach(([ward, count]) => {
      const coords = WARD_COORDS[ward];
      if (!coords) return;
      const intensity = count / maxCount;
      const radius = 15 + intensity * 30;
      const color = intensity > 0.7 ? "#ff1744" : intensity > 0.4 ? "#ff6d00" : "#00e5b0";
      window.L.circleMarker(coords, { radius, color, fillColor: color, fillOpacity: 0.5, weight: 1 })
        .addTo(mapInstance.current)
        .bindPopup(`<b>${ward}</b><br>${count} complaint${count !== 1 ? "s" : ""}`);
    });
  }, [complaints]);
 
  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Complaint Heatmap</h1>
        <span className="page-sub">Geographic distribution of complaints</span>
      </div>
      <div className="map-legend">
        <span style={{ color: "#00e5b0" }}>● Low</span>
        <span style={{ color: "#ff6d00" }}>● Medium</span>
        <span style={{ color: "#ff1744" }}>● High</span>
      </div>
      <div ref={mapRef} className="leaflet-map" />
    </div>
  );
}
 