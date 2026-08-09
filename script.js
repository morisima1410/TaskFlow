/**
 * TASKFLOW - Client Application Logic
 * Vanilla JavaScript implementation for Task Management Application
 */

// Application State
let currentUser = null;
let tasksList = [];
let taskStats = { total: 0, todo: 0, inProgress: 0, completed: 0, dueToday: 0, overdue: 0 };
let currentFilters = {
  search: '',
  category: 'All',
  priority: 'All',
  status: 'All',
  sort: 'Newest'
};
let deletingTaskId = null;
let searchDebounceTimeout = null;

// DOM Elements Initialization
document.addEventListener('DOMContentLoaded', () => {
  initEventListeners();
  checkAuth();
});

// Initialize All Event Listeners
function initEventListeners() {
  // Auth Forms
  const loginForm = document.getElementById('form-login');
  if (loginForm) loginForm.addEventListener('submit', handleLogin);

  const regForm = document.getElementById('form-register');
  if (regForm) regForm.addEventListener('submit', handleRegister);

  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

  // Profile
  const profileBtn = document.getElementById('btn-open-profile');
  if (profileBtn) profileBtn.addEventListener('click', openProfileModal);

  const closeProfileBtn = document.getElementById('btn-close-profile-modal');
  if (closeProfileBtn) closeProfileBtn.addEventListener('click', closeProfileModal);

  const cancelProfileBtn = document.getElementById('btn-cancel-profile');
  if (cancelProfileBtn) cancelProfileBtn.addEventListener('click', closeProfileModal);

  const updateProfileForm = document.getElementById('form-update-profile');
  if (updateProfileForm) updateProfileForm.addEventListener('submit', handleUpdateProfile);

  // Task Modal
  const createBtn = document.getElementById('btn-create-task');
  if (createBtn) createBtn.addEventListener('click', () => openTaskModal());

  const closeTaskBtn = document.getElementById('btn-close-task-modal');
  if (closeTaskBtn) closeTaskBtn.addEventListener('click', closeTaskModal);

  const cancelTaskBtn = document.getElementById('btn-cancel-task-modal');
  if (cancelTaskBtn) cancelTaskBtn.addEventListener('click', closeTaskModal);

  const taskForm = document.getElementById('form-task');
  if (taskForm) taskForm.addEventListener('submit', handleTaskFormSubmit);

  // Delete Modal
  const cancelDeleteBtn = document.getElementById('btn-cancel-delete');
  if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', closeDeleteModal);

  const confirmDeleteBtn = document.getElementById('btn-confirm-delete');
  if (confirmDeleteBtn) confirmDeleteBtn.addEventListener('click', handleConfirmDelete);

  // Filters & Search
  const searchInput = document.getElementById('filter-search');
  const clearSearchBtn = document.getElementById('btn-clear-search');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      if (clearSearchBtn) {
        if (val) {
          clearSearchBtn.classList.remove('hidden');
        } else {
          clearSearchBtn.classList.add('hidden');
        }
      }
      
      clearTimeout(searchDebounceTimeout);
      searchDebounceTimeout = setTimeout(() => {
        currentFilters.search = val;
        fetchTasks();
      }, 300);
    });
  }

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      clearSearchBtn.classList.add('hidden');
      currentFilters.search = '';
      fetchTasks();
    });
  }

  const categoryFilter = document.getElementById('filter-category');
  if (categoryFilter) {
    categoryFilter.addEventListener('change', (e) => {
      currentFilters.category = e.target.value;
      fetchTasks();
    });
  }

  const priorityFilter = document.getElementById('filter-priority');
  if (priorityFilter) {
    priorityFilter.addEventListener('change', (e) => {
      currentFilters.priority = e.target.value;
      fetchTasks();
    });
  }

  const statusFilter = document.getElementById('filter-status');
  if (statusFilter) {
    statusFilter.addEventListener('change', (e) => {
      currentFilters.status = e.target.value;
      fetchTasks();
    });
  }

  const sortFilter = document.getElementById('filter-sort');
  if (sortFilter) {
    sortFilter.addEventListener('change', (e) => {
      currentFilters.sort = e.target.value;
      fetchTasks();
    });
  }
}

