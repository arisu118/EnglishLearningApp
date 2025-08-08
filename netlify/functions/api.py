# Netlify Functions for deployment
import json
import sqlite3
import hashlib
import jwt
import datetime
from urllib.parse import parse_qs
import os

# Database setup for Netlify
def get_db_connection():
    # In Netlify, use /tmp directory for SQLite
    db_path = '/tmp/english_app.db'
    conn = sqlite3.connect(db_path)
    
    # Initialize database if it doesn't exist
    if not os.path.exists(db_path):
        init_database(conn)
    
    return conn

def init_database(conn):
    cursor = conn.cursor()
    
    # Create tables (same as in main app.py)
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
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS topics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            level TEXT NOT NULL,
            description TEXT
        )
    ''')
    
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
    
    # Insert sample data
    insert_sample_data(conn)

def insert_sample_data(conn):
    cursor = conn.cursor()
    
    # Check if data already exists
    cursor.execute("SELECT COUNT(*) FROM topics")
    if cursor.fetchone()[0] > 0:
        return
    
    # Sample data (same as in main app.py)
    topics = [
        ('Family', 'A1', 'Basic family vocabulary'),
        ('Travel', 'A2', 'Travel-related words'),
        ('Business', 'B1', 'Business English vocabulary'),
        ('Technology', 'B2', 'Technology terms')
    ]
    
    cursor.executemany("INSERT INTO topics (name, level, description) VALUES (?, ?, ?)", topics)
    
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

def handler(event, context):
    # CORS headers
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    }
    
    # Handle preflight requests
    if event['httpMethod'] == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': headers,
            'body': ''
        }
    
    try:
        path = event['path'].replace('/.netlify/functions/api', '')
        method = event['httpMethod']
        
        # Parse request body
        body = {}
        if event.get('body'):
            body = json.loads(event['body'])
        
        # Route handling
        if path == '/login' and method == 'POST':
            return login_handler(body, headers)
        elif path == '/register' and method == 'POST':
            return register_handler(body, headers)
        elif path == '/topics' and method == 'GET':
            return topics_handler(headers)
        elif path.startswith('/topics/') and path.endswith('/vocabularies') and method == 'GET':
            topic_id = path.split('/')[2]
            return vocabularies_handler(topic_id, headers)
        elif path.startswith('/topics/') and path.endswith('/quiz') and method == 'GET':
            topic_id = path.split('/')[2]
            return quiz_handler(topic_id, headers)
        elif path == '/quiz/submit' and method == 'POST':
            return submit_quiz_handler(body, event.get('headers', {}), headers)
        elif path == '/progress' and method == 'GET':
            return progress_handler(event.get('headers', {}), headers)
        else:
            return {
                'statusCode': 404,
                'headers': headers,
                'body': json.dumps({'error': 'Not found'})
            }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)})
        }

def login_handler(body, headers):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    username = body.get('username')
    password = body.get('password')
    
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
        }, 'your-secret-key-here', algorithm='HS256')
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'success': True,
                'token': token,
                'user': {
                    'id': user[0],
                    'username': user[1],
                    'email': user[2],
                    'role': user[3]
                }
            })
        }
    
    return {
        'statusCode': 401,
        'headers': headers,
        'body': json.dumps({'success': False, 'message': 'Invalid credentials'})
    }

def register_handler(body, headers):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    username = body.get('username')
    email = body.get('email')
    password = body.get('password')
    
    try:
        hashed_password = hashlib.sha256(password.encode()).hexdigest()
        cursor.execute("INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
                      (username, email, hashed_password))
        conn.commit()
        user_id = cursor.lastrowid
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'success': True, 'user_id': user_id})
        }
    except sqlite3.IntegrityError:
        conn.close()
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'success': False, 'message': 'Username or email already exists'})
        }

def topics_handler(headers):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM topics")
    topics = cursor.fetchall()
    conn.close()
    
    result = [{'id': t[0], 'name': t[1], 'level': t[2], 'description': t[3]} for t in topics]
    
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps(result)
    }

def vocabularies_handler(topic_id, headers):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM vocabularies WHERE topic_id = ?", (topic_id,))
    vocabularies = cursor.fetchall()
    conn.close()
    
    result = [{
        'id': v[0],
        'word': v[1],
        'meaning': v[2],
        'example': v[3],
        'pronunciation': v[4],
        'topic_id': v[5]
    } for v in vocabularies]
    
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps(result)
    }

def quiz_handler(topic_id, headers):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM quizzes WHERE topic_id = ?", (topic_id,))
    quizzes = cursor.fetchall()
    conn.close()
    
    result = [{
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
    
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps(result)
    }

def submit_quiz_handler(body, request_headers, headers):
    # Verify JWT token
    auth_header = request_headers.get('authorization', '')
    if not auth_header.startswith('Bearer '):
        return {
            'statusCode': 401,
            'headers': headers,
            'body': json.dumps({'error': 'Unauthorized'})
        }
    
    token = auth_header[7:]
    try:
        payload = jwt.decode(token, 'your-secret-key-here', algorithms=['HS256'])
        user_id = payload['user_id']
    except:
        return {
            'statusCode': 401,
            'headers': headers,
            'body': json.dumps({'error': 'Invalid token'})
        }
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    quiz_results = body.get('results', [])
    total_questions = len(quiz_results)
    correct_answers = sum(1 for result in quiz_results if result['is_correct'])
    score = (correct_answers / total_questions) * 100 if total_questions > 0 else 0
    
    # Save result to database
    cursor.execute("INSERT INTO results (user_id, quiz_id, score, total_questions) VALUES (?, ?, ?, ?)",
                  (user_id, quiz_results[0]['quiz_id'] if quiz_results else 0, score, total_questions))
    
    conn.commit()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({
            'score': score,
            'correct': correct_answers,
            'total': total_questions
        })
    }

def progress_handler(request_headers, headers):
    # Verify JWT token
    auth_header = request_headers.get('authorization', '')
    if not auth_header.startswith('Bearer '):
        return {
            'statusCode': 401,
            'headers': headers,
            'body': json.dumps({'error': 'Unauthorized'})
        }
    
    token = auth_header[7:]
    try:
        payload = jwt.decode(token, 'your-secret-key-here', algorithms=['HS256'])
        user_id = payload['user_id']
    except:
        return {
            'statusCode': 401,
            'headers': headers,
            'body': json.dumps({'error': 'Invalid token'})
        }
    
    conn = get_db_connection()
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
    """, (user_id,))
    
    stats = cursor.fetchone()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({
            'learned_words': stats[0] or 0,
            'average_score': round(stats[1] or 0, 2),
            'quizzes_taken': stats[2] or 0
        })
    }
