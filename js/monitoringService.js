/**
 * ========================================
 * MONITORING SERVICE - Микросервистерді бақылау
 * ========================================
 * Барлық сервистерді бақылаудың тәуелсіз жүйесі
 */

// Микросервистердің конфигурациясы
const servicesConfig = {
    places: {
        id: 'places',
        name: 'Орындар сервисі',
        icon: 'fa-location-dot',
        description: 'Орындарды басқару сервисі',
        port: 3001,
        endpoint: '/api/places',
        healthCheck: () => true // Реалды тексеріс үшін API call жасау керек
    },
    weather: {
        id: 'weather',
        name: 'Ауа райы сервисі',
        icon: 'fa-cloud-sun',
        description: 'Ауа райы сервисі',
        port: 3002,
        endpoint: '/api/weather',
        healthCheck: () => true
    },
    map: {
        id: 'map',
        name: 'Карта сервисі',
        icon: 'fa-map',
        description: 'Картография сервисі',
        port: 3003,
        endpoint: '/api/map',
        healthCheck: () => true
    },
    chat: {
        id: 'chat',
        name: 'Чат сервисі',
        icon: 'fa-comments',
        description: 'Чат-бот сервисі',
        port: 3004,
        endpoint: '/api/chat',
        healthCheck: () => true
    }
};

// Сервистердің күйі
let servicesState = {};

// Күйді инициализациялау
function initServicesState() {
    Object.keys(servicesConfig).forEach(serviceId => {
        servicesState[serviceId] = {
            status: 'inactive', // active, inactive, error
            startTime: null,
            lastCheck: null,
            errors: [],
            logs: [],
            requestCount: 0,
            responseTime: 0,
            cpu: 0,
            memory: 0
        };
    });
    
    // LocalStorage-тан күйді жүктеу
    const savedState = localStorage.getItem('monitoring_services_state');
    if (savedState) {
        try {
            const parsed = JSON.parse(savedState);
            Object.keys(parsed).forEach(serviceId => {
                if (servicesState[serviceId]) {
                    servicesState[serviceId].status = parsed[serviceId].status || 'inactive';
                    if (parsed[serviceId].status === 'active') {
                        servicesState[serviceId].startTime = new Date(parsed[serviceId].startTime);
                    }
                }
            });
        } catch (e) {
            console.error('Күйді жүктеу қатесі:', e);
        }
    }
}

/**
 * Сервистің денсаулығын тексеру
 */
function checkServiceHealth(serviceId) {
    const config = servicesConfig[serviceId];
    const state = servicesState[serviceId];
    
    try {
        state.lastCheck = new Date();
        
        if (state.status === 'active') {
            // Симуляция метрик
            state.requestCount += Math.floor(Math.random() * 10);
            state.responseTime = Math.floor(Math.random() * 100) + 50;
            state.cpu = Math.floor(Math.random() * 30) + 10;
            state.memory = Math.floor(Math.random() * 200) + 100;
            
            // Випадкові логи для активних сервісів
            if (Math.random() > 0.7) {
                const messages = [
                    'Сұраныс өңделді',
                    'Кэш жаңартылды',
                    'Деректер синхронизацияланды',
                    'Денсаулық тексерісі өтті'
                ];
                addServiceLog(serviceId, messages[Math.floor(Math.random() * messages.length)], 'info');
            }
            
            return 'active';
        } else if (state.status === 'error') {
            return 'error';
        }
        
        return 'inactive';
    } catch (error) {
        state.status = 'error';
        state.errors.push({
            time: new Date(),
            message: error.message
        });
        addServiceLog(serviceId, `Қате: ${error.message}`, 'error');
        return 'error';
    }
}

/**
 * Сервисті іске қосу
 */
function startService(serviceId) {
    const config = servicesConfig[serviceId];
    const state = servicesState[serviceId];
    
    if (state.status === 'active') {
        addServiceLog(serviceId, 'Сервис қазірдің өзінде жұмыс істеп тұр', 'info');
        return;
    }
    
    try {
        addServiceLog(serviceId, '🚀 Сервисті іске қосу...', 'info');
        
        // Симуляция іске қосуды
        setTimeout(() => {
            state.status = 'active';
            state.startTime = new Date();
            state.lastCheck = new Date();
            state.errors = [];
            state.requestCount = 0;
            state.responseTime = 0;
            state.cpu = Math.floor(Math.random() * 20) + 5;
            state.memory = Math.floor(Math.random() * 150) + 50;
            
            addServiceLog(serviceId, `✅ Сервис сәтті іске қосылды (Port: ${config.port})`, 'success');
            addServiceLog(serviceId, `📍 Endpoint: ${config.endpoint}`, 'info');
            addServiceLog(serviceId, '🔄 Денсаулық тексерісі белсендірілді', 'info');
            
            saveServicesState();
            updateUI();
        }, 500);
        
        updateUI();
        
    } catch (error) {
        state.status = 'error';
        state.errors.push({
            time: new Date(),
            message: error.message
        });
        addServiceLog(serviceId, `❌ Іске қосу сәтсіз: ${error.message}`, 'error');
        updateUI();
    }
}

