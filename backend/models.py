from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)

    # We'll store usernames as unique
    username = db.Column(db.String(80), unique=True, nullable=False)
    # Store the hashed password, not plain text
    password_hash = db.Column(db.String(128), nullable=False)

    # back‐reference: one User → many Quests
    quests = db.relationship('Quest', backref='owner', lazy=True)

    def set_password(self, plaintext_password):
        self.password_hash = generate_password_hash(plaintext_password)

    def check_password(self, plaintext_password):
        return check_password_hash(self.password_hash, plaintext_password)

class Quest(db.Model):
    __tablename__ = 'quests'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    backstory = db.Column(db.Text, nullable=False)
    objective = db.Column(db.String(255), nullable=False)
    reward = db.Column(db.Integer, nullable=False)
    icon = db.Column(db.String(10), default='📜')
    status = db.Column(db.String(50), default='Yet to Embark')

    # Foreign-key 
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)


    def serialize(self):
        return {
            "id": self.id,
            "title": self.title,
            "backstory": self.backstory,
            "objective": self.objective,
            "reward": self.reward,
            "icon": self.icon,
            "status": self.status
        }
