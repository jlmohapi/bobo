// server.js
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const XLSX = require('xlsx');
const { stringify } = require('csv-stringify/sync');

const app = express();
app.use(cors());
app.use(express.json()); // modern replacement for bodyParser.json()

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

// -------------------- Database init --------------------
const DB_DIR = path.resolve(__dirname, 'db'); // ensure 'db' directory is next to this server.js
const DB_FILE = path.join(DB_DIR, 'luct_reporting.db');
const DB_SCHEMA_FILE = path.join(__dirname, '..', 'db', 'db.sql');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
  console.log('Created DB directory:', DB_DIR);
}

// open (will create file if not exists)
const db = new sqlite3.Database(DB_FILE, (err) => {
  if (err) {
    console.error('Failed to open SQLite DB:', err);
    process.exit(1);
  } else {
    console.log('Opened SQLite DB at', DB_FILE);
  }
});

// run schema if present (careful: db.exec will run the SQL file contents)
try {
  if (fs.existsSync(DB_SCHEMA_FILE)) {
    const sql = fs.readFileSync(DB_SCHEMA_FILE, 'utf8');
    if (sql && sql.trim()) {
      db.exec(sql, (err) => {
        if (err) console.error('Error executing DB schema:', err);
        else console.log('DB schema executed from', DB_SCHEMA_FILE);
      });
    }
  } else {
    console.warn('DB schema file not found at', DB_SCHEMA_FILE, '- skipping schema exec.');
  }
} catch (e) {
  console.error('Error reading/executing DB schema file:', e);
}

// Promisified helper functions
function dbQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        return reject(err);
      }
      resolve(rows || []);
    });
  });
}

function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ insertId: this.lastID, changes: this.changes });
    });
  });
}

// -------------------- Auth middleware --------------------
function auth(requiredRole) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'no token' });
    const parts = authHeader.split(' ');
    if (parts.length !== 2) return res.status(401).json({ error: 'malformed token' });
    const token = parts[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (requiredRole && decoded.role !== requiredRole) return res.status(403).json({ error: 'forbidden' });
      req.user = decoded;
      next();
    } catch (err) {
      return res.status(401).json({ error: 'invalid token', details: err.message });
    }
  };
}

// -------------------- Routes --------------------

// Health
app.get('/api/health', (req, res) => res.json({ ok: true }));

// REGISTER
app.post('/api/register', async (req, res) => {
  try {
    const { username, full_name, password, role } = req.body || {};

    // basic validation
    if (!username || !password || !full_name) {
      return res.status(400).json({ error: 'username, full_name and password are required' });
    }

    // normalize role
    const allowedRoles = ['student', 'lecturer', 'prl', 'pl', 'admin'];
    const useRole = allowedRoles.includes(role) ? role : 'student';

    // check existing username to give nicer error
    const existing = await dbQuery('SELECT id FROM users WHERE username = ?', [username]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'username already exists' });
    }

    const hash = await bcrypt.hash(password, 10);

    const r = await dbRun(
      'INSERT INTO users (username, full_name, password_hash, role, created_at) VALUES (?,?,?,?,datetime("now"))',
      [username, full_name, hash, useRole]
    );

    return res.status(201).json({ id: r.insertId, message: 'registered' });
  } catch (err) {
    console.error('Register error:', err && err.message ? err.message : err);
    // handle sqlite unique constraint text (fallback)
    const msg = err && err.message ? err.message : '';
    if (msg.toLowerCase().includes('unique') || msg.toLowerCase().includes('constraint')) {
      return res.status(400).json({ error: 'username already exists', details: msg });
    }
    return res.status(500).json({ error: 'db error', details: msg });
  }
});

// LOGIN
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: 'username and password required' });

    const rows = await dbQuery('SELECT * FROM users WHERE username = ?', [username]);
    if (rows.length === 0) return res.status(400).json({ error: 'invalid' });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(400).json({ error: 'invalid' });

    const token = jwt.sign({ id: user.id, role: user.role, full_name: user.full_name }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, role: user.role, full_name: user.full_name });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'db error', details: err.message });
  }
});

// GET FACULTIES
app.get('/api/faculties', auth(), async (req, res) => {
  try {
    const rows = await dbQuery('SELECT * FROM faculties ORDER BY name');
    res.json(rows);
  } catch (err) {
    console.error('Faculties error:', err);
    res.status(500).json({ error: 'db error', details: err.message });
  }
});

