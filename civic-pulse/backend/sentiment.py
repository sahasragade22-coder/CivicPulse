from textblob import TextBlob
 
def analyze_sentiment(text: str) -> float:
    if not text or not text.strip():
        return 0.0
    blob = TextBlob(text)
    return round(blob.sentiment.polarity, 4)