// ------------------- TOAST NOTIFICATIONS ------------------- //
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  let iconSvg = '';
  if (type === 'success') {
    iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22C55E" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`;
  } else if (type === 'error') {
    iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
  } else {
    iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
  }

  toast.innerHTML = `${iconSvg}<span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ------------------- AUTHENTICATION LOGIC ------------------- //
async function checkAuth() {
  try {
    const res = await fetch('/api/me');
    if (res.ok) {
      const data = await res.json();
      if (data && data.authenticated && data.user) {
        currentUser = data.user;
        await showDashboardView();
        return;
      }
    }
    showAuthView();
  } catch (err) {
    showAuthView();
  }
}

function switchAuthTab(tab) {
  const loginTab = document.getElementById('tab-login');
  const regTab = document.getElementById('tab-register');
  const loginForm = document.getElementById('form-login');
  const regForm = document.getElementById('form-register');

  if (!loginTab || !regTab || !loginForm || !regForm) return;

  if (tab === 'login') {
    loginTab.classList.add('active');
    regTab.classList.remove('active');
    loginForm.classList.remove('hidden');
    regForm.classList.add('hidden');
  } else {
    regTab.classList.add('active');
    loginTab.classList.remove('active');
    regForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const emailInput = document.getElementById('login-email');
  const passInput = document.getElementById('login-password');

  if (!emailInput || !passInput) return;

  const email = emailInput.value.trim();
  const password = passInput.value;

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      showToast(data.error || 'Invalid email or password.', 'error');
      return;
    }

    if (data && data.user) {
      currentUser = data.user;
    }
    
    document.getElementById('form-login').reset();
    showToast(data.message || 'Login successful.', 'success');
    await showDashboardView();
  } catch (err) {
    showToast('Failed to connect to server.', 'error');
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const confirmPassword = document.getElementById('reg-confirm-password').value;

  if (password !== confirmPassword) {
    showToast('Passwords do not match.', 'error');
    return;
  }

  try {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, confirmPassword })
    });

    const data = await res.json();

    if (!res.ok) {
      showToast(data.error || 'Registration failed.', 'error');
      return;
    }

    // Reset registration form
    document.getElementById('form-register').reset();

    // Do NOT log in automatically. Show success message & switch to Login page
    showToast('Registration successful! Please login.', 'success');
    switchAuthTab('login');

    // Pre-fill email in login form for user convenience
    const loginEmailInput = document.getElementById('login-email');
    if (loginEmailInput) {
      loginEmailInput.value = email;
    }
  } catch (err) {
    showToast('Failed to connect to server.', 'error');
  }
}

async function handleLogout() {
  try {
    await fetch('/api/logout', { method: 'POST' });
    currentUser = null;
    showToast('Logged out successfully.', 'info');
    showAuthView();
  } catch (err) {
    showToast('Logout error.', 'error');
  }
}

function showAuthView() {
  const authSec = document.getElementById('auth-section');
  const dashSec = document.getElementById('dashboard-section');
  const navCtrls = document.getElementById('nav-user-controls');

  if (authSec) authSec.classList.remove('hidden');
  if (dashSec) dashSec.classList.add('hidden');
  if (navCtrls) navCtrls.classList.add('hidden');
}

async function showDashboardView() {
  const authSec = document.getElementById('auth-section');
  const dashSec = document.getElementById('dashboard-section');
  const navCtrls = document.getElementById('nav-user-controls');

  if (authSec) authSec.classList.add('hidden');
  if (dashSec) dashSec.classList.remove('hidden');
  if (navCtrls) navCtrls.classList.remove('hidden');

  try {
    const meRes = await fetch('/api/me');
    if (meRes.ok) {
      const meData = await meRes.json();
      if (meData && meData.authenticated && meData.user) {
        currentUser = meData.user;
      }
    } else if (meRes.status === 401) {
      showAuthView();
      return;
    }
  } catch (err) {
    console.error('Error verifying /api/me:', err);
  }

  if (currentUser && currentUser.name) {
    const nameStr = currentUser.name;
    const initial = nameStr.charAt(0).toUpperCase();

    const navName = document.getElementById('nav-user-name');
    const navAvatar = document.getElementById('nav-user-avatar');
    const greetingText = document.getElementById('greeting-text');

    if (navName) navName.textContent = nameStr;
    if (navAvatar) navAvatar.textContent = initial;

    const timeGreeting = getGreetingTime();
    if (greetingText) greetingText.textContent = `${timeGreeting}, ${nameStr}`;
  }

  await fetchTasks();
}

function getGreetingTime() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

// ------------------- TASK MANAGEMENT LOGIC ------------------- //
async function fetchTasks() {
  try {
    const queryParams = new URLSearchParams({
      search: currentFilters.search || '',
      category: currentFilters.category || 'All',
      priority: currentFilters.priority || 'All',
      status: currentFilters.status || 'All',
      sort: currentFilters.sort || 'Newest'
    });

    const res = await fetch(`/api/tasks?${queryParams.toString()}`);
    
    if (res.status === 401) {
      showAuthView();
      return;
    }

    if (!res.ok) {
      showToast('Unable to load dashboard data. Please refresh and try again.', 'error');
      renderTasksList();
      return;
    }

    const data = await res.json();

    // Defensive parsing
    tasksList = (data && Array.isArray(data.tasks)) ? data.tasks : [];
    taskStats = (data && data.stats) ? data.stats : { total: 0, todo: 0, inProgress: 0, completed: 0, dueToday: 0, overdue: 0 };

    updateDashboardStats();
    renderTasksList();
  } catch (err) {
    console.error('Error in fetchTasks:', err);
    showToast('Unable to load dashboard data. Please refresh and try again.', 'error');
    tasksList = [];
    taskStats = { total: 0, todo: 0, inProgress: 0, completed: 0, dueToday: 0, overdue: 0 };
    updateDashboardStats();
    renderTasksList();
  }
}

function updateDashboardStats() {
  const statTotal = document.getElementById('stat-total');
  const statTodo = document.getElementById('stat-todo');
  const statProgress = document.getElementById('stat-progress');
  const statCompleted = document.getElementById('stat-completed');

  if (statTotal) statTotal.textContent = Number(taskStats.total) || 0;
  if (statTodo) statTodo.textContent = Number(taskStats.todo) || 0;
  if (statProgress) statProgress.textContent = Number(taskStats.inProgress) || 0;
  if (statCompleted) statCompleted.textContent = Number(taskStats.completed) || 0;
}

function renderTasksList() {
  const container = document.getElementById('tasks-container');
  if (!container) return;

  container.innerHTML = '';

  if (!tasksList || tasksList.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
        </div>
        <h3>No tasks yet. Create your first task.</h3>
        <p>Get started by creating a new task to organize your workspace!</p>
        <button class="btn btn-primary" onclick="openTaskModal()">+ Create Task</button>
      </div>
    `;
    return;
  }

  tasksList.forEach(task => {
    if (!task) return;

    const isCompleted = task.status === 'Completed';
    const isOverdue = checkIsOverdue(task.due_date, task.status);

    const card = document.createElement('div');
    card.className = `task-card ${isCompleted ? 'completed' : ''}`;

    // Priority badge class
    let prioClass = 'badge-prio-low';
    if (task.priority === 'High') prioClass = 'badge-prio-high';
    else if (task.priority === 'Medium') prioClass = 'badge-prio-medium';

    // Status select styling
    let statusSelectClass = 'status-todo';
    if (task.status === 'In Progress') statusSelectClass = 'status-progress';
    else if (task.status === 'Completed') statusSelectClass = 'status-completed';

    const categoryText = task.category || 'Other';
    const priorityText = task.priority || 'Medium';

    card.innerHTML = `
      <div class="task-card-header">
        <div class="task-badges">
          <span class="badge badge-category">${escapeHtml(categoryText)}</span>
          <span class="badge ${prioClass}">${escapeHtml(priorityText)} Priority</span>
        </div>
      </div>

      <div class="task-body">
        <h3 class="task-title">${escapeHtml(task.title || 'Untitled Task')}</h3>
        ${task.description ? `<p class="task-desc">${escapeHtml(task.description)}</p>` : ''}
        
        <div class="task-meta">
          ${task.due_date ? `
            <span class="due-badge ${isOverdue ? 'overdue' : ''}">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              ${isOverdue ? 'OVERDUE (' + formatDueDate(task.due_date) + ')' : 'Due ' + formatDueDate(task.due_date)}
            </span>
          ` : ''}
        </div>
      </div>

      <div class="task-card-footer">
        <select class="form-control select-control status-select ${statusSelectClass}" onchange="quickUpdateStatus(${task.id}, this.value)">
          <option value="To Do" ${task.status === 'To Do' ? 'selected' : ''}>To Do</option>
          <option value="In Progress" ${task.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
          <option value="Completed" ${task.status === 'Completed' ? 'selected' : ''}>Completed</option>
        </select>

        <div class="task-actions">
          <button class="action-icon-btn" onclick="openTaskModal(${task.id})" title="Edit Task">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="action-icon-btn delete-btn" onclick="openDeleteModal(${task.id})" title="Delete Task">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </div>
    `;

    container.appendChild(card);
  });
}

