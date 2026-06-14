from collections import defaultdict
from datetime import datetime, timedelta
 
SPIKE_THRESHOLD = 5
 
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
 