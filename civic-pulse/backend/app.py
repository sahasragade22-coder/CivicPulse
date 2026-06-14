from flask import Flask, jsonify, request
from flask_cors import CORS
import json
import os
from sentiment import analyze_sentiment
from classifier import classify_complaint
from alerts import detect_spikes
from civic_score import compute_civic_scores
from database import (
    init_db, get_all_complaints, insert_complaint, get_complaints_by_ward,
    create_user, get_user_by_email, insert_issue, update_complaint_status
)
 
app = Flask(__name__)
CORS(app)

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
        "priority": body.get("priority", "Normal")
    }
    saved = insert_issue(complaint)
    return jsonify(saved), 201

@app.route("/api/complaints/<int:complaint_id>/status", methods=["PATCH"])
def set_complaint_status(complaint_id):
    body = request.get_json()
    status = body.get("status", "Open")
    if status not in ["Open", "In Progress", "Resolved"]:
        return jsonify({"error": "Invalid status"}), 400
    updated = update_complaint_status(complaint_id, status)
    if not updated:
        return jsonify({"error": "Complaint not found"}), 404
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
 
if __name__ == "__main__":
    app.run(debug=True, port=5000)
