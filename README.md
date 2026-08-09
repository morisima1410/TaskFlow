

# 🚀 TaskFlow

### Plan • Track • Complete

TaskFlow is a modern and professional **Task Management Web Application** built to help users organize, track, and complete their tasks efficiently.

## ✨ Features

- 🔐 User Registration & Login
- 🚪 Secure Logout
- 📊 Dynamic Dashboard
- ➕ Create Tasks
- ✏️ Edit Tasks
- 🗑️ Delete Tasks
- 🔎 Search Tasks
- 🎯 Filter & Sort Tasks
- 📌 Task Categories
- 🚦 Task Priorities
- ✅ Task Status Management
- 📅 Due Dates
- 👤 User Profile
- 📈 Dynamic Task Statistics
- 💾 SQLite Database
- 📱 Responsive Design
- 🌙 Modern Dark UI
- 🔔 Toast Notifications

## 🛠️ Tech Stack

### Frontend
- HTML5
- CSS3
- Vanilla JavaScript

### Backend
- Node.js
- Express.js

### Database
- SQLite

### Authentication
- Express Session
- bcryptjs

## 🏗️ Project Structure

```text
TaskFlow/
├── index.html
├── style.css
├── script.js
├── server.js
├── package.json
└── taskflow.db

🔄 Architecture

HTML + CSS
     ↓
Vanilla JavaScript
     ↓
Fetch API
     ↓
Node.js + Express.js
     ↓
SQLite
     ↓
taskflow.db

📊 Dashboard

The dashboard provides a complete overview of the user's tasks:

Total Tasks

To Do

In Progress

Completed

Due Today

Overdue Tasks


All dashboard statistics are loaded dynamically from SQLite.

📋 Task Management

Each task includes:

Title

Description

Category

Priority

Status

Due Date


Categories

Personal

Work

Study

Development

Other


Priority

Low

Medium

High


Status

To Do

In Progress

Completed


🔐 Authentication

TaskFlow uses secure server-side authentication with:

User Registration

Login

Logout

Session Management

Password Hashing

User-specific Tasks


Passwords are securely hashed using bcryptjs and are never stored as plain text.

🗄️ Database

TaskFlow uses SQLite for persistent data storage.

Users

users
├── id
├── name
├── email
├── password
└── created_at

Tasks

tasks
├── id
├── user_id
├── title
├── description
├── category
├── priority
├── status
├── due_date
├── created_at
└── updated_at

🔌 REST API

Authentication

POST /api/register
POST /api/login
POST /api/logout
GET  /api/me

Tasks

GET    /api/tasks
POST   /api/tasks
PUT    /api/tasks/:id
DELETE /api/tasks/:id

Profile

GET /api/profile
PUT /api/profile

⚙️ Installation & Setup

1. Clone the repository

git clone YOUR_GITHUB_REPOSITORY_URL

2. Open the project

cd TaskFlow

3. Install dependencies

npm install

4. Start the server

node server.js

Or:

npm start

5. Open in browser

http://localhost:3000

The SQLite database will be initialized automatically when the server starts.

🎨 Design

TaskFlow features a clean and professional dark productivity interface with:

Modern dashboard

Minimal UI

Responsive layout

Clean task cards

Subtle animations

Professional typography

Dark purple primary theme

Coral accent elements


🔒 Security

Password hashing with bcryptjs

Session-based authentication

User-specific task access

Backend validation

Parameterized SQLite queries

Protected task operations


🚀 Future Improvements

📧 Email Notifications

🔔 Task Reminders

📆 Calendar Integration

📊 Advanced Productivity Analytics

👥 Team Collaboration

🔄 Recurring Tasks

🌐 Cloud Deployment


👨‍💻 Developer

Sima Mori 

Diploma in Computer Engineering
Full Stack Developer

Technologies Demonstrated

HTML5
CSS3
Vanilla JavaScript
Node.js
Express.js
SQLite
REST API
Authentication
CRUD Operations
Git & GitHub

📌 Project Purpose

TaskFlow was developed as a practical Full Stack Web Development project to demonstrate frontend development, backend API development, authentication, SQLite database management, REST APIs, and complete CRUD functionality using a lightweight technology stack.

⭐ Support

If you like this project, consider giving the repository a ⭐ on GitHub.


---

📄 License

This project is created for educational and portfolio purposes.

