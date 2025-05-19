from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Quest(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    backstory = db.Column(db.Text, nullable=False)
    objective = db.Column(db.String(255), nullable=False)
    reward = db.Column(db.Integer, nullable=False)
    icon = db.Column(db.String(10), default='📜')
    status = db.Column(db.String(50), default='Yet to Embark')

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
