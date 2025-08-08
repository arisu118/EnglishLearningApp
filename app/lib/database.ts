import Database from 'better-sqlite3'
import { hash } from 'bcryptjs'
import path from 'path'

const dbPath = path.join(process.cwd(), 'english_app.db')
const db = new Database(dbPath)

// Initialize database
export function initDatabase() {
  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS topics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      level TEXT NOT NULL,
      description TEXT
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS vocabularies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      word TEXT NOT NULL,
      meaning TEXT NOT NULL,
      example TEXT,
      pronunciation TEXT,
      topic_id INTEGER,
      FOREIGN KEY (topic_id) REFERENCES topics (id)
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      vocab_id INTEGER,
      status TEXT DEFAULT 'not_learned',
      score INTEGER DEFAULT 0,
      last_reviewed DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (vocab_id) REFERENCES vocabularies (id)
    )
  `)

  db.exec(`
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
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      quiz_id INTEGER,
      score REAL,
      total_questions INTEGER,
      completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (quiz_id) REFERENCES quizzes (id)
    )
  `)

  // Insert sample data if tables are empty
  const topicCount = db.prepare('SELECT COUNT(*) as count FROM topics').get() as { count: number }
  
  if (topicCount.count === 0) {
    insertSampleData()
  }
}

async function insertSampleData() {
  // Sample topics
  const insertTopic = db.prepare('INSERT INTO topics (name, level, description) VALUES (?, ?, ?)')
  const topics = [
    ['Family', 'A1', 'Basic family vocabulary'],
    ['Travel', 'A2', 'Travel-related words'],
    ['Business', 'B1', 'Business English vocabulary'],
    ['Technology', 'B2', 'Technology terms']
  ]
  
  topics.forEach(topic => insertTopic.run(...topic))

  // Sample vocabularies
  const insertVocab = db.prepare('INSERT INTO vocabularies (word, meaning, example, pronunciation, topic_id) VALUES (?, ?, ?, ?, ?)')
  const vocabularies = [
    ['father', 'bố', 'My father is a teacher.', '/ˈfɑːðər/', 1],
    ['mother', 'mẹ', 'My mother cooks delicious food.', '/ˈmʌðər/', 1],
    ['brother', 'anh/em trai', 'I have one brother.', '/ˈbrʌðər/', 1],
    ['sister', 'chị/em gái', 'My sister is younger than me.', '/ˈsɪstər/', 1],
    ['airport', 'sân bay', 'We arrived at the airport early.', '/ˈeərpɔːrt/', 2],
    ['hotel', 'khách sạn', 'The hotel was very comfortable.', '/hoʊˈtel/', 2],
    ['passport', 'hộ chiếu', 'Don\'t forget your passport.', '/ˈpæspɔːrt/', 2],
    ['meeting', 'cuộc họp', 'We have a meeting at 3 PM.', '/ˈmiːtɪŋ/', 3],
    ['computer', 'máy tính', 'I use my computer every day.', '/kəmˈpjuːtər/', 4]
  ]
  
  vocabularies.forEach(vocab => insertVocab.run(...vocab))

  // Sample quizzes
  const insertQuiz = db.prepare('INSERT INTO quizzes (topic_id, question, option_a, option_b, option_c, option_d, correct_answer) VALUES (?, ?, ?, ?, ?, ?, ?)')
  const quizzes = [
    [1, 'What does "father" mean?', 'bố', 'mẹ', 'anh trai', 'chị gái', 'A'],
    [1, 'What does "sister" mean?', 'bố', 'mẹ', 'anh trai', 'chị/em gái', 'D'],
    [2, 'What does "airport" mean?', 'khách sạn', 'sân bay', 'hộ chiếu', 'máy bay', 'B'],
    [3, 'What does "meeting" mean?', 'cuộc họp', 'văn phòng', 'công ty', 'nhân viên', 'A']
  ]
  
  quizzes.forEach(quiz => insertQuiz.run(...quiz))

  // Create admin user
  const adminPassword = await hash('admin123', 12)
  const insertUser = db.prepare('INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)')
  insertUser.run('admin', 'admin@example.com', adminPassword, 'admin')
}

// Initialize database on import
initDatabase()

export default db
