# 🚀 TaskFlow

### Plan • Track • Complete

TaskFlow is a modern and professional Task Management Web Application designed to help users organize, manage, track, and complete their daily tasks efficiently.

---

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
- 🚦 Task Priority Management
- ✅ Task Status Management
- 📅 Due Date Management
- 👤 User Profile
- 📈 Dynamic Dashboard Statistics
- 💾 SQLite Persistent Database
- 📱 Fully Responsive Design
- 🌙 Modern Dark UI
- 🔔 Toast Notifications

---

## 🛠️ Technology Stack

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

---

## 🏗️ Project Structure

<pre>
TaskFlow/
│
├── index.html
├── style.css
├── script.js
├── server.js
├── package.json
├── package-lock.json
├── .gitignore
└── README.md
</pre>

> Note: `taskflow.db` is created locally when the application runs and should not be committed to GitHub.

---

## 🔄 Application Architecture

<pre>
HTML5 + CSS3
      ↓
Vanilla JavaScript
      ↓
Fetch API
      ↓
Node.js + Express.js
      ↓
SQLite Database
      ↓
TaskFlow Data
</pre>

---

## 📊 Dashboard

The TaskFlow dashboard provides a complete overview of the user's tasks.

### Dashboard Includes

- Total Tasks
- To Do
- In Progress
- Completed
- Due Today
- Overdue Tasks

All dashboard statistics are dynamically loaded from the SQLite database.

---

## 📋 Task Management

Each task can contain:

- Task Title
- Description
- Category
- Priority
- Status
- Due Date

### Categories

- Personal
- Work
- Study
- Development
- Other

### Priority Levels

- Low
- Medium
- High

### Task Status

- To Do
- In Progress
- Completed

---

## 🔐 Authentication

TaskFlow uses secure server-side authentication.

### Authentication Features

- User Registration
- User Login
- Secure Logout
- Session Management
- Password Hashing
- User-specific Tasks

Passwords are securely hashed using bcryptjs and are never stored as plain text.

---

## 🗄️ Database

TaskFlow uses SQLite for persistent data storage.

### Users

The users table stores:

- User ID
- Name
- Email
- Password
- Created Date

### Tasks

The tasks table stores:

- Task ID
- User ID
- Task Title
- Description
- Category
- Priority
- Status
- Due Date
- Created Date
- Updated Date

The SQLite database is automatically initialized when the server starts.

---

## 🔌 REST API

### Authentication

- `POST /api/register`
- `POST /api/login`
- `POST /api/logout`
- `GET /api/me`

### Tasks

- `GET /api/tasks`
- `POST /api/tasks`
- `PUT /api/tasks/:id`
- `DELETE /api/tasks/:id`

### Profile

- `GET /api/profile`
- `PUT /api/profile`

---

## ⚙️ Installation & Setup

### 1. Clone the Repository

    git clone https://github.com/morisima1410/TaskFlow.git

### 2. Open the Project

    cd TaskFlow

### 3. Install Dependencies

    npm install

### 4. Start the Server

    node server.js

Or:

    npm start

### 5. Open in Browser

    http://localhost:3000

---

## 🎨 Design

TaskFlow features a clean, modern, and professional dark productivity-focused interface.

### Design Highlights

- Modern Dashboard
- Minimal UI
- Responsive Layout
- Clean Task Cards
- Smooth Interactions
- Subtle Animations
- Professional Typography
- Dark Purple Primary Theme
- Coral Accent Elements
- User-friendly Navigation

---

## 🔒 Security

TaskFlow includes:

- Password hashing using bcryptjs
- Server-side session authentication
- User-specific task access
- Backend input validation
- Parameterized SQLite queries
- Protected task operations

---

## 🚀 Future Improvements

- 📧 Email Notifications
- 🔔 Task Reminders
- 📆 Calendar Integration
- 📊 Advanced Productivity Analytics
- 👥 Team Collaboration
- 🔄 Recurring Tasks
- 🌐 Cloud Deployment

---

## 👨‍💻 Developer

### Sima Mori

Diploma in Computer Engineering  
Full Stack Developer

### Technologies Demonstrated

- HTML5
- CSS3
- Vanilla JavaScript
- Node.js
- Express.js
- SQLite
- REST API
- Authentication
- CRUD Operations
- Git & GitHub

---

## 📌 Project Purpose

TaskFlow was developed as a practical Full Stack Web Development project to demonstrate frontend development, backend API development, authentication, SQLite database management, REST APIs, and complete CRUD functionality using a lightweight and modern technology stack.

---

## ⭐ Support

If you like this project, consider giving the repository a ⭐ on GitHub.

---

## 📄 License

This project is created for educational and portfolio purposes.