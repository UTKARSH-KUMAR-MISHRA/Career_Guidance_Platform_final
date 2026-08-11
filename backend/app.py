# backend/app.py
import os
import sqlite3
import re
import json
import tempfile
import time
from datetime import datetime, timezone

from flask import Flask, g, request, jsonify, session, send_from_directory, make_response
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv

# Load backend/.env before importing rag/sarvam_client
env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(env_path)

from rag import answer_question, detect_hallucination
from data_loader import data_loader
from sarvam_client import (
    speech_to_text,
    text_to_speech,
    digitize_document,
    wait_for_job_completion
)

import logging

FRONTEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'frontend'))

app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path='')
app.secret_key = os.urandom(24)
CORS(app, supports_credentials=True)
logging.basicConfig(level=logging.INFO)

DB_PATH = os.path.join(os.path.dirname(__file__), "users.db")
EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
LOG_FILE = "metrics.log"

# ---- Serve Frontend UI & Static Files ----
@app.route('/')
def serve_index():
    return send_from_directory(FRONTEND_DIR, 'index.html')

@app.route('/<path:path>')
def serve_frontend_assets(path):
    if os.path.exists(os.path.join(FRONTEND_DIR, path)):
        return send_from_directory(FRONTEND_DIR, path)
    return send_from_directory(FRONTEND_DIR, 'index.html')

@app.route('/static/images/<path:filename>')
def serve_image(filename):
    return send_from_directory('static/images', filename)

# ---- Database helpers ----
def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys = ON")
    return g.db

