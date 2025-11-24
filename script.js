// DOM Elements
const taskInput = document.getElementById("task-input");
const addTaskBtn = document.getElementById("add-task");
const todosList = document.getElementById("todos-list");
const itemsLeft = document.getElementById("items-left");
const clearCompletedBtn = document.getElementById("clear-completed");
const deleteAllBtn = document.getElementById("delete-all");
const emptyState = document.querySelector(".empty-state");
const dateElement = document.getElementById("date");
const filters = document.querySelectorAll(".filter");
const progressBar = document.getElementById("progress-bar");
const progressPercent = document.getElementById("progress-percent");
const priorityInput = document.getElementById("priority-input");
const dueDateInput = document.getElementById("due-date-input");
const themeToggle = document.getElementById("theme-toggle");

let todos = [];
let currentFilter = "all";

// Initialize date
const today = new Date().toISOString().split("T")[0];
dueDateInput.value = today;
dueDateInput.min = today;

// Theme Handling
function initTheme() {
  const savedTheme = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);
  themeToggle.innerHTML = savedTheme === "light"
    ? '<i class="fas fa-moon"></i>'
    : '<i class="fas fa-sun"></i>';
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme");
  const newTheme = current === "light" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);
  themeToggle.innerHTML = newTheme === "light"
    ? '<i class="fas fa-moon"></i>'
    : '<i class="fas fa-sun"></i>';
}

// Update select border based on priority
function updatePrioritySelectStyle() {
  priorityInput.setAttribute("data-priority", priorityInput.value);
}

// Event Listeners
addTaskBtn.addEventListener("click", addTodo);
taskInput.addEventListener("keydown", (e) => e.key === "Enter" && addTodo());
clearCompletedBtn.addEventListener("click", clearCompleted);
deleteAllBtn.addEventListener("click", deleteAll);
themeToggle.addEventListener("click", toggleTheme);
priorityInput.addEventListener("change", updatePrioritySelectStyle);

filters.forEach((filter) => {
  filter.addEventListener("click", () => setActiveFilter(filter.dataset.filter));
});

window.addEventListener("DOMContentLoaded", () => {
  initTheme();
  loadTodos();
  updateItemsCount();
  updateProgressBar();
  setDate();
  updatePrioritySelectStyle();
});

// Main Functions
function addTodo() {
  const text = taskInput.value.trim();
  if (!text) return;

  const todo = {
    id: Date.now(),
    text,
    completed: false,
    priority: priorityInput.value,
    dueDate: dueDateInput.value || null,
  };

  todos.push(todo);
  saveTodos();
  renderTodos();

  taskInput.value = "";
  priorityInput.value = "medium";
  dueDateInput.value = today;
  taskInput.focus();
  updatePrioritySelectStyle();
}

function saveTodos() {
  localStorage.setItem("todos", JSON.stringify(todos));
  updateItemsCount();
  updateProgressBar();
  checkEmptyState();
}

function updateItemsCount() {
  const count = todos.filter(t => !t.completed).length;
  itemsLeft.textContent = `${count} item${count !== 1 ? "s" : ""} left`;
}

function updateProgressBar() {
  if (todos.length === 0) {
    progressBar.style.width = "0%";
    progressPercent.textContent = "0%";
    return;
  }
  const completed = todos.filter(t => t.completed).length;
  const percent = Math.round((completed / todos.length) * 100);
  progressBar.style.width = `${percent}%`;
  progressPercent.textContent = `${percent}%`;
}

function checkEmptyState() {
  const filtered = filterTodos(currentFilter);
  emptyState.classList.toggle("hidden", filtered.length > 0);
}

function filterTodos(filter) {
  let result = [...todos];
  if (filter === "active") result = result.filter(t => !t.completed);
  if (filter === "completed") result = result.filter(t => t.completed);
  return result;
}

function renderTodos() {
  todosList.innerHTML = "";
  const filtered = filterTodos(currentFilter);
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  filtered.forEach(todo => {
    const item = document.createElement("li");
    item.className = "todo-item";
    if (todo.completed) item.classList.add("completed");

    // Overdue visual on task item (for strikethrough color)
    if (todo.dueDate && !todo.completed) {
      const due = new Date(todo.dueDate);
      due.setHours(0, 0, 0, 0);
      if (due < now) item.classList.add("overdue");
    }

    const priorityDot = document.createElement("div");
    priorityDot.className = `priority-indicator priority-${todo.priority}`;

    const checkboxContainer = document.createElement("label");
    checkboxContainer.className = "checkbox-container";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "todo-checkbox";
    checkbox.checked = todo.completed;
    checkbox.addEventListener("change", () => toggleTodo(todo.id));
    const checkmark = document.createElement("span");
    checkmark.className = "checkmark";
    checkboxContainer.append(checkbox, checkmark);

    const textSpan = document.createElement("span");
    textSpan.className = "todo-item-text";
    textSpan.textContent = todo.text;

    // ✅ FIXED: Due date badge with Future/Today/Overdue
    let dueBadge = null;
    if (todo.dueDate) {
      const due = new Date(todo.dueDate);
      due.setHours(0, 0, 0, 0);
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const timeDiff = due.getTime() - todayStart.getTime();
      const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

      dueBadge = document.createElement("span");
      dueBadge.className = "due-date-badge";

      if (daysDiff < 0 && !todo.completed) {
        dueBadge.classList.add("due-date-overdue");
      } else if (daysDiff === 0) {
        dueBadge.classList.add("due-date-today");
      } else {
        dueBadge.classList.add("due-date-future");
      }

      const opts = { month: "short", day: "numeric" };
      dueBadge.textContent = due.toLocaleDateString("en-US", opts);
    }

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
    deleteBtn.addEventListener("click", () => deleteTodo(todo.id));

    item.append(priorityDot, checkboxContainer, textSpan);
    if (dueBadge) item.appendChild(dueBadge);
    item.appendChild(deleteBtn);
    todosList.appendChild(item);
  });
}

function toggleTodo(id) {
  todos = todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
  saveTodos();
  renderTodos();
}

function deleteTodo(id) {
  todos = todos.filter(t => t.id !== id);
  saveTodos();
  renderTodos();
}

function clearCompleted() {
  todos = todos.filter(t => !t.completed);
  saveTodos();
  renderTodos();
}

function deleteAll() {
  if (todos.length && confirm("Delete all tasks? This cannot be undone.")) {
    todos = [];
    saveTodos();
    renderTodos();
  }
}

function loadTodos() {
  const data = localStorage.getItem("todos");
  if (data) todos = JSON.parse(data);
  renderTodos();
}

function setDate() {
  const opts = { weekday: "long", month: "short", day: "numeric" };
  dateElement.textContent = new Date().toLocaleDateString("en-US", opts);
}

function setActiveFilter(filter) {
  currentFilter = filter;
  filters.forEach(f => f.classList.toggle("active", f.dataset.filter === filter));
  renderTodos();
}