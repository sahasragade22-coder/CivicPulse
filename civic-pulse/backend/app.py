from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_socketio import SocketIO
import json
import os
from sentiment import analyze_sentiment
from classifier import classify_complaint
from alerts import detect_spikes, calculate_severity
from civic_score import compute_civic_scores
from socket_handler import register_socket_handlers, notify_complaint_status_change, notify_complaint_assigned, notify_new_complaint
from database import (
    init_db, get_all_complaints, insert_complaint, get_complaints_by_ward,
    create_user, get_user_by_email, insert_issue, update_complaint_status,
    get_complaints_by_user, update_complaint_severity, update_complaint_location,
    assign_complaint, add_resolution_notes, get_complaints_by_severity,
    get_complaint_by_id, get_user_by_id, find_similar_complaints, mark_as_duplicate
)
 
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Initialize SocketIO with CORS settings
socketio = SocketIO(app, cors_allowed_origins="*")

# Register WebSocket handlers
register_socket_handlers(socketio)

OFFICIAL_EMAIL_DOMAIN = "@ghmc.gov.in"
 
init_db()
 
def load_mock_data():
    mock_path = os.path.join(os.path.dirname(__file__), "complaints.json")
    if os.path.exists(mock_path):
        with open(mock_path) as f:
            complaints = json.load(f)
        for c in complaints:
            insert_complaint(c)
 
load_mock_data()
 
@app.route("/api/complaints", methods=["GET"])
def get_complaints():
    ward = request.args.get("ward")
    if ward:
        data = get_complaints_by_ward(ward)
    else:
        data = get_all_complaints()
    return jsonify(data)
 
@app.route("/api/complaints", methods=["POST"])
def add_complaint():
    body = request.get_json()
    text = body.get("text", "")
    ward = body.get("ward", "Unknown")
    sentiment = analyze_sentiment(text)
    category = body.get("category") or classify_complaint(text)
    
    # Calculate severity level
    severity = calculate_severity({
        "sentiment": sentiment,
        "category": category,
        "text": text,
        "title": body.get("title", ""),
        "priority": body.get("priority", "Normal")
    })
    
    complaint = {
        "title": body.get("title", ""),
        "text": text,
        "ward": ward,
        "address": body.get("address", ""),
        "photo_url": body.get("photo_url", ""),
        "sentiment": sentiment,
        "category": category,
        "date": body.get("date", "2024-01-01"),
        "status": body.get("status", "Open"),
        "citizen_name": body.get("citizen_name", ""),
        "citizen_email": body.get("citizen_email", ""),
        "priority": body.get("priority", "Normal"),
        "severity": severity,
        "latitude": body.get("latitude"),
        "longitude": body.get("longitude"),
        "language": body.get("language", "en")
    }
    saved = insert_issue(complaint)
    
    # Notify officers of new complaint if Critical/High
    if severity in ["Critical", "High"]:
        notify_new_complaint(socketio, saved.get("id"), category, ward, severity)
    
    return jsonify(saved), 201

@app.route("/api/complaints/<int:complaint_id>/status", methods=["PATCH"])
def set_complaint_status(complaint_id):
    body = request.get_json()
    status = body.get("status", "Open")
    if status not in ["Open", "In Progress", "Resolved"]:
        return jsonify({"error": "Invalid status"}), 400
    
    # Get old status before update
    old_complaint = get_complaint_by_id(complaint_id)
    old_status = old_complaint.get("status") if old_complaint else None
    
    updated = update_complaint_status(complaint_id, status)
    if not updated:
        return jsonify({"error": "Complaint not found"}), 404
    
    # Notify all watchers and citizen
    notify_complaint_status_change(socketio, complaint_id, status, old_status)
    
    return jsonify(updated)

@app.route("/api/auth/signup", methods=["POST"])
def signup():
    body = request.get_json()
    required = ["name", "email", "password"]
    if any(not body.get(field) for field in required):
        return jsonify({"error": "Name, email and password are required"}), 400
    role = body.get("role", "citizen")
    email = body["email"].lower()
    if role == "official" and not email.endswith(OFFICIAL_EMAIL_DOMAIN):
        return jsonify({"error": "Officials must use a GHMC email address"}), 403
    if get_user_by_email(body["email"]):
        return jsonify({"error": "Account already exists"}), 409
    user = create_user({
        "name": body["name"],
        "email": email,
        "password": body["password"],
        "role": role
    })
    return jsonify(user), 201

@app.route("/api/auth/login", methods=["POST"])
def login():
    body = request.get_json()
    user = get_user_by_email(body.get("email", ""))
    if not user or user.get("password") != body.get("password", ""):
        return jsonify({"error": "Invalid email or password"}), 401
    return jsonify({
        "id": user["id"],
        "name": user["name"],
        "email": user["email"],
        "role": user["role"]
    })

