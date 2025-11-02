/**
 * ========================================
 * АУА РАЙЫ МИКРОСЕРВИСІ / WEATHER SERVICE
 * ========================================
 * Open-Meteo API интеграциясы (ТЕГІН, API кілті қажет емес!)
 * НЕЗАВИСИМЫЙ МИКРОСЕРВИС - работает изолированно, обрабатывает ошибки
 */

// Флаг состояния сервиса
let weatherServiceActive = true;
let weatherServiceErrors = [];

// Алматының координаттары
const WEATHER_CONFIG = {
    latitude: 43.2220,
    longitude: 76.8512,
    city: 'Almaty',
    timezone: 'Asia/Almaty',
    retryAttempts: 3,
    retryDelay: 2000
};

// Open-Meteo API URL (толықтай ТЕГІН!)
const API_BASE_URL = 'https://api.open-meteo.com/v1/forecast';

/**
 * Ауа райы деректерін алу (Open-Meteo API)
 */
async function getWeatherData(attemptNumber = 1) {
    if (!weatherServiceActive) {
        console.log('⚠️ Weather service is stopped');
        return;
    }

    const weatherPanel = document.getElementById('weather-panel');
    
    if (!weatherPanel) {
        console.error('Weather panel not found!');
        return;
    }

    // Жүктеу индикаторы
    weatherPanel.innerHTML = `
        <div class="weather-loading">
            <div class="spinner">🌤️</div>
            <p>Ауа райын жүктеп жатырмыз... (попытка ${attemptNumber})</p>
        </div>
    `;

    try {
        // Open-Meteo API сұрауы (ТЕГІН, кілт қажет емес!)
        const url = `${API_BASE_URL}?latitude=${WEATHER_CONFIG.latitude}&longitude=${WEATHER_CONFIG.longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&timezone=${WEATHER_CONFIG.timezone}`;
        
        const response = await fetch(url, {
            timeout: 5000
        });
        
        if (!response.ok) {
            throw new Error(`API қатесі: ${response.status}`);
        }

        const data = await response.json();
        
        // Очищаем ошибки при успешном запросе
        weatherServiceErrors = [];
        
        // Деректерді көрсету
        displayWeatherData(data);
        
        console.log('✅ Ауа райы жүктелді:', data);

    } catch (error) {
        console.error('Ауа райын жүктеу қатесі:', error);
        
        // Сохраняем ошибку
        weatherServiceErrors.push({
            time: new Date(),
            message: error.message
        });
        
        // Повторная попытка
        if (attemptNumber < WEATHER_CONFIG.retryAttempts) {
            console.log(`⚠️ Retry attempt ${attemptNumber + 1} in ${WEATHER_CONFIG.retryDelay}ms`);
            setTimeout(() => {
                getWeatherData(attemptNumber + 1);
            }, WEATHER_CONFIG.retryDelay);
        } else {
            showWeatherError('😞 Ауа райын жүктеу мүмкін болмады. Интернет байланысын тексеріңіз. Сервис продолжает работать в фоновом режиме.');
        }
    }
}

/**
 * Ауа райы деректерін көрсету (Open-Meteo форматы)
 */
function displayWeatherData(data) {
    const weatherPanel = document.getElementById('weather-panel');
    
    // Ауа райы мәліметтері
    const current = data.current;
    const temp = Math.round(current.temperature_2m);
    const humidity = current.relative_humidity_2m;
    const windSpeed = Math.round(current.wind_speed_10m);
    const weatherCode = current.weather_code;
    
    // Ауа райы сипаттамасы мен иконкасы
    const { description, icon } = getWeatherDescription(weatherCode);

    weatherPanel.innerHTML = `
        <div class="weather-item main-weather">
            <div class="weather-icon">${icon}</div>
            <div class="weather-info">
                <div class="weather-value">${temp}°C</div>
                <div class="weather-label">${description}</div>
            </div>
        </div>
        
        <div class="weather-item">
            <div class="weather-icon">🌡️</div>
            <div class="weather-info">
                <div class="weather-value">${temp}°</div>
                <div class="weather-label">Температура</div>
            </div>
        </div>
        
        <div class="weather-item">
            <div class="weather-icon">💧</div>
            <div class="weather-info">
                <div class="weather-value">${humidity}%</div>
                <div class="weather-label">Ылғалдылық</div>
            </div>
        </div>
        
        <div class="weather-item">
            <div class="weather-icon">💨</div>
            <div class="weather-info">
                <div class="weather-value">${windSpeed} м/с</div>
                <div class="weather-label">Жел</div>
            </div>
        </div>
    `;

    // Ауа райына байланысты кеңес беру
    provideWeatherAdvice(temp, description);
}

/**
 * WMO Weather Code-тан сипаттама алу
 */
