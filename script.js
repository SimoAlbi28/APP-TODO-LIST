const BASE_PATH = '/app-todo-list/';

const taskText = document.getElementById('task-text');
const taskDate = document.getElementById('task-date');
const taskTime = document.getElementById('task-time');
const addTaskBtn = document.getElementById('add-task');
const tasksContainer = document.getElementById('tasks-container');

const filterDate = document.getElementById('filter-date');
const resetFilterBtn = document.getElementById('reset-filter');

const settingsBtn = document.getElementById('settings-btn');
const settingsMenu = document.getElementById('settings-menu');
const toggleNotifiche = document.getElementById('toggle-notifiche');

let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let notificheAttive = JSON.parse(localStorage.getItem('notificheAttive')) ?? true;

let filteredDate = null;

// Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register(BASE_PATH + 'service-worker.js').then(() => {
    console.log('✅ Service Worker registrato');
  });
}

if ('Notification' in window) {
  Notification.requestPermission().then(permission => {
    if (permission === 'granted') {
      console.log('✅ Notifiche abilitate');
    }
  });
}

function formatDateIT(dateStr) {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

function salva() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
  localStorage.setItem('notificheAttive', JSON.stringify(notificheAttive));
}

function renderTasks() {
  tasksContainer.innerHTML = '';

  let tasksToShow = tasks;
  if (filteredDate) {
    tasksToShow = tasks.filter(t => t.date === filteredDate);
  }

  if (tasksToShow.length === 0) {
    const msg = document.createElement('div');
    msg.textContent = '🟢 Giorno libero!';
    msg.style.color = 'green';
    msg.style.fontWeight = '700';
    msg.style.fontSize = '1.3rem';
    msg.style.textAlign = 'center';
    tasksContainer.appendChild(msg);
    return;
  }

  tasksToShow.forEach((task, index) => {
    const card = document.createElement('div');
    card.className = 'task-card';

    const datetimeDiv = document.createElement('div');
    datetimeDiv.className = 'task-datetime';

    const dateSpan = document.createElement('span');
    dateSpan.className = 'task-date';
    dateSpan.textContent = formatDateIT(task.date);

    const timeSpan = document.createElement('span');
    timeSpan.className = 'task-time';
    timeSpan.textContent = task.time || '-';

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
    // Qui serve l'indice corretto per modifica
    // Se filtro attivo, dobbiamo mappare all'indice originale
    let originalIndex = tasks.indexOf(task);
    editBtn.onclick = () => startEditTask(originalIndex);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'task-btn delete';
    deleteBtn.textContent = '🗑️ Elimina';
    deleteBtn.onclick = () => {
      if (confirm('Sei sicuro di voler eliminare questa attività?')) {
        tasks.splice(originalIndex, 1);
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

function scheduleNotification(task) {
  const isAppInstalled = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

  if (!isAppInstalled) return;       // notifiche SOLO se app installata
  if (!notificheAttive) return;      // notifiche SOLO se attive
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const eventDate = new Date(`${task.date}T${task.time || '00:00'}`);
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
          icon: BASE_PATH + 'icons/icon-192.png',
          badge: BASE_PATH + 'icons/icon-192.png',
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
          icon: BASE_PATH + 'icons/icon-192.png',
          badge: BASE_PATH + 'icons/icon-192.png',
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

  if (!description || !date) {
    alert('Completa almeno descrizione e data!');
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
  filteredDate = null;
  filterDate.value = '';
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

    if (!description || !date) {
      alert('Completa almeno descrizione e data!');
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

    filteredDate = null;
    filterDate.value = '';
  };
}

// Filtra per data
filterDate.onchange = () => {
  if (filterDate.value) {
    filteredDate = filterDate.value;
  } else {
    filteredDate = null;
  }
  renderTasks();
};

// Reset filtro
resetFilterBtn.onclick = () => {
  filteredDate = null;
  filterDate.value = '';
  renderTasks();
};

// Toggle impostazioni notifiche
settingsBtn.onclick = () => {
  settingsMenu.classList.toggle('show');
};

toggleNotifiche.checked = notificheAttive;
toggleNotifiche.onchange = () => {
  notificheAttive = toggleNotifiche.checked;
  salva();
};

renderTasks();
