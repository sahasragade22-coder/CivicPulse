from collections import defaultdict
 
def compute_civic_scores(complaints: list) -> list:
    ward_data = defaultdict(lambda: {"complaints": [], "sentiments": [], "categories": set()})
    for c in complaints:
        ward = c.get("ward", "Unknown")
        ward_data[ward]["complaints"].append(c)
        ward_data[ward]["sentiments"].append(c.get("sentiment", 0))
        ward_data[ward]["categories"].add(c.get("category", "Other"))
 
    if not ward_data:
        return []
 
    all_counts = [len(v["complaints"]) for v in ward_data.values()]
    max_count = max(all_counts) if all_counts else 1
    min_count = min(all_counts) if all_counts else 0
 
    scores = []
    for ward, data in ward_data.items():
        count = len(data["complaints"])
        sentiments = data["sentiments"]
        avg_sentiment = sum(sentiments) / len(sentiments) if sentiments else 0
        category_diversity = len(data["categories"])
 
        if max_count == min_count:
            count_score = 0.5
        else:
            count_score = (count - min_count) / (max_count - min_count)
 
        sentiment_score = (avg_sentiment + 1) / 2
        diversity_penalty = min(category_diversity / 7, 1.0)
 
        raw_score = (
            (1 - count_score) * 0.5 +
            sentiment_score * 0.35 +
            (1 - diversity_penalty) * 0.15
        )
        final_score = round(raw_score * 100, 1)
 
        scores.append({
            "ward": ward,
            "score": final_score,
            "total_complaints": count,
            "avg_sentiment": round(avg_sentiment, 3),
            "categories": list(data["categories"]),
            "category_count": category_diversity
        })
 
    scores.sort(key=lambda x: x["score"], reverse=True)
    for i, s in enumerate(scores):
        s["rank"] = i + 1
 
    return scores