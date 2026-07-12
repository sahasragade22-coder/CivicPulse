import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import MarkerClusterGroup from 'leaflet.markercluster';

// Default map location (Hyderabad)
const DEFAULT_CENTER = [17.3850, 78.4867];
const INITIAL_ZOOM = 12;

// Category colors for markers
const CATEGORY_COLORS = {
  'Road': '#d32f2f',
  'Water': '#1976d2',
  'Electricity': '#f57c00',
  'Garbage': '#7b1fa2',
  'Park': '#388e3c',
  'Building': '#c2185b',
  'Noise': '#00838f',
  'Other': '#616161'
};

// Severity colors for icon styling
const SEVERITY_ICONS = {
  'Critical': '🚨',
  'High': '⚠️',
  'Medium': '📍',
  'Low': '🔵'
};

export default function ComplaintMap({ complaints = [], selectedCategory = null, selectedSeverity = null }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersGroup = useRef(null);
  const [filteredComplaints, setFilteredComplaints] = useState(complaints);

  // Filter complaints based on category and severity
  useEffect(() => {
    let filtered = complaints;

    if (selectedCategory) {
      filtered = filtered.filter(c => c.category === selectedCategory);
    }

    if (selectedSeverity) {
      filtered = filtered.filter(c => c.severity === selectedSeverity);
    }

    setFilteredComplaints(filtered);
  }, [complaints, selectedCategory, selectedSeverity]);

  // Initialize map
  useEffect(() => {
    if (map.current) return; // Prevent re-initialization

    const mapInstance = L.map(mapContainer.current).setView(DEFAULT_CENTER, INITIAL_ZOOM);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
      crossOrigin: true
    }).addTo(mapInstance);

    map.current = mapInstance;
  }, []);

  // Update markers when complaints change
  useEffect(() => {
    if (!map.current) return;

    // Remove old marker group
    if (markersGroup.current) {
      map.current.removeLayer(markersGroup.current);
    }

    // Create new marker cluster group
    markersGroup.current = L.markerClusterGroup({
      maxClusterRadius: 80,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: true
    });

    // Add markers for each complaint with location
    filteredComplaints.forEach(complaint => {
      if (complaint.latitude && complaint.longitude) {
        const color = CATEGORY_COLORS[complaint.category] || CATEGORY_COLORS['Other'];
        const icon = SEVERITY_ICONS[complaint.severity] || '📍';

        // Create custom icon
        const customIcon = L.divIcon({
          html: `
            <div style="
              background-color: ${color};
              width: 40px;
              height: 40px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 20px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              border: 2px solid white;
              cursor: pointer;
            ">
              ${icon}
            </div>
          `,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
          popupAnchor: [0, -20]
        });

        const marker = L.marker(
          [complaint.latitude, complaint.longitude],
          { icon: customIcon }
        );

        // Create popup content
        const popupContent = `
          <div style="min-width: 200px; padding: 8px;">
            <h4 style="margin: 0 0 8px 0; color: ${color};">#${complaint.id} - ${complaint.category}</h4>
            <p style="margin: 4px 0; font-size: 12px; font-weight: bold;">
              ${complaint.title || complaint.text.substring(0, 50)}
            </p>
            <p style="margin: 4px 0; font-size: 12px;">
              <strong>Ward:</strong> ${complaint.ward}
            </p>
            <p style="margin: 4px 0; font-size: 12px;">
              <strong>Severity:</strong> <span style="color: ${color};">${complaint.severity}</span>
            </p>
            <p style="margin: 4px 0; font-size: 12px;">
              <strong>Status:</strong> ${complaint.status}
            </p>
            <p style="margin: 4px 0; font-size: 12px;">
              <strong>Sentiment:</strong> ${(complaint.sentiment * 100).toFixed(0)}%
            </p>
            ${complaint.resolution_notes ? `
              <p style="margin: 4px 0; font-size: 11px; background: #f5f5f5; padding: 4px; border-radius: 3px;">
                <strong>Notes:</strong> ${complaint.resolution_notes.substring(0, 50)}...
              </p>
            ` : ''}
            <p style="margin: 8px 0 0 0; font-size: 11px; color: #999;">
              ${new Date(complaint.created_at).toLocaleDateString()}
            </p>
          </div>
        `;

        marker.bindPopup(popupContent);
        markersGroup.current.addLayer(marker);
      }
    });

    map.current.addLayer(markersGroup.current);

    // Fit bounds to show all markers
    if (filteredComplaints.length > 0) {
      const bounds = markersGroup.current.getBounds();
      if (bounds.isValid()) {
        map.current.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [filteredComplaints]);

  return (
    <div
      ref={mapContainer}
      style={{
        width: '100%',
        height: '600px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        zIndex: 0
      }}
    />
  );
}
