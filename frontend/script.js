document.addEventListener('DOMContentLoaded', () => {
  const clockElement = document.getElementById('clock');
  const dateElement = document.querySelector('.date');
  const cityEl = document.querySelector('.city');
  const weatherIcon = document.getElementById('weatherIcon');
  const tempEl = document.querySelector('.temp');
  const descEl = document.querySelector('.desc');
  const minmaxEl = document.querySelector('.minmax');

  const todoInput = document.getElementById('todoInput');
  const todoTime = document.getElementById('todoTime');
  const todoPeriod = document.getElementById('todoPeriod');
  const addTodoBtn = document.getElementById('addTodo');
  const toggleBtn = document.getElementById('toggleTodo');
  const todoDetails = document.getElementById('todoDetails');
  const previewContainer = document.getElementById('taskPreview');

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function timeDifference(t1, t2) {
    const [h1, m1] = t1.split(':').map(Number);
    const [h2, m2] = t2.split(':').map(Number);
    return Math.abs(h1 * 60 + m1 - (h2 * 60 + m2));
  }

  function updateClock() {
    const now = new Date();
    clockElement.textContent = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    dateElement.textContent = capitalize(now.toLocaleDateString('pt-BR', {
      weekday: 'long', day: 'numeric', month: 'long'
    }));
  }

  setInterval(updateClock, 1000);
  updateClock();

  function fetchWeatherByCoords(lat, lon) {
    const apiKey = '6b2e9835bf99ae05ed4e3fe8b2fdf128';
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=pt_br`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data.cod !== 200) throw new Error(data.message);
        const { icon, description, id } = data.weather[0];
        const isNight = icon.endsWith('n');

        weatherIcon.src = `https://openweathermap.org/img/wn/${icon}@2x.png`;
        weatherIcon.alt = description;
        tempEl.textContent = `${Math.round(data.main.temp)}°C`;
        descEl.textContent = description;
        minmaxEl.textContent = `Mín: ${Math.round(data.main.temp_min)} / Máx: ${Math.round(data.main.temp_max)}`;
        cityEl.textContent = data.name;

        updateWeatherBackground(id, isNight);

        if (id >= 200 && id < 600) createRain();
        else document.querySelector('.rain')?.replaceChildren();
      })
      .catch(err => {
        console.error(err);
        tempEl.textContent = '--';
        descEl.textContent = 'Erro ao carregar';
        minmaxEl.textContent = '';
        weatherIcon.src = '';
        cityEl.textContent = 'Localização indisponível';
      });
  }

  function updateWeatherBackground(id, isNight) {
    const body = document.body;
    body.className = '';
    if (isNight) body.classList.add('weather-night');
    else if (id >= 200 && id < 300) body.classList.add('weather-thunderstorm');
    else if (id >= 300 && id < 600) body.classList.add('weather-rain');
    else if (id >= 600 && id < 700) body.classList.add('weather-snow');
    else if (id >= 700 && id < 800) body.classList.add('weather-mist');
    else if (id === 800) body.classList.add('weather-clear');
    else if (id <= 802) body.classList.add('weather-partly-cloudy');
    else body.classList.add('weather-cloudy');
  }

  function getUserLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => fetchWeatherByCoords(coords.latitude, coords.longitude),
        () => cityEl.textContent = 'Localização não permitida'
      );
    } else {
      cityEl.textContent = 'Geolocalização não suportada';
    }
  }
  getUserLocation();

  function createRain() {
    const rainContainer = document.querySelector('.rain');
    if (!rainContainer) return;
    rainContainer.innerHTML = '';
    for (let i = 0; i < 100; i++) {
      const drop = document.createElement('div');
      drop.className = 'rain-drop';
      drop.style.left = `${Math.random() * 100}vw`;
      drop.style.animationDuration = `${(Math.random() * 0.5 + 0.7).toFixed(2)}s`;
      drop.style.animationDelay = `${Math.random() * 2}s`;
      rainContainer.appendChild(drop);
    }
  }

  function createTaskElement(text, time = '') {
    const li = document.createElement('li');
    const span = document.createElement('span');
    span.textContent = text;
    if (time) span.dataset.time = time;
    li.appendChild(span);

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '🗑️';
    deleteBtn.onclick = () => {
      li.remove();
      saveTasks();
      updateTaskPreview();
    };
    li.appendChild(deleteBtn);

    li.addEventListener('click', (e) => {
      if (e.target !== deleteBtn) {
        li.classList.toggle('done');
        saveTasks();
      }
    });

    return li;
  }

  function saveTasks() {
    const tasks = {};
    ['morning', 'afternoon', 'night'].forEach(period => {
      const list = document.getElementById(`todo${capitalize(period)}`);
      tasks[period] = [...list.querySelectorAll('li')].map(li => {
        const span = li.querySelector('span');
        return {
          text: span.textContent,
          time: span.dataset.time || '',
          done: li.classList.contains('done')
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
        const li = createTaskElement(task.text, task.time);
        if (task.done) li.classList.add('done');
        list.appendChild(li);
      });
    });
    updateTaskPreview();
  }

  addTodoBtn.addEventListener('click', () => {
    const task = todoInput.value.trim();
    const time = todoTime.value;
    const period = todoPeriod.value;

    if (task) {
      const list = document.getElementById(`todo${capitalize(period)}`);
      const li = createTaskElement(task, time);
      list.appendChild(li);
      todoInput.value = '';
      todoTime.value = '';
      saveTasks();
      updateTaskPreview();
    }
  });

  function updateTaskPreview() {
    previewContainer.innerHTML = '';
    ['morning', 'afternoon', 'night'].forEach(period => {
      const list = document.getElementById(`todo${capitalize(period)}`);
      [...list.querySelectorAll('li')].forEach(li => {
        const span = li.querySelector('span');
        const task = span.textContent;
        const time = span.dataset.time;
        const div = document.createElement('div');
        div.className = 'task-preview';
        div.textContent = task + (time ? ` (${time})` : '');

        if (time && timeDifference(new Date().toTimeString().slice(0, 5), time) <= 15) {
          div.classList.add('alert-task');
        }

        previewContainer.appendChild(div);
      });
    });
  }

  toggleBtn.addEventListener('click', () => {
    const isHidden = todoDetails.style.display === 'none';
    todoDetails.style.display = isHidden ? 'block' : 'none';
    toggleBtn.textContent = isHidden ? '－' : '＋';
  });

  document.getElementById('searchInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const query = e.target.value.trim();
      if (query) window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
    }
  });

  document.body.style.overflow = 'hidden';
  window.addEventListener('scroll', () => window.scrollTo(0, 0));

  loadTasks();
  setInterval(updateTaskPreview, 60000);
});

