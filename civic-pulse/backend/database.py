import sqlite3
import os
 
DB_PATH = os.path.join(os.path.dirname(__file__), "civic_pulse.db")
 
def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn
 
def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS complaints (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            text TEXT NOT NULL,
            ward TEXT DEFAULT 'Unknown',
            sentiment REAL DEFAULT 0.0,
            category TEXT DEFAULT 'Other',
            date TEXT DEFAULT '2024-01-01',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'citizen',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    for statement in [
        "ALTER TABLE complaints ADD COLUMN title TEXT DEFAULT ''",
        "ALTER TABLE complaints ADD COLUMN address TEXT DEFAULT ''",
        "ALTER TABLE complaints ADD COLUMN photo_url TEXT DEFAULT ''",
        "ALTER TABLE complaints ADD COLUMN status TEXT DEFAULT 'Open'",
        "ALTER TABLE complaints ADD COLUMN citizen_name TEXT DEFAULT ''",
        "ALTER TABLE complaints ADD COLUMN citizen_email TEXT DEFAULT ''",
        "ALTER TABLE complaints ADD COLUMN priority TEXT DEFAULT 'Normal'",
        "ALTER TABLE complaints ADD COLUMN updated_at TEXT DEFAULT ''",
        "ALTER TABLE complaints ADD COLUMN severity TEXT DEFAULT 'Medium'",
        "ALTER TABLE complaints ADD COLUMN latitude REAL DEFAULT NULL",
        "ALTER TABLE complaints ADD COLUMN longitude REAL DEFAULT NULL",
        "ALTER TABLE complaints ADD COLUMN assigned_to INTEGER DEFAULT NULL",
        "ALTER TABLE complaints ADD COLUMN resolution_notes TEXT DEFAULT ''",
        "ALTER TABLE complaints ADD COLUMN duplicate_of INTEGER DEFAULT NULL",
        "ALTER TABLE complaints ADD COLUMN is_duplicate INTEGER DEFAULT 0",
        "ALTER TABLE complaints ADD COLUMN language TEXT DEFAULT 'en'",
        "ALTER TABLE complaints ADD COLUMN original_text TEXT DEFAULT ''",
    ]:
        try:
            cursor.execute(statement)
        except sqlite3.OperationalError:
            pass
    conn.commit()
    conn.close()
 
def insert_complaint(complaint: dict):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM complaints WHERE text = ? AND date = ?",
                   (complaint.get("text", ""), complaint.get("date", "")))
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
            INSERT INTO complaints (text, ward, sentiment, category, date)
            VALUES (?, ?, ?, ?, ?)
        """, (
            complaint.get("text", ""),
            complaint.get("ward", "Unknown"),
            complaint.get("sentiment", 0.0),
            complaint.get("category", "Other"),
            complaint.get("date", "2024-01-01")
        ))
        conn.commit()
    conn.close()

def create_user(user: dict):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO users (name, email, password, role)
        VALUES (?, ?, ?, ?)
    """, (
        user.get("name", ""),
        user.get("email", "").lower(),
        user.get("password", ""),
        user.get("role", "citizen")
    ))
    conn.commit()
    user_id = cursor.lastrowid
    conn.close()
    return get_user_by_id(user_id)

def get_user_by_id(user_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, email, role, created_at FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def get_user_by_email(email: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (email.lower(),))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def insert_issue(complaint: dict):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO complaints
        (title, text, ward, address, photo_url, sentiment, category, date, status,
         citizen_name, citizen_email, priority, updated_at, severity, latitude, longitude,
         assigned_to, resolution_notes, duplicate_of, is_duplicate, language, original_text)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, ?, ?,
                ?, ?, ?, ?, ?, ?)
    """, (
        complaint.get("title", ""),
        complaint.get("text", ""),
        complaint.get("ward", "Unknown"),
        complaint.get("address", ""),
        complaint.get("photo_url", ""),
        complaint.get("sentiment", 0.0),
        complaint.get("category", "Other"),
        complaint.get("date", "2024-01-01"),
        complaint.get("status", "Open"),
        complaint.get("citizen_name", ""),
        complaint.get("citizen_email", ""),
        complaint.get("priority", "Normal"),
        complaint.get("severity", "Medium"),
        complaint.get("latitude"),
        complaint.get("longitude"),
        complaint.get("assigned_to"),
        complaint.get("resolution_notes", ""),
        complaint.get("duplicate_of"),
        complaint.get("is_duplicate", 0),
        complaint.get("language", "en"),
        complaint.get("original_text", "")
    ))
    conn.commit()
    complaint_id = cursor.lastrowid
    conn.close()
    return get_complaint_by_id(complaint_id)

def get_complaint_by_id(complaint_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM complaints WHERE id = ?", (complaint_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def update_complaint_status(complaint_id: int, status: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE complaints
        SET status = ?, updated_at = datetime('now')
        WHERE id = ?
    """, (status, complaint_id))
    conn.commit()
    conn.close()
    return get_complaint_by_id(complaint_id)

def get_all_complaints():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM complaints ORDER BY id DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_complaints_by_ward(ward: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM complaints WHERE ward = ? ORDER BY id DESC", (ward,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_complaints_by_user(user_id: int):
    """Get complaints filed by a specific citizen"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM complaints 
        WHERE citizen_email = (SELECT email FROM users WHERE id = ?)
        ORDER BY id DESC
    """, (user_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def update_complaint_severity(complaint_id: int, severity: str):
    """Update severity level of a complaint"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE complaints
        SET severity = ?, updated_at = datetime('now')
        WHERE id = ?
    """, (severity, complaint_id))
    conn.commit()
    conn.close()
    return get_complaint_by_id(complaint_id)

def update_complaint_location(complaint_id: int, latitude: float, longitude: float):
    """Update geographic location of a complaint"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE complaints
        SET latitude = ?, longitude = ?, updated_at = datetime('now')
        WHERE id = ?
    """, (latitude, longitude, complaint_id))
    conn.commit()
    conn.close()
    return get_complaint_by_id(complaint_id)

