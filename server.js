import express from 'express';
import session from 'express-session';
import bcrypt from 'bcryptjs';
import { DatabaseSync } from 'node:sqlite';
import path from 'path';

const app = express();
const PORT = 3000;
const DB_PATH = path.resolve('taskflow.db');

// Database initialization using Node native SQLite module
const db = new DatabaseSync(DB_PATH);

// Initialize Pragma and Tables
db.exec('PRAGMA foreign_keys = ON;');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    category TEXT NOT NULL DEFAULT 'Other',
    priority TEXT NOT NULL DEFAULT 'Medium',
    status TEXT NOT NULL DEFAULT 'To Do',
    due_date TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

console.log('TaskFlow SQLite database taskflow.db initialized.');

// Express Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'taskflow_secure_session_secret_2026',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
}));

// Auth Guard Middleware
function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      authenticated: false,
      error: 'Unauthorized. Please log in.'
    });
  }
  next();
}

// ------------------- AUTHENTICATION ROUTES ------------------- //

// Register (Does NOT log user in, redirects to Login)
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ error: 'Please fill all required fields.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(normalizedEmail);

    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const stmt = db.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)');
    const result = stmt.run(name.trim(), normalizedEmail, hashedPassword);

    const newUserId = Number(result.lastInsertRowid);
    const user = db.prepare('SELECT id, name, email, created_at FROM users WHERE id = ?').get(newUserId);

    // Registration successful - Do NOT save session. Return message instructing user to log in.
    return res.status(201).json({
      success: true,
      message: 'Registration successful! Please login.',
      user
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Server error during registration.' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please fill all required fields.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = ?').get(normalizedEmail);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    req.session.userId = user.id;

    // Explicit session save before response
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({ error: 'Failed to create user session.' });
      }

      return res.json({
        success: true,
        message: 'Login successful.',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          created_at: user.created_at
        }
      });
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server error during login.' });
  }
});

// Logout
app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to logout.' });
    }
    res.clearCookie('connect.sid');
    return res.json({ success: true, message: 'Logged out successfully.' });
  });
});

// Get current logged-in user details (/api/me)
app.get('/api/me', (req, res) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({
        authenticated: false
      });
    }

    const user = db.prepare('SELECT id, name, email, created_at FROM users WHERE id = ?').get(req.session.userId);
    if (!user) {
      return res.status(401).json({
        authenticated: false,
        error: 'User not found.'
      });
    }

    return res.json({
      authenticated: true,
      user
    });
  } catch (err) {
    console.error('/api/me error:', err);
    return res.status(500).json({
      authenticated: false,
      error: 'Failed to fetch user session info.'
    });
  }
});