function checkIsOverdue(dueDateStr, status) {
  if (!dueDateStr || status === 'Completed') return false;
  const todayStr = new Date().toISOString().split('T')[0];
  return dueDateStr < todayStr;
}

function formatDueDate(dateStr) {
  if (!dateStr) return '';
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  if (dateStr === todayStr) return 'Today';
  if (dateStr === tomorrowStr) return 'Tomorrow';

  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
    return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  return dateStr;
}

// ------------------- TASK MODAL HANDLERS ------------------- //
function openTaskModal(taskId = null) {
  const modal = document.getElementById('modal-task');
  const modalTitle = document.getElementById('modal-task-title');
  const taskIdInput = document.getElementById('task-id');
  const titleInput = document.getElementById('task-title');
  const descInput = document.getElementById('task-desc');
  const categorySelect = document.getElementById('task-category');
  const prioritySelect = document.getElementById('task-priority');
  const statusSelect = document.getElementById('task-status');
  const dueDateInput = document.getElementById('task-due-date');

  if (!modal || !modalTitle || !taskIdInput || !titleInput) return;

  if (taskId) {
    const task = tasksList.find(t => t && t.id === taskId);
    if (!task) return;

    modalTitle.textContent = 'Edit Task';
    taskIdInput.value = task.id;
    titleInput.value = task.title || '';
    if (descInput) descInput.value = task.description || '';
    if (categorySelect) categorySelect.value = task.category || 'Other';
    if (prioritySelect) prioritySelect.value = task.priority || 'Medium';
    if (statusSelect) statusSelect.value = task.status || 'To Do';
    if (dueDateInput) dueDateInput.value = task.due_date || '';
  } else {
    modalTitle.textContent = 'Create New Task';
    taskIdInput.value = '';
    const taskForm = document.getElementById('form-task');
    if (taskForm) taskForm.reset();
    if (categorySelect) categorySelect.value = 'Work';
    if (prioritySelect) prioritySelect.value = 'Medium';
    if (statusSelect) statusSelect.value = 'To Do';
  }

  modal.classList.remove('hidden');
  titleInput.focus();
}

