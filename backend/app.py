from flask import Flask, request, jsonify, session
from flask_cors import CORS, cross_origin
from werkzeug.security import generate_password_hash, check_password_hash

import requests
import ollama
import re
import secrets
import os

from ollama import chat
from ollama import ChatResponse

from models import db, User, Quest

app = Flask(__name__)

# ─── SECRET_KEY AND DB SETUP ─────────────────────────────────────────────────
# Use a random secret key (in production, load from env var or config)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY') or secrets.token_hex(16)

# Point to your SQLite (or whatever) for SQLAlchemy
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///lifeXP.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize CORS, allowing credentials (cookies) from React’s origin
# CORS(app, supports_credentials=True, resources={r"/*": {"origins": "http://localhost:4000"}}) # Commented out to allow port flexibility by adding cors headers at the bottom
# CORS(app)  # ← this by itself does not set “supports_credentials”

# Init SQLAlchemy
db.init_app(app)

print("Current working dir: ", os.getcwd())

# Create tables if they don't exist
with app.app_context():
    db.create_all()


# ─── LOGIN HELPER ─────────────────────────────────────────────────────────────
def login_required(fn):
    from functools import wraps

    @wraps(fn)
    def wrapper(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
        return fn(*args, **kwargs)
    return wrapper


# ─── REGISTER ROUTE ───────────────────────────────────────────────────────────
@app.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()

    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400

    # Check if username already exists
    existing = User.query.filter_by(username=username).first()
    if existing:
        return jsonify({'error': 'Username already taken'}), 400

    # Create new user
    new_user = User(username=username)
    new_user.set_password(password)

    db.session.add(new_user)
    db.session.commit()

    return jsonify({'message': 'User created'}), 201


# ─── LOGIN ROUTE ──────────────────────────────────────────────────────────────
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()

    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400

    user = User.query.filter_by(username=username).first()
    if not user or not user.check_password(password):
        return jsonify({'error': 'Invalid credentials'}), 401

    # Store user id in session
    session.clear()
    session['user_id'] = user.id
    print(session['user_id'])

    return jsonify({'message': 'Logged in'}), 200


# ─── LOGOUT ROUTE ─────────────────────────────────────────────────────────────
@app.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': 'Logged out'}), 200


# ─── PROTECTED ROUTE (QUESTS) ─────────────────────────────────────────
@app.route('/')
def home():
    return "Backend is running."

@login_required # Wrap quest-related models/route in @login_required
@app.route('/quests', methods=['GET'])
def get_quests():
    # Only logged in users can reach this
    if request.method == 'OPTIONS':
        return '', 204

    uid = session.get('user_id')
    user_quests = Quest.query.filter_by(user_id=uid).all()
    return jsonify([q.serialize() for q in user_quests]), 200

@login_required
@app.route('/quests', methods=['POST'])
def add_quest():
    '''
    Now, whenever a “generate quest” request hits /quests with JSON like { "title": "...", … }, 
    the server automatically uses session['user_id'] to fill the user_id column.
    There’s no need for the client to supply it (and in fact you shouldn’t trust the client to pick a user_id).
    '''
    if request.method == 'OPTIONS':
        return jsonify({}), 200

    data = request.get_json() or {}

    # Always trust the server’s session for user ID
    current_uid = session['user_id']

    # Inject user_id
    data['user_id'] = current_uid
    
    # Create a new Quest, attaching the logged‐in user’s ID
    new_q = Quest(
        title   = data.get('title',     ''),
        backstory = data.get('backstory', ''),
        objective = data.get('objective', ''),
        reward    = data.get('reward',    0),
        icon      = data.get('icon',      '📜'),
        status    = data.get('status',    'Yet to Embark'),
        user_id   = current_uid
    )

    db.session.add(new_q)
    db.session.commit()
    return jsonify(new_q.serialize()), 201

# ─── ACCEPT A QUEST (set status to 'In Progress') ──────────────
@app.route("/quests/<int:qid>/accept", methods=["OPTIONS", "PATCH"])
def accept_quest(qid):
    # 1) Respond to preflight immediately
    if request.method == "OPTIONS":
        return "", 204

    # 2) Now enforce login
    if "user_id" not in session:
        return jsonify({ "error": "Authentication required" }), 401

    # 3) Look up and verify ownership
    quest = Quest.query.get(qid)
    if not quest or quest.user_id != session["user_id"]:
        return jsonify({ "error": "Not found or not yours" }), 404

    # 4) Update status to "In Progress"
    quest.status = "In Progress"
    db.session.add(quest)
    db.session.commit()

    return jsonify({ "id": quest.id, "status": quest.status }), 200


@app.route('/quests/<int:qid>', methods=['PATCH', 'OPTIONS'])
def complete_quest(qid):
    # 1) Respond to preflight unconditionally
    if request.method == 'OPTIONS':
        # Must respond 204 here; later after_request will attach CORS headers
        return '', 204

    # 2) Now do the login-required logic
    if 'user_id' not in session:
        return jsonify({'error': 'Authentication required'}), 401

    user_id = session['user_id']
    quest = Quest.query.get(qid)
    if not quest or quest.user_id != user_id:
        return jsonify({'error': 'Not found or not your quest'}), 404

    data = request.get_json() or {}
    if data.get('status') != 'Completed':
        return jsonify({'error': 'Invalid status update'}), 400

    user = User.query.get(user_id)
    user.totalXP += quest.reward
    db.session.add(user)
    db.session.delete(quest)
    db.session.commit()

    return jsonify({
        'id': quest.id,
        'totalXP': user.totalXP
    }), 200

@app.route('/quests/<int:qid>/giveup', methods=['OPTIONS','PATCH','DELETE'])
def giveup_quest(qid):
    # 1) Always let OPTIONS through
    if request.method == 'OPTIONS':
        return '', 204

    # 2) Enforce login
    if 'user_id' not in session:
        return jsonify({'error': 'Authentication required'}), 401

    quest = Quest.query.get(qid)
    if not quest or quest.user_id != session['user_id']:
        return jsonify({'error': 'Not found or not yours'}), 404

    # 3) Delete the quest row entirely
    db.session.delete(quest)
    db.session.commit()

    return jsonify({'message': 'Quest deleted'}), 200

@login_required
def generate_quest(task):
    prompt = (
        "Convert the following task into a medieval fantasy quest using this format:"

        "Title: [medieval-themed quest name, no emoji here]  "
        "Backstory: [1 paragraph, 3 sentences max, ~50 words, from user's perspective using You, do not add extra characters unless mentioned] "
        "Objective: [Copy the original task, if there's someone's name, use proper noun capitalization, do not add extra characters unless mentioned]"
        "Reward: [any positive number above 100, do not give 0]"
        "Icon: [any suitable emoji/icon for the task, do not output text]  "

        "Do not use bold, symbols like **, or extra characters."

        f"{task}"
    )

    response = requests.post("http://localhost:11434/api/generate", json={
        # Attempted to used llama3.2:1b, faster but produced undesirable result
        # llama3.2:3b is slower but produced better (avg 30s response time)
        "model": "llama3.2",
        "prompt": prompt,
        "stream": False
    })

    result = response.json()
    return result.get("response", "")

@login_required
@app.route('/generate', methods=['POST', 'OPTIONS'])
def generate():
    if request.method == 'OPTIONS':
        return '', 204

    data = request.json or {}
    print("Request received:", data)

    task = data.get("task", "")
    if not task:
        return jsonify({"error": "No task provided"}), 400

    #Generate a quest
    quest = generate_quest(task)
    print("Generated quest:", quest)

    #Extract given output with regex expression
    parsed = parse_quest_text(task, quest)

    #Manually inject user_id before inserting into Quest db
    parsed['user_id'] = session['user_id']

    return jsonify(parsed)

def capitalize_first_letter(text):
    return text[0].upper() + text[1:] if text else text

def parse_quest_text(task, quest):
    # Use re.DOTALL to match multiple sentences with dots (for backstory), re.IGNORECASE makes the regex parser case insensitive (Total, total, ToTAL is accepted)
    title_match = re.search(r'\**\s*Title\s*:\s*(.+)', quest, re.IGNORECASE)
    backstory_match = re.search(r'\**\s*Backstory\s*:\s*(.+?)(?=\n\**\s*Objective\s*:)', quest, re.IGNORECASE | re.DOTALL)
    #backstory_match = re.search(r'\**\s*Backstory\s*:\s*(.+?)(?=\n\**\s*Reward\s*:)', quest, re.IGNORECASE | re.DOTALL)
    objective_match = re.search(r'\**\s*Objective\s*:\s*(.+)', quest, re.IGNORECASE)
    reward_match = re.search(r'\**\s*Reward\s*:\s*(\d+)\s*', quest, re.IGNORECASE)
    icon_match = re.search(r'\**\s*Icon\s*:\s*(.+)', quest, re.IGNORECASE)

    return {
        "title": title_match.group(1).strip() if title_match else "Title not found",
        "backstory": backstory_match.group(1).strip() if backstory_match else "Backstory not found",
        "objective": capitalize_first_letter(objective_match.group(1).strip()) if objective_match else "Objective not found",
        # "objective": capitalize_first_letter(task.strip()),  # use original task
        "reward": int(reward_match.group(1)) if reward_match else 0,
        "icon": icon_match.group(1).strip() if icon_match else "📜"
    }

def add_default_quests():
    if Quest.query.count() == 0:  # only add if DB is empty
        default_quests = [
            Quest(
                title="The Scrolls of Wisdom Test",
                backstory="The ancient tomes await, heavy with knowledge...",
                objective="study",
                reward=1000,
                icon="📖",
                status="Yet to Embark"
            ),
            Quest(
                title="Sanity Run",
                backstory="Madness brews like a storm in your skull...",
                objective="jog",
                reward=900,
                icon="🏃‍♀️",
                status="Yet to Embark"
            ),
            Quest(
                title="Brew of Awakening",
                backstory="The morning fog clings to your mind...",
                objective="make a cup of coffee.",
                reward=850,
                icon="🔮",
                status="Yet to Embark"
            )
        ]
        db.session.add_all(default_quests)
        db.session.commit()
        print("✅ Default quests added.")

# ─── OPTIONAL: GET CURRENT USER INFO ──────────────────────────────────────────
@app.route('/me', methods=['GET', 'OPTIONS'])
def get_me():
    if request.method == 'OPTIONS':
        return '', 204
    
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'user': None}), 200

    user = User.query.get(user_id)
    if not user:
        session.clear()
        return jsonify({'user': None}), 200

    return jsonify({'user': user.serialize()}), 200

@app.after_request
def add_cors_headers(response):
    ori = request.headers.get('Origin')
    if ori and ori.startswith("http://localhost:"):
        response.headers['Access-Control-Allow-Origin'] = ori #Doesn't restrict to only one port
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS, PATCH, DELETE'
    return response

'''
with app.app_context():
    # db.drop_all()
    db.create_all()
    add_default_quests()
'''

if __name__ == '__main__':
    app.run(host="localhost", debug=True, port=5050)

