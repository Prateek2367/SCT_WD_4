/**
 * TaskFlow - Smart Task & List Manager
 * Main Application Logic
 */

(function () {
  'use strict';

  // ==========================================================================
  // Default Starter Data (Used on first load)
  // ==========================================================================

  const DEFAULT_LISTS = [
    { id: 'list-work', name: 'Work', color: '#8b5cf6', icon: 'briefcase' },
    { id: 'list-personal', name: 'Personal', color: '#3b82f6', icon: 'user' },
    { id: 'list-fitness', name: 'Fitness & Health', color: '#10b981', icon: 'activity' },
    { id: 'list-ideas', name: 'Creative Ideas', color: '#f59e0b', icon: 'lightbulb' }
  ];

  // Generate dynamic sample dates based on today
  const todayObj = new Date();
  const todayStr = todayObj.toISOString().split('T')[0];
  
  const tomorrowObj = new Date(todayObj);
  tomorrowObj.setDate(tomorrowObj.getDate() + 1);
  const tomorrowStr = tomorrowObj.toISOString().split('T')[0];

  const yesterdayObj = new Date(todayObj);
  yesterdayObj.setDate(yesterdayObj.getDate() - 1);
  const yesterdayStr = yesterdayObj.toISOString().split('T')[0];

  const DEFAULT_TASKS = [
    {
      id: 'task-1',
      title: 'Review quarterly product roadmap & deliverable specs',
      notes: 'Prepare slide deck for team sync and verify Q4 milestones.',
      listId: 'list-work',
      priority: 'high',
      dueDate: todayStr,
      dueTime: '15:00',
      completed: false,
      createdAt: Date.now() - 3600000 * 5
    },
    {
      id: 'task-2',
      title: '30-minute interval running & stretching session',
      notes: 'Focus on heart rate cadence and hydration.',
      listId: 'list-fitness',
      priority: 'medium',
      dueDate: todayStr,
      dueTime: '18:30',
      completed: false,
      createdAt: Date.now() - 3600000 * 4
    },
    {
      id: 'task-3',
      title: 'Submit quarterly expense reports and receipts',
      notes: 'Verify invoice approvals in the finance dashboard.',
      listId: 'list-work',
      priority: 'urgent',
      dueDate: yesterdayStr,
      dueTime: '12:00',
      completed: false,
      createdAt: Date.now() - 3600000 * 24
    },
    {
      id: 'task-4',
      title: 'Grocery shopping: Fresh produce & whole grains',
      notes: 'Apples, avocados, Greek yogurt, sourdough loaf.',
      listId: 'list-personal',
      priority: 'low',
      dueDate: tomorrowStr,
      dueTime: '10:00',
      completed: false,
      createdAt: Date.now() - 3600000 * 2
    },
    {
      id: 'task-5',
      title: 'Set up weekly task management workflow',
      notes: 'Configured TaskFlow lists and organized initial priorities.',
      listId: 'list-personal',
      priority: 'medium',
      dueDate: todayStr,
      dueTime: '09:00',
      completed: true,
      createdAt: Date.now() - 3600000 * 8
    }
  ];

  // ==========================================================================
  // Application State
  // ==========================================================================

  let state = {
    lists: [],
    tasks: [],
    currentView: 'all', // 'all' | 'today' | 'upcoming' | 'completed' | custom listId
    currentFilter: 'all', // 'all' | 'pending' | 'completed'
    searchQuery: '',
    sortBy: 'createdDesc',
    theme: 'dark',
    lastDeletedTask: null,
    undoTimeout: null
  };

  // ==========================================================================
  // DOM Elements Cache
  // ==========================================================================

  const el = {
    // Navigation
    sidebar: document.getElementById('sidebar'),
    sidebarOverlay: document.getElementById('sidebarOverlay'),
    menuToggleBtn: document.getElementById('menuToggleBtn'),
    closeSidebarBtn: document.getElementById('closeSidebarBtn'),
    customListsContainer: document.getElementById('customListsContainer'),
    navItems: document.querySelectorAll('.sidebar-nav .nav-item[data-view]'),
    
    // Counts
    countAll: document.getElementById('countAll'),
    countToday: document.getElementById('countToday'),
    countUpcoming: document.getElementById('countUpcoming'),
    countCompleted: document.getElementById('countCompleted'),

    // Page View Header
    currentViewTitle: document.getElementById('currentViewTitle'),
    currentViewSubtitle: document.getElementById('currentViewSubtitle'),

    // Search
    taskSearchInput: document.getElementById('taskSearchInput'),
    clearSearchBtn: document.getElementById('clearSearchBtn'),

    // Stats
    statTotalCount: document.getElementById('statTotalCount'),
    statPendingCount: document.getElementById('statPendingCount'),
    statCompletedCount: document.getElementById('statCompletedCount'),
    progressPercentage: document.getElementById('progressPercentage'),
    progressBarFill: document.getElementById('progressBarFill'),

    // Quick Add Task
    quickAddForm: document.getElementById('quickAddForm'),
    quickTaskInput: document.getElementById('quickTaskInput'),
    quickListSelect: document.getElementById('quickListSelect'),
    quickDateInput: document.getElementById('quickDateInput'),
    quickTimeInput: document.getElementById('quickTimeInput'),
    quickPrioritySelect: document.getElementById('quickPrioritySelect'),

    // Controls
    filterTabs: document.querySelectorAll('.filter-tab'),
    sortSelect: document.getElementById('sortSelect'),
    tasksContainer: document.getElementById('tasksContainer'),
    emptyState: document.getElementById('emptyState'),

    // Modals
    openCreateTaskModalBtn: document.getElementById('openCreateTaskModalBtn'),
    editTaskModal: document.getElementById('editTaskModal'),
    editTaskForm: document.getElementById('editTaskForm'),
    closeEditModalBtn: document.getElementById('closeEditModalBtn'),
    cancelEditBtn: document.getElementById('cancelEditBtn'),
    editTaskId: document.getElementById('editTaskId'),
    editTaskTitle: document.getElementById('editTaskTitle'),
    editTaskNotes: document.getElementById('editTaskNotes'),
    editTaskList: document.getElementById('editTaskList'),
    editTaskPriority: document.getElementById('editTaskPriority'),
    editTaskDate: document.getElementById('editTaskDate'),
    editTaskTime: document.getElementById('editTaskTime'),

    openNewListModalBtn: document.getElementById('openNewListModalBtn'),
    newListModal: document.getElementById('newListModal'),
    newListForm: document.getElementById('newListForm'),
    closeNewListModalBtn: document.getElementById('closeNewListModalBtn'),
    cancelNewListBtn: document.getElementById('cancelNewListBtn'),
    newListName: document.getElementById('newListName'),

    // Theme & Toast
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    themeIcon: document.getElementById('themeIcon'),
    themeLabel: document.getElementById('themeLabel'),
    toastContainer: document.getElementById('toastContainer')
  };

  // ==========================================================================
  // Storage & State Initialization
  // ==========================================================================

  function loadState() {
    try {
      const savedLists = localStorage.getItem('taskflow_lists');
      const savedTasks = localStorage.getItem('taskflow_tasks');
      const savedTheme = localStorage.getItem('taskflow_theme');

      state.lists = savedLists ? JSON.parse(savedLists) : DEFAULT_LISTS;
      state.tasks = savedTasks ? JSON.parse(savedTasks) : DEFAULT_TASKS;
      state.theme = savedTheme || 'dark';
    } catch (e) {
      console.error('Failed reading from localStorage:', e);
      state.lists = DEFAULT_LISTS;
      state.tasks = DEFAULT_TASKS;
    }

    applyTheme(state.theme);
  }

  function saveState() {
    try {
      localStorage.setItem('taskflow_lists', JSON.stringify(state.lists));
      localStorage.setItem('taskflow_tasks', JSON.stringify(state.tasks));
      localStorage.setItem('taskflow_theme', state.theme);
    } catch (e) {
      console.error('Failed saving to localStorage:', e);
    }
  }

  // ==========================================================================
  // Date & Time Formatting Utilities
  // ==========================================================================

  function getTodayDateString() {
    return new Date().toISOString().split('T')[0];
  }

  function formatTime(timeStr) {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    let h = parseInt(hours, 10);
    const m = minutes ? minutes.padStart(2, '0') : '00';
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${m} ${ampm}`;
  }

  function formatRelativeDate(dateStr, timeStr) {
    if (!dateStr) return null;

    const today = getTodayDateString();
    const taskDate = new Date(dateStr + 'T' + (timeStr || '23:59:59'));
    const now = new Date();

    const formattedTime = timeStr ? ` at ${formatTime(timeStr)}` : '';

    // Check if yesterday or overdue
    const isPast = taskDate < now;
    
    // Day comparison
    const [tYear, tMonth, tDay] = dateStr.split('-').map(Number);
    const dateObj = new Date(tYear, tMonth - 1, tDay);
    
    const curDate = new Date();
    curDate.setHours(0, 0, 0, 0);
    const compareDate = new Date(dateObj);
    compareDate.setHours(0, 0, 0, 0);

    const diffDays = Math.round((compareDate - curDate) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return {
        label: `Today${formattedTime}`,
        status: isPast ? 'overdue' : 'today'
      };
    } else if (diffDays === 1) {
      return {
        label: `Tomorrow${formattedTime}`,
        status: 'upcoming'
      };
    } else if (diffDays === -1) {
      return {
        label: `Yesterday${formattedTime}`,
        status: 'overdue'
      };
    } else if (diffDays < -1) {
      return {
        label: `${dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}${formattedTime}`,
        status: 'overdue'
      };
    } else {
      return {
        label: `${dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: dateObj.getFullYear() !== curDate.getFullYear() ? 'numeric' : undefined })}${formattedTime}`,
        status: 'upcoming'
      };
    }
  }

  // ==========================================================================
  // Render Functions
  // ==========================================================================

  function renderApp() {
    renderSidebarLists();
    populateListDropdowns();
    renderNavCounts();
    renderStats();
    renderHeaderInfo();
    renderTasks();
    
    // Re-initialize Lucide Icons after DOM updates
    if (window.lucide) {
      lucide.createIcons();
    }
  }

  function renderSidebarLists() {
    el.customListsContainer.innerHTML = '';

    state.lists.forEach(list => {
      const taskCount = state.tasks.filter(t => t.listId === list.id && !t.completed).length;

      const li = document.createElement('li');
      li.className = `nav-item ${state.currentView === list.id ? 'active' : ''}`;
      li.setAttribute('data-view', list.id);

      li.innerHTML = `
        <div class="nav-item-content">
          <span class="custom-list-dot" style="background-color: ${list.color};"></span>
          <span>${escapeHtml(list.name)}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 0.35rem;">
          <span class="badge">${taskCount}</span>
          ${state.lists.length > 1 ? `
            <div class="custom-list-actions">
              <button class="delete-list-btn icon-btn-sm" data-delete-list="${list.id}" title="Delete list" aria-label="Delete list ${escapeHtml(list.name)}">
                <i data-lucide="trash-2" style="width: 13px; height: 13px;"></i>
              </button>
            </div>
          ` : ''}
        </div>
      `;

      li.addEventListener('click', (e) => {
        // If clicked on the delete button, don't trigger view change
        if (e.target.closest('[data-delete-list]')) return;
        switchView(list.id);
      });

      const deleteBtn = li.querySelector('[data-delete-list]');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          handleDeleteList(list.id);
        });
      }

      el.customListsContainer.appendChild(li);
    });
  }

  function populateListDropdowns() {
    const options = state.lists.map(list => 
      `<option value="${list.id}">${escapeHtml(list.name)}</option>`
    ).join('');

    el.quickListSelect.innerHTML = options;
    el.editTaskList.innerHTML = options;
  }

  function renderNavCounts() {
    const todayStr = getTodayDateString();
    
    const countAll = state.tasks.filter(t => !t.completed).length;
    const countToday = state.tasks.filter(t => !t.completed && t.dueDate === todayStr).length;
    const countUpcoming = state.tasks.filter(t => !t.completed && t.dueDate && t.dueDate > todayStr).length;
    const countCompleted = state.tasks.filter(t => t.completed).length;

    el.countAll.textContent = countAll;
    el.countToday.textContent = countToday;
    el.countUpcoming.textContent = countUpcoming;
    el.countCompleted.textContent = countCompleted;
  }

  function renderStats() {
    const total = state.tasks.length;
    const completed = state.tasks.filter(t => t.completed).length;
    const pending = total - completed;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    el.statTotalCount.textContent = total;
    el.statPendingCount.textContent = pending;
    el.statCompletedCount.textContent = completed;
    el.progressPercentage.textContent = `${percent}%`;
    el.progressBarFill.style.width = `${percent}%`;
  }

  function renderHeaderInfo() {
    let title = 'All Tasks';
    let subtitle = 'Keep track of your goals and daily to-dos';

    if (state.currentView === 'all') {
      title = 'All Tasks';
      subtitle = 'View and manage every task across all projects';
    } else if (state.currentView === 'today') {
      title = 'Today';
      subtitle = `Tasks scheduled for today (${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })})`;
    } else if (state.currentView === 'upcoming') {
      title = 'Upcoming';
      subtitle = 'Stay ahead with scheduled future deliverables';
    } else if (state.currentView === 'completed') {
      title = 'Completed Tasks';
      subtitle = 'Review what you have accomplished';
    } else {
      const currentList = state.lists.find(l => l.id === state.currentView);
      if (currentList) {
        title = currentList.name;
        subtitle = `Tasks in the "${currentList.name}" list`;
      }
    }

    el.currentViewTitle.textContent = title;
    el.currentViewSubtitle.textContent = subtitle;

    // Highlight active nav item
    el.navItems.forEach(item => {
      if (item.getAttribute('data-view') === state.currentView) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  function getFilteredAndSortedTasks() {
    const todayStr = getTodayDateString();

    // 1. View Filter
    let filtered = state.tasks.filter(task => {
      if (state.currentView === 'all') return true;
      if (state.currentView === 'today') return task.dueDate === todayStr;
      if (state.currentView === 'upcoming') return task.dueDate && task.dueDate > todayStr;
      if (state.currentView === 'completed') return task.completed;
      return task.listId === state.currentView;
    });

    // 2. Status Tab Filter ('all' | 'pending' | 'completed')
    if (state.currentFilter === 'pending') {
      filtered = filtered.filter(t => !t.completed);
    } else if (state.currentFilter === 'completed') {
      filtered = filtered.filter(t => t.completed);
    }

    // 3. Search Query Filter
    if (state.searchQuery.trim()) {
      const q = state.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(t => {
        const list = state.lists.find(l => l.id === t.listId);
        const listName = list ? list.name.toLowerCase() : '';
        return (
          t.title.toLowerCase().includes(q) ||
          (t.notes && t.notes.toLowerCase().includes(q)) ||
          t.priority.toLowerCase().includes(q) ||
          listName.includes(q)
        );
      });
    }

    // 4. Sorting
    const priorityWeights = { urgent: 4, high: 3, medium: 2, low: 1 };

    filtered.sort((a, b) => {
      // Completed items always sort slightly below pending if in 'all' view
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }

      switch (state.sortBy) {
        case 'dueDateAsc':
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          const aDateTime = `${a.dueDate} ${a.dueTime || '23:59'}`;
          const bDateTime = `${b.dueDate} ${b.dueTime || '23:59'}`;
          return aDateTime.localeCompare(bDateTime);

        case 'dueDateDesc':
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          const aDt = `${a.dueDate} ${a.dueTime || '00:00'}`;
          const bDt = `${b.dueDate} ${b.dueTime || '00:00'}`;
          return bDt.localeCompare(aDt);

        case 'priorityDesc':
          return (priorityWeights[b.priority] || 0) - (priorityWeights[a.priority] || 0);

        case 'priorityAsc':
          return (priorityWeights[a.priority] || 0) - (priorityWeights[b.priority] || 0);

        case 'titleAsc':
          return a.title.localeCompare(b.title);

        case 'createdDesc':
        default:
          return (b.createdAt || 0) - (a.createdAt || 0);
      }
    });

    return filtered;
  }

  function renderTasks() {
    const tasks = getFilteredAndSortedTasks();
    el.tasksContainer.innerHTML = '';

    if (tasks.length === 0) {
      el.emptyState.classList.remove('hidden');
    } else {
      el.emptyState.classList.add('hidden');

      tasks.forEach(task => {
        const list = state.lists.find(l => l.id === task.listId) || { name: 'Inbox', color: '#8b5cf6' };
        const relativeDate = formatRelativeDate(task.dueDate, task.dueTime);

        const card = document.createElement('article');
        card.className = `task-card ${task.completed ? 'completed' : ''}`;
        card.id = `task-card-${task.id}`;
        card.style.setProperty('--task-color', list.color);

        // Date Badge HTML
        let dateBadgeHtml = '';
        if (relativeDate) {
          let dateClass = 'badge-due-upcoming';
          let iconName = 'calendar';
          if (!task.completed && relativeDate.status === 'overdue') {
            dateClass = 'badge-due-overdue';
            iconName = 'alert-circle';
          } else if (relativeDate.status === 'today') {
            dateClass = 'badge-due-today';
            iconName = 'clock';
          }

          dateBadgeHtml = `
            <span class="meta-badge ${dateClass}">
              <i data-lucide="${iconName}"></i>
              <span>${escapeHtml(relativeDate.label)}</span>
            </span>
          `;
        }

        // Priority Badge HTML
        const priorityLabels = {
          low: 'Low',
          medium: 'Medium',
          high: 'High',
          urgent: 'Urgent 🔥'
        };

        const priorityBadgeHtml = `
          <span class="meta-badge badge-priority-${task.priority}">
            <i data-lucide="flag"></i>
            <span>${priorityLabels[task.priority] || 'Normal'}</span>
          </span>
        `;

        // Notes HTML
        const notesHtml = task.notes ? `
          <p class="task-notes">${escapeHtml(task.notes)}</p>
        ` : '';

        card.innerHTML = `
          <div class="task-checkbox-wrap">
            <input type="checkbox" class="task-checkbox" id="check-${task.id}" ${task.completed ? 'checked' : ''} aria-label="Mark task complete">
            <i data-lucide="check" class="task-checkbox-icon"></i>
          </div>

          <div class="task-body">
            <div class="task-main-row">
              <span class="task-title">${escapeHtml(task.title)}</span>
            </div>
            ${notesHtml}
            <div class="task-meta-row">
              <span class="meta-badge" style="border-left: 3px solid ${list.color};">
                <i data-lucide="folder"></i>
                <span>${escapeHtml(list.name)}</span>
              </span>
              ${dateBadgeHtml}
              ${priorityBadgeHtml}
            </div>
          </div>

          <div class="task-actions">
            <button class="task-action-btn edit-btn" data-edit-id="${task.id}" title="Edit task" aria-label="Edit task">
              <i data-lucide="edit-2"></i>
            </button>
            <button class="task-action-btn delete-btn" data-delete-id="${task.id}" title="Delete task" aria-label="Delete task">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        `;

        // Event: Toggle complete
        const checkbox = card.querySelector(`#check-${task.id}`);
        checkbox.addEventListener('change', () => toggleTaskComplete(task.id));

        // Event: Edit task
        const editBtn = card.querySelector(`[data-edit-id="${task.id}"]`);
        editBtn.addEventListener('click', () => openEditModal(task.id));

        // Event: Delete task
        const deleteBtn = card.querySelector(`[data-delete-id="${task.id}"]`);
        deleteBtn.addEventListener('click', () => deleteTask(task.id));

        el.tasksContainer.appendChild(card);
      });
    }
  }

  // ==========================================================================
  // Task Actions (CRUD)
  // ==========================================================================

  function addTask(title, notes, listId, dueDate, dueTime, priority) {
    if (!title.trim()) return;

    const newTask = {
      id: 'task-' + Date.now(),
      title: title.trim(),
      notes: notes ? notes.trim() : '',
      listId: listId || state.lists[0]?.id || 'default',
      dueDate: dueDate || '',
      dueTime: dueTime || '',
      priority: priority || 'medium',
      completed: false,
      createdAt: Date.now()
    };

    state.tasks.unshift(newTask);
    saveState();
    renderApp();
    showToast('Task added successfully', 'check-circle');
  }

  function toggleTaskComplete(taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;

    task.completed = !task.completed;
    saveState();
    renderApp();

    if (task.completed) {
      showToast('Task completed! Great job! 🎉', 'check-circle');
    }
  }

  function editTask(taskId, updatedData) {
    const taskIndex = state.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    state.tasks[taskIndex] = {
      ...state.tasks[taskIndex],
      ...updatedData
    };

    saveState();
    renderApp();
    showToast('Task updated successfully', 'check-circle');
  }

  function deleteTask(taskId) {
    const taskIndex = state.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    const removedTask = state.tasks.splice(taskIndex, 1)[0];
    state.lastDeletedTask = { task: removedTask, index: taskIndex };

    saveState();
    renderApp();

    showUndoToast(`Task deleted`, () => {
      if (state.lastDeletedTask) {
        state.tasks.splice(state.lastDeletedTask.index, 0, state.lastDeletedTask.task);
        state.lastDeletedTask = null;
        saveState();
        renderApp();
        showToast('Task restored', 'rotate-ccw');
      }
    });
  }

  // ==========================================================================
  // List Actions
  // ==========================================================================

  function addList(name, color) {
    if (!name.trim()) return;

    const newList = {
      id: 'list-' + Date.now(),
      name: name.trim(),
      color: color || '#8b5cf6',
      icon: 'folder'
    };

    state.lists.push(newList);
    saveState();
    switchView(newList.id);
    showToast(`List "${newList.name}" created`, 'folder-plus');
  }

  function handleDeleteList(listId) {
    const list = state.lists.find(l => l.id === listId);
    if (!list) return;

    if (state.lists.length <= 1) {
      alert('You must keep at least one list.');
      return;
    }

    const tasksInList = state.tasks.filter(t => t.listId === listId);
    let confirmMsg = `Are you sure you want to delete the "${list.name}" list?`;
    if (tasksInList.length > 0) {
      confirmMsg += `\n${tasksInList.length} task(s) in this list will be reassigned to "${state.lists.find(l => l.id !== listId)?.name}".`;
    }

    if (!confirm(confirmMsg)) return;

    // Remove list
    state.lists = state.lists.filter(l => l.id !== listId);

    // Reassign tasks if any
    const fallbackListId = state.lists[0].id;
    state.tasks.forEach(t => {
      if (t.listId === listId) {
        t.listId = fallbackListId;
      }
    });

    if (state.currentView === listId) {
      state.currentView = 'all';
    }

    saveState();
    renderApp();
    showToast(`List deleted`, 'trash');
  }

  function switchView(viewId) {
    state.currentView = viewId;
    renderApp();

    // Close sidebar on mobile
    if (window.innerWidth <= 960) {
      closeSidebar();
    }
  }

  // ==========================================================================
  // Modals Management
  // ==========================================================================

  function openEditModal(taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;

    el.editTaskId.value = task.id;
    el.editTaskTitle.value = task.title;
    el.editTaskNotes.value = task.notes || '';
    el.editTaskList.value = task.listId;
    el.editTaskPriority.value = task.priority;
    el.editTaskDate.value = task.dueDate || '';
    el.editTaskTime.value = task.dueTime || '';

    el.editTaskModal.classList.remove('hidden');
    el.editTaskTitle.focus();
    
    if (window.lucide) lucide.createIcons();
  }

  function closeEditModal() {
    el.editTaskModal.classList.add('hidden');
    el.editTaskForm.reset();
  }

  function openNewListModal() {
    el.newListModal.classList.remove('hidden');
    el.newListName.value = '';
    el.newListName.focus();
    if (window.lucide) lucide.createIcons();
  }

  function closeNewListModal() {
    el.newListModal.classList.add('hidden');
    el.newListForm.reset();
  }

  // ==========================================================================
  // Toast Notification System
  // ==========================================================================

  function showToast(message, icon = 'info') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <i data-lucide="${icon}" class="toast-icon text-purple"></i>
      <span>${escapeHtml(message)}</span>
    `;

    el.toastContainer.appendChild(toast);
    if (window.lucide) lucide.createIcons();

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, 2800);
  }

  function showUndoToast(message, onUndo) {
    clearTimeout(state.undoTimeout);
    el.toastContainer.innerHTML = '';

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <i data-lucide="trash-2" class="toast-icon text-rose"></i>
      <span>${escapeHtml(message)}</span>
      <button class="toast-undo-btn" id="toastUndoBtn">Undo</button>
    `;

    el.toastContainer.appendChild(toast);
    if (window.lucide) lucide.createIcons();

    const undoBtn = toast.querySelector('#toastUndoBtn');
    undoBtn.addEventListener('click', () => {
      onUndo();
      toast.remove();
    });

    state.undoTimeout = setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => {
        toast.remove();
        state.lastDeletedTask = null;
      }, 250);
    }, 4500);
  }

  // ==========================================================================
  // Theme Toggle
  // ==========================================================================

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    state.theme = theme;
    if (theme === 'light') {
      el.themeLabel.textContent = 'Light Mode';
      el.themeIcon.setAttribute('data-lucide', 'sun');
    } else {
      el.themeLabel.textContent = 'Dark Mode';
      el.themeIcon.setAttribute('data-lucide', 'moon');
    }
    if (window.lucide) lucide.createIcons();
  }

  function toggleTheme() {
    const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
    saveState();
  }

  // ==========================================================================
  // Mobile Sidebar
  // ==========================================================================

  function openSidebar() {
    el.sidebar.classList.add('open');
    el.sidebarOverlay.classList.add('active');
  }

  function closeSidebar() {
    el.sidebar.classList.remove('open');
    el.sidebarOverlay.classList.remove('active');
  }

  // ==========================================================================
  // Helper: Escape HTML
  // ==========================================================================

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ==========================================================================
  // Event Listeners Registration
  // ==========================================================================

  function initEventListeners() {
    // Quick Add Form
    el.quickAddForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = el.quickTaskInput.value;
      const listId = el.quickListSelect.value || (state.currentView.startsWith('list-') ? state.currentView : state.lists[0]?.id);
      const dueDate = el.quickDateInput.value;
      const dueTime = el.quickTimeInput.value;
      const priority = el.quickPrioritySelect.value;

      addTask(title, '', listId, dueDate, dueTime, priority);
      el.quickAddForm.reset();
      // Restore list to current view if viewing a custom list
      if (state.currentView.startsWith('list-')) {
        el.quickListSelect.value = state.currentView;
      }
    });

    // Quick create button from sidebar
    el.openCreateTaskModalBtn.addEventListener('click', () => {
      el.quickTaskInput.focus();
      el.quickTaskInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (window.innerWidth <= 960) closeSidebar();
    });

    // Edit Task Form
    el.editTaskForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = el.editTaskId.value;
      const title = el.editTaskTitle.value;
      const notes = el.editTaskNotes.value;
      const listId = el.editTaskList.value;
      const priority = el.editTaskPriority.value;
      const dueDate = el.editTaskDate.value;
      const dueTime = el.editTaskTime.value;

      editTask(id, { title, notes, listId, priority, dueDate, dueTime });
      closeEditModal();
    });

    el.closeEditModalBtn.addEventListener('click', closeEditModal);
    el.cancelEditBtn.addEventListener('click', closeEditModal);
    el.editTaskModal.addEventListener('click', (e) => {
      if (e.target === el.editTaskModal) closeEditModal();
    });

    // New List Form
    el.openNewListModalBtn.addEventListener('click', openNewListModal);
    el.closeNewListModalBtn.addEventListener('click', closeNewListModal);
    el.cancelNewListBtn.addEventListener('click', closeNewListModal);
    el.newListModal.addEventListener('click', (e) => {
      if (e.target === el.newListModal) closeNewListModal();
    });

    el.newListForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = el.newListName.value;
      const checkedColor = document.querySelector('input[name="listColor"]:checked')?.value || '#8b5cf6';
      addList(name, checkedColor);
      closeNewListModal();
    });

    // Overview Navigation Views
    el.navItems.forEach(item => {
      item.addEventListener('click', () => {
        const view = item.getAttribute('data-view');
        switchView(view);
      });
    });

    // Filter Tabs (All / Pending / Done)
    el.filterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        el.filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        state.currentFilter = tab.getAttribute('data-filter');
        renderTasks();
      });
    });

    // Sort Dropdown
    el.sortSelect.addEventListener('change', (e) => {
      state.sortBy = e.target.value;
      renderTasks();
    });

    // Search Input
    el.taskSearchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      if (state.searchQuery) {
        el.clearSearchBtn.classList.remove('hidden');
      } else {
        el.clearSearchBtn.classList.add('hidden');
      }
      renderTasks();
    });

    el.clearSearchBtn.addEventListener('click', () => {
      el.taskSearchInput.value = '';
      state.searchQuery = '';
      el.clearSearchBtn.classList.add('hidden');
      renderTasks();
      el.taskSearchInput.focus();
    });

    // Theme Toggle
    el.themeToggleBtn.addEventListener('click', toggleTheme);

    // Mobile Sidebar Drawer
    el.menuToggleBtn.addEventListener('click', openSidebar);
    el.closeSidebarBtn.addEventListener('click', closeSidebar);
    el.sidebarOverlay.addEventListener('click', closeSidebar);

    // Global Keyboard Shortcuts (Esc to close modals)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeEditModal();
        closeNewListModal();
        closeSidebar();
      }
    });
  }

  // ==========================================================================
  // Application Entry Point
  // ==========================================================================

  function init() {
    loadState();
    initEventListeners();
    renderApp();
  }

  // Initialize once DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