function getWeatherDescription(code) {
    const weatherCodes = {
        0: { description: 'Ашық аспан', icon: '☀️' },
        1: { description: 'Негізінен ашық', icon: '🌤️' },
        2: { description: 'Ішінара бұлтты', icon: '⛅' },
        3: { description: 'Бұлтты', icon: '☁️' },
        45: { description: 'Тұман', icon: '�️' },
        48: { description: 'Қырау түсіп тұр', icon: '🌫️' },
        51: { description: 'Жеңіл жаңбыр', icon: '🌦️' },
        53: { description: 'Орташа жаңбыр', icon: '🌧️' },
        55: { description: 'Қатты жаңбыр', icon: '🌧️' },
        61: { description: 'Жеңіл жаңбыр', icon: '🌧️' },
        63: { description: 'Орташа жаңбыр', icon: '🌧️' },
        65: { description: 'Қатты жаңбыр', icon: '⛈️' },
        71: { description: 'Жеңіл қар', icon: '�️' },
        73: { description: 'Орташа қар', icon: '❄️' },
        75: { description: 'Қатты қар', icon: '❄️' },
        77: { description: 'Қар дәндері', icon: '❄️' },
        80: { description: 'Жаңбыр жауын', icon: '�️' },
        81: { description: 'Жаңбыр жауын', icon: '⛈️' },
        82: { description: 'Қатты жаңбыр', icon: '⛈️' },
        85: { description: 'Қар жауын', icon: '�️' },
        86: { description: 'Қатты қар жауын', icon: '❄️' },
        95: { description: 'Найзағай', icon: '⛈️' },
        96: { description: 'Найзағай және бұршақ', icon: '⛈️' },
        99: { description: 'Найзағай және қатты бұршақ', icon: '⛈️' }
    };

    return weatherCodes[code] || { description: 'Белгісіз', icon: '🌤️' };
}

/**
 * Ауа райына байланысты кеңес беру
 */
function provideWeatherAdvice(temp, description) {
    let advice = '';

    if (temp > 30) {
        advice = '🔥 Ауа ыстық! Су ішіп, көлеңкеде болыңыз. Медеу немесе БАО-ға барыңыз - онда салқын.';
    } else if (temp > 20) {
        advice = '☀️ Керемет ауа! Көктөбе немесе паркке серуендеуге тамаша уақыт!';
    } else if (temp > 10) {
        advice = '🍂 Салқын ауа. Жылы киініңіз! Сауда орталығына немесе Көктөбеге барыңыз.';
    } else if (temp > 0) {
        advice = '🧥 Суық ауа! Жылы киім киіңіз. Медеуде коньки тебуге болады!';
    } else {
        advice = '❄️ Өте суық! Жылы киініп, Медеу немесе Шымбұлаққа барыңыз - онда қыста тамаша!';
    }

    if (description.includes('дождь') || description.includes('rain')) {
        advice += ' 🌧️ Жаңбыр жауып тұр - көлеңкені алып жүріңіз!';
    } else if (description.includes('снег') || description.includes('snow')) {
        advice += ' ❄️ Қар жауып тұр - шаңғы тебуге керемет уақыт!';
    }

    // Чатботқа кеңесті жіберу
    if (typeof addMessage === 'function') {
        setTimeout(() => {
            addMessage(advice, 'bot');
        }, 500);
    }
}

/**
 * Ауа райы қатесін көрсету
 */
function showWeatherError(message) {
    const weatherPanel = document.getElementById('weather-panel');
    
    weatherPanel.innerHTML = `
        <div class="weather-error">
            <div class="error-icon">⚠️</div>
            <p>${message}</p>
        </div>
    `;
}

/**
 * 5 күнлік болжамды алу (қосымша функция)
 */
async function getForecast() {
    try {
        const url = `${API_BASE_URL}?latitude=${WEATHER_CONFIG.latitude}&longitude=${WEATHER_CONFIG.longitude}&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=${WEATHER_CONFIG.timezone}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`API қатесі: ${response.status}`);
        }

        const data = await response.json();
        return data;

    } catch (error) {
        console.error('Болжамды жүктеу қатесі:', error);
        return null;
    }
}

/**
 * Ауа райы стильдері
 */
const weatherStyles = document.createElement('style');
weatherStyles.textContent = `
    .weather-loading {
        text-align: center;
        padding: 2rem;
    }

    .spinner {
        font-size: 3rem;
        animation: spin 2s linear infinite;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    .weather-error {
        text-align: center;
        padding: 2rem;
        color: var(--gray-text);
    }

    .error-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
    }

    .weather-item.main-weather {
        grid-column: 1 / -1;
    }

    .main-weather .weather-info {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .main-weather .weather-value {
        font-size: 3rem !important;
    }

    .weather-info {
        text-align: center;
    }

    @media (max-width: 768px) {
        .weather-panel {
            flex-direction: column;
            gap: 1rem;
        }

        .weather-item.main-weather {
            grid-column: auto;
        }
    }
`;
document.head.appendChild(weatherStyles);

// Ауа райын автоматты түрде жүктеу
document.addEventListener('DOMContentLoaded', () => {
    // Бет жүктелгенде ауа райын алу
    setTimeout(() => {
        getWeatherData();
    }, 1000);
});

// Export (басқа модульдер үшін)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getWeatherData,
        getForecast,
        WEATHER_CONFIG
    };
}