@app.route("/api/auth/official-login", methods=["POST"])
def official_login():
    body = request.get_json()
    email = body.get("email", "").lower()
    if not email.endswith(OFFICIAL_EMAIL_DOMAIN):
        return jsonify({"error": "Use an official GHMC email address"}), 403
    user = get_user_by_email(email)
    if not user or user.get("password") != body.get("password", "") or user.get("role") != "official":
        return jsonify({"error": "Invalid official account"}), 401
    return jsonify({
        "id": user["id"],
        "name": user["name"],
        "email": user["email"],
        "role": user["role"]
    })
 
@app.route("/api/classify", methods=["POST"])
def classify():
    body = request.get_json()
    text = body.get("text", "")
    sentiment = analyze_sentiment(text)
    category = classify_complaint(text)
    return jsonify({"sentiment": sentiment, "category": category, "text": text})
 
@app.route("/api/alerts", methods=["GET"])
def alerts():
    complaints = get_all_complaints()
    spikes = detect_spikes(complaints)
    return jsonify(spikes)
 
@app.route("/api/civic-scores", methods=["GET"])
def civic_scores():
    complaints = get_all_complaints()
    scores = compute_civic_scores(complaints)
    return jsonify(scores)
 
@app.route("/api/trends", methods=["GET"])
def trends():
    complaints = get_all_complaints()
    from collections import defaultdict
    by_date = defaultdict(list)
    for c in complaints:
        date = c.get("date", "2024-01-01")[:10]
        by_date[date].append(c.get("sentiment", 0))
    result = []
    for date in sorted(by_date.keys()):
        scores = by_date[date]
        avg = sum(scores) / len(scores) if scores else 0
        result.append({"date": date, "avg_sentiment": round(avg, 3), "count": len(scores)})
    return jsonify(result)
 
@app.route("/api/stats", methods=["GET"])
def stats():
    complaints = get_all_complaints()
    total = len(complaints)
    from collections import Counter
    categories = Counter(c.get("category", "Other") for c in complaints)
    sentiments = [c.get("sentiment", 0) for c in complaints]
    avg_sentiment = sum(sentiments) / len(sentiments) if sentiments else 0
    wards = Counter(c.get("ward", "Unknown") for c in complaints)
    return jsonify({
        "total_complaints": total,
        "categories": dict(categories),
        "avg_sentiment": round(avg_sentiment, 3),
        "top_wards": dict(wards.most_common(5))
    })

@app.route("/api/complaints/<int:complaint_id>/location", methods=["PATCH"])
def update_complaint_location_route(complaint_id):
    """Update geographic location of a complaint"""
    body = request.get_json()
    latitude = body.get("latitude")
    longitude = body.get("longitude")
    
    if latitude is None or longitude is None:
        return jsonify({"error": "Latitude and longitude required"}), 400
    
    try:
        updated = update_complaint_location(complaint_id, float(latitude), float(longitude))
        if not updated:
            return jsonify({"error": "Complaint not found"}), 404
        return jsonify(updated)
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid coordinates"}), 400

@app.route("/api/complaints/<int:complaint_id>/assign", methods=["PATCH"])
def assign_complaint_route(complaint_id):
    """Assign complaint to an officer"""
    body = request.get_json()
    officer_id = body.get("officer_id")
    
    if officer_id is None:
        return jsonify({"error": "officer_id required"}), 400
    
    # Verify officer exists
    officer = get_user_by_id(officer_id)
    if not officer or officer.get("role") != "official":
        return jsonify({"error": "Officer not found"}), 404
    
    updated = assign_complaint(complaint_id, officer_id)
    if not updated:
        return jsonify({"error": "Complaint not found"}), 404
    
    # Notify officer and citizen
    notify_complaint_assigned(socketio, complaint_id, officer_id)
    
    return jsonify(updated)

@app.route("/api/complaints/<int:complaint_id>/notes", methods=["POST"])
def add_notes_route(complaint_id):
    """Add resolution notes to a complaint"""
    body = request.get_json()
    notes = body.get("notes", "")
    
    if not notes:
        return jsonify({"error": "Notes cannot be empty"}), 400
    
    updated = add_resolution_notes(complaint_id, notes)
    if not updated:
        return jsonify({"error": "Complaint not found"}), 404
    return jsonify(updated)

@app.route("/api/user/<int:user_id>/complaints", methods=["GET"])
def user_complaints(user_id):
    """Get complaints filed by a specific user"""
    complaints = get_complaints_by_user(user_id)
    return jsonify(complaints)

