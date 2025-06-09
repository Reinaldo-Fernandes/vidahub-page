document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos do DOM ---
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

    // --- Utilitários ---
    const capitalize = str => str.charAt(0).toUpperCase() + str.slice(1);

    const timeDifference = (t1, t2) => {
        const [h1, m1] = t1.split(':').map(Number);
        const [h2, m2] = t2.split(':').map(Number);
        return Math.abs(h1 * 60 + m1 - (h2 * 60 + m2));
    };

    // --- Funções do Relógio ---
    function updateClock() {
        const now = new Date();
        clockElement.textContent = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        dateElement.textContent = capitalize(now.toLocaleDateString('pt-BR', {
            weekday: 'long', day: 'numeric', month: 'long'
        }));
    }
    setInterval(updateClock, 1000);
    updateClock();

    // --- Funções de Animação e Tema Climático ---
    function updateWeatherTheme(weatherCondition) {
        const body = document.body;
        const clouds = document.querySelectorAll('.cloud');

        // Limpa todas as classes climáticas existentes
        body.className = '';
        // Adiciona a nova classe climática
        body.classList.add(`weather-${weatherCondition}`);

        // Remove quaisquer gotas de chuva existentes de todas as nuvens
        clouds.forEach(cloud => {
            cloud.querySelectorAll('.rain-drop').forEach(drop => drop.remove());
        });

        // Adiciona gotas de chuva se o clima for 'chuva'
        if (weatherCondition === 'rain') {
            clouds.forEach(cloud => {
                const numberOfDrops = 30; // Ajuste para mais ou menos gotas
                for (let i = 0; i < numberOfDrops; i++) {
                    const rainDrop = document.createElement('div');
                    rainDrop.classList.add('rain-drop');

                    // Posição horizontal aleatória dentro da nuvem
                    rainDrop.style.left = `${Math.random() * 100}%`;
                    // Atraso de animação aleatório para queda escalonada
                    rainDrop.style.animationDelay = `${Math.random() * 3}s`; // Atraso máximo de 3 segundos
                    // Duração da animação aleatória para variar a velocidade de queda
                    rainDrop.style.animationDuration = `${5 + Math.random() * 5}s`; // Entre 5 e 10 segundos

                    cloud.appendChild(rainDrop);
                }
            });
        }
    }

    // --- Funções de Clima ---
    function fetchWeatherByCoords(lat, lon) {
        const apiKey = '6b2e9835bf99ae05ed4e3fe8b2fdf128'; // Seu API Key
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=pt_br`;

        fetch(url)
            .then(res => res.json())
            .then(data => {
                if (data.cod !== 200) {
                    console.error("Erro na API do tempo:", data.message);
                    throw new Error(data.message);
                }

                const { icon, description, id } = data.weather[0];
                const now = new Date();
                // Determinar se é noite com base no horário do nascer/pôr do sol
                const isNightTime = now.getTime() / 1000 > data.sys.sunset || now.getTime() / 1000 < data.sys.sunrise;


                weatherIcon.src = `https://openweathermap.org/img/wn/${icon}@2x.png`;
                weatherIcon.alt = description;
                tempEl.textContent = `${Math.round(data.main.temp)}°C`;
                descEl.textContent = capitalize(description);
                minmaxEl.textContent = `Mín: ${Math.round(data.main.temp_min)}° / Máx: ${Math.round(data.main.temp_max)}°`;
                cityEl.textContent = data.name;

                let weatherCondition = 'clear'; // Padrão
                if (isNightTime) {
                    weatherCondition = 'night';
                } else if (id >= 200 && id < 300) {
                    weatherCondition = 'thunderstorm';
                } else if (id >= 300 && id < 600) {
                    weatherCondition = 'rain';
                } else if (id >= 600 && id < 700) {
                    weatherCondition = 'snow';
                } else if (id >= 700 && id < 800) {
                    weatherCondition = 'mist';
                } else if (id === 800) {
                    weatherCondition = 'clear';
                } else if (id <= 802) {
                    weatherCondition = 'partly-cloudy';
                } else { // id >= 803
                    weatherCondition = 'cloudy';
                }

                updateWeatherTheme(weatherCondition); // Aplica o tema e animações
            })
            .catch(err => {
                console.error("Erro ao buscar dados do tempo:", err);
                tempEl.textContent = '--';
                descEl.textContent = 'Erro ao carregar';
                minmaxEl.textContent = '';
                weatherIcon.src = '';
                cityEl.textContent = 'Localização indisponível';
                // Reseta para um tema padrão em caso de erro
                updateWeatherTheme('clear');
            });
    }

    function getUserLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                ({ coords }) => fetchWeatherByCoords(coords.latitude, coords.longitude),
                (error) => {
                    console.warn("Geolocalização não permitida ou erro:", error);
                    cityEl.textContent = 'Localização não permitida. Exibindo tempo para Natal.';
                    fetchWeatherByCoords(-5.79448, -35.211); // Coordenadas de Natal, Brasil
                }
            );
        } else {
            console.warn("Geolocalização não suportada pelo navegador. Exibindo tempo para Natal.");
            cityEl.textContent = 'Geolocalização não suportada. Exibindo tempo para Natal.';
            fetchWeatherByCoords(-5.79448, -35.211); // Coordenadas de Natal, Brasil
        }
    }
    getUserLocation();


    // --- Funções da Lista de Tarefas ---
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
                updateTaskPreview();
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
                    if (diff <= 15 && !li.classList.contains('done')) { // Only alert for undone tasks
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
        // Update "Próxima tarefa" text (optional, if you want to show the very next task)
        const nextTaskElement = document.getElementById('nextTask');
        if (previewContainer.children.length > 0) {
            nextTaskElement.textContent = previewContainer.children[0].textContent;
        } else {
            nextTaskElement.textContent = 'Nenhuma';
        }
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

    toggleBtn.addEventListener('click', () => {
        const isHidden = todoDetails.style.display === 'none';
        todoDetails.style.display = isHidden ? 'block' : 'none';
        toggleBtn.textContent = isHidden ? '－' : '＋';
    });

    document.getElementById('searchInput').addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            const query = e.target.value.trim();
            if (query) {
                // Check if it's a URL
                if (query.includes('.') && !query.includes(' ')) {
                    let url = query;
                    if (!url.startsWith('http://') && !url.startsWith('https://')) {
                        url = 'https://' + url; // Prepend https:// if missing
                    }
                    window.open(url, '_blank');
                } else {
                    window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
                }
            }
        }
    });

    // Bloqueio de scroll
    document.body.style.overflow = 'hidden';
    window.addEventListener('scroll', () => window.scrollTo(0, 0));

    // --- Inicialização ---
    loadTasks();
    setInterval(updateTaskPreview, 60000); // Atualiza o preview a cada minuto

    // Expondo `clearAll` para o HTML (se ainda for usado)
    window.clearAll = function(period) {
        const list = document.getElementById(`todo${capitalize(period)}`);
        list.innerHTML = '';
        saveTasks();
        updateTaskPreview();
    };
});