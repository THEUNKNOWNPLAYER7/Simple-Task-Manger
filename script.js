// Initialize state
const STORAGE_KEY = 'tasks_app_data';
let tasks = [];
let currentView = 'inbox';
let currentFilter = 'all';

// DOM Elements - initialized after DOM is ready
let taskInput, addBtn, taskList, menuBtn, sidebar, overlay;
let navItems, filterBtns;
let pageTitle, pageSubtitle, pageEmoji;
let inboxCount, todayCount, upcomingCount;

// Initialize the app
function init() {
  // Get DOM elements
  taskInput = document.getElementById('taskInput');
  addBtn = document.getElementById('addBtn');
  taskList = document.getElementById('taskList');
  menuBtn = document.getElementById('menuBtn');
  sidebar = document.getElementById('sidebar');
  overlay = document.getElementById('overlay');
  navItems = document.querySelectorAll('.nav-item');
  filterBtns = document.querySelectorAll('.filter-btn');
  pageTitle = document.getElementById('pageTitle');
  pageSubtitle = document.getElementById('pageSubtitle');
  pageEmoji = document.getElementById('pageEmoji');
  inboxCount = document.getElementById('inboxCount');
  todayCount = document.getElementById('todayCount');
  upcomingCount = document.getElementById('upcomingCount');

  // Load tasks from localStorage
  loadTasks();

  // Set up event listeners
  setupEventListeners();

  // Initial render
  renderTasks();
  updateCounts();
}

// Load tasks from localStorage
function loadTasks() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      tasks = JSON.parse(stored);
    }
  } catch (e) {
    console.error('Error loading tasks:', e);
    tasks = [];
  }
}

// Save tasks to localStorage
function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (e) {
    console.error('Error saving tasks:', e);
  }
}

// Set up all event listeners
function setupEventListeners() {
  // Add task
  addBtn.addEventListener('click', addTask);
  taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTask();
  });

  // Navigation
  navItems.forEach(item => {
    item.addEventListener('click', () => handleNavClick(item));
    item.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleNavClick(item);
      }
    });
  });

  // Filters
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => handleFilterClick(btn));
  });

  // Mobile menu
  menuBtn.addEventListener('click', toggleSidebar);
  overlay.addEventListener('click', closeSidebar);
}

// Handle navigation click
function handleNavClick(item) {
  const view = item.dataset.view;
  currentView = view;

  navItems.forEach(nav => nav.classList.remove('active'));
  item.classList.add('active');

  updatePageHeader();
  renderTasks();

  if (window.innerWidth <= 768) {
    closeSidebar();
  }
}

// Handle filter click
function handleFilterClick(btn) {
  currentFilter = btn.dataset.filter;
  filterBtns.forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderTasks();
}

// Update page header based on view
function updatePageHeader() {
  const titles = {
    inbox:    { emoji: '📥', title: 'Inbox',    subtitle: 'All your tasks in one place' },
    today:    { emoji: '📅', title: 'Today',    subtitle: 'Focus on what matters today'  },
    upcoming: { emoji: '⏳', title: 'Upcoming', subtitle: 'Plan ahead for the week'       }
  };

  const current = titles[currentView];
  if (pageEmoji) pageEmoji.textContent = current.emoji;
  pageTitle.textContent = current.title;
  pageSubtitle.textContent = current.subtitle;
}

// Toggle sidebar (mobile)
function toggleSidebar() {
  sidebar.classList.toggle('open');
  overlay.classList.toggle('active');
}

// Close sidebar
function closeSidebar() {
  sidebar.classList.remove('open');
  overlay.classList.remove('active');
}

// Add a new task
function addTask() {
  const text = taskInput.value.trim();
  if (!text) return;

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const task = {
    id: Date.now(),
    text: text,
    completed: false,
    createdAt: today.toISOString(),
    dueDate: currentView === 'today' ? today.toISOString() : 
             currentView === 'upcoming' ? nextWeek.toISOString() : tomorrow.toISOString()
  };

  tasks.unshift(task);
  taskInput.value = '';
  saveTasks();
  renderTasks();
  updateCounts();
}

// Toggle task completion
function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.completed = !task.completed;
    saveTasks();
    renderTasks();
    updateCounts();
  }
}

// Delete task
function deleteTask(id) {
  const taskEl = document.querySelector(`[data-id="${id}"]`);
  if (taskEl) {
    taskEl.classList.add('removing');
    setTimeout(() => {
      tasks = tasks.filter(t => t.id !== id);
      saveTasks();
      renderTasks();
      updateCounts();
    }, 300);
  }
}

// Get filtered tasks based on view and filter
function getFilteredTasks() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  let filtered = [...tasks];

  // Filter by view
  if (currentView === 'today') {
    filtered = filtered.filter(task => {
      const dueDate = new Date(task.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate.getTime() === today.getTime();
    });
  } else if (currentView === 'upcoming') {
    filtered = filtered.filter(task => {
      const dueDate = new Date(task.dueDate);
      return dueDate > today && dueDate <= nextWeek;
    });
  }

  // Filter by status
  if (currentFilter === 'active') {
    filtered = filtered.filter(task => !task.completed);
  } else if (currentFilter === 'completed') {
    filtered = filtered.filter(task => task.completed);
  }

  return filtered;
}

// Render tasks
function renderTasks() {
  const filtered = getFilteredTasks();

  if (filtered.length === 0) {
    taskList.innerHTML = `
      <div class="empty-state">
        <svg class="empty-state-icon" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
        </svg>
        <div class="empty-state-text">No tasks yet</div>
        <div class="empty-state-subtext">Add a task to get started</div>
      </div>
    `;
    return;
  }

  taskList.innerHTML = filtered.map(task => createTaskHTML(task)).join('');

  // Add event listeners to task elements
  taskList.querySelectorAll('.task-item').forEach(taskEl => {
    const id = parseInt(taskEl.dataset.id);
    const checkbox = taskEl.querySelector('input[type="checkbox"]');
    const deleteBtn = taskEl.querySelector('.delete-btn');

    checkbox.addEventListener('change', () => toggleTask(id));
    deleteBtn.addEventListener('click', () => deleteTask(id));
  });
}

// Create task HTML
function createTaskHTML(task) {
  const dueDate = new Date(task.dueDate);
  const formattedDate = dueDate.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });

  return `
    <div class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
      <label class="checkbox-wrapper">
        <input type="checkbox" ${task.completed ? 'checked' : ''} aria-label="Mark task as ${task.completed ? 'incomplete' : 'complete'}">
        <div class="checkbox-custom">
          <svg fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
      </label>
      <span class="task-text">${escapeHTML(task.text)}</span>
      <span class="task-date">${formattedDate}</span>
      <button class="delete-btn" aria-label="Delete task">
        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
        </svg>
      </button>
    </div>
  `;
}

// Escape HTML to prevent XSS
function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Update task counts
function updateCounts() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const active = tasks.filter(t => !t.completed);

  // Inbox count (all active)
  inboxCount.textContent = active.length;

  // Today count
  const todayTasks = active.filter(task => {
    const dueDate = new Date(task.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate.getTime() === today.getTime();
  });
  todayCount.textContent = todayTasks.length;

  // Upcoming count
  const upcomingTasks = active.filter(task => {
    const dueDate = new Date(task.dueDate);
    return dueDate > today && dueDate <= nextWeek;
  });
  upcomingCount.textContent = upcomingTasks.length;
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