function closeTaskModal() {
  const modal = document.getElementById('modal-task');
  const taskForm = document.getElementById('form-task');

  if (modal) modal.classList.add('hidden');
  if (taskForm) taskForm.reset();
}

async function handleTaskFormSubmit(e) {
  e.preventDefault();

  const taskIdInput = document.getElementById('task-id');
  const titleInput = document.getElementById('task-title');

  if (!titleInput) return;

  const taskId = taskIdInput ? taskIdInput.value : '';
  const title = titleInput.value.trim();
  
  const descInput = document.getElementById('task-desc');
  const catSelect = document.getElementById('task-category');
  const prioSelect = document.getElementById('task-priority');
  const statSelect = document.getElementById('task-status');
  const dueDateInput = document.getElementById('task-due-date');

  const description = descInput ? descInput.value.trim() : '';
  const category = catSelect ? catSelect.value : 'Other';
  const priority = prioSelect ? prioSelect.value : 'Medium';
  const status = statSelect ? statSelect.value : 'To Do';
  const due_date = dueDateInput ? dueDateInput.value : '';

  if (!title) {
    showToast('Task title is required.', 'error');
    return;
  }

  const payload = { title, description, category, priority, status, due_date };

  try {
    let res;
    if (taskId) {
      res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } else {
      res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }

    const data = await res.json();

    if (!res.ok) {
      showToast(data.error || 'Failed to save task.', 'error');
      return;
    }

    showToast(data.message || (taskId ? 'Task updated successfully.' : 'Task created successfully.'), 'success');
    closeTaskModal();
    fetchTasks();
  } catch (err) {
    showToast('Server error while saving task.', 'error');
  }
}

