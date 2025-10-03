
LUCT Faculty Reporting App - Full Version
=========================================

This full version includes:
- React frontend with role-based routing and protected routes
- Node.js backend with SQLite database
- JWT authentication for login/register
- Role-based dashboards: Student, Lecturer, PRL, PL, Admin
- Lecturer reporting form with validation and dropdowns
- Reports list with search, CSV/Excel export, PRL feedback
- Courses and Classes management for PL
- Monitoring stats and ratings system
- SQLite schema in db/db.sql

Quick Start:
1. Install Node.js.
2. Backend:
   cd backend
   npm install
   # .env file is already created with default settings
   node index.js
3. Frontend (in new terminal):
   cd frontend
   npm install
   npm start
4. Open http://localhost:3000
5. Register users with different roles (student, lecturer, prl, pl, admin)
6. Login and test features based on role

Roles:
- Student: View reports, submit ratings
- Lecturer: Submit reports, view own reports
- PRL: View reports, add feedback, manage courses
- PL: Manage courses and classes, view reports
- Admin: Full access

Features:
- Search in reports, courses, classes
- Export reports to CSV or Excel
- Role-based access control
- Form validation and error handling

