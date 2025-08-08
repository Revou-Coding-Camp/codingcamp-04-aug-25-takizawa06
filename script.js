document.addEventListener('DOMContentLoaded', () => {
    // Input Elements
    const taskInput = document.querySelector('.todo');
    const dueDateInput = document.querySelector('.schedule-date');
    const priorityInput = document.querySelector('.priority-select');
    const addBtn = document.querySelector('.add-task-button');
    const taskTableBody = document.querySelector('.todos-list-body');
    const taskTable = document.querySelector('.table');
    const noTaskMsg = document.querySelector('.empty-state') || { style: {} };
    const deleteAllBtn = document.querySelector('.delete-all-btn');
    const searchInput = document.querySelector('.search-input');

    // Filter Elements
    const filterDropdown = document.querySelector('.dropdown .menu');
    const filterAllBtn = document.querySelector('[data-filter="all"]');
    const filterPendingBtn = document.querySelector('[data-filter="pending"]');
    const filterCompletedBtn = document.querySelector('[data-filter="completed"]');
    const filterOverdueBtn = document.querySelector('[data-filter="overdue"]');
    const filterTodayBtn = document.querySelector('[data-filter="today"]');
    const filterBtns = [filterAllBtn, filterPendingBtn, filterCompletedBtn, filterOverdueBtn, filterTodayBtn];

    // Sort Elements
    const sortPriorityBtn = document.querySelector('.dropdown-content.menu a[onclick*="priority"]');
    const sortDueDateBtn = document.querySelector('.dropdown-content.menu a[onclick*="duedate"]');
    const sortStatusBtn = document.querySelector('.dropdown-content.menu a[onclick*="status"]');

    // Calendar
    const calendarBtn = document.querySelector('.btn-info.btn-sm');
    const calendarModal = document.getElementById('calendar-modal');
    const calendarCloseBtn = calendarModal ? calendarModal.querySelector('.btn') : null;
    const calendarContainer = document.getElementById('calendar-container');

    // Import/Export
    const importBtn = document.querySelector('.btn-outline.btn-sm[onclick*="import"]');
    const exportBtn = document.querySelector('.btn-outline.btn-sm[onclick*="export"]');

    // Stats
    const totalCounter = document.querySelector('.total-counter');
    const completedCounter = document.querySelector('.completed-counter');
    const pendingCounter = document.querySelector('.pending-counter');
    const progressBar = document.querySelector('.progress-bar');

    // Weather Widget
    const weatherInfo = document.getElementById('weather-info');

    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

    // Filtering
    let currentFilter = 'all';

    // Render tasks
    const renderTasks = (customList = null) => {
        let filteredTasks = customList || filterTasks();
        taskTableBody.innerHTML = '';
        const today = new Date().toISOString().slice(0, 10);

        if (filteredTasks.length === 0) {
            if (noTaskMsg) {
                noTaskMsg.style.display = 'block';
                noTaskMsg.textContent = 'No tasks found';
            }
            taskTable.style.display = 'table';
            taskTableBody.innerHTML = `<tr><td colspan="5" class="empty-state"><i class="bx bx-coffee"></i> No tasks found</td></tr>`;
        } else {
            if (noTaskMsg) noTaskMsg.style.display = 'none';
            taskTable.style.display = 'table';
            filteredTasks.forEach((task, idx) => {
                const overdue = task.status !== 'completed' && task.dueDate && task.dueDate < today;
                const tr = document.createElement('tr');
                tr.className = `todo-row${overdue ? ' task-overdue' : ''}`;
                tr.innerHTML = `
                    <td>${escapeHtml(task.text)}</td>
                    <td>${task.dueDate || 'No due date'}</td>
                    <td>
                        <span class="badge ${priorityClass(task.priority)}">${priorityLabel(task.priority)}</span>
                    </td>
                    <td>
                        <span class="badge ${task.status === 'completed' ? 'badge-success' : 'badge-warning'}">
                            ${task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-xs btn-info edit-btn" title="Edit"><i class='bx bx-pencil'></i></button>
                        <button class="btn btn-xs btn-success status-btn" title="Toggle"><i class="bx ${task.status === "completed" ? "bx-x" : "bx-check"}"></i></button>
                        <button class="btn btn-xs btn-error delete-btn" title="Delete"><i class='bx bx-trash'></i></button>
                    </td>
                `;
                // Edit
                tr.querySelector('.edit-btn').onclick = () => showEditModal(idx, filteredTasks);
                // Status
                tr.querySelector('.status-btn').onclick = () => toggleTaskCompletion(idx, filteredTasks);
                // Delete
                tr.querySelector('.delete-btn').onclick = () => deleteTask(idx, filteredTasks);

                taskTableBody.appendChild(tr);
            });
        }
        updateStats();
    };

    const updateStats = () => {
        totalCounter.textContent = tasks.length;
        completedCounter.textContent = tasks.filter(t => t.status === 'completed').length;
        pendingCounter.textContent = tasks.filter(t => t.status === 'pending').length;
        const progress = tasks.length ? (tasks.filter(t => t.status === 'completed').length / tasks.length) * 100 : 0;
        progressBar.style.width = `${progress}%`;
    };

    // Filter logic
    function filterTasks() {
        const today = new Date().toISOString().slice(0, 10);
        if (currentFilter === 'pending') return tasks.filter(t => t.status === "pending");
        if (currentFilter === 'completed') return tasks.filter(t => t.status === "completed");
        if (currentFilter === 'overdue') return tasks.filter(t => t.status === "pending" && t.dueDate && t.dueDate < today);
        if (currentFilter === 'today') return tasks.filter(t => t.dueDate === today);
        return tasks;
    }

    // Helpers
    function escapeHtml(text) { return (text || '').replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
    function priorityClass(priority) {
        if (priority === 'high') return 'badge-high priority-high';
        if (priority === 'medium') return 'badge-medium priority-medium';
        return 'badge-low priority-low';
    }
    function priorityLabel(priority) {
        if (priority === 'high') return 'Very important';
        if (priority === 'medium') return 'A bit important';
        return 'Not in a hurry';
    }

    function saveTasks() { localStorage.setItem('tasks', JSON.stringify(tasks)); }

    function addTask() {
        const taskText = taskInput.value.trim();
        const dueDate = dueDateInput.value;
        const priority = priorityInput.value;
        if (taskText !== '' && priority) {
            const newTask = {
                id: Date.now(),
                text: taskText,
                dueDate: dueDate || '',
                priority: priority,
                status: "pending"
            };
            tasks.push(newTask);
            saveTasks();
            renderTasks();
            taskInput.value = '';
            dueDateInput.value = '';
            priorityInput.value = '';
        }
    }

    function deleteTask(idx, list) {
        const globalIdx = tasks.indexOf(list[idx]);
        if (globalIdx > -1) tasks.splice(globalIdx, 1);
        saveTasks();
        renderTasks();
    }

    function toggleTaskCompletion(idx, list) {
        const task = list[idx];
        if (task) {
            task.status = task.status === "completed" ? "pending" : "completed";
            saveTasks();
            renderTasks();
        }
    }

    function showEditModal(idx, list) {
        const task = list[idx];
        taskInput.value = task.text;
        dueDateInput.value = task.dueDate;
        priorityInput.value = task.priority;
        addBtn.onclick = () => {
            const text = taskInput.value.trim();
            const dueDate = dueDateInput.value;
            const priority = priorityInput.value;
            if (text && priority) {
                task.text = text;
                task.dueDate = dueDate;
                task.priority = priority;
                saveTasks();
                renderTasks();
                document.getElementById('my-modal').checked = false;
                addBtn.onclick = addTask; // restore default
            }
        };
        document.getElementById('my-modal').checked = true;
    }

    // Delete All
    function deleteAllTasks() {
        if (confirm("Delete all tasks?")) {
            tasks = [];
            saveTasks();
            renderTasks();
        }
    }

    // Filter
    filterBtns.forEach(btn => {
        if (btn) {
            btn.onclick = () => {
                currentFilter = btn.getAttribute('data-filter');
                renderTasks();
            };
        }
    });

    // Sort
    if (sortPriorityBtn) sortPriorityBtn.onclick = () => {
        const order = { high: 0, medium: 1, low: 2 };
        tasks.sort((a, b) => order[a.priority] - order[b.priority]);
        renderTasks();
    };
    if (sortDueDateBtn) sortDueDateBtn.onclick = () => {
        tasks.sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));
        renderTasks();
    };
    if (sortStatusBtn) sortStatusBtn.onclick = () => {
        tasks.sort((a, b) => (a.status || '').localeCompare(b.status || ''));
        renderTasks();
    };

    // Search
    if (searchInput) searchInput.oninput = function () {
        const val = this.value.toLowerCase().trim();
        const filtered = tasks.filter(t =>
            t.text.toLowerCase().includes(val) ||
            (t.dueDate || '').toLowerCase().includes(val)
        );
        renderTasks(filtered);
    };

    // Calendar
    if (calendarBtn) calendarBtn.onclick = () => {
        if (calendarModal) calendarModal.classList.add('active');
        if (calendarContainer) {
            calendarContainer.innerHTML = '';
            // Group by date
            const dates = {};
            tasks.forEach(task => {
                const date = task.dueDate || "No due date";
                if (!dates[date]) dates[date] = [];
                dates[date].push(task);
            });
            Object.keys(dates).sort().forEach(date => {
                calendarContainer.innerHTML += `
                    <div class="mb-2">
                        <strong>${date}</strong>
                        <ul>
                            ${dates[date].map(t =>
                                `<li>
                                    ${escapeHtml(t.text)}
                                    <span class="badge ${priorityClass(t.priority)}">${priorityLabel(t.priority)}</span>
                                    <span class="badge ${t.status === "completed" ? "badge-success" : "badge-warning"}">${t.status}</span>
                                 </li>`
                            ).join('')}
                        </ul>
                    </div>
                `;
            });
        }
    };
    if (calendarCloseBtn) calendarCloseBtn.onclick = () => {
        if (calendarModal) calendarModal.classList.remove('active');
    };

    // Import
    if (importBtn) importBtn.onclick = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = ".json";
        input.onchange = e => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = event => {
                try {
                    const imported = JSON.parse(event.target.result);
                    tasks = Array.isArray(imported) ? imported : imported.tasks || [];
                    saveTasks();
                    renderTasks();
                } catch (err) { alert('Invalid import file.'); }
            };
            reader.readAsText(file);
        };
        input.click();
    };

    // Export
    if (exportBtn) exportBtn.onclick = () => {
        const dataStr = JSON.stringify(tasks, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = "todo-tasks.json";
        link.click();
    };

    // Delete All
    if (deleteAllBtn) deleteAllBtn.onclick = deleteAllTasks;

    // Add Task
    addBtn.onclick = addTask;
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });

    // Weather Widget
    if (weatherInfo) {
        fetch('https://wttr.in/?format=%C+%t')
            .then(res => res.text())
            .then(data => { weatherInfo.textContent = data; });
    }

    // Initial Display
    renderTasks();
}); 