@app.teardown_appcontext
def close_db(exception=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()

def init_db():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            college TEXT DEFAULT 'Jaipur Institute',
            branch TEXT DEFAULT 'CSE',
            year TEXT DEFAULT '3rd Year',
            target_role TEXT DEFAULT 'AI Engineer',
            skills TEXT DEFAULT '["Python", "SQL"]',
            progress TEXT DEFAULT '{}',
            daily_time TEXT DEFAULT '2 hours',
            notes TEXT DEFAULT '',
            created_at TEXT NOT NULL
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS user_todos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            text TEXT NOT NULL,
            done INTEGER DEFAULT 0,
            created_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS user_chats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            thread_id TEXT NOT NULL,
            title TEXT NOT NULL,
            messages TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS community_queries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            author_name TEXT NOT NULL,
            title TEXT NOT NULL,
            category TEXT DEFAULT 'General',
            content TEXT NOT NULL,
            upvotes INTEGER DEFAULT 0,
            answers TEXT DEFAULT '[]',
            created_at TEXT NOT NULL
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS chat_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            sender TEXT NOT NULL,
            message TEXT NOT NULL,
            citations TEXT DEFAULT '[]',
            image_url TEXT DEFAULT '',
            timestamp TEXT NOT NULL
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS feedback (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            message_id TEXT,
            type TEXT,
            answer TEXT,
            timestamp TEXT NOT NULL
        )
    """)
    
    # ALTER table safely for existing DB files
    cols_to_add = [
        ('college', "TEXT DEFAULT 'Jaipur Institute'"),
        ('branch', "TEXT DEFAULT 'CSE'"),
        ('year', "TEXT DEFAULT '3rd Year'"),
        ('target_role', "TEXT DEFAULT 'AI Engineer'"),
        ('skills', "TEXT DEFAULT '[\"Python\", \"SQL\"]'"),
        ('progress', "TEXT DEFAULT '{}'"),
        ('daily_time', "TEXT DEFAULT '2 hours'"),
        ('notes', "TEXT DEFAULT ''"),
        ('age', "TEXT DEFAULT '21'"),
        ('passout_year', "TEXT DEFAULT '2026'"),
        ('interests', "TEXT DEFAULT '[\"AI & Machine Learning\", \"Full Stack Development\"]'"),
        ('bio', "TEXT DEFAULT 'Engineering student preparing for technology placement roles.'"),
        ('points', "INTEGER DEFAULT 0"),
        ('level', "INTEGER DEFAULT 1"),
        ('streak_days', "INTEGER DEFAULT 0"),
        ('badges', "TEXT DEFAULT '[]'"),
        ('language', "TEXT DEFAULT 'en'"),
        ('last_login', "TEXT")
    ]
    for col_name, col_def in cols_to_add:
        try:
            conn.execute(f"ALTER TABLE users ADD COLUMN {col_name} {col_def}")
        except sqlite3.OperationalError:
            pass
    conn.commit()
    conn.close()

init_db()

# Helper to fetch full user payload from SQLite
def build_user_payload(user_id, db):
    u = db.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    if not u:
        return None
    
    todos_rows = db.execute("SELECT id, text, done FROM user_todos WHERE user_id = ? ORDER BY id ASC", (user_id,)).fetchall()
    todos = [{"id": t["id"], "text": t["text"], "done": bool(t["done"])} for t in todos_rows]
    
    chats_rows = db.execute("SELECT thread_id, title, messages FROM user_chats WHERE user_id = ? ORDER BY id DESC", (user_id,)).fetchall()
    chat_threads = []
    for c in chats_rows:
        try:
            msgs = json.loads(c["messages"])
        except Exception:
            msgs = []
        chat_threads.append({
            "id": c["thread_id"],
            "title": c["title"],
            "messages": msgs
        })
    
    skills = []
    try:
        skills = json.loads(u["skills"]) if u["skills"] else ["Python", "SQL"]
    except Exception:
        skills = ["Python", "SQL"]
        
    progress = {}
    try:
        progress = json.loads(u["progress"]) if u["progress"] else {}
    except Exception:
        progress = {}

    interests = []
    try:
        interests = json.loads(u["interests"]) if u["interests"] else ["AI & Machine Learning", "Full Stack Development"]
    except Exception:
        interests = ["AI & Machine Learning", "Full Stack Development"]

    badges = []
    if "badges" in u.keys() and u["badges"]:
        try:
            badges = json.loads(u["badges"])
        except:
            pass

    return {
        "user_id": u["id"],
        "full_name": u["full_name"],
        "email": u["email"],
        "age": u["age"] if "age" in u.keys() and u["age"] else "21",
        "college": u["college"] or "Jaipur Institute",
        "branch": u["branch"] or "CSE",
        "year": u["year"] or "3rd Year",
        "passout_year": u["passout_year"] if "passout_year" in u.keys() and u["passout_year"] else "2026",
        "target_role": u["target_role"] or "AI Engineer",
        "interests": interests,
        "bio": u["bio"] if "bio" in u.keys() and u["bio"] else "Engineering student preparing for technology placement roles.",
        "skills": skills,
        "progress": progress,
        "daily_time": u["daily_time"] or "2 hours",
        "notes": u["notes"] or "",
        "todos": todos,
        "chat_threads": chat_threads,
        "points": u["points"] if "points" in u.keys() else 0,
        "level": u["level"] if "level" in u.keys() else 1,
        "streak_days": u["streak_days"] if "streak_days" in u.keys() else 0,
        "badges": badges,
        "language": u["language"] if "language" in u.keys() and u["language"] else "en",
        "last_login": u["last_login"] if "last_login" in u.keys() else ""
    }

# ===================== AUTH & SYNC ROUTES =====================
@app.route('/api/auth/register', methods=['POST'])
def api_auth_register():
    data = request.get_json(silent=True) or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    full_name = data.get("full_name", "").strip()
    college = data.get("college", "Jaipur Institute")
    branch = data.get("branch", "CSE")
    year = data.get("year", "3rd Year")
    target_role = data.get("target_role", "AI Engineer")

    if not email or not password or not full_name:
        return jsonify(ok=False, error="Full Name, Email, and Password are required."), 400

    db = get_db()
    existing = db.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
    if existing:
        return jsonify(ok=False, error="An account with this email already exists."), 400

    pw_hash = generate_password_hash(password)
    now_iso = datetime.now(timezone.utc).isoformat()

    cursor = db.execute("""
        INSERT INTO users (full_name, email, password_hash, college, branch, year, target_role, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (full_name, email, pw_hash, college, branch, year, target_role, now_iso))
    db.commit()

    user_id = cursor.lastrowid
    session["user_id"] = user_id

    payload = build_user_payload(user_id, db)
    return jsonify(ok=True, data=payload)

@app.route('/api/auth/login', methods=['POST'])
def api_auth_login():
    data = request.get_json(silent=True) or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify(ok=False, error="Email and password are required."), 400

    db = get_db()
    user = db.execute("SELECT id, password_hash FROM users WHERE email = ?", (email,)).fetchone()
    if not user or not check_password_hash(user["password_hash"], password):
        return jsonify(ok=False, error="Invalid email or password."), 401

    session["user_id"] = user["id"]
    
    # Update last_login
    now_iso = datetime.now(timezone.utc).isoformat()
    try:
        db.execute("UPDATE users SET last_login = ? WHERE id = ?", (now_iso, user["id"]))
        db.commit()
    except:
        pass
        
    payload = build_user_payload(user["id"], db)
    return jsonify(ok=True, data=payload)

@app.route('/api/auth/logout', methods=['POST'])
def api_auth_logout():
    session.clear()
    return jsonify(ok=True)

@app.route('/api/auth/session', methods=['GET'])
def api_auth_session():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify(logged_in=False)
    
    db = get_db()
    payload = build_user_payload(user_id, db)
    if not payload:
        session.clear()
        return jsonify(logged_in=False)
        
    return jsonify(logged_in=True, data=payload)

@app.route('/api/user/sync', methods=['POST'])
def api_user_sync():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify(ok=False, error="Unauthorized. Please log in."), 401
    
    data = request.get_json(silent=True) or {}
    db = get_db()
    
    # Update profile fields if provided
    profile = data.get("profile")
    if profile and isinstance(profile, dict):
        full_name = profile.get("full_name")
        email = profile.get("email")
        age = profile.get("age", "21")
        college = profile.get("college")
        branch = profile.get("branch")
        year = profile.get("year")
        passout_year = profile.get("passout_year", "2026")
        target_role = profile.get("target_role")
        bio = profile.get("bio", "")
        interests = json.dumps(profile.get("interests", ["AI & Machine Learning"]))
        skills = json.dumps(profile.get("skills", []))
        progress = json.dumps(profile.get("progress", {}))
        daily_time = profile.get("daily_time", "2 hours")
        language = profile.get("language", "en")
        
        db.execute("""
            UPDATE users SET 
                full_name = COALESCE(?, full_name),
                email = COALESCE(?, email),
                age = COALESCE(?, age),
                college = COALESCE(?, college),
                branch = COALESCE(?, branch),
                year = COALESCE(?, year),
                passout_year = COALESCE(?, passout_year),
                target_role = COALESCE(?, target_role),
                bio = COALESCE(?, bio),
                interests = ?,
                skills = ?,
                progress = ?,
                daily_time = ?,
                language = COALESCE(?, language)
            WHERE id = ?
        """, (full_name, email, age, college, branch, year, passout_year, target_role, bio, interests, skills, progress, daily_time, language, user_id))

    # Update scratchpad notes
    if "notes" in data:
        db.execute("UPDATE users SET notes = ? WHERE id = ?", (str(data["notes"]), user_id))

    # Update to-dos
    if "todos" in data and isinstance(data["todos"], list):
        db.execute("DELETE FROM user_todos WHERE user_id = ?", (user_id,))
        for t in data["todos"]:
            db.execute("INSERT INTO user_todos (user_id, text, done, created_at) VALUES (?, ?, ?, ?)",
                       (user_id, str(t.get("text", "")), 1 if t.get("done") else 0, datetime.now(timezone.utc).isoformat()))

    # Update chat threads
    if "chat_threads" in data and isinstance(data["chat_threads"], list):
        db.execute("DELETE FROM user_chats WHERE user_id = ?", (user_id,))
        for thread in data["chat_threads"]:
            thread_id = str(thread.get("id", time.time()))
            title = str(thread.get("title", "Conversation"))
            msgs_json = json.dumps(thread.get("messages", []))
            db.execute("INSERT INTO user_chats (user_id, thread_id, title, messages, updated_at) VALUES (?, ?, ?, ?, ?)",
                       (user_id, thread_id, title, msgs_json, datetime.now(timezone.utc).isoformat()))

    db.commit()
    updated_payload = build_user_payload(user_id, db)
    return jsonify(ok=True, data=updated_payload)

@app.route('/api/profile', methods=['GET'])
def get_profile():
    if 'user' not in session:
        return jsonify({"error": "Not logged in"}), 401
    db = get_db()
    user = db.execute("SELECT skills, progress, last_lesson FROM users WHERE id = ?", (session['user']['id'],)).fetchone()
    return jsonify({
        "skills": json.loads(user['skills']) if user['skills'] else [],
        "progress": json.loads(user['progress']) if user['progress'] else {},
        "last_lesson": user['last_lesson'] or ''
    })

@app.route('/api/profile', methods=['POST'])
def update_profile():
    if 'user' not in session:
        return jsonify({"error": "Not logged in"}), 401
    data = request.get_json()
    skills = data.get('skills')
    progress = data.get('progress')
    last_lesson = data.get('last_lesson')
    db = get_db()
    if skills is not None:
        db.execute("UPDATE users SET skills = ? WHERE id = ?", (json.dumps(skills), session['user']['id']))
        session['profile']['skills'] = skills
    if progress is not None:
        db.execute("UPDATE users SET progress = ? WHERE id = ?", (json.dumps(progress), session['user']['id']))
        session['profile']['progress'] = progress
    if last_lesson is not None:
        db.execute("UPDATE users SET last_lesson = ? WHERE id = ?", (last_lesson, session['user']['id']))
        session['profile']['last_lesson'] = last_lesson
    db.commit()
    return jsonify({"success": True})

# ===================== RAG ROUTE =====================
def log_metric(endpoint, question, response_time, out_of_scope, citation_count):
    """Log metrics for debugging and analytics."""
    import json
    import time
    try:
        with open("metrics.log", "a") as f:
            f.write(json.dumps({
                "timestamp": time.time(),
                "endpoint": endpoint,
                "question": question[:100],  # truncate to save space
                "response_time": response_time,
                "out_of_scope": out_of_scope,
                "citation_count": citation_count
            }) + "\n")
    except Exception as e:
        # Fail silently so the main request doesn't break
        print(f"⚠️ Metric logging failed: {e}")

@app.route('/api/v1/ask', methods=['POST'])
def ask():
    data = request.get_json(silent=True) or {}
    question = data.get('question')
    if not question:
        return jsonify({"error": "No question provided"}), 400

    language = data.get('language', 'en')
    profile = session.get("profile")
    history = session.get("chat_history", [])

    start_time = time.time()
    try:
        result = answer_question(question, history, profile, data_loader, language=language)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Failed to generate answer: {str(e)}"}), 500
        
    elapsed_ms = int((time.time() - start_time) * 1000)

    # Log metrics
    log_metric(
        endpoint="/api/v1/ask",
        question=question,
        response_time=elapsed_ms,
        out_of_scope=result.get("out_of_scope", False),
        citation_count=len(result.get("citations", []))
    )

    if "user" in session:
        if "chat_history" not in session:
            session["chat_history"] = []
        session["chat_history"].append({
            "user": question,
            "assistant": result.get("answer", "")
        })
    return jsonify(result)

# ===================== HEALTH CHECK =====================
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok"})

# ===================== DOCUMENT VIEWER ROUTE =====================
@app.route('/api/doc/<path:filename>', methods=['GET'])
def get_doc(filename):
    docs_dir = os.path.join(os.path.dirname(__file__), "docs")
    filepath = os.path.join(docs_dir, filename)
    if not os.path.exists(filepath):
        return jsonify({"error": "Document not found", "filename": filename}), 404
    try:
        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
        return jsonify({"filename": filename, "content": content})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ===================== NEW ENDPOINTS =====================

@app.route('/api/roles', methods=['GET'])
def get_roles():
    roles = [{"title": r.get("role_name") or r.get("title") or r.get("id"), "id": r.get("id")} for r in data_loader.roles]
    return jsonify(roles)

@app.route('/api/skill-gap', methods=['POST'])
def skill_gap():
    data = request.get_json() or {}
    role_name = data.get('role', 'AI Engineer')
    user_skills = set(data.get('skills', []))

    role = None
    role_lower = role_name.lower()
    for r in data_loader.roles:
        t_lower = (r.get("role_name") or r.get("title") or "").lower()
        if role_lower == t_lower or role_lower in t_lower or t_lower in role_lower:
            role = r
            break

    if not role and data_loader.roles:
        role = data_loader.roles[0]

    raw_reqs = role.get("required_skills") or role.get("skills") or ["Python", "SQL", "Git"]
    required_skills = set(raw_reqs[:10]) if isinstance(raw_reqs, list) else {"Python", "SQL", "Git"}
    missing_skills = list(required_skills - user_skills)
    matched_skills = list(user_skills & required_skills)
    completion = round((len(matched_skills) / len(required_skills)) * 100) if required_skills else 65

    # Find resources for missing skills (from skills.json)
    resources = []
    for skill_name in missing_skills:
        for s in data_loader.skills:
            if s.get("name", "").lower() == skill_name.lower():
                resources.append({
                    "skill": skill_name,
                    "avg_hours": s.get("avg_hours", 40),
                    "courses": s.get("recommended_courses", ["Coursera", "YouTube"])
                })
                break

    return jsonify({
        "role": (role.get("role_name") or role.get("title")) if role else role_name,
        "required_skills": list(required_skills),
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "completion_percent": completion,
        "resources": resources,
        "difficulty": role.get("difficulty_level") or role.get("difficulty", "Intermediate") if role else "Intermediate",
        "alternate_roles": []
    })

@app.route('/api/personalized-roadmap', methods=['POST'])
def personalized_roadmap():
    data = request.get_json() or {}
    role_name = data.get('role', 'AI Engineer')
    user_skills = data.get('skills', [])
    available_hours = data.get('available_hours', 10)

    role = None
    role_lower = role_name.lower()
    for r in data_loader.roles:
        t_lower = (r.get("role_name") or r.get("title") or "").lower()
        if role_lower == t_lower or role_lower in t_lower or t_lower in role_lower:
            role = r
            break

    if not role and data_loader.roles:
        role = data_loader.roles[0]

    roadmaps = data_loader.get_roadmaps_by_role(role.get("id")) if role else []
    raw_reqs = role.get("required_skills") or role.get("skills") or []
    required_skills = set(raw_reqs[:10]) if isinstance(raw_reqs, list) else set()
    missing_skills = required_skills - set(user_skills)

    filtered_phases = []
    for r in roadmaps:
        topic = r.get("topic", "")
        if any(skill.lower() in topic.lower() for skill in missing_skills) or not missing_skills:
            filtered_phases.append(r)

    total_hours = sum(r.get("est_hours", 0) for r in filtered_phases) or 80
    weeks = max(1, int(total_hours / available_hours))

    return jsonify({
        "role": (role.get("role_name") or role.get("title")) if role else role_name,
        "total_estimated_hours": total_hours,
        "weeks_to_complete": weeks,
        "phases": filtered_phases or [{"topic": "Foundations", "est_hours": 20, "status": "Active"}],
        "missing_skills": list(missing_skills)
    })

@app.route('/api/feedback', methods=['GET', 'POST'])
def feedback():
    db = get_db()
    if request.method == 'POST':
        data = request.get_json() or {}
        message_id = data.get('message_id', 'general')
        feedback_type = data.get('type', 'positive')
        answer_text = data.get('answer') or data.get('feedback', '')
        user_name = data.get('user_name', 'Student User')
        rating = data.get('rating', 5)

        db.execute(
            "INSERT INTO feedback (message_id, type, answer, timestamp) VALUES (?, ?, ?, ?)",
            (message_id, f"{feedback_type}|{user_name}|{rating}", answer_text, datetime.now(timezone.utc).isoformat())
        )
        db.commit()
        return jsonify({"success": True, "message": "Feedback submitted successfully!"})
    else:
        rows = db.execute("SELECT * FROM feedback ORDER BY id DESC LIMIT 20").fetchall()
        result = []
        for r in rows:
            meta_parts = (r['type'] or '').split('|')
            fb_type = meta_parts[0] if len(meta_parts) > 0 else 'general'
            author = meta_parts[1] if len(meta_parts) > 1 else 'Anonymous Student'
            rating = meta_parts[2] if len(meta_parts) > 2 else '5'
            result.append({
                "id": r['id'],
                "type": fb_type,
                "author": author,
                "rating": rating,
                "comment": r['answer'],
                "timestamp": r['timestamp']
            })
        return jsonify(result)

@app.route('/api/learning-resources', methods=['GET'])
def get_learning_resources():
    skill_filter = request.args.get('skill', '').strip().lower()
    category_filter = request.args.get('category', '').strip().lower()
    cost_filter = request.args.get('cost', '').strip().lower()

    resources = [
        {
            "id": "res_py_01",
            "title": "Python for Data Science & AI - Complete Bootcamp",
            "provider": "HCLTech Learning Portal & Coursera",
            "skill": "Python",
            "category": "Courses",
            "cost": "Free",
            "rating": 4.9,
            "est_hours": 32,
            "url": "https://www.coursera.org/learn/python-for-applied-data-science-ai",
            "description": "Master Python programming fundamentals, data structures, NumPy, Pandas, and AI library integration."
        },
        {
            "id": "res_sql_01",
            "title": "Modern SQL & Database Design Benchmark",
            "provider": "PostgreSQL & HCL Academy",
            "skill": "SQL",
            "category": "Docs",
            "cost": "Free",
            "rating": 4.8,
            "est_hours": 18,
            "url": "https://www.postgresql.org/docs/current/tutorial.html",
            "description": "Comprehensive tutorial covering complex joins, query optimization, indexing, and relational schemas."
        },
        {
            "id": "res_ml_01",
            "title": "Machine Learning Specialization by Andrew Ng",
            "provider": "DeepLearning.AI",
            "skill": "Machine Learning",
            "category": "Courses",
            "cost": "Certified",
            "rating": 4.95,
            "est_hours": 60,
            "url": "https://www.deeplearning.ai/courses/machine-learning-specialization/",
            "description": "Industry-standard introduction to supervised learning, neural networks, decision trees, and ML ops."
        },
        {
            "id": "res_cloud_01",
            "title": "AWS & Cloud Architecture Foundations",
            "provider": "AWS Skill Builder",
            "skill": "DevOps",
            "category": "Video Tutorials",
            "cost": "Free",
            "rating": 4.7,
            "est_hours": 24,
            "url": "https://aws.amazon.com/training/learn-about/cloud-practitioner/",
            "description": "Learn cloud infrastructure, EC2 instances, S3 storage, microservices deployment, and IAM security."
        },
        {
            "id": "res_dsa_01",
            "title": "LeetCode Patterns & Algorithm Masterclass",
            "provider": "Tech Interview Handbook",
            "skill": "System Design",
            "category": "Docs",
            "cost": "Free",
            "rating": 4.9,
            "est_hours": 45,
            "url": "https://www.techinterviewhandbook.org/grind75",
            "description": "Curated 75 top coding interview questions grouped by topic with optimal space/time complexity solutions."
        },
        {
            "id": "res_ai_01",
            "title": "LangChain & Vector DB RAG Architectures",
            "provider": "Pinecone & LangChain Official Docs",
            "skill": "Python",
            "category": "Books",
            "cost": "Free",
            "rating": 4.85,
            "est_hours": 28,
            "url": "https://python.langchain.com/docs/get_started/introduction",
            "description": "Build production-grade retrieval augmented generation applications using LLMs, embeddings, and vector stores."
        }
    ]

    filtered = []
    for r in resources:
        if skill_filter and skill_filter != 'all' and skill_filter not in r['skill'].lower():
            continue
        if category_filter and category_filter != 'all' and category_filter not in r['category'].lower():
            continue
        if cost_filter and cost_filter != 'all' and cost_filter not in r['cost'].lower():
            continue
        filtered.append(r)

    return jsonify(filtered)

@app.route('/api/admin/insights', methods=['GET'])
def get_admin_insights():
    db = get_db()
    feedback_rows = db.execute("SELECT * FROM feedback ORDER BY id DESC LIMIT 10").fetchall()
    feedback_list = []
    for r in feedback_rows:
        meta_parts = (r['type'] or '').split('|')
        author = meta_parts[1] if len(meta_parts) > 1 else 'Student User'
        rating = meta_parts[2] if len(meta_parts) > 2 else '5'
        feedback_list.append({
            "author": author,
            "rating": int(rating) if rating.isdigit() else 5,
            "comment": r['answer'],
            "date": r['timestamp'][:10] if r['timestamp'] else 'Recently'
        })

    return jsonify({
        "popular_roles": [
            {"role": "AI & ML Engineer", "count": 1420, "percentage": 34},
            {"role": "Full Stack Developer", "count": 980, "percentage": 24},
            {"role": "Cloud & DevOps Specialist", "count": 750, "percentage": 18},
            {"role": "Data Scientist & Analyst", "count": 620, "percentage": 15},
            {"role": "Cybersecurity Analyst", "count": 370, "percentage": 9}
        ],
        "common_skill_gaps": [
            {"skill": "System Design & Microservices", "gap_percentage": 68},
            {"skill": "Docker & Kubernetes Deployment", "gap_percentage": 59},
            {"skill": "Vector DBs & RAG Pipelines", "gap_percentage": 54},
            {"skill": "PyTorch & Deep Learning Models", "gap_percentage": 48},
            {"skill": "Advanced SQL & Query Optimization", "gap_percentage": 42}
        ],
        "usage_stats": {
            "active_students": 3280,
            "resumes_analyzed": 1450,
            "mock_interviews_completed": 890,
            "chat_queries_answered": 12450
        },
        "student_feedback": feedback_list or [
            {"author": "Aarav Sharma (CSE 4th Year)", "rating": 5, "comment": "The skill gap analysis and 30/60/90 day roadmap gave me clear direction for my HCLTech placement preparation!", "date": "2026-07-28"},
            {"author": "Priya Patel (IT 3rd Year)", "rating": 5, "comment": "ATS Resume Scanner helped me optimize my resume format and score 88%!", "date": "2026-07-29"}
        ]
    })

@app.route('/api/metrics', methods=['GET'])
def get_metrics():
    if not os.path.exists(LOG_FILE):
        return jsonify({"error": "No metrics available"}), 404

    metrics = []
    with open(LOG_FILE, "r") as f:
        for line in f:
            try:
                metrics.append(json.loads(line))
            except:
                continue

    total = len(metrics)
    out_of_scope = sum(1 for m in metrics if m.get('out_of_scope'))
    avg_citations = sum(m.get('citation_count', 0) for m in metrics) / total if total > 0 else 0

    return jsonify({
        "total_queries": total,
        "out_of_scope_rate": round(out_of_scope / total * 100, 2) if total > 0 else 0,
        "avg_citations": round(avg_citations, 2),
        "recent": metrics[-10:]
    })

@app.route('/api/project-recommendations', methods=['POST'])
def project_recommendations():
    data = request.get_json(silent=True) or {}
    user_skills = set(data.get('skills', []))
    role_name = (data.get('role') or '').strip().lower()

    projects_path = os.path.join(os.path.dirname(__file__), "data", "projects.json")
    try:
        with open(projects_path, "r", encoding="utf-8") as f:
            projects = json.load(f)
    except Exception as e:
        print(f"Error loading projects.json: {e}")
        projects = []

    recommended = []
    for p in projects:
        p_skills = set(p.get("skills", []))
        skill_score = len(p_skills & user_skills)
        
        role_score = 0
        if role_name:
            p_role = (p.get("role") or "").lower()
            p_title = (p.get("title") or "").lower()
            p_domain = (p.get("domain") or "").lower()
            aliases = [a.lower() for a in p.get("role_aliases", [])]
            
            if role_name == p_role or role_name in aliases:
                role_score = 100
            elif role_name in p_title or p_role in role_name or any(role_name in a or a in role_name for a in aliases):
                role_score = 50
            elif role_name in p_domain or p_domain in role_name:
                role_score = 20
        
        total_score = role_score + skill_score

        recommended.append({
            "id": p.get("id"),
            "title": p.get("title"),
            "role": p.get("role", "Engineering"),
            "role_aliases": p.get("role_aliases", []),
            "domain": p.get("domain", "Engineering"),
            "skills": list(p_skills),
            "match_score": total_score,
            "difficulty": p.get("difficulty", "Intermediate"),
            "time_estimate": p.get("time_estimate", "2 weeks"),
            "description": p.get("description", ""),
            "architecture": p.get("architecture", ""),
            "code_snippet": p.get("code_snippet", ""),
            "github_repo": p.get("github_repo", f"https://github.com/topics/{p.get('id', 'project')}")
        })

    # Sort by total match score descending
    recommended.sort(key=lambda x: x["match_score"], reverse=True)
    return jsonify(recommended)

@app.route('/api/interview-checklist', methods=['POST'])
def interview_checklist():
    data = request.get_json()
    role_name = data.get('role')

    role = None
    for r in data_loader.roles:
        if r.get("title", "").lower() == role_name.lower():
            role = r
            break

    if not role:
        return jsonify({"error": "Role not found"}), 404

    checklist = [
        {"item": "Understand core responsibilities of the role", "checked": False},
        {"item": f"Master at least 3 key skills: {', '.join(role.get('skills', [])[:3])}", "checked": False},
        {"item": "Prepare 2-3 projects related to the role", "checked": False},
        {"item": "Practice behavioral interview questions", "checked": False},
        {"item": "Research the company's tech stack", "checked": False},
        {"item": "Prepare questions for the interviewer", "checked": False},
    ]

    return jsonify({
        "role": role.get("title"),
        "checklist": checklist,
        "difficulty": role.get("difficulty", "Intermediate")
    })

@app.route('/api/resume-checklist', methods=['GET'])
def resume_checklist():
    checklist = [
        {"section": "Contact Information", "tips": "Include email, phone, LinkedIn, GitHub"},
        {"section": "Education", "tips": "List degree, university, year, CGPA (if >7)"},
        {"section": "Technical Skills", "tips": "Categorize by proficiency (Expert/Intermediate/Beginner)"},
        {"section": "Projects", "tips": "Include 2-4 projects with tech stack and outcomes"},
        {"section": "Experience", "tips": "Highlight internships, contributions, measurable results"},
        {"section": "Certifications", "tips": "List relevant certifications with dates"},
    ]
    return jsonify({"checklist": checklist})

@app.route('/api/resume-analyzer', methods=['POST'])
def analyze_resume():
    data = request.get_json(silent=True) or {}
    text = data.get('resume_text', '')
    target_role = data.get('target_role', 'AI Engineer')

    role_requirements = {
        "Machine Learning Engineer": ["Python", "PyTorch", "TensorFlow", "CUDA", "Docker", "Git", "SQL", "Scikit-Learn"],
        "AI Engineer": ["Python", "PyTorch", "LLMs", "RAG", "ChromaDB", "FastAPI", "Docker", "Git", "System Design"],
        "Data Analyst": ["SQL", "Excel", "Tableau", "Power BI", "Python", "Pandas", "Data Visualization", "Statistics"],
        "Backend Developer": ["Node.js", "Python", "SQL", "Redis", "REST API", "Docker", "Git", "PostgreSQL", "System Design"],
        "Frontend Developer": ["JavaScript", "React", "HTML5", "CSS3", "TypeScript", "REST API", "Git", "UI/UX"],
        "Full Stack Developer": ["React", "Node.js", "Python", "SQL", "Docker", "Git", "REST API", "System Design"],
        "Software Engineer": ["Python", "C++", "Java", "Data Structures", "Algorithms", "System Design", "Git", "OOP"],
        "DevOps Engineer": ["Docker", "Kubernetes", "Jenkins", "Terraform", "Linux", "AWS", "CI/CD", "Git", "Bash"],
        "Cloud Engineer": ["AWS", "Azure", "Docker", "Terraform", "Linux", "Cloud Security", "Python"],
        "Cyber Security Analyst": ["Network Security", "Wireshark", "Linux", "SIEM", "Cryptography", "Python"],
        "Android Developer": ["Kotlin", "Java", "Android Studio", "Jetpack Compose", "REST API", "Coroutines", "Room DB"],
        "iOS Developer": ["Swift", "SwiftUI", "Xcode", "CoreData", "iOS SDK", "REST API", "Git"],
        "Flutter Developer": ["Flutter", "Dart", "Firebase", "State Management", "Mobile UI", "REST API"],
        "QA Engineer": ["Manual Testing", "Test Cases", "Bug Tracking", "Jira", "Postman", "API Testing"],
        "Automation Test Engineer": ["Selenium", "Playwright", "Cypress", "Python", "Java", "PyTest"],
        "Game Developer": ["Unity", "C#", "Unreal Engine", "C++", "3D Math", "Physics Engines"],
        "Robotics Engineer": ["ROS2", "Python", "C++", "Kinematics", "Gazebo", "LiDAR", "SLAM"],
        "UI/UX Designer": ["Figma", "User Research", "Wireframing", "Prototyping", "UX Audit", "Design Systems"],
        "Data Engineer": ["Python", "Spark", "SQL", "Airflow", "Kafka", "Data Warehousing", "Snowflake"],
        "Prompt Engineer": ["Prompt Design", "LLMs", "Few-Shot Prompting", "Python", "RAG", "LangChain"],
        "Generative AI Engineer": ["Python", "PyTorch", "LLMs", "Diffusion Models", "LangChain", "Vector DB"],
        "Web Developer": ["HTML5", "CSS3", "JavaScript", "React", "Responsive Design", "Git"]
    }

    reqs = role_requirements.get(target_role, ["Python", "Git", "SQL", "System Design", "Docker", "REST API"])
    text_lower = text.lower()

    # Detect skills
    all_known_skills = list(set([s for list_s in role_requirements.values() for s in list_s]))
    detected_skills = [s for s in all_known_skills if s.lower() in text_lower]

    matched_skills = [s for s in reqs if s.lower() in [ds.lower() for ds in detected_skills]]
    missing_skills = [s for s in reqs if s.lower() not in [ds.lower() for ds in detected_skills]]

    # Contact Info Checks
    has_email = bool(re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text))
    has_phone = bool(re.search(r'(\+\d{1,3}[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}', text))
    has_linkedin = 'linkedin.com' in text_lower
    has_github = 'github.com' in text_lower

    # Sub-scores calculation
    skills_score = round((len(matched_skills) / max(len(reqs), 1)) * 100)
    
    metrics_count = len(re.findall(r'(\d+%\b|\$\d+|\b\d+\+\b|\b\d+x\b|increased|reduced|improved|built|deployed|achieved)', text_lower))
    impact_score = min(100, max(35, metrics_count * 18))

    action_verbs = ["architected", "developed", "engineered", "implemented", "optimized", "spearheaded", "designed", "automated", "scaled", "built", "created"]
    found_action_verbs = [v for v in action_verbs if v in text_lower]
    action_verbs_score = min(100, max(30, len(found_action_verbs) * 20))

    has_education = any(w in text_lower for w in ["education", "b.tech", "degree", "university", "college", "bachelor", "master"])
    has_projects = any(w in text_lower for w in ["project", "capstone", "portfolio", "built", "github"])
    has_experience = any(w in text_lower for w in ["experience", "internship", "work", "role", "position"])

    formatting_score = 50
    if has_education: formatting_score += 15
    if has_projects: formatting_score += 20
    if has_experience: formatting_score += 15
    formatting_score = min(100, formatting_score)

    experience_score = round((skills_score * 0.5) + (impact_score * 0.3) + (formatting_score * 0.2))

    score = round((skills_score * 0.4) + (impact_score * 0.2) + (formatting_score * 0.2) + (action_verbs_score * 0.1) + (experience_score * 0.1))
    if not text.strip():
        score = 0
        skills_score = 0
        impact_score = 0
        formatting_score = 0
        experience_score = 0
        action_verbs_score = 0
        matched_skills = []
        missing_skills = reqs

    if score >= 85:
        verdict = "Top 5% ATS Candidate"
    elif score >= 70:
        verdict = "Strong Competitive Resume"
    elif score >= 50:
        verdict = "Moderate - Needs Optimization"
    else:
        verdict = "Low ATS Score - Urgent Revisions Needed"

    strengths = []
    if matched_skills: strengths.append(f"Strong skill alignment in target areas: {', '.join(matched_skills[:4])}")
    if has_github: strengths.append("Includes live GitHub repository link for project verification")
    if metrics_count >= 2: strengths.append("Effective use of quantifiable metrics and achievements")
    if found_action_verbs: strengths.append(f"Strong action verb usage ('{found_action_verbs[0].capitalize()}', etc.)")
    if not strengths: strengths.append("Basic resume layout is present")

    weaknesses = []
    if missing_skills: weaknesses.append(f"Missing core role competencies: {', '.join(missing_skills[:3])}")
    if not has_github: weaknesses.append("Missing GitHub profile link for code proof-of-work")
    if metrics_count < 2: weaknesses.append("Lacks quantifiable metrics (% or $ impact) in project descriptions")
    if not (has_email and has_phone): weaknesses.append("Incomplete contact details (missing email or phone number)")

    action_items = [
        f"Add hands-on capstone projects highlighting missing skills ({', '.join(missing_skills[:3]) if missing_skills else 'Advanced Architecture'})",
        "Use strong action verbs (Developed, Architected, Optimized) with measurable metrics",
        "Ensure GitHub repository URLs and LinkedIn profile links are clearly included in header"
    ]

    redline_suggestions = [
        {
            "original": "Worked on backend APIs and database queries.",
            "improved": f"Architected high-throughput REST APIs using {matched_skills[0] if matched_skills else 'FastAPI'}, reducing database response latency by 35%."
        },
        {
            "original": "Built machine learning model for prediction.",
            "improved": f"Engineered production ML pipeline with {matched_skills[1] if len(matched_skills)>1 else 'PyTorch'}, achieving 92% precision score."
        }
    ]

    return jsonify({
        "score": score,
        "verdict": verdict,
        "target_role": target_role,
        "contact_info": {
            "email": has_email,
            "phone": has_phone,
            "linkedin": has_linkedin,
            "github": has_github
        },
        "category_scores": {
            "skills": skills_score,
            "impact": impact_score,
            "formatting": formatting_score,
            "experience": experience_score,
            "action_verbs": action_verbs_score
        },
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "detected_skills": detected_skills,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "action_items": action_items,
        "redline_suggestions": redline_suggestions
    })

