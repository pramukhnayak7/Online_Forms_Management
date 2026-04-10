-- 1. Users
CREATE TABLE Users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    email VARCHAR(255) NOT NULL UNIQUE
);
-- 2. Forms
CREATE TABLE Forms (
    form_id VARCHAR(6) PRIMARY KEY,
    creator_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    FOREIGN KEY (creator_id) REFERENCES Users(user_id) ON DELETE CASCADE
);
-- 3. Questions
CREATE TABLE Questions (
    question_id SERIAL PRIMARY KEY,
    form_id VARCHAR(6) NOT NULL,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) DEFAULT 'text',
    is_required BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (form_id) REFERENCES Forms(form_id) ON DELETE CASCADE
);
-- 4. Responses
CREATE TABLE Responses (
    response_id SERIAL PRIMARY KEY,
    form_id VARCHAR(6) NOT NULL,
    user_id INT NOT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (form_id) REFERENCES Forms(form_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    UNIQUE (form_id, user_id)
);
-- 5. Answers
CREATE TABLE Answers (
    answer_id SERIAL PRIMARY KEY,
    response_id INT NOT NULL,
    question_id INT NOT NULL,
    answer_text TEXT,
    FOREIGN KEY (response_id) REFERENCES Responses(response_id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES Questions(question_id) ON DELETE CASCADE
);
-- Indexes
CREATE INDEX idx_questions_form ON Questions(form_id);
CREATE INDEX idx_responses_form ON Responses(form_id);
CREATE INDEX idx_answers_response ON Answers(response_id);