//ao adicionar o meu JS o meu style ficou bagunçado:
document.addEventListener('DOMContentLoaded', () => {
  // Utilitários
  const capitalize = str => str.charAt(0).toUpperCase() + str.slice(1);
  const timeDifference = (t1, t2) => {
    const [h1, m1] = t1.split(':').map(Number);
    const [h2, m2] = t2.split(':').map(Number);
    return Math.abs(h1 * 60 + m1 - (h2 * 60 + m2));
  };

  // Elementos principais
  const todoInput = document.getElementById('todoInput');
  const todoTime = document.getElementById('todoTime');
  const todoPeriod = document.getElementById('todoPeriod');
  const addTodoBtn = document.getElementById('addTodo');
  const toggleBtn = document.getElementById('toggleTodo');
  const todoDetails = document.getElementById('todoDetails');
  const previewContainer = document.getElementById('taskPreview');

  // Criação de item visual da tarefa
  function createTaskElement(text, time = '') {
    const li = document.createElement('li');
    const span = document.createElement('span');
    span.textContent = text;
    if (time) span.dataset.time = time;
    li.appendChild(span);

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '🗑️';
    deleteBtn.onclick = () => {
      li.remove();
      saveTasks();
      updateTaskPreview();
    };
    li.appendChild(deleteBtn);

    li.addEventListener('click', e => {
      if (e.target !== deleteBtn) {
        li.classList.toggle('done');
        saveTasks();
        updateTaskPreview();
      }
    });

    return li;
  }

  // Salvar tarefas no localStorage
  function saveTasks() {
    const tasks = {};
    ['morning', 'afternoon', 'night'].forEach(period => {
      const list = document.getElementById(`todo${capitalize(period)}`);
      tasks[period] = [...list.querySelectorAll('li')].map(li => {
        const span = li.querySelector('span');
        return {
          text: span.textContent,
          time: span.dataset.time || '',
          done: li.classList.contains('done')
        };
      });
    });
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }

  // Carregar tarefas do localStorage
  function loadTasks() {
    const saved = JSON.parse(localStorage.getItem('tasks') || '{}');
    ['morning', 'afternoon', 'night'].forEach(period => {
      const list = document.getElementById(`todo${capitalize(period)}`);
      list.innerHTML = '';
      (saved[period] || []).forEach(task => {
        const li = createTaskElement(task.text, task.time);
        if (task.done) li.classList.add('done');
        list.appendChild(li);
      });
    });
    updateTaskPreview();
  }

  // Remover tarefa de todas as listas
  function removeTaskByTextAndTime(text, time) {
    ['morning', 'afternoon', 'night'].forEach(period => {
      const list = document.getElementById(`todo${capitalize(period)}`);
      [...list.querySelectorAll('li')].forEach(li => {
        const span = li.querySelector('span');
        if (span.textContent === text && span.dataset.time === time) {
          li.remove();
        }
      });
    });
    saveTasks();
  }

  // Atualizar área "Próxima tarefa"
  function updateTaskPreview() {
    previewContainer.innerHTML = '';
    const now = new Date();
    const nowTime = now.toTimeString().slice(0, 5);

    ['morning', 'afternoon', 'night'].forEach(period => {
      const list = document.getElementById(`todo${capitalize(period)}`);
      [...list.querySelectorAll('li')].forEach(li => {
        const span = li.querySelector('span');
        const task = span.textContent;
        const time = span.dataset.time || '';

        const container = document.createElement('div');
        container.className = 'task-preview';
        container.textContent = task + (time ? ` (${time})` : '');

        if (time) {
          const diff = timeDifference(nowTime, time);
          if (diff <= 15) {
            container.classList.add('alert-task');

            const btn = document.createElement('button');
            btn.textContent = 'Desligar Alarme';
            btn.className = 'dismiss-alert-btn';
            btn.onclick = () => {
              removeTaskByTextAndTime(task, time);
              updateTaskPreview();
            };
            container.appendChild(btn);
          }
        }

        previewContainer.appendChild(container);
      });
    });
  }

  // Adicionar nova tarefa
  addTodoBtn.addEventListener('click', () => {
    const task = todoInput.value.trim();
    const time = todoTime.value;
    const period = todoPeriod.value;

    if (task) {
      const list = document.getElementById(`todo${capitalize(period)}`);
      const li = createTaskElement(task, time);
      list.appendChild(li);
      todoInput.value = '';
      todoTime.value = '';
      saveTasks();
      updateTaskPreview();
    }
  });

  // Alternar exibição da lista de tarefas
  toggleBtn.addEventListener('click', () => {
    const isHidden = todoDetails.style.display === 'none';
    todoDetails.style.display = isHidden ? 'block' : 'none';
    toggleBtn.textContent = isHidden ? '－' : '＋';
  });

  // Pesquisa Google
  document.getElementById('searchInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const query = e.target.value.trim();
      if (query) window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
    }
  });

  // Bloqueio de scroll
  document.body.style.overflow = 'hidden';
  window.addEventListener('scroll', () => window.scrollTo(0, 0));

  loadTasks();
  setInterval(updateTaskPreview, 60000);
});
document.addEventListener('DOMContentLoaded', () => {
  // Utilitários
  const capitalize = str => str.charAt(0).toUpperCase() + str.slice(1);
  const timeDifference = (t1, t2) => {
    const [h1, m1] = t1.split(':').map(Number);
    const [h2, m2] = t2.split(':').map(Number);
    return Math.abs(h1 * 60 + m1 - (h2 * 60 + m2));
  };

  // Elementos principais
  const todoInput = document.getElementById('todoInput');
  const todoTime = document.getElementById('todoTime');
  const todoPeriod = document.getElementById('todoPeriod');
  const addTodoBtn = document.getElementById('addTodo');
  const toggleBtn = document.getElementById('toggleTodo');
  const todoDetails = document.getElementById('todoDetails');
  const previewContainer = document.getElementById('taskPreview');

  // Criação de item visual da tarefa
  function createTaskElement(text, time = '') {
    const li = document.createElement('li');
    const span = document.createElement('span');
    span.textContent = text;
    if (time) span.dataset.time = time;
    li.appendChild(span);

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '🗑️';
    deleteBtn.onclick = () => {
      li.remove();
      saveTasks();
      updateTaskPreview();
    };
    li.appendChild(deleteBtn);

    li.addEventListener('click', e => {
      if (e.target !== deleteBtn) {
        li.classList.toggle('done');
        saveTasks();
        updateTaskPreview();
      }
    });

    return li;
  }

  // Salvar tarefas no localStorage
  function saveTasks() {
    const tasks = {};
    ['morning', 'afternoon', 'night'].forEach(period => {
      const list = document.getElementById(`todo${capitalize(period)}`);
      tasks[period] = [...list.querySelectorAll('li')].map(li => {
        const span = li.querySelector('span');
        return {
          text: span.textContent,
          time: span.dataset.time || '',
          done: li.classList.contains('done')
        };
      });
    });
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }

  // Carregar tarefas do localStorage
  function loadTasks() {
    const saved = JSON.parse(localStorage.getItem('tasks') || '{}');
    ['morning', 'afternoon', 'night'].forEach(period => {
      const list = document.getElementById(`todo${capitalize(period)}`);
      list.innerHTML = '';
      (saved[period] || []).forEach(task => {
        const li = createTaskElement(task.text, task.time);
        if (task.done) li.classList.add('done');
        list.appendChild(li);
      });
    });
    updateTaskPreview();
  }

  // Remover tarefa de todas as listas
  function removeTaskByTextAndTime(text, time) {
    ['morning', 'afternoon', 'night'].forEach(period => {
      const list = document.getElementById(`todo${capitalize(period)}`);
      [...list.querySelectorAll('li')].forEach(li => {
        const span = li.querySelector('span');
        if (span.textContent === text && span.dataset.time === time) {
          li.remove();
        }
      });
    });
    saveTasks();
  }

  // Atualizar área "Próxima tarefa"
  function updateTaskPreview() {
    previewContainer.innerHTML = '';
    const now = new Date();
    const nowTime = now.toTimeString().slice(0, 5);

    ['morning', 'afternoon', 'night'].forEach(period => {
      const list = document.getElementById(`todo${capitalize(period)}`);
      [...list.querySelectorAll('li')].forEach(li => {
        const span = li.querySelector('span');
        const task = span.textContent;
        const time = span.dataset.time || '';

        const container = document.createElement('div');
        container.className = 'task-preview';
        container.textContent = task + (time ? ` (${time})` : '');

        if (time) {
          const diff = timeDifference(nowTime, time);
          if (diff <= 15) {
            container.classList.add('alert-task');

            const btn = document.createElement('button');
            btn.textContent = 'Desligar Alarme';
            btn.className = 'dismiss-alert-btn';
            btn.onclick = () => {
              removeTaskByTextAndTime(task, time);
              updateTaskPreview();
            };
            container.appendChild(btn);
          }
        }

        previewContainer.appendChild(container);
      });
    });
  }

  // Adicionar nova tarefa
  addTodoBtn.addEventListener('click', () => {
    const task = todoInput.value.trim();
    const time = todoTime.value;
    const period = todoPeriod.value;

    if (task) {
      const list = document.getElementById(`todo${capitalize(period)}`);
      const li = createTaskElement(task, time);
      list.appendChild(li);
      todoInput.value = '';
      todoTime.value = '';
      saveTasks();
      updateTaskPreview();
    }
  });

  // Alternar exibição da lista de tarefas
  toggleBtn.addEventListener('click', () => {
    const isHidden = todoDetails.style.display === 'none';
    todoDetails.style.display = isHidden ? 'block' : 'none';
    toggleBtn.textContent = isHidden ? '－' : '＋';
  });

  // Pesquisa Google
  document.getElementById('searchInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const query = e.target.value.trim();
      if (query) window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
    }
  });

  // Bloqueio de scroll
  document.body.style.overflow = 'hidden';
  window.addEventListener('scroll', () => window.scrollTo(0, 0));

  loadTasks();
  setInterval(updateTaskPreview, 60000);
});
document.addEventListener('DOMContentLoaded', () => {
  // Utilitários
  const capitalize = str => str.charAt(0).toUpperCase() + str.slice(1);
  const timeDifference = (t1, t2) => {
    const [h1, m1] = t1.split(':').map(Number);
    const [h2, m2] = t2.split(':').map(Number);
    return Math.abs(h1 * 60 + m1 - (h2 * 60 + m2));
  };

  // Elementos principais
  const todoInput = document.getElementById('todoInput');
  const todoTime = document.getElementById('todoTime');
  const todoPeriod = document.getElementById('todoPeriod');
  const addTodoBtn = document.getElementById('addTodo');
  const toggleBtn = document.getElementById('toggleTodo');
  const todoDetails = document.getElementById('todoDetails');
  const previewContainer = document.getElementById('taskPreview');

  // Criação de item visual da tarefa
  function createTaskElement(text, time = '') {
    const li = document.createElement('li');
    const span = document.createElement('span');
    span.textContent = text;
    if (time) span.dataset.time = time;
    li.appendChild(span);

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '🗑️';
    deleteBtn.onclick = () => {
      li.remove();
      saveTasks();
      updateTaskPreview();
    };
    li.appendChild(deleteBtn);

    li.addEventListener('click', e => {
      if (e.target !== deleteBtn) {
        li.classList.toggle('done');
        saveTasks();
        updateTaskPreview();
      }
    });

    return li;
  }

  // Salvar tarefas no localStorage
  function saveTasks() {
    const tasks = {};
    ['morning', 'afternoon', 'night'].forEach(period => {
      const list = document.getElementById(`todo${capitalize(period)}`);
      tasks[period] = [...list.querySelectorAll('li')].map(li => {
        const span = li.querySelector('span');
        return {
          text: span.textContent,
          time: span.dataset.time || '',
          done: li.classList.contains('done')
        };
      });
    });
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }

  // Carregar tarefas do localStorage
  function loadTasks() {
    const saved = JSON.parse(localStorage.getItem('tasks') || '{}');
    ['morning', 'afternoon', 'night'].forEach(period => {
      const list = document.getElementById(`todo${capitalize(period)}`);
      list.innerHTML = '';
      (saved[period] || []).forEach(task => {
        const li = createTaskElement(task.text, task.time);
        if (task.done) li.classList.add('done');
        list.appendChild(li);
      });
    });
    updateTaskPreview();
  }

  // Remover tarefa de todas as listas
  function removeTaskByTextAndTime(text, time) {
    ['morning', 'afternoon', 'night'].forEach(period => {
      const list = document.getElementById(`todo${capitalize(period)}`);
      [...list.querySelectorAll('li')].forEach(li => {
        const span = li.querySelector('span');
        if (span.textContent === text && span.dataset.time === time) {
          li.remove();
        }
      });
    });
    saveTasks();
  }

  // Atualizar área "Próxima tarefa"
  function updateTaskPreview() {
    previewContainer.innerHTML = '';
    const now = new Date();
    const nowTime = now.toTimeString().slice(0, 5);

    ['morning', 'afternoon', 'night'].forEach(period => {
      const list = document.getElementById(`todo${capitalize(period)}`);
      [...list.querySelectorAll('li')].forEach(li => {
        const span = li.querySelector('span');
        const task = span.textContent;
        const time = span.dataset.time || '';

        const container = document.createElement('div');
        container.className = 'task-preview';
        container.textContent = task + (time ? ` (${time})` : '');

        if (time) {
          const diff = timeDifference(nowTime, time);
          if (diff <= 15) {
            container.classList.add('alert-task');

            const btn = document.createElement('button');
            btn.textContent = 'Desligar Alarme';
            btn.className = 'dismiss-alert-btn';
            btn.onclick = () => {
              removeTaskByTextAndTime(task, time);
              updateTaskPreview();
            };
            container.appendChild(btn);
          }
        }

        previewContainer.appendChild(container);
      });
    });
  }

  // Adicionar nova tarefa
  addTodoBtn.addEventListener('click', () => {
    const task = todoInput.value.trim();
    const time = todoTime.value;
    const period = todoPeriod.value;

    if (task) {
      const list = document.getElementById(`todo${capitalize(period)}`);
      const li = createTaskElement(task, time);
      list.appendChild(li);
      todoInput.value = '';
      todoTime.value = '';
      saveTasks();
      updateTaskPreview();
    }
  });

  // Alternar exibição da lista de tarefas
  toggleBtn.addEventListener('click', () => {
    const isHidden = todoDetails.style.display === 'none';
    todoDetails.style.display = isHidden ? 'block' : 'none';
    toggleBtn.textContent = isHidden ? '－' : '＋';
  });

  // Pesquisa Google
  document.getElementById('searchInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const query = e.target.value.trim();
      if (query) window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
    }
  });

  // Bloqueio de scroll
  document.body.style.overflow = 'hidden';
  window.addEventListener('scroll', () => window.scrollTo(0, 0));

  loadTasks();
  setInterval(updateTaskPreview, 60000);
});
document.addEventListener('DOMContentLoaded', () => {
  // Utilitários
  const capitalize = str => str.charAt(0).toUpperCase() + str.slice(1);
  const timeDifference = (t1, t2) => {
    const [h1, m1] = t1.split(':').map(Number);
    const [h2, m2] = t2.split(':').map(Number);
    return Math.abs(h1 * 60 + m1 - (h2 * 60 + m2));
  };

  // Elementos principais
  const todoInput = document.getElementById('todoInput');
  const todoTime = document.getElementById('todoTime');
  const todoPeriod = document.getElementById('todoPeriod');
  const addTodoBtn = document.getElementById('addTodo');
  const toggleBtn = document.getElementById('toggleTodo');
  const todoDetails = document.getElementById('todoDetails');
  const previewContainer = document.getElementById('taskPreview');

  // Criação de item visual da tarefa
  function createTaskElement(text, time = '') {
    const li = document.createElement('li');
    const span = document.createElement('span');
    span.textContent = text;
    if (time) span.dataset.time = time;
    li.appendChild(span);

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '🗑️';
    deleteBtn.onclick = () => {
      li.remove();
      saveTasks();
      updateTaskPreview();
    };
    li.appendChild(deleteBtn);

    li.addEventListener('click', e => {
      if (e.target !== deleteBtn) {
        li.classList.toggle('done');
        saveTasks();
        updateTaskPreview();
      }
    });

    return li;
  }

  // Salvar tarefas no localStorage
  function saveTasks() {
    const tasks = {};
    ['morning', 'afternoon', 'night'].forEach(period => {
      const list = document.getElementById(`todo${capitalize(period)}`);
      tasks[period] = [...list.querySelectorAll('li')].map(li => {
        const span = li.querySelector('span');
        return {
          text: span.textContent,
          time: span.dataset.time || '',
          done: li.classList.contains('done')
        };
      });
    });
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }

  // Carregar tarefas do localStorage
  function loadTasks() {
    const saved = JSON.parse(localStorage.getItem('tasks') || '{}');
    ['morning', 'afternoon', 'night'].forEach(period => {
      const list = document.getElementById(`todo${capitalize(period)}`);
      list.innerHTML = '';
      (saved[period] || []).forEach(task => {
        const li = createTaskElement(task.text, task.time);
        if (task.done) li.classList.add('done');
        list.appendChild(li);
      });
    });
    updateTaskPreview();
  }

  // Remover tarefa de todas as listas
  function removeTaskByTextAndTime(text, time) {
    ['morning', 'afternoon', 'night'].forEach(period => {
      const list = document.getElementById(`todo${capitalize(period)}`);
      [...list.querySelectorAll('li')].forEach(li => {
        const span = li.querySelector('span');
        if (span.textContent === text && span.dataset.time === time) {
          li.remove();
        }
      });
    });
    saveTasks();
  }

  // Atualizar área "Próxima tarefa"
  function updateTaskPreview() {
    previewContainer.innerHTML = '';
    const now = new Date();
    const nowTime = now.toTimeString().slice(0, 5);

    ['morning', 'afternoon', 'night'].forEach(period => {
      const list = document.getElementById(`todo${capitalize(period)}`);
      [...list.querySelectorAll('li')].forEach(li => {
        const span = li.querySelector('span');
        const task = span.textContent;
        const time = span.dataset.time || '';

        const container = document.createElement('div');
        container.className = 'task-preview';
        container.textContent = task + (time ? ` (${time})` : '');

        if (time) {
          const diff = timeDifference(nowTime, time);
          if (diff <= 15) {
            container.classList.add('alert-task');

            const btn = document.createElement('button');
            btn.textContent = 'Desligar Alarme';
            btn.className = 'dismiss-alert-btn';
            btn.onclick = () => {
              removeTaskByTextAndTime(task, time);
              updateTaskPreview();
            };
            container.appendChild(btn);
          }
        }

        previewContainer.appendChild(container);
      });
    });
  }

  // Adicionar nova tarefa
  addTodoBtn.addEventListener('click', () => {
    const task = todoInput.value.trim();
    const time = todoTime.value;
    const period = todoPeriod.value;

    if (task) {
      const list = document.getElementById(`todo${capitalize(period)}`);
      const li = createTaskElement(task, time);
      list.appendChild(li);
      todoInput.value = '';
      todoTime.value = '';
      saveTasks();
      updateTaskPreview();
    }
  });

  // Alternar exibição da lista de tarefas
  toggleBtn.addEventListener('click', () => {
    const isHidden = todoDetails.style.display === 'none';
    todoDetails.style.display = isHidden ? 'block' : 'none';
    toggleBtn.textContent = isHidden ? '－' : '＋';
  });

  // Pesquisa Google
  document.getElementById('searchInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const query = e.target.value.trim();
      if (query) window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
    }
  });

  // Bloqueio de scroll
  document.body.style.overflow = 'hidden';
  window.addEventListener('scroll', () => window.scrollTo(0, 0));

  loadTasks();
  setInterval(updateTaskPreview, 60000);
});
