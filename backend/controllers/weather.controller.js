/**
 * ========================================
 * АУА РАЙЫ КОНТРОЛЛЕРІ / WEATHER CONTROLLER
 * ========================================
 * 
 * МАҚСАТЫ: Open-Meteo API арқылы Алматының ауа райын алу
 * 
 * ФУНКЦИЯЛАРЫ:
 * - fetchWeatherFromAPI()      - Open-Meteo API-дан деректер алу
 * - interpretWeatherCode()     - Ауа райы кодын түсіндіру (0-99)
 * - getWeatherRecommendation() - Температураға қарай кеңес беру
 * - getCurrentWeather()        - Қазіргі ауа райын қайтару (кэштеумен)
 * 
 * КЭШТЕУ: 5 минут (бос-бостан API-ға сұрау жібермейміз)
 * API: https://open-meteo.com (ТЕГІН, token қажет емес)
 */

const https = require('https');

// Алматының координаттары
const ALMATY_LAT = 43.2380;
const ALMATY_LON = 76.9490;

// Ауа райы кэші (5 минутқа сақталады)
let weatherCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 минут миллисекундпен

/**
 * Open-Meteo API-дан ауа райын алу
 * @param {number} latitude - Ендік координаты
 * @param {number} longitude - Бойлық координаты
 * @returns {Promise} - API жауабы
 */
