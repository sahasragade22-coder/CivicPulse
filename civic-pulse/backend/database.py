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
         citizen_name, citizen_email, priority, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
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
        complaint.get("priority", "Normal")
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
 
def get_all_complaints() -> list:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM complaints ORDER BY date DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]
 
def get_complaints_by_ward(ward: str) -> list:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM complaints WHERE ward = ? ORDER BY date DESC", (ward,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]