async function quickUpdateStatus(taskId, newStatus) {
  const task = tasksList.find(t => t && t.id === taskId);
  if (!task) return;

  const payload = {
    title: task.title,
    description: task.description || '',
    category: task.category || 'Other',
    priority: task.priority || 'Medium',
    status: newStatus,
    due_date: task.due_date || ''
  };

  try {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) {
      showToast(data.error || 'Failed to update task status.', 'error');
      return;
    }

    showToast('Task updated successfully.', 'success');
    fetchTasks();
  } catch (err) {
    showToast('Failed to update status.', 'error');
  }
}

// ------------------- DELETE MODAL LOGIC ------------------- //
function openDeleteModal(taskId) {
  deletingTaskId = taskId;
  const modal = document.getElementById('modal-delete');
  if (modal) modal.classList.remove('hidden');
}

function closeDeleteModal() {
  deletingTaskId = null;
  const modal = document.getElementById('modal-delete');
  if (modal) modal.classList.add('hidden');
}

async function handleConfirmDelete() {
  if (!deletingTaskId) return;

  try {
    const res = await fetch(`/api/tasks/${deletingTaskId}`, {
      method: 'DELETE'
    });

    const data = await res.json();
    if (!res.ok) {
      showToast(data.error || 'Failed to delete task.', 'error');
      return;
    }

    showToast(data.message || 'Task deleted successfully.', 'success');
    closeDeleteModal();
    fetchTasks();
  } catch (err) {
    showToast('Failed to delete task.', 'error');
  }
}

// ------------------- PROFILE MODAL LOGIC ------------------- //
async function openProfileModal() {
  try {
    const res = await fetch('/api/profile');
    if (!res.ok) {
      showToast('Could not load profile.', 'error');
      return;
    }

    const data = await res.json();
    const user = (data && data.user) ? data.user : {};

    const profileAvatar = document.getElementById('profile-avatar');
    const profileName = document.getElementById('profile-display-name');
    const profileEmail = document.getElementById('profile-display-email');
    const profileJoined = document.getElementById('profile-joined-date');
    const profileNameInput = document.getElementById('profile-name-input');
    const profileEmailInput = document.getElementById('profile-email-readonly');

    if (profileAvatar) profileAvatar.textContent = (user.name || 'U').charAt(0).toUpperCase();
    if (profileName) profileName.textContent = user.name || 'User Name';
    if (profileEmail) profileEmail.textContent = user.email || 'email@example.com';
    
    if (profileJoined) {
      if (user.created_at) {
        const dateObj = new Date(user.created_at);
        profileJoined.textContent = 'Member since ' + dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      } else {
        profileJoined.textContent = 'Active Member';
      }
    }

    if (profileNameInput) profileNameInput.value = user.name || '';
    if (profileEmailInput) profileEmailInput.value = user.email || '';

    const modal = document.getElementById('modal-profile');
    if (modal) modal.classList.remove('hidden');
  } catch (err) {
    showToast('Error fetching profile details.', 'error');
  }
}

function closeProfileModal() {
  const modal = document.getElementById('modal-profile');
  if (modal) modal.classList.add('hidden');
}

async function handleUpdateProfile(e) {
  e.preventDefault();
  const nameInput = document.getElementById('profile-name-input');
  if (!nameInput) return;

  const newName = nameInput.value.trim();

  if (!newName) {
    showToast('Name cannot be empty.', 'error');
    return;
  }

  try {
    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName })
    });

    const data = await res.json();

    if (!res.ok) {
      showToast(data.error || 'Failed to update profile.', 'error');
      return;
    }

    if (data && data.user) {
      currentUser = data.user;
    }

    const navName = document.getElementById('nav-user-name');
    const navAvatar = document.getElementById('nav-user-avatar');
    const greetingText = document.getElementById('greeting-text');

    if (currentUser && currentUser.name) {
      if (navName) navName.textContent = currentUser.name;
      if (navAvatar) navAvatar.textContent = currentUser.name.charAt(0).toUpperCase();
      if (greetingText) greetingText.textContent = `${getGreetingTime()}, ${currentUser.name}`;
    }

    showToast(data.message || 'Profile updated successfully.', 'success');
    closeProfileModal();
  } catch (err) {
    showToast('Error updating profile.', 'error');
  }
}

// Helper utility to prevent XSS
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
