// --- Utilitário ---
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// --- Relógio ---
function updateClock() {
  const now = new Date();
  const clock = document.getElementById('clock');
  const dateElem = document.querySelector('.date');

  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  clock.textContent = `${hours}:${minutes}`;

  const options = { weekday: 'long', day: 'numeric', month: 'long' };
  const formattedDate = now.toLocaleDateString('pt-BR', options);
  dateElem.textContent = capitalize(formattedDate);
}

// --- Tarefas ---
function createTaskElement(text, time = '', done = false) {
  const li = document.createElement('li');
  li.className = done ? 'done' : '';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = done;
  checkbox.addEventListener('change', () => {
    li.classList.toggle('done', checkbox.checked);
    saveTasks();
    updateTaskPreview();
  });
  li.appendChild(checkbox);

  const span = document.createElement('span');
  span.className = 'task-text';
  span.textContent = text;
  if (time) span.dataset.time = time;
  li.appendChild(span);

  if (time) {
    const timeSpan = document.createElement('span');
    timeSpan.className = 'task-time';
    timeSpan.textContent = time;
    li.appendChild(timeSpan);
  }

  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = '🗑️';
  deleteBtn.className = 'delete-task-btn';
  deleteBtn.onclick = () => {
    li.remove();
    saveTasks();
    updateTaskPreview();
  };
  li.appendChild(deleteBtn);

  return li;
}

