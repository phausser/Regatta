from flask import Flask, request, jsonify
import sqlite3
import hashlib
import secrets
import time
from datetime import datetime
import json
import os
from pathlib import Path

app = Flask(__name__)
ALLOWED_ORIGINS = {
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://phausser.github.io",
    "null",
}

DB_PATH = Path(__file__).with_name("highscores.db")
SESSION_TTL_SECONDS = 3600
SUBMIT_GRACE_SECONDS = 600

@app.after_request
def add_cors_headers(response):
    origin = request.headers.get("Origin")
    if origin in ALLOWED_ORIGINS:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Vary"] = "Origin"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    return response

# ====================== DB SETUP ======================
def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS sessions (
                    id TEXT PRIMARY KEY,
                    fingerprint TEXT,
                    secret TEXT,
                    created_at REAL
                 )''')
    c.execute('''CREATE TABLE IF NOT EXISTS highscores (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    playername TEXT,
                    time REAL,
                    fingerprint TEXT,
                    created_at TEXT
                 )''')
    conn.commit()
    conn.close()

init_db()

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def cleanup_sessions(conn):
    expires_before = time.time() - SESSION_TTL_SECONDS
    conn.execute("DELETE FROM sessions WHERE created_at < ?", (expires_before,))

def browser_signature():
    data = {
        "user_agent": request.headers.get("User-Agent", ""),
        "accept_language": request.headers.get("Accept-Language", ""),
        "accept": request.headers.get("Accept", ""),
        "sec_ch_ua": request.headers.get("Sec-Ch-Ua", ""),
        "sec_ch_ua_platform": request.headers.get("Sec-Ch-Ua-Platform", ""),
        "sec_ch_ua_mobile": request.headers.get("Sec-Ch-Ua-Mobile", ""),
    }
    return json.dumps(data, sort_keys=True)

def hash_score(time_val, secret, playername):
    data = f"{time_val}:{secret}:{playername}"
    return hashlib.sha256(data.encode('utf-8')).hexdigest()

# ====================== ROUTES ======================

@app.route('/start-session', methods=['POST'])
def start_session():
    fingerprint = browser_signature()

    session_id = secrets.token_hex(16)
    secret = secrets.token_hex(32)

    conn = get_db()
    cleanup_sessions(conn)
    conn.execute("INSERT INTO sessions (id, fingerprint, secret, created_at) VALUES (?, ?, ?, ?)",
                 (session_id, fingerprint, secret, time.time()))
    conn.commit()
    conn.close()

    return jsonify({
        "session_id": session_id,
        "secret": secret,
        "expires_in": SESSION_TTL_SECONDS
    })

@app.route('/submit-score', methods=['POST'])
def submit_score():
    data = request.get_json() or {}
    fingerprint = browser_signature()
    time_val = data.get('time')
    playername = str(data.get('playername') or 'Anonymous').strip()[:30] or 'Anonymous'
    client_hash = data.get('hash')
    session_id = data.get('session_id')

    if not all([time_val is not None, client_hash, session_id]):
        return jsonify({"error": "Missing data"}), 400

    try:
        score_time = float(time_val)
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid time"}), 400

    if score_time <= 180 or score_time >= 3600:
        return jsonify({"error": "Implausible time"}), 400

    conn = get_db()
    session = conn.execute("SELECT * FROM sessions WHERE id = ?", (session_id,)).fetchone()

    if not session:
        conn.close()
        return jsonify({"error": "Invalid session"}), 403

    session_age = time.time() - session['created_at']
    if session_age > SESSION_TTL_SECONDS:
        conn.close()
        return jsonify({"error": "Session expired"}), 403

    if score_time + SUBMIT_GRACE_SECONDS < session_age:
        conn.close()
        return jsonify({"error": "Score time shorter than session age"}), 400

    # Hash + Fingerprint prüfen
    expected_hash = hash_score(time_val, session['secret'], playername)
    if expected_hash != client_hash or session['fingerprint'] != fingerprint:
        conn.close()
        return jsonify({"error": "Validation failed"}), 403

    # Speichern
    now = datetime.now().isoformat()
    conn.execute("INSERT INTO highscores (playername, time, fingerprint, created_at) VALUES (?, ?, ?, ?)",
                 (playername, score_time, fingerprint, now))
    conn.execute("DELETE FROM sessions WHERE id = ?", (session_id,))
    conn.commit()
    conn.close()

    return jsonify({"success": True})

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"ok": True})

@app.route('/leaderboard', methods=['GET'])
def leaderboard():
    try:
        limit = int(request.args.get('limit', 5))
    except (TypeError, ValueError):
        limit = 5
    limit = max(1, min(limit, 100))

    conn = get_db()
    rows = conn.execute("""
        SELECT playername, time, created_at
        FROM highscores
        ORDER BY time ASC
        LIMIT ?
    """, (limit,)).fetchall()
    conn.close()

    return jsonify([dict(row) for row in rows])

if __name__ == '__main__':
    port = int(os.environ.get("PORT", "5000"))
    print(f"🚤 Regatta Highscore Server läuft → http://localhost:{port}")
    debug = os.environ.get("FLASK_DEBUG") == "1"
    app.run(host='0.0.0.0', port=port, debug=debug)
