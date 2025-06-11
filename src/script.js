document.addEventListener('DOMContentLoaded', () => {
  const clockElement = document.getElementById('clock');
  const dateElement = document.querySelector('.date');
  const cityEl = document.querySelector('.city');
  const weatherIcon = document.getElementById('weatherIcon');
  const tempEl = document.querySelector('.temp');
  const descEl = document.querySelector('.desc');
  const minmaxEl = document.querySelector('.minmax');

  const capitalize = str => str.charAt(0).toUpperCase() + str.slice(1);

  function updateClockAndDate() {
    const now = new Date();
    clockElement.textContent = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    dateElement.textContent = capitalize(
      now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
    );
  }
  setInterval(updateClockAndDate, 1000);
  updateClockAndDate();

  function updateWeatherTheme(weatherCondition) {
    const body = document.body;
    const clouds = document.querySelectorAll('.cloud');
    body.className = '';
    body.classList.add(`weather-${weatherCondition}`);

    clouds.forEach(cloud => {
      cloud.querySelectorAll('.rain-drop').forEach(drop => drop.remove());
    });

    if (weatherCondition === 'rain') {
      clouds.forEach(cloud => {
        const numberOfDrops = 30;
        for (let i = 0; i < numberOfDrops; i++) {
          const rainDrop = document.createElement('div');
          rainDrop.classList.add('rain-drop');
          rainDrop.style.left = `${Math.random() * 100}%`;
          rainDrop.style.animationDelay = `${Math.random() * 3}s`;
          rainDrop.style.animationDuration = `${5 + Math.random() * 5}s`;
          cloud.appendChild(rainDrop);
        }
      });
    }
  }

  function fetchWeatherByCoords(lat, lon) {
    const apiKey = '6b2e9835bf99ae05ed4e3fe8b2fdf128';
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=pt_br`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data.cod !== 200) throw new Error(data.message);

        const { icon, description, id } = data.weather[0];
        const now = new Date();
        const nowSeconds = now.getTime() / 1000;
        const isNightTime = nowSeconds > data.sys.sunset || nowSeconds < data.sys.sunrise;

        weatherIcon.src = `https://openweathermap.org/img/wn/${icon}@2x.png`;
        weatherIcon.alt = description;
        tempEl.textContent = `${Math.round(data.main.temp)}°C`;
        descEl.textContent = capitalize(description);
        minmaxEl.textContent = `Mín: ${Math.round(data.main.temp_min)}° / Máx: ${Math.round(data.main.temp_max)}°`;
        cityEl.textContent = data.name;

        let weatherCondition = 'clear';
        if (isNightTime) weatherCondition = 'night';
        else if (id >= 200 && id < 300) weatherCondition = 'thunderstorm';
        else if (id >= 300 && id < 600) weatherCondition = 'rain';
        else if (id >= 600 && id < 700) weatherCondition = 'snow';
        else if (id >= 700 && id < 800) weatherCondition = 'mist';
        else if (id === 800) weatherCondition = 'clear';
        else if (id <= 802) weatherCondition = 'partly-cloudy';
        else weatherCondition = 'cloudy';

        updateWeatherTheme(weatherCondition);
      })
      .catch(err => {
        console.error("Erro ao buscar dados do tempo:", err);
        tempEl.textContent = '--';
        descEl.textContent = 'Erro ao carregar';
        minmaxEl.textContent = '';
        weatherIcon.src = '';
        cityEl.textContent = 'Localização indisponível';
        updateWeatherTheme('clear');
      });
  }

  function getUserLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => fetchWeatherByCoords(coords.latitude, coords.longitude),
        () => {
          cityEl.textContent = 'Localização não permitida. Exibindo tempo para Natal.';
          fetchWeatherByCoords(-5.79448, -35.211);
        }
      );
    } else {
      cityEl.textContent = 'Geolocalização não suportada. Exibindo tempo para Natal.';
      fetchWeatherByCoords(-5.79448, -35.211);
    }
  }
  getUserLocation();

  function aplicarEfeitoGlow(botao) {
    if (!botao.classList.contains('glow-button')) {
      botao.classList.add('glow-button');
    }
  }

  function handleBotaoClick(botao) {
    stopTimer();
    botao.classList.remove('glow-button');
    console.log('Brilho removido manualmente por clique.');
  }

  document.querySelectorAll('#clockIcons button').forEach(button => {
    button.addEventListener('click', () => handleBotaoClick(button));
  });
});

// Inicia contador de tempo ao abrir a página
// Variáveis globais para controle do timer
window.seconds = 0;
window.timerId = null;

// Função para aplicar efeito glow (brilho) no botão
function aplicarEfeitoGlow(botao) {
  if (!botao.classList.contains('glow-button')) {
    botao.classList.add('glow-button');
  }
}

// Função para parar o timer
function stopTimer() {
  if (window.timerId !== null) {
    clearInterval(window.timerId);
    window.timerId = null;
    console.log('Timer parado.');
  }
}

// Função para iniciar o timer
function startTimer() {
  if (window.timerId === null) {
    window.timerId = setInterval(() => {
      window.seconds++;

      const pausas = [
        { tipo: 'pausa', segundos: 30 * 60 },
        { tipo: 'agua', segundos: 45 * 60 },
        { tipo: 'alongar', segundos: 60 * 60 }
      ];

      pausas.forEach(({ tipo, segundos }) => {
        if (window.seconds === segundos) {
          const botao = document.querySelector(`#clockIcons button[aria-label="${tipo}"]`);
          console.log('Buscando botão para tipo:', tipo, 'Resultado:', botao);
          if (botao) aplicarEfeitoGlow(botao);
        }
      });
    }, 1000);
    console.log('Timer iniciado.');
  }
}

// Função executada ao clicar no botão
function handleBotaoClick(botao) {
  stopTimer(); // Para o timer
  botao.classList.remove('glow-button'); // Remove brilho do botão clicado
  console.log('Brilho removido manualmente por clique e timer parado.');
}

document.addEventListener('DOMContentLoaded', () => {
  // Seu código de relógio, clima, etc, aqui...

  // Eventos para os botões
  document.querySelectorAll('#clockIcons button').forEach(button => {
    button.addEventListener('click', () => handleBotaoClick(button));
  });

  // Inicia o timer ao carregar a página
  startTimer();
});