function saveTasks() {
  const tasks = {};
  ['morning', 'afternoon', 'night'].forEach(period => {
    const list = document.getElementById(`todo${capitalize(period)}`);
    tasks[period] = [...list.querySelectorAll('li')].map(li => {
      const checkbox = li.querySelector('input[type="checkbox"]');
      const span = li.querySelector('.task-text');
      const time = span.dataset.time || '';
      return {
        text: span.textContent,
        time,
        done: checkbox.checked
      };
    });
  });
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

function loadTasks() {
  const saved = JSON.parse(localStorage.getItem('tasks') || '{}');
  ['morning', 'afternoon', 'night'].forEach(period => {
    const list = document.getElementById(`todo${capitalize(period)}`);
    list.innerHTML = '';
    (saved[period] || []).forEach(task => {
      const li = createTaskElement(task.text, task.time, task.done);
      list.appendChild(li);
    });
  });
  updateTaskPreview();
}

function updateTaskPreview() {
  const now = new Date();
  let nextTask = null;
  let nextTaskTime = null;

  function getDateFromTime(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  function checkPeriodTasks(period) {
    const list = document.getElementById(`todo${capitalize(period)}`);
    [...list.querySelectorAll('li:not(.done)')].forEach(task => {
      const span = task.querySelector('.task-text');
      const timeStr = span.dataset.time;
      if (timeStr) {
        const taskTime = getDateFromTime(timeStr);
        if (taskTime >= now) {
          if (!nextTaskTime || taskTime < nextTaskTime) {
            nextTask = task;
            nextTaskTime = taskTime;
          }
        }
      } else if (!nextTaskTime && !nextTask) {
        nextTask = task;
      }
    });
  }

  ['morning', 'afternoon', 'night'].forEach(checkPeriodTasks);

  const nextTaskSpan = document.getElementById('nextTask');
  const taskPreviewContainer = document.getElementById('taskPreview');

  if (nextTask) {
    const text = nextTask.querySelector('.task-text').textContent;
    const time = nextTask.querySelector('.task-text').dataset.time || '';
    nextTaskSpan.textContent = time ? `${text} às ${time}` : text;
  } else {
    nextTaskSpan.textContent = 'Nenhuma';
  }

  taskPreviewContainer.innerHTML = '';
  ['morning', 'afternoon', 'night'].forEach(period => {
    const list = document.getElementById(`todo${capitalize(period)}`);
    [...list.querySelectorAll('li')].forEach(li => {
      const clone = li.cloneNode(true);
      const checkbox = clone.querySelector('input[type="checkbox"]');
      const deleteBtn = clone.querySelector('.delete-task-btn');
      if (checkbox) checkbox.remove();
      if (deleteBtn) deleteBtn.remove();
      taskPreviewContainer.appendChild(clone);
    });
  });

  // Alerta visual se faltar 15min ou menos
  if (nextTaskTime) {
    const diffMs = nextTaskTime - now;
    if (diffMs <= 15 * 60 * 1000 && diffMs >= 0) {
      nextTaskSpan.classList.add('alert');
    } else {
      nextTaskSpan.classList.remove('alert');
    }
  } else {
    nextTaskSpan.classList.remove('alert');
  }
}

function clearTasks(period) {
  const list = document.getElementById(`todo${capitalize(period)}`);
  list.innerHTML = '';
  saveTasks();
  updateTaskPreview();
}

// --- Inicialização ---
document.addEventListener('DOMContentLoaded', () => {
  updateClock();
  setInterval(updateClock, 1000);
  loadTasks();

  document.getElementById('addTodo').addEventListener('click', () => {
    const text = document.getElementById('todoInput').value.trim();
    const time = document.getElementById('todoTime').value;
    const period = document.getElementById('todoPeriod').value;

    if (!text) {
      alert('Por favor, insira uma tarefa.');
      return;
    }

    const list = document.getElementById(`todo${capitalize(period)}`);
    const li = createTaskElement(text, time);
    list.appendChild(li);

    document.getElementById('todoInput').value = '';
    document.getElementById('todoTime').value = '';
    saveTasks();
    updateTaskPreview();
  });

  ['morning', 'afternoon', 'night'].forEach(period => {
    document.getElementById(`clear${capitalize(period)}`).addEventListener('click', () => {
      clearTasks(period);
    });
  });

  const toggleBtn = document.getElementById('toggleTodo');
  const todoDetails = document.getElementById('todoDetails');
  toggleBtn.addEventListener('click', () => {
    const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
    todoDetails.style.display = isExpanded ? 'none' : 'block';
    toggleBtn.setAttribute('aria-expanded', !isExpanded);
    toggleBtn.textContent = isExpanded ? '＋' : '−';
  });

  // Atualização a cada minuto
  setInterval(() => {
    updateClock();
    updateTaskPreview();
  }, 60 * 1000);

  getLocation(); // Clima
});


// --- Clima com OpenWeatherMap ---
function getWeather(lat, lon) {
  const apiKey = '6b2e9835bf99ae05ed4e3fe8b2fdf128';
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=pt_br`;

  fetch(url)
    .then(res => res.json())
    .then(data => {
      const weatherIcon = document.getElementById('weatherIcon');
      const weatherCity = document.querySelector('.city');
      const weatherTemp = document.querySelector('.temp');
      const weatherDesc = document.querySelector('.desc');
      const weatherMinMax = document.querySelector('.minmax');

      const { name, weather, main } = data;
      const icon = weather[0].icon;
      const desc = weather[0].description;
      const temp = Math.round(main.temp);
      const min = Math.round(main.temp_min);
      const max = Math.round(main.temp_max);

      weatherCity.textContent = name;
      weatherTemp.textContent = `${temp}°C`;
      weatherDesc.textContent = capitalize(desc);
      weatherMinMax.textContent = `Mín: ${min}° / Máx: ${max}°`;
      weatherIcon.src = `https://openweathermap.org/img/wn/${icon}.png`;

      // Define classe de clima no body
      document.body.classList.add(`weather-${weather[0].main.toLowerCase()}`);
    })
    .catch(() => {
      const weatherCity = document.querySelector('.city');
      weatherCity.textContent = 'Erro ao obter clima';
    });
}

function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        getWeather(latitude, longitude);
      },
      () => {
        document.querySelector('.city').textContent = 'Permissão negada';
      }
    );
  } else {
    document.querySelector('.city').textContent = 'Geolocalização não suportada';
  }
}