// SUBMIT REPORT
app.post('/api/reports', auth('lecturer'), async (req, res) => {
  const r = req.body || {};
  try {
    // basic validation
    if (!r.class_id || !r.course_id || !r.lecture_date || !r.topic_taught || !r.learning_outcomes) {
      return res.status(400).json({ error: 'missing required report fields' });
    }

    const result = await dbRun(
      `INSERT INTO lectures
        (class_id, course_id, lecturer_id, week_of_reporting, lecture_date, topic_taught, learning_outcomes, recommendations, actual_students_present, created_at)
       VALUES (?,?,?,?,?,?,?,?,?, datetime("now"))`,
      [
        r.class_id,
        r.course_id,
        req.user.id,
        r.week_of_reporting || '',
        r.lecture_date,
        r.topic_taught,
        r.learning_outcomes,
        r.recommendations || '',
        Number(r.actual_students_present) || 0
      ]
    );

    res.json({ id: result.insertId });
  } catch (err) {
    console.error('Submit report error:', err);
    res.status(500).json({ error: 'db error', details: err.message });
  }
});

// LIST REPORTS
app.get('/api/reports', auth(), async (req, res) => {
  try {
    const q = req.query.q || '';
    let sql = `SELECT lectures.*, courses.name AS course_name, courses.code AS course_code, users.full_name AS lecturer_name, classes.name AS class_name, classes.total_registered
               FROM lectures
               LEFT JOIN courses ON lectures.course_id = courses.id
               LEFT JOIN classes ON lectures.class_id = classes.id
               LEFT JOIN users ON lectures.lecturer_id = users.id`;
    const params = [];
    const where = [];

    if (req.user.role === 'lecturer') {
      where.push('lectures.lecturer_id = ?');
      params.push(req.user.id);
    }

    if (q) {
      where.push('(courses.name LIKE ? OR users.full_name LIKE ? OR lectures.topic_taught LIKE ?)');
      const w = `%${q}%`;
      params.push(w, w, w);
    }

    if (where.length) sql += ' WHERE ' + where.join(' AND ');
    sql += ' ORDER BY lectures.created_at DESC LIMIT 200';

    const rows = await dbQuery(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('List reports error:', err);
    res.status(500).json({ error: 'db error', details: err.message });
  }
});

// EXPORT REPORTS (CSV / Excel)
app.get('/api/reports/export', auth(), async (req, res) => {
  try {
    const q = req.query.q || '';
    const format = (req.query.format || 'csv').toLowerCase();

    let sql = `SELECT lectures.*, courses.name AS course_name, courses.code AS course_code, users.full_name AS lecturer_name, classes.name AS class_name, classes.total_registered
               FROM lectures
               LEFT JOIN courses ON lectures.course_id = courses.id
               LEFT JOIN classes ON lectures.class_id = classes.id
               LEFT JOIN users ON lectures.lecturer_id = users.id`;
    const params = [];
    const where = [];

    if (req.user.role === 'lecturer') {
      where.push('lectures.lecturer_id = ?');
      params.push(req.user.id);
    }

    if (q) {
      where.push('(courses.name LIKE ? OR users.full_name LIKE ? OR lectures.topic_taught LIKE ?)');
      const w = `%${q}%`;
      params.push(w, w, w);
    }

    if (where.length) sql += ' WHERE ' + where.join(' AND ');

    const rows = await dbQuery(sql, params);

    if (format === 'excel') {
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Reports');
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-disposition', 'attachment; filename=reports.xlsx');
      res.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      return res.send(buffer);
    } else {
      const header = Object.keys(rows[0] || {});
      const data = rows.map(r => header.map(h => (r[h] === null || typeof r[h] === 'undefined') ? '' : r[h]));
      const csv = stringify([header, ...data]);
      res.setHeader('Content-disposition', 'attachment; filename=reports.csv');
      res.set('Content-Type', 'text/csv');
      return res.send(csv);
    }
  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ error: 'db error', details: err.message });
  }
});