/**
 * Сервисті тоқтату
 */
function stopService(serviceId) {
    const state = servicesState[serviceId];
    
    if (state.status === 'inactive') {
        addServiceLog(serviceId, 'Сервис қазірдің өзінде тоқтатылған', 'info');
        return;
    }
    
    try {
        addServiceLog(serviceId, '⏸️ Сервисті тоқтату...', 'info');
        
        state.status = 'inactive';
        state.startTime = null;
        state.cpu = 0;
        state.memory = 0;
        
        addServiceLog(serviceId, '✅ Сервис тоқтатылды', 'success');
        
        saveServicesState();
        updateUI();
        
    } catch (error) {
        addServiceLog(serviceId, `❌ Тоқтату кезінде қате: ${error.message}`, 'error');
        updateUI();
    }
}

/**
 * Сервисті қайта іске қосу
 */
function restartService(serviceId) {
    addServiceLog(serviceId, '🔄 Сервисті қайта іске қосу...', 'info');
    stopService(serviceId);
    
    setTimeout(() => {
        startService(serviceId);
    }, 1000);
}

/**
 * Күйді сақтау
 */
function saveServicesState() {
    try {
        const stateToSave = {};
        Object.keys(servicesState).forEach(serviceId => {
            stateToSave[serviceId] = {
                status: servicesState[serviceId].status,
                startTime: servicesState[serviceId].startTime
            };
        });
        localStorage.setItem('monitoring_services_state', JSON.stringify(stateToSave));
    } catch (e) {
        console.error('Күйді сақтау қатесі:', e);
    }
}

/**
 * Сервис логын қосу
 */
function addServiceLog(serviceId, message, type = 'info') {
    const state = servicesState[serviceId];
    const timestamp = new Date().toLocaleTimeString();
    
    state.logs.unshift({
        time: timestamp,
        message: message,
        type: type
    });
    
    // Логтар санын шектейміз
    if (state.logs.length > 50) {
        state.logs.pop();
    }
}

/**
 * Барлық сервистерді іске қосу
 */
function startAllServices() {
    Object.keys(servicesConfig).forEach(serviceId => {
        if (servicesState[serviceId].status !== 'active') {
            startService(serviceId);
        }
    });
}

/**
 * Барлық сервистерді тоқтату
 */
function stopAllServices() {
    Object.keys(servicesConfig).forEach(serviceId => {
        if (servicesState[serviceId].status !== 'inactive') {
            stopService(serviceId);
        }
    });
}

/**
 * UI жаңарту
 */
function updateUI() {
    const container = document.getElementById('services-container');
    
    if (!container) return;
    
    container.innerHTML = '';
    
    Object.keys(servicesConfig).forEach(serviceId => {
        const config = servicesConfig[serviceId];
        const state = servicesState[serviceId];
        
        // Сервистің денсаулығын тексереміз
        const currentStatus = checkServiceHealth(serviceId);
        
        const card = document.createElement('div');
        card.className = `service-card ${currentStatus}`;
        
        const uptime = state.startTime ? 
            Math.floor((new Date() - state.startTime) / 1000) : 0;
        
        const statusText = {
            'active': 'Жұмыс істейді',
            'inactive': 'Тоқтатылған',
            'error': 'Қате'
        }[currentStatus];
        
        const statusIcon = {
            'active': 'fa-circle-check',
            'inactive': 'fa-circle-xmark',
            'error': 'fa-triangle-exclamation'
        }[currentStatus];
        
        card.innerHTML = `
            <div class="service-header">
                <div class="service-title">
                    <i class="fa-solid ${config.icon} service-icon"></i>
                    <div>
                        <div class="service-name">${config.name}</div>
                        <div style="font-size: 0.9rem; color: var(--gray-text);">${config.description}</div>
                    </div>
                </div>
                <div class="status-badge ${currentStatus}">
                    <i class="fa-solid ${statusIcon} ${currentStatus === 'active' ? 'pulse' : ''}"></i>
                    ${statusText}
                </div>
            </div>
            
            <div class="service-info">
                <div class="info-row">
                    <span class="info-label">Жұмыс уақыты:</span>
                    <span class="info-value">${formatUptime(uptime)}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Соңғы тексеру:</span>
                    <span class="info-value">${state.lastCheck ? state.lastCheck.toLocaleTimeString() : 'Деректер жоқ'}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Қателер:</span>
                    <span class="info-value" style="color: ${state.errors.length > 0 ? 'var(--danger-color)' : 'var(--success-color)'}">
                        ${state.errors.length}
                    </span>
                </div>
                <div class="info-row">
                    <span class="info-label">Сұраулар:</span>
                    <span class="info-value">${state.requestCount}</span>
                </div>
            </div>
            
            <div class="service-actions">
                <button class="action-btn start" onclick="startService('${serviceId}')" ${currentStatus === 'active' ? 'disabled' : ''}>
                    <i class="fa-solid fa-play"></i>
                    Іске қосу
                </button>
                <button class="action-btn stop" onclick="stopService('${serviceId}')" ${currentStatus === 'inactive' ? 'disabled' : ''}>
                    <i class="fa-solid fa-stop"></i>
                    Тоқтату
                </button>
                <button class="action-btn restart" onclick="restartService('${serviceId}')">
                    <i class="fa-solid fa-rotate"></i>
                    Қайта қосу
                </button>
                <button class="action-btn details" onclick="window.location.href='service-details.html?service=${serviceId}'">
                    <i class="fa-solid fa-chart-line"></i>
                    Деталдар
                </button>
            </div>
            
            <div class="log-section">
                <div class="log-title">
                    <i class="fa-solid fa-file-lines"></i>
                    Соңғы логтар:
                </div>
                ${state.logs.slice(0, 10).map(log => `
                    <div class="log-entry ${log.type}">
                        [${log.time}] ${log.message}
                    </div>
                `).join('')}
            </div>
        `;
        
        container.appendChild(card);
    });
    
    updateStats();
}