def assign_complaint(complaint_id: int, officer_id: int):
    """Assign complaint to an officer"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE complaints
        SET assigned_to = ?, status = 'In Progress', updated_at = datetime('now')
        WHERE id = ?
    """, (officer_id, complaint_id))
    conn.commit()
    conn.close()
    return get_complaint_by_id(complaint_id)

def add_resolution_notes(complaint_id: int, notes: str):
    """Add resolution notes to a complaint"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE complaints
        SET resolution_notes = ?, updated_at = datetime('now')
        WHERE id = ?
    """, (notes, complaint_id))
    conn.commit()
    conn.close()
    return get_complaint_by_id(complaint_id)

def get_complaints_near_location(latitude: float, longitude: float, radius_km: float = 1.0):
    """Get complaints within a geographic radius (simplified distance calc)"""
    conn = get_connection()
    cursor = conn.cursor()
    # Simple bounding box (1 km ≈ 0.009 degrees)
    delta = radius_km * 0.009
    cursor.execute("""
        SELECT * FROM complaints
        WHERE latitude IS NOT NULL AND longitude IS NOT NULL
        AND latitude BETWEEN ? AND ?
        AND longitude BETWEEN ? AND ?
        ORDER BY id DESC
    """, (
        latitude - delta, latitude + delta,
        longitude - delta, longitude + delta
    ))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_complaints_by_severity(severity: str):
    """Get complaints of a specific severity level"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM complaints
        WHERE severity = ?
        ORDER BY id DESC
    """, (severity,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def calculate_text_similarity(text1: str, text2: str) -> float:
    """Calculate text similarity using token-based comparison (0.0 to 1.0)"""
    import difflib
    # Normalize text
    text1 = text1.lower().strip()
    text2 = text2.lower().strip()
    
    # Use SequenceMatcher to calculate ratio
    matcher = difflib.SequenceMatcher(None, text1, text2)
    return matcher.ratio()

def calculate_location_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate approximate distance in kilometers using Haversine formula"""
    from math import radians, cos, sin, asin, sqrt
    
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))
    r = 6371  # Radius of earth in kilometers
    return c * r

def find_similar_complaints(complaint_id: int, title: str, text: str, category: str, latitude: float = None, longitude: float = None, similarity_threshold: float = 0.6):
    """Find similar complaints based on text similarity and location proximity"""
    conn = get_connection()
    cursor = conn.cursor()
    
    # Get recent Open complaints (last 30 days)
    cursor.execute("""
        SELECT id, title, text, category, latitude, longitude, severity, citizen_name, citizen_email, date
        FROM complaints
        WHERE id != ? AND status = 'Open' AND severity IN ('Critical', 'High', 'Medium')
        AND datetime(date) > datetime('now', '-30 days')
        LIMIT 50
    """, (complaint_id,))
    
    recent_complaints = cursor.fetchall()
    conn.close()
    
    similar_complaints = []
    
    for complaint in recent_complaints:
        complaint_dict = dict(complaint)
        
        # Check text similarity
        text_sim = calculate_text_similarity(text, complaint_dict.get('text', ''))
        title_sim = calculate_text_similarity(title, complaint_dict.get('title', ''))
        combined_text_sim = (text_sim + title_sim) / 2
        
        # Check location proximity (if coordinates available)
        location_match = False
        distance = None
        if latitude and longitude and complaint_dict.get('latitude') and complaint_dict.get('longitude'):
            distance = calculate_location_distance(
                latitude, longitude,
                complaint_dict['latitude'], complaint_dict['longitude']
            )
            location_match = distance < 0.5  # Within 500 meters
        
        # Mark as similar if text similarity is high OR (text is moderate AND location matches)
        if combined_text_sim >= similarity_threshold or (combined_text_sim >= 0.4 and location_match):
            similar_complaints.append({
                'id': complaint_dict['id'],
                'title': complaint_dict['title'],
                'text': complaint_dict['text'],
                'category': complaint_dict['category'],
                'severity': complaint_dict['severity'],
                'citizen_name': complaint_dict.get('citizen_name'),
                'citizen_email': complaint_dict.get('citizen_email'),
                'date': complaint_dict['date'],
                'latitude': complaint_dict.get('latitude'),
                'longitude': complaint_dict.get('longitude'),
                'text_similarity': round(combined_text_sim, 2),
                'distance_km': round(distance, 2) if distance else None,
                'match_type': 'text' if combined_text_sim >= similarity_threshold else 'location'
            })
    
    # Sort by similarity score (highest first)
    similar_complaints.sort(key=lambda x: x['text_similarity'], reverse=True)
    return similar_complaints[:5]  # Return top 5 similar

def mark_as_duplicate(original_complaint_id: int, duplicate_complaint_id: int):
    """Mark a complaint as duplicate of another"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE complaints
        SET duplicate_of = ?, is_duplicate = 1, updated_at = datetime('now')
        WHERE id = ?
    """, (original_complaint_id, duplicate_complaint_id))
    conn.commit()
    conn.close()
    return get_complaint_by_id(duplicate_complaint_id)
