/**
 * ========================================
 * FRONTEND ҮШІН API КОНФИГУРАЦИЯСЫ
 * ========================================
 * Бұл скриптті HTML файлда басқа JS файлдардан бұрын қосыңыз
 * 
 * МАҚСАТЫ: Backend серверімен байланысу үшін қарапайым интерфейс
 * ҚОЛДАНЫЛУЫ: Барлық API сұрауларын TravelMapAPI объектісі арқылы жасаңыз
 */

// API Конфигурациясы
const API_CONFIG = {
    BASE_URL: 'http://localhost:3000',      // Backend сервердің адресі
    API_VERSION: 'v1',                       // API нұсқасы
    
    // Эндпоинттар (API мекенжайлары)
    PLACES: '/api/places',     // Орындар API
    WEATHER: '/api/weather',   // Ауа райы API
    MAP: '/api/map',           // Карта API
    CHAT: '/api/chat',         // Чатбот API
    AUTH: '/api/auth',         // Аутентификация API
    
    // Күту баптаулары
    TIMEOUT: 10000,            // 10 секунд (сұраудың максималды уақыты)
    
    // Кэштеу баптаулары
    CACHE_DURATION: 5 * 60 * 1000  // 5 минут (деректерді қанша уақыт сақтау)
};

/**
 * API сұраулары үшін әмбебап функция
 * 
 * @param {string} endpoint - API эндпоинтінің мекенжайы
 * @param {Object} options - Қосымша баптаулар (method, body, headers)
 * @returns {Promise} - Сервердің жауабы (JSON форматында)
 * 
 * ҚАЛАЙ ЖҰМЫС ІСТЕЙДІ:
 * 1. URL мекенжайын құрастырады
 * 2. Authorization токенін қосады (егер бар болса)
 * 3. fetch() арқылы серверге сұрау жібереді
 * 4. JSON жауапты қайтарады немесе қатені лақтырады
 */
