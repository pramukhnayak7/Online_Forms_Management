from flask import Flask, request, jsonify, session
from flask_cors import CORS

app = Flask(__name__)
app.secret_key = "your-secret-key-change-this"
CORS(app, supports_credentials=True, origins=["http://localhost:3000"])

# Simple in-memory user store (replace with DB in production)
users = {}

@app.route("/api/signup", methods=["POST"])
def signup():
    data = request.json
    email = data.get("email", "").lower().strip()
    password = data.get("password", "")
    name = data.get("name", "")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400
    if email in users:
        return jsonify({"error": "User already exists"}), 409

    users[email] = {"name": name, "password": password}  # hash in prod!
    session["session_id"] = email
    return jsonify({"message": "Signup successful", "session_id": email}), 201

@app.route("/api/login", methods=["POST"])
def login():
    data = request.json
    email = data.get("email", "").lower().strip()
    password = data.get("password", "")

    user = users.get(email)
    if not user or user["password"] != password:
        return jsonify({"error": "Invalid credentials"}), 401

    session["session_id"] = email
    return jsonify({"message": "Login successful", "session_id": email}), 200

@app.route("/api/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"message": "Logged out"}), 200

@app.route("/api/me", methods=["GET"])
def me():
    session_id = session.get("session_id")
    if not session_id:
        return jsonify({"error": "Not authenticated"}), 401
    return jsonify({"session_id": session_id, "user": users.get(session_id)}), 200

if __name__ == "__main__":
    app.run(debug=True, port=5000)