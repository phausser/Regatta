from flask import Flask, request, jsonify
import sqlite3
import hashlib
import secrets
import time
from datetime import datetime
import json

app = Flask(__name__)

# ====================== DB SETUP ======================
def init_db():
    conn = sqlite3.connect('highscores.db')
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
    conn = sqlite3.connect('highscores.db')
    conn.row_factory = sqlite3.Row
    return conn

def hash_score(time_val, secret, playername):
    data = f"{time_val}:{secret}:{playername}"
    return hashlib.sha256(data.encode('utf-8')).hexdigest()

# ====================== ROUTES ======================

@app.route('/start-session', methods=['POST'])
def start_session():
    data = request.get_json() or {}
    fingerprint = json.dumps(data.get('fingerprint', {}), sort_keys=True)
    
    session_id = secrets.token_hex(16)
    secret = secrets.token_hex(32)
    
    conn = get_db()
    conn.execute("INSERT INTO sessions (id, fingerprint, secret, created_at) VALUES (?, ?, ?, ?)",
                 (session_id, fingerprint, secret, time.time()))
    conn.commit()
    conn.close()
    
    return jsonify({
        "session_id": session_id,
        "secret": secret,
        "expires_in": 600
    })

@app.route('/submit-score', methods=['POST'])
def submit_score():
    data = request.get_json() or {}
    fingerprint = json.dumps(data.get('fingerprint', {}), sort_keys=True)
    time_val = data.get('time')
    playername = data.get('playername', 'Anonymous').strip()[:30]
    client_hash = data.get('hash')
    session_id = data.get('session_id')

    if not all([fingerprint, time_val is not None, client_hash, session_id]):
        return jsonify({"error": "Missing data"}), 400

    conn = get_db()
    session = conn.execute("SELECT * FROM sessions WHERE id = ?", (session_id,)).fetchone()
    
    if not session:
        conn.close()
        return jsonify({"error": "Invalid session"}), 403

    if time.time() - session['created_at'] > 600:
        conn.close()
        return jsonify({"error": "Session expired"}), 403

    # Hash + Fingerprint prüfen
    expected_hash = hash_score(time_val, session['secret'], playername)
    if expected_hash != client_hash or session['fingerprint'] != fingerprint:
        conn.close()
        return jsonify({"error": "Validation failed"}), 403

    # Speichern
    now = datetime.now().isoformat()
    conn.execute("INSERT INTO highscores (playername, time, fingerprint, created_at) VALUES (?, ?, ?, ?)",
                 (playername, float(time_val), fingerprint, now))
    conn.execute("DELETE FROM sessions WHERE id = ?", (session_id,))
    conn.commit()
    conn.close()

    return jsonify({"success": True})

@app.route('/leaderboard', methods=['GET'])
def leaderboard():
    limit = min(int(request.args.get('limit', 5)), 100)
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
    print("🚤 Regatta Highscore Server läuft → http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)
