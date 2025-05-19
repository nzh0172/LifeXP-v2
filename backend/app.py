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
    response: ChatResponse = chat(model='llama3.2', messages=[
    {
        'role': 'system',
        'content': 'You are to turn a given task into a quest with short backstory consists of 1 short paragraph with 3 sentences, 50 words max. '
        'If the task contains a name or a deadline, you must include it. '
        'The quest must have the users involvement using pronoun You, not a third party. Make it under this format "Backstory:"'
        'For each task, give a cool epic medieval quest name under this format, Title: X. '
        'Write exactly as the original task under this format, Objective: X, do not add any additional info '
        'such as time or deadline or other character unless mentioned in the task. '
        'Make a suitable icon for the quest under this format, Icon: X.'
        'Do not put any symbols such as double ** in title, backstory, objective, reward and icon. '
        'For each task, give an amount of coins that is appropriate for the level of difficulty of the task. '
        'The coins must not be zero or negative. Give only coins, no other comments needed. Make it under this format "Reward: X coins"'
        'The appearance order must be: first, Title, then Backstory, Objective, Reward and Icon.'
    },
    {
        'role': 'user',
        'content': task
    }
    ])
    return response.message.content


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
    title_match = re.search(r"Title:\s(.+)", quest)
    title = title_match.group(1) if title_match else "Title not found"

    backstory_match = re.search(r'Backstory:\s*(.+?)\nObjective:', quest, re.DOTALL)
    backstory = backstory_match.group(1) if backstory_match else "Backstory not found"

    objective_match = re.search(r"Objective:\s(.+)", quest)
    objective = objective_match.group(1) if objective_match else "Objective not found"

    reward_match = re.search(r'Reward:\s*(\d+)\s*coins', quest)
    reward = reward_match.group(1) if reward_match else 0

    icon_match = re.search(r'Icon:\s*(.+)', quest);
    icon = icon_match.group(1) if icon_match else "📜"



    return jsonify({
        "title": title,
        "backstory": backstory,
        "objective": objective,
        "reward": int(reward),
        "icon": icon
    })

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