async function apiRequest(endpoint, options = {}) {
    // Толық URL мекенжайын құрастыру
    const url = endpoint.startsWith('http') ? endpoint : `${API_CONFIG.BASE_URL}${endpoint}`;
    
    // Әдепкі баптаулар
    const defaultOptions = {
        method: 'GET',           // Әдепкі HTTP әдісі
        headers: {
            'Content-Type': 'application/json'  // JSON форматында деректер жібереміз
        },
        timeout: API_CONFIG.TIMEOUT
    };
    
    // Токенді қосу (егер пайдаланушы кірген болса)
    const token = localStorage.getItem('auth_token');
    if (token) {
        defaultOptions.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Баптауларды біріктіру
    const config = { ...defaultOptions, ...options };
    
    // Body деректерін JSON форматына түрлендіру
    if (config.body && typeof config.body === 'object') {
        config.body = JSON.stringify(config.body);
    }
    
    try {
        // Серверге сұрау жіберу
        const response = await fetch(url, config);
        const data = await response.json();
        
        // Қате болса, exception лақтыру
        if (!response.ok) {
            throw new Error(data.error || 'API сұрауы сәтсіз аяқталды');
        }
        
        return data;
    } catch (error) {
        console.error('API сұрау қатесі:', error);
        throw error;
    }
}

/**
 * ТRAVELMAP API - НЕГІЗГІ ИНТЕРФЕЙС
 * =====================================
 * Бұл объект барлық API функцияларын қамтиды
 * Әр категория бойынша функциялар топтастырылған
 */
const TravelMapAPI = {
    // ========== ОРЫНДАР (PLACES) ==========
    // Алматының демалыс орындарымен жұмыс істеу
    places: {
        /**
         * Барлық орындарды алу
         * @param {Object} filters - Сүзгілер (rating, category, т.б.)
         * @example TravelMapAPI.places.getAll({ category: 'nature' })
         */
        getAll: (filters = {}) => {
            const params = new URLSearchParams(filters);
            return apiRequest(`${API_CONFIG.PLACES}?${params}`);
        },
        
        /**
         * Белгілі ID бойынша орынды алу
         * @param {number} id - Орынның ID нөмірі
         * @example TravelMapAPI.places.getById(1) // Медеуді алу
         */
        getById: (id) => {
            return apiRequest(`${API_CONFIG.PLACES}/${id}`);
        },
        
        /**
         * Орындарды іздеу
         * @param {string} query - Іздеу сөзі
         * @example TravelMapAPI.places.search("Көктөбе")
         */
        search: (query) => {
            return apiRequest(`${API_CONFIG.PLACES}/search?q=${encodeURIComponent(query)}`);
        },
        
        /**
         * Категория бойынша орындарды алу
         * @param {string} category - Категория атауы
         * @example TravelMapAPI.places.getByCategory("nature")
         */
        getByCategory: (category) => {
            return apiRequest(`${API_CONFIG.PLACES}/category/${category}`);
        }
    },
    
    // ========== АУА РАЙЫ (WEATHER) ==========
    // Open-Meteo API арқылы метеодеректер
    weather: {
        /**
         * Қазіргі ауа райын алу
         * @returns Температура, ылғалдылық, жел деректері
         * @example TravelMapAPI.weather.getCurrent()
         */
        getCurrent: () => {
            return apiRequest(API_CONFIG.WEATHER);
        },
        
        /**
         * Ауа райы болжамын алу
         * @returns Алдағы күндердің ауа райы
         * @example TravelMapAPI.weather.getForecast()
         */
        getForecast: () => {
            return apiRequest(`${API_CONFIG.WEATHER}/forecast`);
        },
        
        /**
         * Координаттар бойынша ауа райын алу
         * @param {number} lat - Ендік (latitude)
         * @param {number} lon - Бойлық (longitude)
         * @example TravelMapAPI.weather.getByLocation(43.238949, 76.889709)
         */
        getByLocation: (lat, lon) => {
            return apiRequest(`${API_CONFIG.WEATHER}/location/${lat}/${lon}`);
        }
    },
    
    // ========== КАРТА (MAP) ==========
    // Leaflet картасымен жұмыс істеу
    map: {
        /**
         * Барлық маркерлерді алу
         * @returns Картадағы барлық орындардың маркерлері
         * @example TravelMapAPI.map.getMarkers()
         */
        getMarkers: () => {
            return apiRequest(`${API_CONFIG.MAP}/markers`);
        },
        
        /**
         * ID бойынша маркерді алу
         * @param {number} id - Маркердің ID нөмірі
         * @example TravelMapAPI.map.getMarkerById(1)
         */
        getMarkerById: (id) => {
            return apiRequest(`${API_CONFIG.MAP}/markers/${id}`);
        },
        
        /**
         * Карта шекараларын алу
         * @returns Барлық маркерлерді қамтитын шекаралар
         * @example TravelMapAPI.map.getBounds()
         */
        getBounds: () => {
            return apiRequest(`${API_CONFIG.MAP}/bounds`);
        },
        
        /**
         * Маршрут құру
         * @param {Object} from - Бастапқы нүкте {lat, lng}
         * @param {Object} to - Соңғы нүкте {lat, lng}
         * @returns Google Maps маршруты
         * @example TravelMapAPI.map.calculateRoute(
         *   {lat: 43.238949, lng: 76.889709},
         *   {lat: 43.222034, lng: 76.851216}
         * )
         */
        calculateRoute: (from, to) => {
            return apiRequest(`${API_CONFIG.MAP}/route`, {
                method: 'POST',
                body: { from, to }
            });
        }
    },
    
    // ========== ЧАТБОТ (CHAT) ==========
    // AI көмекшісімен сөйлесу
    chat: {
        /**
         * Чатботқа хабар жіберу
         * @param {string} message - Пайдаланушының хабары
         * @param {string} language - Тіл коды ('kk' немесе 'ru')
         * @returns Чатботтың жауабы
         * @example TravelMapAPI.chat.sendMessage("Медеуге қалай барамын?", "kk")
         */
        sendMessage: (message, language = 'ru') => {
            return apiRequest(API_CONFIG.CHAT, {
                method: 'POST',
                body: { message, language }
            });
        },
        
        /**
         * Сұрақ үлгілерін алу
         * @param {string} lang - Тіл коды
         * @returns Ұсынылатын сұрақтар тізімі
         * @example TravelMapAPI.chat.getSuggestions('kk')
         */
        getSuggestions: (lang = 'ru') => {
            return apiRequest(`${API_CONFIG.CHAT}/suggestions?lang=${lang}`);
        }
    },
    
    // ========== АУТЕНТИФИКАЦИЯ (AUTH) ==========
    // Пайдаланушыларды тіркеу және кіру
    auth: {
        /**
         * Жаңа пайдаланушыны тіркеу
         * @param {string} username - Логин
         * @param {string} email - Email мекенжайы
         * @param {string} password - Құпия сөз
         * @param {string} full_name - Толық аты-жөні
         * @returns Тіркелген пайдаланушы деректері
         */
        register: (username, email, password, full_name) => {
            return apiRequest(`${API_CONFIG.AUTH}/register`, {
                method: 'POST',
                body: { username, email, password, full_name }
            });
        },
        
        /**
         * Жүйеге кіру
         * @param {string} username - Логин
         * @param {string} password - Құпия сөз
         * @returns Authorization токені
         */
        login: (username, password) => {
            return apiRequest(`${API_CONFIG.AUTH}/login`, {
                method: 'POST',
                body: { username, password }
            });
        },
        
        /**
         * Жүйеден шығу
         * @param {string} token - Authorization токені
         */
        logout: (token) => {
            return apiRequest(`${API_CONFIG.AUTH}/logout`, {
                method: 'POST',
                body: { token }
            });
        },
        
        /**
         * Қазіргі пайдаланушы ақпаратын алу
         * @returns Пайдаланушы профилі
         */
        getCurrentUser: () => {
            return apiRequest(`${API_CONFIG.AUTH}/me`);
        }
    },
    
    // ========== ДЕНСАУЛЫҚ ТЕКСЕРУ (HEALTH CHECK) ==========
    /**
     * Backend серверінің жұмысын тексеру
     * @returns Барлық микросервистердің статусы
     * @example TravelMapAPI.health()
     */
    health: () => {
        return apiRequest('/api/health');
    }
};

// ========================================
// ЭКСПОРТ (Node.js модульдері үшін)
// ========================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { API_CONFIG, TravelMapAPI, apiRequest };
}

console.log('✅ trАvelMap API клиенті сәтті жүктелді');
