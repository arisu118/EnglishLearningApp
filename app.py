from flask import Flask, request, jsonify, render_template, session
from flask_cors import CORS
import sqlite3
import hashlib
import jwt
import datetime
from functools import wraps
import os

app = Flask(__name__)
app.secret_key = 'your-secret-key-here'
CORS(app)

# Database Models (OOP approach)
class Database:
    def __init__(self, db_name='english_app.db'):
        self.db_name = db_name
        self.init_database()
    
    def get_connection(self):
        return sqlite3.connect(self.db_name)
    
    def init_database(self):
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Users table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Topics table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS topics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                level TEXT NOT NULL,
                description TEXT
            )
        ''')
        
        # Vocabularies table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS vocabularies (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                word TEXT NOT NULL,
                meaning TEXT NOT NULL,
                example TEXT,
                pronunciation TEXT,
                topic_id INTEGER,
                FOREIGN KEY (topic_id) REFERENCES topics (id)
            )
        ''')
        
        # Progress table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS progress (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                vocab_id INTEGER,
                status TEXT DEFAULT 'not_learned',
                score INTEGER DEFAULT 0,
                last_reviewed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id),
                FOREIGN KEY (vocab_id) REFERENCES vocabularies (id)
            )
        ''')
        
        # Quizzes table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS quizzes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                topic_id INTEGER,
                question TEXT NOT NULL,
                option_a TEXT NOT NULL,
                option_b TEXT NOT NULL,
                option_c TEXT NOT NULL,
                option_d TEXT NOT NULL,
                correct_answer TEXT NOT NULL,
                FOREIGN KEY (topic_id) REFERENCES topics (id)
            )
        ''')
        
        # Results table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS results (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                quiz_id INTEGER,
                score REAL,
                total_questions INTEGER,
                completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id),
                FOREIGN KEY (quiz_id) REFERENCES quizzes (id)
            )
        ''')
        
        conn.commit()
        conn.close()
        
        # Insert sample data
        self.insert_sample_data()
    
    def insert_sample_data(self):
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Check if data already exists
        cursor.execute("SELECT COUNT(*) FROM topics")
        if cursor.fetchone()[0] > 0:
            conn.close()
            return
        
        # Sample topics
        topics = [
            ('Family', 'A1', 'Basic family vocabulary'),
            ('Travel', 'A2', 'Travel-related words'),
            ('Business', 'B1', 'Business English vocabulary'),
            ('Technology', 'B2', 'Technology terms')
        ]
        
        cursor.executemany("INSERT INTO topics (name, level, description) VALUES (?, ?, ?)", topics)
        
        # Sample vocabularies
        vocabularies = [
            ('father', 'bố', 'My father is a teacher.', '/ˈfɑːðər/', 1),
            ('mother', 'mẹ', 'My mother cooks delicious food.', '/ˈmʌðər/', 1),
            ('brother', 'anh/em trai', 'I have one brother.', '/ˈbrʌðər/', 1),
            ('sister', 'chị/em gái', 'My sister is younger than me.', '/ˈsɪstər/', 1),
            ('airport', 'sân bay', 'We arrived at the airport early.', '/ˈeərpɔːrt/', 2),
            ('hotel', 'khách sạn', 'The hotel was very comfortable.', '/hoʊˈtel/', 2),
            ('passport', 'hộ chiếu', 'Don\'t forget your passport.', '/ˈpæspɔːrt/', 2),
            ('meeting', 'cuộc họp', 'We have a meeting at 3 PM.', '/ˈmiːtɪŋ/', 3),
            ('computer', 'máy tính', 'I use my computer every day.', '/kəmˈpjuːtər/', 4)
        ]
        
        cursor.executemany("INSERT INTO vocabularies (word, meaning, example, pronunciation, topic_id) VALUES (?, ?, ?, ?, ?)", vocabularies)
        
        # Sample quizzes
        quizzes = [
            (1, 'What does "father" mean?', 'bố', 'mẹ', 'anh trai', 'chị gái', 'A'),
            (1, 'What does "sister" mean?', 'bố', 'mẹ', 'anh trai', 'chị/em gái', 'D'),
            (2, 'What does "airport" mean?', 'khách sạn', 'sân bay', 'hộ chiếu', 'máy bay', 'B'),
            (3, 'What does "meeting" mean?', 'cuộc họp', 'văn phòng', 'công ty', 'nhân viên', 'A')
        ]
        
        cursor.executemany("INSERT INTO quizzes (topic_id, question, option_a, option_b, option_c, option_d, correct_answer) VALUES (?, ?, ?, ?, ?, ?, ?)", quizzes)
        
        # Create admin user
        admin_password = hashlib.sha256('admin123'.encode()).hexdigest()
        cursor.execute("INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)", 
                      ('admin', 'admin@example.com', admin_password, 'admin'))
        
        conn.commit()
        conn.close()

class User:
    def __init__(self, db):
        self.db = db
    
    def register(self, username, email, password):
        conn = self.db.get_connection()
        cursor = conn.cursor()
        
        try:
            hashed_password = hashlib.sha256(password.encode()).hexdigest()
            cursor.execute("INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
                          (username, email, hashed_password))
            conn.commit()
            user_id = cursor.lastrowid
            conn.close()
            return {'success': True, 'user_id': user_id}
        except sqlite3.IntegrityError:
            conn.close()
            return {'success': False, 'message': 'Username or email already exists'}
    
    def login(self, username, password):
        conn = self.db.get_connection()
        cursor = conn.cursor()
        
        hashed_password = hashlib.sha256(password.encode()).hexdigest()
        cursor.execute("SELECT id, username, email, role FROM users WHERE username = ? AND password = ?",
                      (username, hashed_password))
        user = cursor.fetchone()
        conn.close()
        
        if user:
            token = jwt.encode({
                'user_id': user[0],
                'username': user[1],
                'role': user[3],
                'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
            }, app.secret_key, algorithm='HS256')
            
            return {
                'success': True,
                'token': token,
                'user': {
                    'id': user[0],
                    'username': user[1],
                    'email': user[2],
                    'role': user[3]
                }
            }
        return {'success': False, 'message': 'Invalid credentials'}

class Topic:
    def __init__(self, db):
        self.db = db
    
    def get_all(self):
        conn = self.db.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM topics")
        topics = cursor.fetchall()
        conn.close()
        
        return [{'id': t[0], 'name': t[1], 'level': t[2], 'description': t[3]} for t in topics]
    
    def get_by_id(self, topic_id):
        conn = self.db.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM topics WHERE id = ?", (topic_id,))
        topic = cursor.fetchone()
        conn.close()
        
        if topic:
            return {'id': topic[0], 'name': topic[1], 'level': topic[2], 'description': topic[3]}
        return None

class Vocabulary:
    def __init__(self, db):
        self.db = db
    
    def get_by_topic(self, topic_id):
        conn = self.db.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM vocabularies WHERE topic_id = ?", (topic_id,))
        vocabularies = cursor.fetchall()
        conn.close()
        
        return [{
            'id': v[0],
            'word': v[1],
            'meaning': v[2],
            'example': v[3],
            'pronunciation': v[4],
            'topic_id': v[5]
        } for v in vocabularies]

class Quiz:
    def __init__(self, db):
        self.db = db
    
    def get_by_topic(self, topic_id):
        conn = self.db.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM quizzes WHERE topic_id = ?", (topic_id,))
        quizzes = cursor.fetchall()
        conn.close()
        
        return [{
            'id': q[0],
            'topic_id': q[1],
            'question': q[2],
            'options': {
                'A': q[3],
                'B': q[4],
                'C': q[5],
                'D': q[6]
            },
            'correct_answer': q[7]
        } for q in quizzes]
    
    def submit_result(self, user_id, quiz_results):
        conn = self.db.get_connection()
        cursor = conn.cursor()
        
        total_questions = len(quiz_results)
        correct_answers = sum(1 for result in quiz_results if result['is_correct'])
        score = (correct_answers / total_questions) * 100
        
        cursor.execute("INSERT INTO results (user_id, quiz_id, score, total_questions) VALUES (?, ?, ?, ?)",
                      (user_id, quiz_results[0]['quiz_id'], score, total_questions))
        
        conn.commit()
        conn.close()
        
        return {'score': score, 'correct': correct_answers, 'total': total_questions}

# Initialize database and models
db = Database()
user_model = User(db)
topic_model = Topic(db)
vocabulary_model = Vocabulary(db)
quiz_model = Quiz(db)

# Authentication decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
        
        try:
            if token.startswith('Bearer '):
                token = token[7:]
            data = jwt.decode(token, app.secret_key, algorithms=['HS256'])
            current_user = data
        except:
            return jsonify({'message': 'Token is invalid'}), 401
        
        return f(current_user, *args, **kwargs)
    return decorated

# Routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    result = user_model.register(data['username'], data['email'], data['password'])
    return jsonify(result)

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    result = user_model.login(data['username'], data['password'])
    return jsonify(result)

@app.route('/api/topics', methods=['GET'])
def get_topics():
    topics = topic_model.get_all()
    return jsonify(topics)

@app.route('/api/topics/<int:topic_id>/vocabularies', methods=['GET'])
def get_vocabularies(topic_id):
    vocabularies = vocabulary_model.get_by_topic(topic_id)
    return jsonify(vocabularies)

@app.route('/api/topics/<int:topic_id>/quiz', methods=['GET'])
def get_quiz(topic_id):
    quiz_questions = quiz_model.get_by_topic(topic_id)
    return jsonify(quiz_questions)

@app.route('/api/quiz/submit', methods=['POST'])
@token_required
def submit_quiz(current_user):
    data = request.get_json()
    result = quiz_model.submit_result(current_user['user_id'], data['results'])
    return jsonify(result)

@app.route('/api/progress', methods=['GET'])
@token_required
def get_progress(current_user):
    conn = db.get_connection()
    cursor = conn.cursor()
    
    # Get user's learning statistics
    cursor.execute("""
        SELECT 
            COUNT(DISTINCT p.vocab_id) as learned_words,
            AVG(r.score) as avg_score,
            COUNT(DISTINCT r.id) as quizzes_taken
        FROM progress p
        LEFT JOIN results r ON r.user_id = p.user_id
        WHERE p.user_id = ?
    """, (current_user['user_id'],))
    
    stats = cursor.fetchone()
    conn.close()
    
    return jsonify({
        'learned_words': stats[0] or 0,
        'average_score': round(stats[1] or 0, 2),
        'quizzes_taken': stats[2] or 0
    })

if __name__ == '__main__':
    app.run(debug=True)
