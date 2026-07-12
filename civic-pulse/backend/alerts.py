from collections import defaultdict
from datetime import datetime, timedelta
 
SPIKE_THRESHOLD = 5

# Civic impact scores by category (lower = more impactful)
CATEGORY_IMPACT = {
    "Water": 95,
    "Electricity": 90,
    "Road": 85,
    "Garbage": 70,
    "Building": 60,
    "Noise": 40,
    "Park": 30,
    "Other": 50
}

def calculate_severity(complaint: dict) -> str:
    """
    Calculate severity level (Critical, High, Medium, Low) based on:
    - Sentiment (negative = higher severity)
    - Category civic impact (water/electricity = higher severity)
    - Word indicators (urgent, critical, dangerous, etc.)
    """
    sentiment = complaint.get("sentiment", 0.0)
    category = complaint.get("category", "Other")
    text = (complaint.get("text", "") + complaint.get("title", "")).lower()
    priority = complaint.get("priority", "Normal").lower()
    
    # Base score (0-100, higher = more severe)
    base_score = 50
    
    # Sentiment impact (0-35 points)
    if sentiment < -0.5:
        base_score += 35
    elif sentiment < -0.3:
        base_score += 25
    elif sentiment < 0:
        base_score += 15
    
    # Category civic impact (0-30 points)
    category_score = CATEGORY_IMPACT.get(category, 50)
    base_score += (100 - category_score) * 0.3
    
    # Priority flag impact (0-20 points)
    if priority == "critical":
        base_score += 20
    elif priority == "urgent":
        base_score += 10
    
    # Critical keywords (0-15 points)
    critical_keywords = ["emergency", "urgent", "critical", "dangerous", "hazard", 
                        "severe", "life-threatening", "immediate", "collapsed", "flooded"]
    if any(kw in text for kw in critical_keywords):
        base_score += 15
    
    # High keywords
    high_keywords = ["broken", "damaged", "blocked", "leak", "overflow", "accident", 
                     "injury", "stuck", "broken"]
    if any(kw in text for kw in high_keywords):
        base_score += 8
    
    # Determine severity level
    if base_score >= 80:
        return "Critical"
    elif base_score >= 60:
        return "High"
    elif base_score >= 40:
        return "Medium"
    else:
        return "Low"

def calculate_complaint_severity(sentiment: float, category: str, title: str, text: str, 
                                  priority: str = "Normal") -> str:
    """Convenience function that calculates severity from individual parameters"""
    complaint = {
        "sentiment": sentiment,
        "category": category,
        "title": title,
        "text": text,
        "priority": priority
    }
    return calculate_severity(complaint)
 
def detect_spikes(complaints: list) -> list:
    alerts = []
    now = datetime.now()
    window_7 = now - timedelta(days=7)
    window_30 = now - timedelta(days=30)
 
    recent_7 = defaultdict(list)
    recent_30 = defaultdict(list)
 
    for c in complaints:
        date_str = c.get("date", "")
        try:
            date = datetime.strptime(date_str[:10], "%Y-%m-%d")
        except Exception:
            continue
        ward = c.get("ward", "Unknown")
        category = c.get("category", "Other")
        key = (ward, category)
        if date >= window_7:
            recent_7[key].append(c)
        if date >= window_30:
            recent_30[key].append(c)
 
    for key, recent in recent_7.items():
        ward, category = key
        count_7 = len(recent)
        count_30 = len(recent_30.get(key, []))
        expected = count_30 / 4
        if count_7 >= SPIKE_THRESHOLD and count_7 > expected * 1.5:
            severity = "high" if count_7 > expected * 2.5 else "medium"
            alerts.append({
                "ward": ward,
                "category": category,
                "count_7d": count_7,
                "count_30d": count_30,
                "severity": severity,
                "message": f"Spike detected in {ward}: {count_7} {category} complaints in last 7 days"
            })
 
    ward_sentiments = defaultdict(list)
    for c in complaints:
        date_str = c.get("date", "")
        try:
            date = datetime.strptime(date_str[:10], "%Y-%m-%d")
        except Exception:
            continue
        if date >= window_7:
            ward = c.get("ward", "Unknown")
            ward_sentiments[ward].append(c.get("sentiment", 0))
 
    for ward, sentiments in ward_sentiments.items():
        if len(sentiments) >= 3:
            avg = sum(sentiments) / len(sentiments)
            if avg < -0.3:
                alerts.append({
                    "ward": ward,
                    "category": "Sentiment",
                    "count_7d": len(sentiments),
                    "count_30d": None,
                    "severity": "medium",
                    "message": f"High negativity in {ward}: avg sentiment {avg:.2f} over {len(sentiments)} complaints"
                })
 
    alerts.sort(key=lambda x: (x["severity"] == "high", x["count_7d"]), reverse=True)
    return alerts
 