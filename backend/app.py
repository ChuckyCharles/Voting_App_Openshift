from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from datetime import datetime, timedelta
import os
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
CORS(app)

# Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql://root:Charles42@localhost/voting'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-secret-key')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)

db = SQLAlchemy(app)
jwt = JWTManager(app)

# Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(256), nullable=False)
    votes = db.relationship('Vote', backref='user', lazy=True)

class Poll(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    end_date = db.Column(db.DateTime)
    options = db.relationship('Option', backref='poll', lazy=True)

class Option(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    text = db.Column(db.String(200), nullable=False)
    poll_id = db.Column(db.Integer, db.ForeignKey('poll.id'), nullable=False)
    votes = db.relationship('Vote', backref='option', lazy=True)

class Vote(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    option_id = db.Column(db.Integer, db.ForeignKey('option.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# Routes
@app.route('/api/polls', methods=['GET'])
def get_polls():
    polls = Poll.query.all()
    return jsonify([{
        'id': poll.id,
        'title': poll.title,
        'description': poll.description,
        'created_at': poll.created_at,
        'end_date': poll.end_date,
        'options': [{'id': opt.id, 'text': opt.text} for opt in poll.options]
    } for poll in polls])

@app.route('/api/polls', methods=['POST'])
@jwt_required()
def create_poll():
    data = request.get_json()
    new_poll = Poll(
        title=data['title'],
        description=data.get('description', ''),
        end_date=datetime.fromisoformat(data['end_date'])
    )
    db.session.add(new_poll)
    
    for option_text in data['options']:
        option = Option(text=option_text, poll=new_poll)
        db.session.add(option)
    
    db.session.commit()
    return jsonify({'message': 'Poll created successfully', 'id': new_poll.id}), 201

@app.route('/api/polls/<int:poll_id>/vote', methods=['POST'])
@jwt_required()
def vote(poll_id):
    user_id = get_jwt_identity()
    data = request.get_json()
    option_id = data['option_id']
    
    # Check if user already voted
    existing_vote = Vote.query.filter_by(user_id=user_id, option_id=option_id).first()
    if existing_vote:
        return jsonify({'message': 'You have already voted for this option'}), 400
    
    new_vote = Vote(user_id=user_id, option_id=option_id)
    db.session.add(new_vote)
    db.session.commit()
    
    return jsonify({'message': 'Vote recorded successfully'})

@app.route('/api/polls/<int:poll_id>/results', methods=['GET'])
def get_results(poll_id):
    poll = Poll.query.get_or_404(poll_id)
    results = []
    
    for option in poll.options:
        vote_count = Vote.query.filter_by(option_id=option.id).count()
        results.append({
            'option_id': option.id,
            'text': option.text,
            'votes': vote_count
        })
    
    return jsonify(results)

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'message': 'Username already exists'}), 400
    hashed_password = generate_password_hash(data['password'])
    user = User(username=data['username'], password=hashed_password)
    db.session.add(user)
    db.session.commit()
    access_token = create_access_token(identity=user.id)
    return jsonify({'access_token': access_token, 'user': {'id': user.id, 'username': user.username}}), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(username=data['username']).first()
    if not user or not check_password_hash(user.password, data['password']):
        return jsonify({'message': 'Invalid credentials'}), 401
    access_token = create_access_token(identity=user.id)
    return jsonify({'access_token': access_token, 'user': {'id': user.id, 'username': user.username}})

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', 5000))) 