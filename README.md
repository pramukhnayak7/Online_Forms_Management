# Forms Management Database

A simple SQL-first backend design for an online forms application.

This project currently contains the database schema for a forms system where users can:
- Create forms
- Add questions to forms
- Submit one response per form
- Store individual answers for each question

## Project Status

Current scope:
- Database schema design (MySQL style SQL)
- Relational structure with foreign keys
- Basic indexing for performance

Planned future scope (optional):
- Backend API (create form, submit response, fetch analytics)
- Frontend UI for form builder and response collection
- Authentication and authorization

## Database File

The schema is defined in:
- formsDB.sql

## Schema Overview

The schema uses 5 core tables:

1. Users
- Stores form creators and responders
- Includes unique username and email

2. Forms
- Each form belongs to one creator (Users)
- Stores form title and creation timestamp

3. Questions
- Each question belongs to one form
- Supports question types (example: text, radio, checkbox)
- Supports required/optional flag

4. Responses
- One row per user submission for a form
- Tracks who submitted and when
- Enforces one submission per user per form using unique(form_id, user_id)

5. Answers
- Stores answer values for each question inside a response
- Links response to question

## Relationships

- Users (1) -> (many) Forms
- Forms (1) -> (many) Questions
- Forms (1) -> (many) Responses
- Users (1) -> (many) Responses
- Responses (1) -> (many) Answers
- Questions (1) -> (many) Answers

All foreign keys use ON DELETE CASCADE so related data is cleaned automatically when parent records are removed.

## Indexes Included

Performance indexes are added for common lookups:
- Questions by form_id
- Responses by form_id
- Answers by response_id

## How To Run The Schema

Prerequisites:
- MySQL or MariaDB

Steps:
1. Create and select your database (or use an existing one).
2. Open the SQL script in your SQL client.
3. Execute formsDB.sql.

If needed, update the first line of the script:
- use FormsDB;

Make sure your actual database name matches this.

## Example Workflow

1. Insert users.
2. A creator inserts a form.
3. Add questions for that form.
4. A user submits a response row.
5. Insert one or more answer rows linked to response_id and question_id.

## Notes

- Password field currently stores plain text in schema examples; production systems should store password hashes only.
- question_type is stored as VARCHAR for flexibility.
- answer_text is TEXT and can be adapted later for typed/structured answers.

## Suggested Next Improvements

1. Add CHECK constraints or enum-like validation for question_type.
2. Add created_by / updated_at audit fields where needed.
3. Add soft delete strategy if recoverability is needed.
4. Add API layer and seed data scripts for testing.

## Author

Maintained as part of a learning project for building a forms application from scratch.