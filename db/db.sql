
-- SQLite schema for LUCT Reporting App

-- Roles: student, lecturer, prl, pl, admin
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  full_name TEXT,
  email TEXT UNIQUE,
  password_hash TEXT,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student','lecturer','prl','pl','admin')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS faculties (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  faculty_id INTEGER,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  stream TEXT,
  FOREIGN KEY (faculty_id) REFERENCES faculties(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS classes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  course_id INTEGER,
  venue TEXT,
  scheduled_time TEXT,
  total_registered INTEGER DEFAULT 0,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL
);

-- Each lecture instance (a date when a lecture happened)
CREATE TABLE IF NOT EXISTS lectures (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  class_id INTEGER,
  course_id INTEGER,
  lecturer_id INTEGER,
  week_of_reporting TEXT,
  lecture_date DATE,
  topic_taught TEXT,
  learning_outcomes TEXT,
  recommendations TEXT,
  actual_students_present INTEGER,
  feedback TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
  FOREIGN KEY (lecturer_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_lectures_lecturer_id ON lectures(lecturer_id);
CREATE INDEX idx_lectures_class_id ON lectures(class_id);
CREATE INDEX idx_lectures_course_id ON lectures(course_id);
CREATE INDEX idx_lectures_created_at ON lectures(created_at);

-- Simple ratings/monitoring table
CREATE TABLE IF NOT EXISTS ratings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  target_id INTEGER, -- e.g., lecturer or course id
  target_type TEXT CHECK (target_type IN ('lecturer','course','class')),
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_ratings_user_id ON ratings(user_id);
CREATE INDEX idx_ratings_target_id ON ratings(target_id);

-- Sample data (optional)
INSERT INTO faculties (name) VALUES ('Engineering'), ('Sciences'), ('Business');

-- Example course and class
INSERT INTO courses (faculty_id, name, code, stream) VALUES (1, 'Database Systems', 'CS101', 'Computer Science');
INSERT INTO classes (name, course_id, venue, scheduled_time, total_registered) VALUES ('CS101 - A', 1, 'Room 12', '09:00 - 10:30', 120);
