from flask import Flask, request, jsonify
from flask_cors import CORS

import requests
import ollama
import re

from ollama import chat
from ollama import ChatResponse

from models import db, Quest

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:4000"}})
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///quests.db'
db.init_app(app) 

@app.route('/')
def home():
    return "Backend is running."

@app.route('/quests', methods=['GET'])
def get_quests():
    quests = Quest.query.all()
    return jsonify([q.serialize() for q in quests])

@app.route('/quests', methods=['POST'])
def add_quest():
    data = request.get_json()
    quest = Quest(**data)
    db.session.add(quest)
    db.session.commit()
    return jsonify({'message': 'Quest added successfully'})

def generate_quest(task):
    prompt = (
        "Convert the following task into a medieval fantasy quest using this format:"

        "Title: [medieval-themed quest name, no emoji here]  "
        "Backstory: [1 paragraph, 3 sentences max, ~50 words, from user's perspective using You] "
        "Objective: [Copy the original task, if there's name theres capital letter]"
        "Reward: [any positive number above 100, do not give 0]"
        "Icon: [suitable emoji with the task, for example: ⚗️ 💀 ⭐️]  "

        "Do not use bold, symbols like **, or extra characters."

        f"{task}"
    )

    response = requests.post("http://localhost:11434/api/generate", json={
        "model": "llama3.2",
        "prompt": prompt,
        "stream": False
    })

    result = response.json()
    return result.get("response", "")


@app.route('/generate', methods=['POST', 'OPTIONS'])
def generate():
    if request.method == 'OPTIONS':
        return '', 204

    data = request.json
    print("Request received:", data)

    task = data.get("task", "")
    if not task:
        return jsonify({"error": "No task provided"}), 400

    #Generate a quest
    quest = generate_quest(task)
    print("Generated quest:", quest)

    #Extract given output with regex expression
    parsed = parse_quest_text(task, quest)

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
                title="The Scrolls of Wisdom Teste",
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


@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = 'http://localhost:4000'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
    return response

with app.app_context():
    # db.drop_all()
    db.create_all()
    add_default_quests()

if __name__ == '__main__':
    app.run(debug=True, port=5050)