@app.route("/api/user/<int:user_id>/dashboard", methods=["GET"])
def user_dashboard(user_id):
    """Get user dashboard statistics"""
    user = get_user_by_id(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    complaints = get_complaints_by_user(user_id)
    total = len(complaints)
    resolved = len([c for c in complaints if c.get("status") == "Resolved"])
    pending = len([c for c in complaints if c.get("status") in ["Open", "In Progress"]])
    
    # Severity distribution
    severity_counts = {}
    for c in complaints:
        sev = c.get("severity", "Medium")
        severity_counts[sev] = severity_counts.get(sev, 0) + 1
    
    # Category distribution
    category_counts = {}
    for c in complaints:
        cat = c.get("category", "Other")
        category_counts[cat] = category_counts.get(cat, 0) + 1
    
    return jsonify({
        "user_id": user_id,
        "user_name": user.get("name"),
        "total_complaints": total,
        "resolved_complaints": resolved,
        "pending_complaints": pending,
        "resolution_rate": round((resolved / total * 100) if total > 0 else 0, 1),
        "severity_distribution": severity_counts,
        "category_distribution": category_counts,
        "recent_complaints": complaints[:5]
    })

@app.route("/api/complaints/severity/<severity>", methods=["GET"])
def get_by_severity(severity):
    """Get complaints by severity level"""
    valid_severities = ["Critical", "High", "Medium", "Low"]
    if severity not in valid_severities:
        return jsonify({"error": "Invalid severity level"}), 400
    
    complaints = get_complaints_by_severity(severity)
    return jsonify(complaints)

@app.route("/api/officer/<int:officer_id>/dashboard", methods=["GET"])
def officer_dashboard(officer_id):
    """Get officer dashboard statistics"""
    officer = get_user_by_id(officer_id)
    if not officer or officer.get("role") != "official":
        return jsonify({"error": "Officer not found"}), 404
    
    complaints = get_all_complaints()
    
    # Filter by assigned officer
    assigned = [c for c in complaints if c.get("assigned_to") == officer_id]
    
    # Status breakdown
    open_count = len([c for c in assigned if c.get("status") == "Open"])
    in_progress = len([c for c in assigned if c.get("status") == "In Progress"])
    resolved = len([c for c in assigned if c.get("status") == "Resolved"])
    
    # Severity breakdown
    critical = len([c for c in assigned if c.get("severity") == "Critical"])
    high = len([c for c in assigned if c.get("severity") == "High"])
    
    return jsonify({
        "officer_id": officer_id,
        "officer_name": officer.get("name"),
        "total_assigned": len(assigned),
        "open": open_count,
        "in_progress": in_progress,
        "resolved": resolved,
        "critical_count": critical,
        "high_count": high,
        "assigned_complaints": assigned[:10]
    })

@app.route("/api/complaints/check-duplicates", methods=["POST"])
def check_duplicates():
    """Check for duplicate complaints before submission"""
    body = request.get_json()
    title = body.get("title", "")
    text = body.get("text", "")
    category = body.get("category", "Other")
    latitude = body.get("latitude")
    longitude = body.get("longitude")
    
    if not title or not text:
        return jsonify({"error": "Title and text required"}), 400
    
    try:
        # Create a temporary ID (0) for checking against existing complaints
        similar = find_similar_complaints(
            complaint_id=0,
            title=title,
            text=text,
            category=category,
            latitude=float(latitude) if latitude else None,
            longitude=float(longitude) if longitude else None,
            similarity_threshold=0.5
        )
        
        return jsonify({
            "has_duplicates": len(similar) > 0,
            "similar_complaints": similar,
            "warning": f"Found {len(similar)} similar complaint(s). Please review before submitting." if similar else None
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/complaints/<int:complaint_id>/similar", methods=["GET"])
def get_similar_complaints(complaint_id):
    """Get similar complaints for a specific complaint"""
    complaint = get_complaint_by_id(complaint_id)
    if not complaint:
        return jsonify({"error": "Complaint not found"}), 404
    
    try:
        similar = find_similar_complaints(
            complaint_id=complaint_id,
            title=complaint.get("title", ""),
            text=complaint.get("text", ""),
            category=complaint.get("category", "Other"),
            latitude=complaint.get("latitude"),
            longitude=complaint.get("longitude"),
            similarity_threshold=0.5
        )
        
        return jsonify({
            "complaint_id": complaint_id,
            "similar_complaints": similar,
            "total_similar": len(similar)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/complaints/<int:complaint_id>/mark-duplicate", methods=["POST"])
def mark_complaint_duplicate(complaint_id):
    """Mark a complaint as duplicate of another complaint"""
    body = request.get_json()
    original_id = body.get("original_complaint_id")
    
    if original_id is None:
        return jsonify({"error": "original_complaint_id required"}), 400
    
    # Verify both complaints exist
    original = get_complaint_by_id(original_id)
    duplicate = get_complaint_by_id(complaint_id)
    
    if not original or not duplicate:
        return jsonify({"error": "One or both complaints not found"}), 404
    
    if original_id == complaint_id:
        return jsonify({"error": "Cannot mark complaint as duplicate of itself"}), 400
    
    try:
        updated = mark_as_duplicate(original_id, complaint_id)
        return jsonify({
            "message": f"Complaint #{complaint_id} marked as duplicate of #{original_id}",
            "complaint": updated
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
 
if __name__ == "__main__":
    socketio.run(app, debug=True, port=5000, host='0.0.0.0')
