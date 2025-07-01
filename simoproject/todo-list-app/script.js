// Variabili DOM
const taskText = document.getElementById('task-text');
const taskDate = document.getElementById('task-date');
const taskTime = document.getElementById('task-time');
const addTaskBtn = document.getElementById('add-task');
const tasksContainer = document.getElementById('tasks-container');

const settingsBtn = document.getElementById('settings-btn');
const settingsMenu = document.getElementById('settings-menu');
const toggleNotifiche = document.getElementById('toggle-notifiche');

let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let notificheAttive = JSON.parse(localStorage.getItem('notificheAttive')) ?? true;

// Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').then(() => {
    console.log('✅ Service Worker registrato');
  });
}

// Richiedi permesso notifiche
if ('Notification' in window) {
  Notification.requestPermission().then(permission => {
    if (permission === 'granted') {
      console.log('✅ Notifiche abilitate');
    }
  });
}

function salva() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
  localStorage.setItem('notificheAttive', JSON.stringify(notificheAttive));
}

function renderTasks() {
  tasksContainer.innerHTML = '';
  tasks.forEach((task, index) => {
    const card = document.createElement('div');
    card.className = 'task-card';

    const datetimeDiv = document.createElement('div');
    datetimeDiv.className = 'task-datetime';

    const dateSpan = document.createElement('span');
    dateSpan.className = 'task-date';
    dateSpan.textContent = formatDateDisplay(task.date);

    const timeSpan = document.createElement('span');
    timeSpan.className = 'task-time';
    timeSpan.textContent = task.time;

    datetimeDiv.appendChild(dateSpan);
    datetimeDiv.appendChild(timeSpan);

    const descDiv = document.createElement('div');
    descDiv.className = 'task-desc';
    descDiv.textContent = task.description;

    const buttonsDiv = document.createElement('div');
    buttonsDiv.className = 'task-buttons';

    const editBtn = document.createElement('button');
    editBtn.className = 'task-btn edit';
    editBtn.textContent = '✏️ Modifica';
    editBtn.onclick = () => startEditTask(index);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'task-btn delete';
    deleteBtn.textContent = '🗑️ Elimina';
    deleteBtn.onclick = () => {
      if (confirm('Sei sicuro di voler eliminare questa attività?')) {
        tasks.splice(index, 1);
        salva();
        renderTasks();
      }
    };

    buttonsDiv.appendChild(editBtn);
    buttonsDiv.appendChild(deleteBtn);

    card.appendChild(datetimeDiv);
    card.appendChild(descDiv);
    card.appendChild(buttonsDiv);

    tasksContainer.appendChild(card);
  });
}

// Formatta la data in gg/mm/aaaa
function formatDateDisplay(dateISO) {
  const d = new Date(dateISO);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

// Doppia notifica: 5h prima e 1h prima
function scheduleNotification(task) {
  if (!notificheAttive || !('Notification' in window) || Notification.permission !== 'granted') return;

  const eventDate = new Date(`${task.date}T${task.time}`);
  const now = new Date();

  const notifica1h = new Date(eventDate.getTime() - 60 * 60 * 1000);
  const notifica5h = new Date(eventDate.getTime() - 5 * 60 * 60 * 1000);

  const msTo1h = notifica1h - now;
  const msTo5h = notifica5h - now;

  if (msTo5h > 0) {
    setTimeout(() => {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification('🕔 Promemoria attività', {
          body: `Tra 5 ore: ${task.description}`,
          icon: 'icons/icon-192.png',
          badge: 'icons/icon-192.png',
          tag: `reminder5-${task.date}-${task.time}`
        });
      });
    }, msTo5h);
  }

  if (msTo1h > 0) {
    setTimeout(() => {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification('⏰ Promemoria attività', {
          body: `Tra 1 ora: ${task.description}`,
          icon: 'icons/icon-192.png',
          badge: 'icons/icon-192.png',
          tag: `reminder1-${task.date}-${task.time}`
        });
      });
    }, msTo1h);
  }
}

function addTaskHandler() {
  const description = taskText.value.trim();
  const date = taskDate.value;
  const time = taskTime.value;

  if (!description || !date || !time) {
    alert('Completa tutti i campi!');
    return;
  }

  const newTask = { description, date, time };
  tasks.push(newTask);
  salva();
  renderTasks();
  scheduleNotification(newTask);

  taskText.value = '';
  taskDate.value = '';
  taskTime.value = '';
}

addTaskBtn.onclick = addTaskHandler;

function startEditTask(index) {
  const task = tasks[index];
  taskText.value = task.description;
  taskDate.value = task.date;
  taskTime.value = task.time;
  addTaskBtn.textContent = 'Salva Modifica';

  addTaskBtn.onclick = () => {
    const description = taskText.value.trim();
    const date = taskDate.value;
    const time = taskTime.value;

    if (!description || !date || !time) {
      alert('Completa tutti i campi!');
      return;
    }

    tasks[index] = { description, date, time };
    salva();
    renderTasks();
    scheduleNotification(tasks[index]);

    taskText.value = '';
    taskDate.value = '';
    taskTime.value = '';
    addTaskBtn.textContent = 'Aggiungi';
    addTaskBtn.onclick = addTaskHandler;
  };
}

// Impostazioni toggle
settingsBtn.onclick = () => {
  settingsMenu.classList.toggle('show');
};

toggleNotifiche.checked = notificheAttive;
toggleNotifiche.onchange = () => {
  notificheAttive = toggleNotifiche.checked;
  salva();
};

renderTasks();