// Get profile & stats
app.get('/api/profile', requireAuth, (req, res) => {
  try {
    const user = db.prepare('SELECT id, name, email, created_at FROM users WHERE id = ?').get(req.session.userId);
    const taskStats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed
      FROM tasks WHERE user_id = ?
    `).get(req.session.userId);

    return res.json({
      user: user || {},
      stats: {
        totalTasks: taskStats ? (Number(taskStats.total) || 0) : 0,
        completedTasks: taskStats ? (Number(taskStats.completed) || 0) : 0
      }
    });
  } catch (err) {
    console.error('Profile error:', err);
    return res.status(500).json({ error: 'Failed to fetch profile.' });
  }
});

// Update profile name
app.put('/api/profile', requireAuth, (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name cannot be empty.' });
    }

    db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name.trim(), req.session.userId);
    const updatedUser = db.prepare('SELECT id, name, email, created_at FROM users WHERE id = ?').get(req.session.userId);

    return res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: updatedUser
    });
  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// ------------------- TASK MANAGEMENT ROUTES ------------------- //

function getTaskStats(userId) {
  const todayStr = new Date().toISOString().split('T')[0];

  const totalRow = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE user_id = ?').get(userId);
  const todoRow = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND status = 'To Do'").get(userId);
  const inProgressRow = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND status = 'In Progress'").get(userId);
  const completedRow = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND status = 'Completed'").get(userId);
  const dueTodayRow = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND due_date = ?").get(userId, todayStr);
  const overdueRow = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND status != 'Completed' AND due_date != '' AND due_date < ?").get(userId, todayStr);

  return {
    total: totalRow ? (Number(totalRow.count) || 0) : 0,
    todo: todoRow ? (Number(todoRow.count) || 0) : 0,
    inProgress: inProgressRow ? (Number(inProgressRow.count) || 0) : 0,
    completed: completedRow ? (Number(completedRow.count) || 0) : 0,
    dueToday: dueTodayRow ? (Number(dueTodayRow.count) || 0) : 0,
    overdue: overdueRow ? (Number(overdueRow.count) || 0) : 0
  };
}

// Get tasks with filtering, search, and sorting
app.get('/api/tasks', requireAuth, (req, res) => {
  try {
    const userId = req.session.userId;
    const { search, category, priority, status, sort } = req.query;

    let query = 'SELECT * FROM tasks WHERE user_id = ?';
    const params = [userId];

    if (category && category !== 'All') {
      query += ' AND category = ?';
      params.push(category);
    }

    if (priority && priority !== 'All') {
      query += ' AND priority = ?';
      params.push(priority);
    }

    if (status && status !== 'All') {
      query += ' AND status = ?';
      params.push(status);
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      const searchTerm = `%${search.trim()}%`;
      query += ' AND (title LIKE ? OR description LIKE ? OR category LIKE ?)';
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Sorting
    if (sort === 'Oldest') {
      query += ' ORDER BY created_at ASC';
    } else if (sort === 'Due Date') {
      query += ' ORDER BY CASE WHEN due_date IS NULL OR due_date = "" THEN 1 ELSE 0 END, due_date ASC';
    } else if (sort === 'Priority') {
      query += ` ORDER BY CASE priority WHEN 'High' THEN 1 WHEN 'Medium' THEN 2 WHEN 'Low' THEN 3 ELSE 4 END`;
    } else {
      query += ' ORDER BY created_at DESC';
    }

    const rawTasks = db.prepare(query).all(...params);
    const tasks = Array.isArray(rawTasks) ? rawTasks : [];
    const stats = getTaskStats(userId);

    return res.json({ tasks, stats });
  } catch (err) {
    console.error('Error fetching tasks:', err);
    return res.status(500).json({ error: 'Failed to fetch tasks.', tasks: [], stats: { total: 0, todo: 0, inProgress: 0, completed: 0, dueToday: 0, overdue: 0 } });
  }
});

// Create Task
app.post('/api/tasks', requireAuth, (req, res) => {
  try {
    const userId = req.session.userId;
    const { title, description = '', category = 'Other', priority = 'Medium', status = 'To Do', due_date = '' } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Task title is required.' });
    }

    const validCategories = ['Personal', 'Work', 'Study', 'Development', 'Other'];
    const validPriorities = ['Low', 'Medium', 'High'];
    const validStatuses = ['To Do', 'In Progress', 'Completed'];

    const cat = validCategories.includes(category) ? category : 'Other';
    const prio = validPriorities.includes(priority) ? priority : 'Medium';
    const stat = validStatuses.includes(status) ? status : 'To Do';

    const stmt = db.prepare(`
      INSERT INTO tasks (user_id, title, description, category, priority, status, due_date, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);
    const result = stmt.run(userId, title.trim(), String(description).trim(), cat, prio, stat, String(due_date).trim());

    const newTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(Number(result.lastInsertRowid));

    return res.status(201).json({
      success: true,
      message: 'Task created successfully.',
      task: newTask
    });
  } catch (err) {
    console.error('Create task error:', err);
    return res.status(500).json({ error: 'Failed to create task.' });
  }
});

// Update Task
app.put('/api/tasks/:id', requireAuth, (req, res) => {
  try {
    const userId = req.session.userId;
    const taskId = req.params.id;
    const { title, description = '', category = 'Other', priority = 'Medium', status = 'To Do', due_date = '' } = req.body;

    const existingTask = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(taskId, userId);
    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found or permission denied.' });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Task title is required.' });
    }

    const validCategories = ['Personal', 'Work', 'Study', 'Development', 'Other'];
    const validPriorities = ['Low', 'Medium', 'High'];
    const validStatuses = ['To Do', 'In Progress', 'Completed'];

    const cat = validCategories.includes(category) ? category : 'Other';
    const prio = validPriorities.includes(priority) ? priority : 'Medium';
    const stat = validStatuses.includes(status) ? status : 'To Do';

    db.prepare(`
      UPDATE tasks 
      SET title = ?, description = ?, category = ?, priority = ?, status = ?, due_date = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `).run(title.trim(), String(description).trim(), cat, prio, stat, String(due_date).trim(), taskId, userId);

    const updatedTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);

    return res.json({
      success: true,
      message: 'Task updated successfully.',
      task: updatedTask
    });
  } catch (err) {
    console.error('Update task error:', err);
    return res.status(500).json({ error: 'Failed to update task.' });
  }
});

// Delete Task
app.delete('/api/tasks/:id', requireAuth, (req, res) => {
  try {
    const userId = req.session.userId;
    const taskId = req.params.id;

    const existingTask = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(taskId, userId);
    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found or permission denied.' });
    }

    db.prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?').run(taskId, userId);

    return res.json({
      success: true,
      message: 'Task deleted successfully.'
    });
  } catch (err) {
    console.error('Delete task error:', err);
    return res.status(500).json({ error: 'Failed to delete task.' });
  }
});

// Static assets
app.use(express.static(path.resolve('.')));

// Catch-all route to serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.resolve('index.html'));
});

// Start Server


app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