# ===================== HEALTH =====================
@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"})

# ===================== SARVAM SPEECH & VISION ROUTES =====================
@app.route('/api/stt', methods=['POST'])
def stt():
    if 'audio' not in request.files and 'file' not in request.files:
        return jsonify({"error": "No audio file uploaded", "ok": False}), 400
    file_obj = request.files.get('audio') or request.files.get('file')
    audio_bytes = file_obj.read()
    filename = file_obj.filename or "recording.webm"
    language = request.form.get('language', 'en-IN')
    try:
        text = speech_to_text(audio_bytes, filename=filename, language_code=language)
        return jsonify({"text": text, "ok": True})
    except Exception as e:
        print(f"STT Route Error: {e}")
        return jsonify({"error": str(e), "ok": False}), 500

@app.route('/api/tts', methods=['POST'])
def tts():
    data = request.get_json()
    text = data.get('text')
    if not text:
        return jsonify({"error": "No text provided"}), 400
    try:
        audio_bytes = text_to_speech(text)
        response = make_response(audio_bytes)
        response.headers.set('Content-Type', 'audio/mpeg')
        response.headers.set('Content-Disposition', 'attachment', filename='speech.mp3')
        return response
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/vision/digitize', methods=['POST'])
def vision_digitize():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    output_format = request.form.get('output_format', 'md')
    language = request.form.get('language', 'en-IN')
    with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as tmp_file:
        file.save(tmp_file.name)
        tmp_file_path = tmp_file.name
    try:
        initial_response = digitize_document(tmp_file_path, output_format, language)
        job_id = initial_response.get('job_id')
        if not job_id:
            return jsonify({"error": "Failed to get job ID"}), 500
        final_response = wait_for_job_completion(job_id)
        return jsonify({
            "success": True,
            "job_id": job_id,
            "result": final_response.get('result'),
            "output_format": output_format
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if os.path.exists(tmp_file_path):
            os.unlink(tmp_file_path)

# ===================== CHAT HISTORY ENDPOINTS =====================
@app.route('/api/history', methods=['GET'])
def get_chat_history():
    user_id = session.get("user", {}).get("id", 0)
    db = get_db()
    rows = db.execute("SELECT sender, message, citations, image_url, timestamp FROM chat_history WHERE user_id = ? ORDER BY id ASC", (user_id,)).fetchall()
    history = []
    for r in rows:
        history.append({
            "sender": r["sender"],
            "message": r["message"],
            "citations": json.loads(r["citations"]) if r["citations"] else [],
            "image_url": r["image_url"] or "",
            "timestamp": r["timestamp"]
        })
    return jsonify(history)

@app.route('/api/history', methods=['POST'])
def save_chat_history():
    user_id = session.get("user", {}).get("id", 0)
    data = request.get_json() or {}
    sender = data.get("sender", "user")
    message = data.get("message", "")
    citations = json.dumps(data.get("citations", []))
    image_url = data.get("image_url", "")
    ts = datetime.now(timezone.utc).isoformat()
    if not message and not image_url:
        return jsonify({"error": "Empty message"}), 400
    db = get_db()
    db.execute(
        "INSERT INTO chat_history (user_id, sender, message, citations, image_url, timestamp) VALUES (?, ?, ?, ?, ?, ?)",
        (user_id, sender, message, citations, image_url, ts)
    )
    db.commit()
    return jsonify({"success": True})

@app.route('/api/history', methods=['DELETE'])
def clear_chat_history():
    user_id = session.get("user", {}).get("id", 0)
    db = get_db()
    db.execute("DELETE FROM chat_history WHERE user_id = ?", (user_id,))
    db.commit()
    session["chat_history"] = []
    return jsonify({"success": True})

# ===================== OCR & IMAGE CHAT ENDPOINT =====================
UPLOAD_FOLDER = os.path.join(FRONTEND_DIR, 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def extract_ocr_text(file_path: str, language: str = "en-IN") -> str:
    extracted_text = ""

    # 1. Primary: Sarvam's document digitization (vision OCR) API
    try:
        print("📷 Trying Sarvam document digitization (OCR)...")
        initial_response = digitize_document(file_path, output_format="md", language=language)
        job_id = initial_response.get("job_id")
        if job_id:
            final_response = wait_for_job_completion(job_id)
            result = final_response.get("result")
            if isinstance(result, dict):
                extracted_text = (result.get("text") or result.get("content") or json.dumps(result)).strip()
            elif isinstance(result, str):
                extracted_text = result.strip()
            if extracted_text:
                print(f"✅ Sarvam OCR succeeded ({len(extracted_text)} chars).")
    except Exception as e:
        print(f"⚠️ Sarvam OCR failed: {e}. Falling back to local extraction...")

    # 2. Fallback: local PDF text extraction
    ext = os.path.splitext(file_path)[1].lower()
    if not extracted_text and ext == '.pdf':
        try:
            from pypdf import PdfReader
            reader = PdfReader(file_path)
            extracted_text = "\n".join([page.extract_text() or "" for page in reader.pages]).strip()
        except Exception as e:
            print(f"PyPDF error: {e}")

    # 3. Fallback: local EasyOCR for images
    if not extracted_text:
        try:
            import easyocr
            model_dir = os.path.join(os.path.dirname(__file__), "ocr_models")
            os.makedirs(model_dir, exist_ok=True)
            reader = easyocr.Reader(['en'], gpu=False, model_storage_directory=model_dir, user_network_directory=model_dir)
            results = reader.readtext(file_path)
            extracted_text = " ".join([res[1] for res in results]).strip()
        except Exception as e:
            print(f"EasyOCR error: {e}")

    if extracted_text:
        print(f"📷 Extracted OCR Text ({len(extracted_text)} chars): {extracted_text[:100]}...")
    return extracted_text or "No clear text could be extracted from the uploaded document."

@app.route('/api/v1/ocr-chat', methods=['POST'])
def ocr_chat():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    question_prompt = request.form.get('question', '').strip()
    language = request.form.get('language', 'en')

    filename = f"{int(time.time())}_{re.sub(r'[^a-zA-Z0-9._-]', '_', file.filename)}"
    save_path = os.path.join(UPLOAD_FOLDER, filename)
    file.save(save_path)
    image_url = f"/uploads/{filename}"

    sarvam_lang = language if "-" in language else {"en": "en-IN", "hi": "hi-IN"}.get(language, "en-IN")
    extracted_text = extract_ocr_text(save_path, language=sarvam_lang)
    print(f"📷 OCR Text ({len(extracted_text)} chars): {extracted_text[:150]}...")

    combined_query = f"The student uploaded an image/document (resume, marksheet, certificate, or job posting).\nExtracted Document OCR Text:\n\"\"\"\n{extracted_text}\n\"\"\"\n"
    if question_prompt:
        combined_query += f"Student Question/Prompt: {question_prompt}"
    else:
        combined_query += "Student Question/Prompt: Please analyze this document and provide personalized career guidance, missing skill analysis, and recommended next steps."

    profile = session.get("profile")
    history = session.get("chat_history", [])

    start_time = time.time()
    result = answer_question(combined_query, history, profile, data_loader, language=language)
    elapsed_ms = int((time.time() - start_time) * 1000)

    result["extracted_text"] = extracted_text
    result["image_url"] = image_url

    # Save user message & assistant message to SQLite (non-blocking)
    try:
        user_id = session.get("user_id", 0)
        db = get_db()
        ts = datetime.now(timezone.utc).isoformat()
        db.execute(
            "INSERT INTO chat_history (user_id, sender, message, citations, image_url, timestamp) VALUES (?, ?, ?, ?, ?, ?)",
            (user_id, "user", question_prompt or "Uploaded image/document for career analysis", "[]", image_url, ts)
        )
        db.execute(
            "INSERT INTO chat_history (user_id, sender, message, citations, image_url, timestamp) VALUES (?, ?, ?, ?, ?, ?)",
            (user_id, "assistant", result.get("answer", ""), json.dumps(result.get("citations", [])), "", ts)
        )
        db.commit()
    except Exception as db_err:
        print(f"⚠️ Non-critical: could not save OCR chat to DB: {db_err}")

    return jsonify(result)

# ===================== COMMUNITY Q&A ENDPOINTS =====================
@app.route('/api/community/queries', methods=['GET', 'POST'])
def api_community_queries():
    db = get_db()
    if request.method == 'POST':
        data = request.get_json(silent=True) or {}
        title = data.get('title', '').strip()
        content = data.get('content', '').strip()
        category = data.get('category', 'General').strip()
        if not title or not content:
            return jsonify(ok=False, error="Title and content are required."), 400
        
        user_id = session.get("user_id")
        user_row = db.execute("SELECT full_name FROM users WHERE id = ?", (user_id,)).fetchone() if user_id else None
        author_name = user_row["full_name"] if user_row else data.get('author_name', 'Student Peer')
        
        created_at = datetime.now(timezone.utc).isoformat()
        db.execute("""
            INSERT INTO community_queries (user_id, author_name, title, category, content, upvotes, answers, created_at)
            VALUES (?, ?, ?, ?, ?, 0, '[]', ?)
        """, (user_id, author_name, title, category, content, created_at))
        db.commit()
        return jsonify(ok=True, message="Query posted successfully!")
    
    # GET queries
    rows = db.execute("SELECT * FROM community_queries ORDER BY id DESC").fetchall()
    queries = []
    for r in rows:
        queries.append({
            "id": r["id"],
            "author_name": r["author_name"],
            "title": r["title"],
            "category": r["category"],
            "content": r["content"],
            "upvotes": r["upvotes"],
            "answers": json.loads(r["answers"] or "[]"),
            "created_at": r["created_at"]
        })
    
    # Seed default queries if empty
    if not queries:
        defaults = [
            {
                "author_name": "Aarav Sharma (CSE 4th Year)",
                "title": "How do I prepare for HCLTech Technical Interview rounds?",
                "category": "Interviews",
                "content": "I have an upcoming campus interview for HCLTech AI Systems role. What specific topics in Data Structures, SQL, and System Design should I prioritize?",
                "upvotes": 14,
                "answers": [
                    { "author": "Priya V. (Senior Mentor)", "text": "Focus heavily on SQL joins, indexing, Python memory management, and basic ML model deployment scenarios. Practice coding LeetCode medium array and string questions!", "date": "2 hours ago" }
                ],
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "author_name": "Rohan Verma (ECE 3rd Year)",
                "title": "Which certifications add maximum value to an AI & ML Resume?",
                "category": "Career Guidance",
                "content": "Looking to pivot into Machine Learning. Are AWS Certified AI Practitioner or Google TensorFlow certificates recognized by top hiring managers?",
                "upvotes": 9,
                "answers": [],
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        ]
        for d in defaults:
            db.execute("""
                INSERT INTO community_queries (author_name, title, category, content, upvotes, answers, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (d["author_name"], d["title"], d["category"], d["content"], d["upvotes"], json.dumps(d["answers"]), d["created_at"]))
        db.commit()
        return api_community_queries()
        
    return jsonify(queries)

@app.route('/api/community/queries/<int:query_id>/answer', methods=['POST'])
def api_answer_community_query(query_id):
    db = get_db()
    data = request.get_json(silent=True) or {}
    text = data.get("text", "").strip()
    if not text:
        return jsonify(ok=False, error="Answer text cannot be empty."), 400
    
    user_id = session.get("user_id")
    user_row = db.execute("SELECT full_name FROM users WHERE id = ?", (user_id,)).fetchone() if user_id else None
    author = user_row["full_name"] if user_row else data.get("author", "Student Member")
    
    row = db.execute("SELECT answers FROM community_queries WHERE id = ?", (query_id,)).fetchone()
    if not row:
        return jsonify(ok=False, error="Query not found."), 404
        
    answers = json.loads(row["answers"] or "[]")
    answers.append({
        "author": author,
        "text": text,
        "date": "Just now"
    })
    
    db.execute("UPDATE community_queries SET answers = ? WHERE id = ?", (json.dumps(answers), query_id))
    db.commit()
    return jsonify(ok=True, answers=answers)

@app.route('/api/community/queries/<int:query_id>/upvote', methods=['POST'])
def api_upvote_community_query(query_id):
    db = get_db()
    db.execute("UPDATE community_queries SET upvotes = upvotes + 1 WHERE id = ?", (query_id,))
    db.commit()
    row = db.execute("SELECT upvotes FROM community_queries WHERE id = ?", (query_id,)).fetchone()
    return jsonify(ok=True, upvotes=row["upvotes"] if row else 0)

# ===================== GAMIFICATION ENDPOINTS =====================
@app.route('/api/gamification/update', methods=['POST'])
def api_gamification_update():
    user_id = session.get("user_id")
    if not user_id: return jsonify(ok=False, error="Unauthorized"), 401
    data = request.get_json(silent=True) or {}
    points = data.get("points", 0)
    action = data.get("action", "")
    badge = data.get("badge")
    
    db = get_db()
    db.execute("UPDATE users SET points = points + ? WHERE id = ?", (points, user_id))
    
    u = db.execute("SELECT points, level, badges FROM users WHERE id = ?", (user_id,)).fetchone()
    current_points = u["points"]
    current_level = u["level"]
    badges = []
    if u["badges"]:
        try:
            badges = json.loads(u["badges"])
        except:
            pass
    
    # Simple level formula: level = 1 + (points // 100)
    new_level = 1 + (current_points // 100)
    if new_level > current_level:
        db.execute("UPDATE users SET level = ? WHERE id = ?", (new_level, user_id))
        current_level = new_level
        
    if badge and badge not in badges:
        badges.append(badge)
        db.execute("UPDATE users SET badges = ? WHERE id = ?", (json.dumps(badges), user_id))
        
    db.commit()
    return jsonify(ok=True, points=current_points, level=current_level, badges=badges)

@app.route('/api/gamification/leaderboard', methods=['GET'])
def api_gamification_leaderboard():
    db = get_db()
    rows = db.execute("SELECT full_name, college, points, level, badges FROM users ORDER BY points DESC LIMIT 10").fetchall()
    leaderboard = []
    for r in rows:
        badges = []
        if r["badges"]:
            try:
                badges = json.loads(r["badges"])
            except:
                pass
        leaderboard.append({
            "full_name": r["full_name"],
            "college": r["college"],
            "points": r["points"],
            "level": r["level"],
            "badges": badges
        })
    return jsonify(leaderboard)

@app.route('/api/gamification/stats', methods=['GET'])
def api_gamification_stats():
    user_id = session.get("user_id")
    if not user_id: return jsonify(ok=False, error="Unauthorized"), 401
    db = get_db()
    u = db.execute("SELECT points, level, streak_days, badges FROM users WHERE id = ?", (user_id,)).fetchone()
    badges = []
    if u["badges"]:
        try:
            badges = json.loads(u["badges"])
        except:
            pass
    return jsonify(points=u["points"], level=u["level"], streak_days=u["streak_days"], badges=badges)

# ===================== 7 BFF FEATURE ENDPOINTS =====================
@app.route('/api/generate-roadmap', methods=['POST'])
def generate_roadmap_bff():
    data = request.get_json() or {}
    role = data.get('role', 'AI Engineer')
    from prompts import ROADMAP_PROMPT
    prompt = ROADMAP_PROMPT.format(role=role)
    result = answer_question(prompt, [], session.get("profile"), data_loader)
    return jsonify(ok=True, result=result.get("answer"))

@app.route('/api/redline-resume', methods=['POST'])
def redline_resume_bff():
    data = request.get_json() or {}
    resume_text = data.get('resume_text', '')
    from prompts import RESUME_REDLINE_PROMPT
    prompt = RESUME_REDLINE_PROMPT.format(resume_text=resume_text)
    result = answer_question(prompt, [], session.get("profile"), data_loader)
    return jsonify(ok=True, result=result.get("answer"))

@app.route('/api/roi-explain', methods=['POST'])
def roi_explain_bff():
    data = request.get_json() or {}
    role = data.get('role', 'AI Engineer')
    from prompts import ROI_PROMPT
    prompt = ROI_PROMPT.format(role=role)
    result = answer_question(prompt, [], session.get("profile"), data_loader)
    return jsonify(ok=True, result=result.get("answer"))

@app.route('/api/translate-response', methods=['POST'])
def translate_response_bff():
    data = request.get_json() or {}
    text = data.get('text', '')
    from prompts import TRANSLATE_PROMPT
    prompt = TRANSLATE_PROMPT.format(text=text)
    result = answer_question(prompt, [], session.get("profile"), data_loader)
    return jsonify(ok=True, result=result.get("answer"))

@app.route('/api/find-buddy', methods=['POST'])
def find_buddy_bff():
    user_id = session.get("user_id")
    if not user_id: return jsonify(ok=False, error="Unauthorized"), 401
    db = get_db()
    peer = db.execute("SELECT full_name, target_role, skills FROM users WHERE id != ? ORDER BY RANDOM() LIMIT 1", (user_id,)).fetchone()
    if not peer: return jsonify(ok=False, error="No peers found")
    
    from prompts import ICEBREAKER_PROMPT
    prompt = ICEBREAKER_PROMPT.format(peer_name=peer['full_name'], peer_role=peer['target_role'], peer_skills=peer['skills'])
    result = answer_question(prompt, [], session.get("profile"), data_loader)
    return jsonify(ok=True, peer={"full_name": peer["full_name"], "target_role": peer["target_role"]}, icebreaker=result.get("answer"))

@app.route('/api/admin/cohort-insights', methods=['GET'])
def admin_cohort_insights():
    db = get_db()
    total = db.execute("SELECT COUNT(id) FROM users").fetchone()[0]
    avg_pts = db.execute("SELECT AVG(points) FROM users").fetchone()[0]
    
    cohort_data = f"Total Users: {total}, Average Gamification Points: {avg_pts:.1f}"
    
    from prompts import COHORT_INSIGHTS_PROMPT
    prompt = COHORT_INSIGHTS_PROMPT.format(cohort_data=cohort_data)
    result = answer_question(prompt, [], session.get("profile"), data_loader)
    
    return jsonify({
        "total_users": total,
        "avg_points": round(avg_pts, 1) if avg_pts else 0,
        "ai_insights": result.get("answer")
    })

@app.route('/api/analyze-jobs', methods=['POST'])
def analyze_jobs_bff():
    data = request.get_json() or {}
    job_desc = data.get('job_desc', '')
    from prompts import JOB_ANALYSIS_PROMPT
    prompt = JOB_ANALYSIS_PROMPT.format(job_desc=job_desc)
    result = answer_question(prompt, [], session.get("profile"), data_loader)
    return jsonify(ok=True, result=result.get("answer"))

# ===================== ADMIN DASHBOARD ROUTE =====================
@app.route('/admin')
def admin_dashboard():
    # Simple password protection for admin dashboard via query param for demo purposes
    if request.args.get('pwd') != 'admin123':
        return "Unauthorized. Use /admin?pwd=admin123", 401
    
    # In a real scenario, this would render a template. 
    # For now, we will return the admin HTML directly.
    return '''
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>T&P Admin Dashboard</title>
        <style>
            body { font-family: 'Inter', sans-serif; background: #f8fafc; margin: 0; padding: 20px; color: #0b192c; }
            h1 { color: #00c853; }
            .card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        </style>
    </head>
    <body>
        <h1>Training & Placement Admin Insights</h1>
        <div class="card" id="insights">Loading...</div>
        <script>
            fetch('/api/admin/cohort-insights')
                .then(r => r.json())
                .then(data => {
                    document.getElementById('insights').innerHTML = `
                        <p>Total Registered Students: <strong>${data.total_users}</strong></p>
                        <p>Average Gamification Points: <strong>${data.avg_points}</strong></p>
                        <div style="margin-top:20px; background:#f1f5f9; padding:16px; border-radius:8px;">
                            <h3 style="margin-top:0;">AI generated insights:</h3>
                            <div>${data.ai_insights}</div>
                        </div>
                    `;
                });
        </script>
    </body>
    </html>
    '''

# ===================== MAIN =====================
if __name__ == '__main__':
    print("🚀 Starting Flask server on port 5000...")
    app.run(debug=True, host='0.0.0.0', port=5000)