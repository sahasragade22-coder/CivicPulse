# CivicPulse Enhancement - Detailed Implementation Plan

## Project Overview
CivicPulse is a Flask + React (Vite) citizen complaint management system with sentiment analysis and civic scoring.

**Current Architecture:**
- Backend: Flask with SQLite3, sentiment analysis (TextBlob), complaint classification
- Frontend: React 18 + Vite with React Router, Recharts for charts, Leaflet for maps
- Database: SQLite with complaints, users tables
- API: RESTful endpoints for complaints, auth, analysis

---

## Phase 1: Core Enhancements (Highest Priority)

### 1.1 Complaint Priority Scoring
**Goal:** Automatically calculate severity levels based on sentiment, category, and civic score.

**Implementation:**
- **Files to Modify:**
  - `backend/database.py` - Add `severity` column to complaints table
  - `backend/alerts.py` - Add severity calculation logic
  - `backend/app.py` - Integrate severity scoring in complaint creation
  
- **New Severity Logic:**
  - **Critical:** Negative sentiment (<-0.5) + high civic impact OR multiple red flags
  - **High:** Negative sentiment (-0.3 to -0.5) + medium civic impact
  - **Medium:** Neutral sentiment + standard categories
  - **Low:** Positive sentiment or low-impact categories

- **Frontend Changes:**
  - Display colored severity badges in complaint lists
  - Color mapping: Red (Critical), Orange (High), Yellow (Medium), Green (Low)

---

### 1.2 Geo-Location Mapping
**Goal:** Add Leaflet-based map visualization with markers and clusters.

**Implementation:**
- **Files to Modify:**
  - `backend/database.py` - Add `latitude`, `longitude` columns to complaints
  - `backend/app.py` - Add endpoints for location-based queries
  - `frontend/package.json` - Already has leaflet, add leaflet-markercluster
  
- **New Components:**
  - Create `frontend/src/components/ComplaintMap.jsx` - Interactive map with markers
  - Create `frontend/src/pages/GeoMap.jsx` - Full-page map view
  
- **Features:**
  - Map markers with complaint details popup
  - Marker clustering at zoom levels
  - Category-based color coding for markers
  - Ward-based filtering
  - Real-time marker updates

---

### 1.3 Real-Time Updates (WebSocket)
**Goal:** Notify citizens when complaint status changes using WebSockets.

**Implementation:**
- **Backend Changes:**
  - Add `Flask-SocketIO` to requirements.txt
  - Create `backend/socket_handler.py` - WebSocket event handlers
  - Modify `backend/app.py` - Integrate SocketIO
  
- **Frontend Changes:**
  - Install `socket.io-client`
  - Create `frontend/src/hooks/useSocket.js` - Custom hook for socket connection
  - Create `frontend/src/components/NotificationPanel.jsx` - Toast notifications
  - Integrate socket listeners in complaint pages

- **Events:**
  - `complaint_updated` - Status change notification
  - `complaint_resolved` - Completion notification
  - `new_complaint` - New complaint alert (for officials)

---

### 1.4 Citizen Dashboard
**Goal:** Show personal complaint overview and activity timeline.

**Implementation:**
- **Files to Create:**
  - `frontend/src/pages/CitizenDashboard.jsx` - Personal dashboard
  
- **Metrics:**
  - Total complaints filed
  - Pending complaints count
  - Resolved complaints count
  - Resolution rate %
  - Recent activity timeline
  
- **Backend Endpoints:**
  - `GET /api/complaints/user/<user_id>` - User-specific complaints
  - `GET /api/user/<user_id>/stats` - User statistics

---

### 1.5 Officer Dashboard
**Goal:** Enhanced admin view for complaint management.

**Implementation:**
- **Files to Modify:**
  - `frontend/src/pages/OfficialActions.jsx` - Enhanced UI
  
- **Features:**
  - Complaint assignment system
  - Bulk status updates
  - Resolution notes/comments
  - Filter by severity, category, ward, date range
  - Quick statistics panel
  
- **Backend Endpoints:**
  - `PATCH /api/complaints/<id>/assign` - Assign complaint to officer
  - `POST /api/complaints/<id>/notes` - Add resolution notes
  - `GET /api/dashboard/officer` - Officer statistics

---

## Phase 2: Advanced Features

### 2.1 Multilingual Support
**Goal:** Support English, Telugu, and Hindi languages.

**Implementation:**
- **Files to Create:**
  - `frontend/src/locales/en.json` - English translations
  - `frontend/src/locales/te.json` - Telugu translations
  - `frontend/src/locales/hi.json` - Hindi translations
  - `frontend/src/hooks/useTranslation.js` - Translation hook
  
- **Backend:**
  - Add language detection via TextBlob for non-English complaints
  - Store original + translated text in database

---