// COURSES
app.get('/api/courses', auth(), async (req, res) => {
  try {
    const q = req.query.q || '';
    let sql = 'SELECT courses.*, faculties.name AS faculty_name FROM courses LEFT JOIN faculties ON courses.faculty_id = faculties.id';
    const params = [];
    const where = [];
    if (q) {
      where.push('(courses.name LIKE ? OR courses.code LIKE ?)');
      const w = `%${q}%`;
      params.push(w, w);
    }
    if (where.length) sql += ' WHERE ' + where.join(' AND ');
    sql += ' ORDER BY courses.name';
    const rows = await dbQuery(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('Courses error:', err);
    res.status(500).json({ error: 'db error', details: err.message });
  }
});

app.post('/api/courses', auth('pl'), async (req, res) => {
  try {
    const { faculty_id, name, code, stream } = req.body || {};
    if (!faculty_id || !name || !code) return res.status(400).json({ error: 'faculty_id, name and code required' });
    const r = await dbRun('INSERT INTO courses (faculty_id, name, code, stream) VALUES (?,?,?,?)', [faculty_id, name, code, stream || '']);
    res.json({ id: r.insertId });
  } catch (err) {
    console.error('Add course error:', err);
    res.status(500).json({ error: 'db error', details: err.message });
  }
});

// CLASSES
app.get('/api/classes', auth(), async (req, res) => {
  try {
    const q = req.query.q || '';
    let sql = 'SELECT classes.*, courses.name AS course_name FROM classes LEFT JOIN courses ON classes.course_id = courses.id';
    const params = [];
    const where = [];
    if (q) {
      where.push('(classes.name LIKE ? OR courses.name LIKE ?)');
      const w = `%${q}%`;
      params.push(w, w);
    }
    if (where.length) sql += ' WHERE ' + where.join(' AND ');
    sql += ' ORDER BY classes.name';
    const rows = await dbQuery(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('Classes error:', err);
    res.status(500).json({ error: 'db error', details: err.message });
  }
});

app.post('/api/classes', auth('pl'), async (req, res) => {
  try {
    const { course_id, name, venue, scheduled_time, total_registered } = req.body || {};
    if (!course_id || !name) return res.status(400).json({ error: 'course_id and name required' });
    const r = await dbRun('INSERT INTO classes (course_id, name, venue, scheduled_time, total_registered) VALUES (?,?,?,?,?)', [course_id, name, venue || '', scheduled_time || '', Number(total_registered) || 0]);
    res.json({ id: r.insertId });
  } catch (err) {
    console.error('Add class error:', err);
    res.status(500).json({ error: 'db error', details: err.message });
  }
});

// USER'S CLASSES (for lecturer)
app.get('/api/user/classes', auth('lecturer'), async (req, res) => {
  try {
    // Find classes that have lectures by this lecturer (distinct)
    const rows = await dbQuery(
      `SELECT DISTINCT classes.*, courses.name AS course_name
       FROM classes
       LEFT JOIN courses ON classes.course_id = courses.id
       WHERE classes.id IN (SELECT class_id FROM lectures WHERE lecturer_id = ?)`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('User classes error:', err);
    res.status(500).json({ error: 'db error', details: err.message });
  }
});

// FEEDBACK (PRL)
app.put('/api/reports/:id/feedback', auth('prl'), async (req, res) => {
  try {
    const { feedback } = req.body || {};
    if (typeof feedback === 'undefined') return res.status(400).json({ error: 'feedback required' });
    await dbRun('UPDATE lectures SET feedback = ? WHERE id = ?', [feedback, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Feedback error:', err);
    res.status(500).json({ error: 'db error', details: err.message });
  }
});

// RATINGS
app.post('/api/ratings', auth(), async (req, res) => {
  try {
    const { target_id, target_type, rating, comment } = req.body || {};
    if (!target_id || !target_type || !rating) return res.status(400).json({ error: 'target_id, target_type and rating required' });
    const r = await dbRun('INSERT INTO ratings (user_id, target_id, target_type, rating, comment, created_at) VALUES (?,?,?,?,?, datetime("now"))', [req.user.id, target_id, target_type, Number(rating), comment || '']);
    res.json({ id: r.insertId });
  } catch (err) {
    console.error('Ratings error:', err);
    res.status(500).json({ error: 'db error', details: err.message });
  }
});

// MONITORING
app.get('/api/monitoring', auth(), async (req, res) => {
  try {
    // compute average attendance % (guard divide by zero)
    const attendanceRows = await dbQuery('SELECT AVG(CASE WHEN classes.total_registered > 0 THEN (CAST(lectures.actual_students_present AS FLOAT)/classes.total_registered) * 100 ELSE NULL END) AS avg_attendance FROM lectures LEFT JOIN classes ON lectures.class_id = classes.id');
    const ratingRows = await dbQuery('SELECT AVG(rating) AS avg_rating FROM ratings');
    const avg_attendance = attendanceRows[0] ? (attendanceRows[0].avg_attendance || 0) : 0;
    const avg_rating = ratingRows[0] ? (ratingRows[0].avg_rating || 0) : 0;
    res.json({ avg_attendance, avg_rating });
  } catch (err) {
    console.error('Monitoring error:', err);
    res.status(500).json({ error: 'db error', details: err.message });
  }
});

// -------------------- Global error handler --------------------
app.use((err, req, res, next) => {
  console.error('Unhandled error middleware:', err);
  res.status(500).json({ error: 'internal server error', details: err && err.message });
});

// -------------------- Start --------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