function fetchWeatherFromAPI(latitude, longitude) {
    return new Promise((resolve, reject) => {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,weather_code,wind_speed_10m,wind_direction_10m&timezone=Asia/Almaty&forecast_days=1`;
        
        https.get(url, (response) => {
            let data = '';
            
            // Деректерді бөліктермен жинау
            response.on('data', (chunk) => {
                data += chunk;
            });
            
            // Барлық деректер алынғанда
            response.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve(parsed);
                } catch (error) {
                    reject(new Error('Ауа райы деректерін парсинг қатесі'));
                }
            });
        }).on('error', (error) => {
            reject(error);
        });
    });
}

/**
 * Ауа райы кодын түсіндіру (WMO коды)
 * @param {number} code - 0-ден 99-ға дейін код
 * @returns {Object} - Үш тілде сипаттама және иконка
 */
function interpretWeatherCode(code) {
    const codes = {
        0: { kk: "Ашық аспан", ru: "Ясно", en: "Clear sky", icon: "☀️" },
        1: { kk: "Негізінен ашық", ru: "В основном ясно", en: "Mainly clear", icon: "🌤️" },
        2: { kk: "Ішінара бұлтты", ru: "Переменная облачность", en: "Partly cloudy", icon: "⛅" },
        3: { kk: "Бұлтты", ru: "Облачно", en: "Overcast", icon: "☁️" },
        45: { kk: "Тұман", ru: "Туман", en: "Fog", icon: "🌫️" },
        48: { kk: "Қырау тұманы", ru: "Изморозь", en: "Rime fog", icon: "🌫️" },
        51: { kk: "Жеңіл қоңыр жаңбыр", ru: "Легкая морось", en: "Light drizzle", icon: "🌦️" },
        53: { kk: "Орташа қоңыр жаңбыр", ru: "Умеренная морось", en: "Moderate drizzle", icon: "🌦️" },
        55: { kk: "Күшті қоңыр жаңбыр", ru: "Густая морось", en: "Dense drizzle", icon: "🌧️" },
        61: { kk: "Жеңіл жаңбыр", ru: "Слабый дождь", en: "Slight rain", icon: "🌧️" },
        63: { kk: "Орташа жаңбыр", ru: "Умеренный дождь", en: "Moderate rain", icon: "🌧️" },
        65: { kk: "Күшті жаңбыр", ru: "Сильный дождь", en: "Heavy rain", icon: "⛈️" },
        71: { kk: "Жеңіл қар", ru: "Слабый снег", en: "Slight snow", icon: "🌨️" },
        73: { kk: "Орташа қар", ru: "Умеренный снег", en: "Moderate snow", icon: "🌨️" },
        75: { kk: "Күшті қар", ru: "Сильный снег", en: "Heavy snow", icon: "❄️" },
        95: { kk: "Найзағай", ru: "Гроза", en: "Thunderstorm", icon: "⛈️" }
    };
    
    return codes[code] || { kk: "Белгісіз", ru: "Неизвестно", en: "Unknown", icon: "🌍" };
}

/**
 * Рекомендация по погоде
 */
function getWeatherRecommendation(temp, weatherCode) {
    const weather = interpretWeatherCode(weatherCode);
    
    if (temp > 25) {
        return {
            kk: `${weather.icon} Ыстық ауа! БАО немесе Шымбұлаққа баруға тамаша күн.`,
            ru: `${weather.icon} Жаркая погода! Отличный день для БАО или Шымбулака.`,
            en: `${weather.icon} Hot weather! Perfect day for BAO or Shymbulak.`
        };
    } else if (temp > 15) {
        return {
            kk: `${weather.icon} Жылы ауа! Көктөбеге немесе парктерге баруға жарайды.`,
            ru: `${weather.icon} Теплая погода! Отлично для Кок-Тобе или парков.`,
            en: `${weather.icon} Warm weather! Great for Kok-Tobe or parks.`
        };
    } else if (temp > 5) {
        return {
            kk: `${weather.icon} Салқын ауа. Қала ішіндегі орындар жақсы.`,
            ru: `${weather.icon} Прохладно. Лучше посетить места в городе.`,
            en: `${weather.icon} Cool weather. Better to visit city places.`
        };
    } else if (temp > -5) {
        return {
            kk: `${weather.icon} Суық. Медеуге баруға жарайды!`,
            ru: `${weather.icon} Холодно. Отлично для Медео!`,
            en: `${weather.icon} Cold. Perfect for Medeu!`
        };
    } else {
        return {
            kk: `${weather.icon} Өте суық! ТРЦ немесе жылы орындарға баруды ұсынамыз.`,
            ru: `${weather.icon} Очень холодно! Рекомендуем ТРЦ или теплые места.`,
            en: `${weather.icon} Very cold! We recommend malls or warm places.`
        };
    }
}

/**
 * GET /api/weather - Получить текущую погоду
 */
exports.getCurrentWeather = async (req, res) => {
    try {
        // Проверка кэша
        if (weatherCache && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
            console.log('📦 Используем кэш погоды');
            return res.json(weatherCache);
        }
        
        // Получаем данные из API
        const weatherData = await fetchWeatherFromAPI(ALMATY_LAT, ALMATY_LON);
        
        const current = weatherData.current;
        const weatherInterpretation = interpretWeatherCode(current.weather_code);
        const recommendation = getWeatherRecommendation(current.temperature_2m, current.weather_code);
        
        const response = {
            success: true,
            location: {
                city_kk: "Алматы",
                city_ru: "Алматы",
                city_en: "Almaty",
                latitude: ALMATY_LAT,
                longitude: ALMATY_LON
            },
            current: {
                temperature: Math.round(current.temperature_2m),
                feels_like: Math.round(current.apparent_temperature),
                humidity: current.relative_humidity_2m,
                wind_speed: Math.round(current.wind_speed_10m),
                wind_direction: current.wind_direction_10m,
                precipitation: current.precipitation,
                is_day: current.is_day === 1,
                weather: weatherInterpretation,
                icon: weatherInterpretation.icon
            },
            recommendation: recommendation,
            timestamp: new Date().toISOString()
        };
        
        // Кэшируем ответ
        weatherCache = response;
        cacheTimestamp = Date.now();
        
        res.json(response);
    } catch (error) {
        console.error('Weather API Error:', error);
        res.status(500).json({
            success: false,
            error: 'Не удалось получить данные о погоде',
            message: error.message
        });
    }
};

/**
 * GET /api/weather/forecast - Получить прогноз погоды
 */
exports.getForecast = async (req, res) => {
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${ALMATY_LAT}&longitude=${ALMATY_LON}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code&timezone=Asia/Almaty&forecast_days=7`;
        
        const forecastData = await new Promise((resolve, reject) => {
            https.get(url, (response) => {
                let data = '';
                response.on('data', (chunk) => { data += chunk; });
                response.on('end', () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch (error) {
                        reject(error);
                    }
                });
            }).on('error', reject);
        });
        
        const daily = forecastData.daily;
        const forecast = daily.time.map((date, index) => ({
            date: date,
            temperature_max: Math.round(daily.temperature_2m_max[index]),
            temperature_min: Math.round(daily.temperature_2m_min[index]),
            precipitation: daily.precipitation_sum[index],
            weather: interpretWeatherCode(daily.weather_code[index])
        }));
        
        res.json({
            success: true,
            location: "Almaty",
            forecast: forecast
        });
    } catch (error) {
        console.error('Forecast API Error:', error);
        res.status(500).json({
            success: false,
            error: 'Не удалось получить прогноз погоды'
        });
    }
};

/**
 * GET /api/weather/location/:lat/:lon - Получить погоду по координатам
 */
exports.getWeatherByLocation = async (req, res) => {
    try {
        const { lat, lon } = req.params;
        
        const weatherData = await fetchWeatherFromAPI(parseFloat(lat), parseFloat(lon));
        const current = weatherData.current;
        const weatherInterpretation = interpretWeatherCode(current.weather_code);
        
        res.json({
            success: true,
            location: {
                latitude: parseFloat(lat),
                longitude: parseFloat(lon)
            },
            current: {
                temperature: Math.round(current.temperature_2m),
                feels_like: Math.round(current.apparent_temperature),
                humidity: current.relative_humidity_2m,
                wind_speed: Math.round(current.wind_speed_10m),
                weather: weatherInterpretation,
                icon: weatherInterpretation.icon
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Weather by location error:', error);
        res.status(500).json({
            success: false,
            error: 'Не удалось получить погоду для указанных координат'
        });
    }
};
