-- MySQL schema for LUCT Reporting App

DROP TABLE IF EXISTS ratings;
DROP TABLE IF EXISTS lectures;
DROP TABLE IF EXISTS classes;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS faculties;
DROP TABLE IF EXISTS users;

-- Roles: student, lecturer, prl, pl, admin
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  full_name VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  password_hash VARCHAR(255),
  role VARCHAR(20) NOT NULL DEFAULT 'student' CHECK (role IN ('student','lecturer','prl','pl','admin')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);

CREATE TABLE faculties (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

CREATE TABLE courses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  faculty_id INT,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) NOT NULL,
  stream VARCHAR(50),
  FOREIGN KEY (faculty_id) REFERENCES faculties(id) ON DELETE SET NULL
);

CREATE TABLE classes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  course_id INT,
  venue VARCHAR(50),
  scheduled_time VARCHAR(50),
  total_registered INT DEFAULT 0,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL
);

-- Each lecture instance (a date when a lecture happened)
CREATE TABLE lectures (
  id INT AUTO_INCREMENT PRIMARY KEY,
  class_id INT,
  course_id INT,
  lecturer_id INT,
  week_of_reporting VARCHAR(50),
  lecture_date DATE,
  topic_taught TEXT,
  learning_outcomes TEXT,
  recommendations TEXT,
  actual_students_present INT,
  feedback TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
  FOREIGN KEY (lecturer_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_lectures_lecturer_id ON lectures(lecturer_id);
CREATE INDEX idx_lectures_class_id ON lectures(class_id);
CREATE INDEX idx_lectures_course_id ON lectures(course_id);
CREATE INDEX idx_lectures_created_at ON lectures(created_at);

-- Simple ratings/monitoring table
CREATE TABLE ratings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  target_id INT, -- e.g., lecturer or course id
  target_type VARCHAR(20) CHECK (target_type IN ('lecturer','course','class')),
  rating INT CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_ratings_user_id ON ratings(user_id);
CREATE INDEX idx_ratings_target_id ON ratings(target_id);

-- Sample data
INSERT INTO faculties (name) VALUES ('Engineering'), ('Sciences'), ('Business');
INSERT INTO courses (faculty_id, name, code, stream) VALUES (1, 'Database Systems', 'CS101', 'Computer Science');
INSERT INTO classes (name, course_id, venue, scheduled_time, total_registered) VALUES ('CS101 - A', 1, 'Room 12', '09:00 - 10:30', 120);