/**
 * Статистиканы жаңарту
 */
function updateStats() {
    const activeCount = Object.values(servicesState).filter(s => s.status === 'active').length;
    const inactiveCount = Object.values(servicesState).filter(s => s.status === 'inactive').length;
    const errorCount = Object.values(servicesState).filter(s => s.status === 'error').length;
    
    document.getElementById('active-count').textContent = activeCount;
    document.getElementById('inactive-count').textContent = inactiveCount;
    document.getElementById('error-count').textContent = errorCount;
    
    // Жалпы жұмыс уақыты
    const totalUptime = Object.values(servicesState).reduce((sum, state) => {
        if (state.startTime) {
            return sum + Math.floor((new Date() - state.startTime) / 1000);
        }
        return sum;
    }, 0);
    
    document.getElementById('uptime').textContent = formatUptime(totalUptime);
}

/**
 * Жұмыс уақытын форматтау
 */
function formatUptime(seconds) {
    if (seconds === 0) return '0s';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    const parts = [];
    if (hours > 0) parts.push(`${hours}с`);
    if (minutes > 0) parts.push(`${minutes}м`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}с`);
    
    return parts.join(' ');
}

/**
 * Бақылауды жаңарту
 */
function refreshMonitoring() {
    console.log('🔄 Бақылау деректерін жаңарту...');
    
    Object.keys(servicesConfig).forEach(serviceId => {
        checkServiceHealth(serviceId);
    });
    
    updateUI();
}

/**
 * Барлық сервістерді іске қосу
 */
function startAllServices() {
    console.log('🚀 Барлық сервістерді іске қосу...');
    
    Object.keys(servicesConfig).forEach((serviceId, index) => {
        setTimeout(() => {
            startService(serviceId);
        }, index * 300); // Әр сервисті 300ms аралықпен іске қосу
    });
}

/**
 * Барлық сервістерді тоқтату
 */
function stopAllServices() {
    console.log('⏸️ Барлық сервістерді тоқтату...');
    
    Object.keys(servicesConfig).forEach(serviceId => {
        stopService(serviceId);
    });
}

/**
 * Автоматты жаңарту
 */
function startAutoRefresh() {
    setInterval(() => {
        Object.keys(servicesConfig).forEach(serviceId => {
            if (servicesState[serviceId].status === 'active') {
                checkServiceHealth(serviceId);
            }
        });
        updateUI();
    }, 5000); // Әр 5 секунд сайын
}

/**
 * Бет жүктелгенде инициализация
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Бақылау сервисін іске қосу...');
    
    initServicesState();
    updateUI();
    startAutoRefresh();
    
    // Егер сервістер жоқ болса, олардың бастапқы логтарын қосамыз
    Object.keys(servicesConfig).forEach(serviceId => {
        if (servicesState[serviceId].logs.length === 0) {
            addServiceLog(serviceId, '📋 Сервис конфигурацияланған', 'info');
            addServiceLog(serviceId, `📍 Port: ${servicesConfig[serviceId].port}`, 'info');
            addServiceLog(serviceId, `🔗 Endpoint: ${servicesConfig[serviceId].endpoint}`, 'info');
        }
    });
    
    updateUI();
    
    console.log('✅ Бақылау сервисі іске қосылды');
});