### 2.2 Duplicate Complaint Detection
**Goal:** Identify and merge duplicate complaints.

**Implementation:**
- **Files to Create:**
  - `backend/duplicate_detector.py` - Similarity algorithms
  
- **Methods:**
  - Text similarity (cosine distance with TF-IDF)
  - Location proximity (lat/lon within 500m)
  - Time proximity (within 24 hours)
  - Category match
  
- **Frontend:**
  - Show "Similar complaints" suggestions before submission
  - Merge option for officers

---

### 2.3 Analytics Dashboard
**Goal:** Comprehensive visualization of complaint trends.

**Implementation:**
- **Files to Create:**
  - `frontend/src/pages/AdvancedAnalytics.jsx` - New analytics page
  
- **Charts:**
  - Complaints by category (pie/bar chart)
  - Complaints by area/ward (heat map + bar)
  - Resolution time trends (line chart)
  - Sentiment trends over time
  - Category-wise resolution rates

---

## Phase 3: AI & Advanced Visualization

### 3.1 AI Chatbot
**Goal:** Assist citizens with complaint submission.

**Implementation:**
- **Backend:**
  - Integrate OpenAI/Hugging Face API
  - Create `backend/chatbot.py`
  - FAQ retrieval system
  
- **Frontend:**
  - Create `frontend/src/components/ChatBot.jsx` - Chat interface
  - Integration in complaint form

---

### 3.2 Heatmap Visualization
**Goal:** Show complaint density across areas.

**Implementation:**
- **Frontend:**
  - Install `leaflet.heat` plugin
  - Create `frontend/src/components/HeatmapLayer.jsx`
  - Dynamic heatmap based on time range and category

---

## Technical Dependencies

### Backend (requirements.txt additions):
```
Flask-SocketIO==5.3.0
python-socketio==5.9.0
python-engineio==4.7.0
python-dotenv==1.0.0
```

### Frontend (package.json additions):
```json
{
  "socket.io-client": "^4.7.0",
  "leaflet-markercluster": "^1.4.1",
  "leaflet.heat": "^0.2.0"
}
```

---

## Database Schema Changes

### New Columns (ALTER TABLE complaints):
- `severity` TEXT DEFAULT 'Medium' - Priority level
- `latitude` REAL - Complaint location latitude
- `longitude` REAL - Complaint location longitude
- `assigned_to` INTEGER - Officer ID
- `resolution_notes` TEXT - Officer notes
- `duplicate_of` INTEGER - Link to original complaint (if duplicate)
- `is_duplicate` BOOLEAN DEFAULT 0 - Mark as duplicate
- `language` TEXT DEFAULT 'en' - Original language
- `original_text` TEXT - Non-English original text
- `socket_id` TEXT - For real-time updates

---

## Implementation Order

1. **Database schema updates** → Add new columns
2. **Backend severity scoring** → Priority system
3. **Geolocation support** → Database + API
4. **WebSocket integration** → Real-time communication
5. **Frontend map component** → Geo visualization
6. **Frontend dashboards** → Citizen + Officer views
7. **Phase 2 & 3** → Multilingual, analytics, chatbot

---

## Key Files Summary

### Backend Files:
- `app.py` - Main Flask app (modify routes)
- `database.py` - SQLite operations (add columns, queries)
- `alerts.py` - Severity logic (new scoring function)
- `socket_handler.py` - NEW WebSocket handlers
- `duplicate_detector.py` - NEW Similarity detection

### Frontend Files:
- `App.jsx` - Add new routes
- `components/ComplaintMap.jsx` - NEW Map component
- `components/NotificationPanel.jsx` - NEW Notifications
- `pages/CitizenDashboard.jsx` - NEW User dashboard
- `pages/GeoMap.jsx` - NEW Full map page
- `pages/AdvancedAnalytics.jsx` - NEW Analytics
- `hooks/useSocket.js` - NEW Socket hook
- `locales/` - NEW Translations

---

## Backward Compatibility
✅ All existing endpoints remain unchanged
✅ New columns have DEFAULT values
✅ Existing complaints continue to work
✅ Optional WebSocket (graceful fallback to HTTP polling)

---

## Testing Strategy
1. Database migrations with existing data
2. API endpoint testing (existing + new)
3. WebSocket connection testing
4. Frontend component integration
5. End-to-end user flows

---

## Deployment
- Keep Flask on port 5000
- Frontend dev: `npm run dev` on port 5173
- Frontend prod: `npm run build` → static build
- Database: SQLite3 (no migration needed if done carefully)

---

## Estimated Timeline
- Phase 1: 2-3 weeks (Priority Scoring, Maps, WebSocket, Dashboards)
- Phase 2: 2 weeks (Multilingual, Duplicate Detection, Analytics)
- Phase 3: 1-2 weeks (Chatbot, Advanced Heatmaps)
