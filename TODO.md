# Database Schema Update Plan

## Completed Steps
- [x] Update users table: Add UNIQUE constraint on email and create indexes on username and email in db/db.sql and db/mysql_schema.sql.
- [x] Update lectures table: Add updated_at field and create indexes on lecturer_id, class_id, course_id, created_at in db/db.sql and db/mysql_schema.sql.
- [x] Update ratings table: Add CHECK constraint on rating (1-5), updated_at field, and create indexes on user_id and target_id in db/db.sql and db/mysql_schema.sql.
- [ ] Test schema: Verify SQLite schema by restarting backend (if running) or executing schema in a new DB instance. Check for errors in constraints and indexes.
- [ ] Verify MySQL schema: If MySQL is used, run the schema script and confirm no syntax errors.
- [ ] Line-by-line review: Ensure no syntax issues, proper data types, relationships intact, and sample data inserts successfully.
- [ ] Update backend if needed: No changes required, but confirm db init uses updated schema.
