use FormsDB;
-- 1. Create Users Table (The "Creators" and "Responders")
CREATE TABLE Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    -- In real life, store hashes!
    name VARCHAR(100),
    email VARCHAR(255) NOT NULL UNIQUE
);
-- 2. Create Forms Table (Linked to Creator)
CREATE TABLE Forms (
    form_id INT AUTO_INCREMENT PRIMARY KEY,
    creator_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES Users(user_id) ON DELETE CASCADE
);
-- 3. Create Questions Table (Linked to Forms)
CREATE TABLE Questions (
    question_id INT AUTO_INCREMENT PRIMARY KEY,
    form_id INT NOT NULL,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) DEFAULT 'text',
    -- e.g., 'text', 'radio', 'checkbox'
    is_required BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (form_id) REFERENCES Forms(form_id) ON DELETE CASCADE
);
-- 4. Create Responses Table (The "Header" - Who took it and when?)
CREATE TABLE Responses (
    response_id INT AUTO_INCREMENT PRIMARY KEY,
    form_id INT NOT NULL,
    user_id INT NOT NULL,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (form_id) REFERENCES Forms(form_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    UNIQUE (form_id, user_id)
);
-- 5. Create Answers Table (The "Details" - The actual data)
CREATE TABLE Answers (
    answer_id INT AUTO_INCREMENT PRIMARY KEY,
    response_id INT NOT NULL,
    question_id INT NOT NULL,
    answer_text TEXT,
    FOREIGN KEY (response_id) REFERENCES Responses(response_id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES Questions(question_id) ON DELETE CASCADE
);
-- Performance indexes
CREATE INDEX idx_questions_form ON Questions(form_id);
CREATE INDEX idx_responses_form ON Responses(form_id);
CREATE INDEX idx_answers_response ON Answers(response_id);