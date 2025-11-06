/**
 * ========================================
 * TRAVELMAP - НЕГІЗГІ ҚОСЫМША ФАЙЛЫ
 * ========================================
 * 
 * МАҚСАТЫ: Барлық frontend функционалдылығын басқару
 * API БАЙЛАНЫСЫ: api-client.js арқылы backend-пен байланысу
 */

// ========================================
// ГЛОБАЛЬДЫ АЙНЫМАЛЫЛАР
// ========================================

let currentLanguage = 'kk';  // Қазіргі тіл
let allPlaces = [];          // Барлық орындар
let leafletMap = null;       // Leaflet картасы
let mapMarkers = [];         // Карта маркерлері

// ========================================
// БЕТ ЖҮКТЕЛГЕНДЕ ІСКЕ ҚОСЫЛАТЫН КОД
// ========================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('✅ trАvelMap қосымшасы іске қосылды');
    
    // Backend серверін тексеру
    await checkBackendHealth();
    
    // Барлық деректерді жүктеу
    await loadPlaces();
    await loadWeather();
    
    // Картаны инициализациялау
    initMap();
    
    // Event listener-дерді қосу
    initEventListeners();
});

// ========================================
// BACKEND ДЕНСАУЛЫҒЫН ТЕКСЕРУ
// ========================================

async function checkBackendHealth() {
    try {
        const response = await TravelMapAPI.health();
        console.log('✅ Backend сервері жұмыс істеп тұр:', response.services);
    } catch (error) {
        console.error('❌ Backend серверіне қосылу қатесі:', error);
        showNotification('Backend серверіне қосылу мүмкін емес. npm start командасын іске қосыңыз.', 'error');
    }
}

// ========================================
// ОРЫНДАРДЫ ЖҮКТЕУ
// ========================================

async function loadPlaces(filters = {}) {
    const container = document.getElementById('places-container');
    const loading = document.getElementById('places-loading');
    
    // Loading көрсету
    loading.style.display = 'block';
    container.innerHTML = '';
    
    try {
        const response = await TravelMapAPI.places.getAll(filters);
        allPlaces = response.data;
        
        console.log(`✅ ${allPlaces.length} орын жүктелді`);
        
        // Орындарды көрсету
        displayPlaces(allPlaces);
        
    } catch (error) {
        console.error('❌ Орындарды жүктеу қатесі:', error);
        container.innerHTML = '<p class="error-message">Орындарды жүктеу мүмкін болмады</p>';
    } finally {
        loading.style.display = 'none';
    }
}

// ========================================
// ОРЫНДАРДЫ ЭКРАНҒА ШЫҒАРУ
// ========================================

function displayPlaces(places) {
    const container = document.getElementById('places-container');
    
    if (places.length === 0) {
        container.innerHTML = '<p class="no-results">Ешқандай орын табылмады</p>';
        return;
    }
    
    container.innerHTML = places.map(place => `
        <div class="place-card" data-id="${place.id}">
            <div class="place-image" style="background-image: url('${place.image_url}')">
                <span class="place-category">${getCategoryName(place.category)}</span>
                <span class="place-rating">
                    <i class="fa-solid fa-star"></i> ${place.rating}
                </span>
            </div>
            <div class="place-info">
                <h3 class="place-name">${place.name_kk}</h3>
                <p class="place-description">${place.description_kk}</p>
                
                <div class="place-details">
                    <div class="detail-item">
                        <i class="fa-solid fa-clock"></i>
                        <span>${place.details.workingHours.weekdays}</span>
                    </div>
                    <div class="detail-item">
                        <i class="fa-solid fa-money-bill"></i>
                        <span>${place.details.price.min}-${place.details.price.max} ₸</span>
                    </div>
                    <div class="detail-item">
                        <i class="fa-solid fa-eye"></i>
                        <span>${place.visit_count} келген</span>
                    </div>
                </div>
                
                <button class="view-details-btn" onclick="viewPlaceDetails(${place.id})">
                    <i class="fa-solid fa-circle-info"></i> Толығырақ
                </button>
            </div>
        </div>
    `).join('');
}

// ========================================
// ОРЫН ДЕТАЛДАРЫН КӨРСЕТУ
// ========================================

async function viewPlaceDetails(placeId) {
    try {
        const response = await TravelMapAPI.places.getById(placeId);
        const place = response.data;
        
        // Modal терезе құру
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="modal-close" onclick="closeModal()">&times;</span>
                
                <img src="${place.image_url}" alt="${place.name_kk}" class="modal-image">
                
                <h2>${place.name_kk}</h2>
                <p class="modal-description">${place.description_kk}</p>
                
                <div class="modal-info">
                    <div class="info-row">
                        <strong><i class="fa-solid fa-clock"></i> Жұмыс уақыты:</strong>
                        <span>Дүйсенбі-Жұма: ${place.details.workingHours.weekdays}</span>
                        <span>Сенбі-Жексенбі: ${place.details.workingHours.weekends}</span>
                    </div>
                    
                    <div class="info-row">
                        <strong><i class="fa-solid fa-money-bill"></i> Баға:</strong>
                        <span>${place.details.price.min}-${place.details.price.max} ${place.details.price.currency}</span>
                    </div>
                    
                    <div class="info-row">
                        <strong><i class="fa-solid fa-bus"></i> Көлік:</strong>
                        ${place.details.transport.map(t => `
                            <span>${t.description}</span>
                        `).join('')}
                    </div>
                    
                    <div class="info-row">
                        <strong><i class="fa-solid fa-star"></i> Рейтинг:</strong>
                        <span>${place.rating} / 5.0</span>
                    </div>
                    
                    <div class="info-row">
                        <strong><i class="fa-solid fa-eye"></i> Келгендер:</strong>
                        <span>${place.visit_count} адам</span>
                    </div>
                </div>
                
                <div class="modal-actions">
                    <button onclick="showOnMap(${place.latitude}, ${place.longitude}, '${place.name_kk}')">
                        <i class="fa-solid fa-map-location-dot"></i> Картада көрсету
                    </button>
                    <button onclick="openGoogleMaps(${place.latitude}, ${place.longitude})">
                        <i class="fa-brands fa-google"></i> Google Maps-те ашу
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'flex';
        
    } catch (error) {
        console.error('❌ Орын деталдарын жүктеу қатесі:', error);
        showNotification('Орын ақпаратын жүктеу мүмкін болмады', 'error');
    }
}

// ========================================
// КАРТАНЫ ИНИЦИАЛИЗАЦИЯЛАУ
// ========================================

async function initMap() {
    try {
        // Leaflet картасын құру (Алматы орталығы)
        leafletMap = L.map('leaflet-map').setView([43.238949, 76.889709], 11);
        
        // OpenStreetMap тайлдарын қосу
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 18
        }).addTo(leafletMap);
        
        // Маркерлерді жүктеу
        const response = await TravelMapAPI.map.getMarkers();
        const markers = response.data;
        
        console.log(`✅ ${markers.length} маркер жүктелді`);
        
        // Әр маркерді картаға қосу
        markers.forEach(marker => {
            const leafletMarker = L.marker([marker.position.lat, marker.position.lng], {
                icon: L.divIcon({
                    html: `<div style="background: ${marker.color}; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">${marker.icon}</div>`,
                    className: 'custom-marker',
                    iconSize: [30, 30]
                })
            }).addTo(leafletMap);
            
            // Popup қосу - жақсартылған дизайн
            const markerTitle = marker.title[currentLanguage] || marker.title.kk;
            const categoryText = currentLanguage === 'kk' ? getCategoryNameKK(marker.category) : getCategoryNameRU(marker.category);
            
            leafletMarker.bindPopup(`
                <div class="map-popup">
                    <div class="popup-image-container">
                        <img src="${marker.image}" alt="${markerTitle}" class="popup-image">
                        <div class="popup-category" style="background: ${marker.color};">
                            ${marker.icon} ${categoryText}
                        </div>
                    </div>
                    <div class="popup-content">
                        <h3 class="popup-title">${markerTitle}</h3>
                        <div class="popup-rating">
                            <span class="stars">${getStarRating(marker.rating)}</span>
                            <span class="rating-number">${marker.rating}</span>
                        </div>
                        <button onclick="viewPlaceDetails(${marker.id})" class="popup-btn">
                            <i class="fa-solid fa-circle-info"></i>
                            ${currentLanguage === 'kk' ? 'Толығырақ' : 'Подробнее'}
                        </button>
                    </div>
                </div>
            `, {
                maxWidth: 300,
                className: 'custom-popup'
            });
            
            mapMarkers.push(leafletMarker);
        });
        
        // Картаны барлық маркерлерге масштабтау
        if (markers.length > 0) {
            const bounds = await TravelMapAPI.map.getBounds();
            if (bounds && bounds.bounds) {
                const b = bounds.bounds;
                leafletMap.fitBounds([
                    [b.south, b.west],  // southWest
                    [b.north, b.east]   // northEast
                ]);
            }
        }
        
    } catch (error) {
        console.error('❌ Картаны инициализациялау қатесі:', error);
    }
}

// ========================================
// АУА РАЙЫН ЖҮКТЕУ
// ========================================

async function loadWeather() {
    const container = document.getElementById('weather-container');
    const loading = document.getElementById('weather-loading');
    
    loading.style.display = 'block';
    
    try {
        const response = await TravelMapAPI.weather.getCurrent();
        const weather = response; // Жауап түбірінде data жоқ
        
        console.log('✅ Ауа райы жүктелді:', weather.current.temperature + '°C');
        
        container.innerHTML = `
            <div class="weather-main">
                <div class="weather-icon">${weather.current.icon}</div>
                <div class="weather-temp">${weather.current.temperature}°C</div>
                <div class="weather-condition">${weather.current.weather[currentLanguage]}</div>
            </div>
            
            <div class="weather-details">
                <div class="weather-detail">
                    <i class="fa-solid fa-temperature-three-quarters"></i>
                    <span>Сезілетін: ${weather.current.feels_like}°C</span>
                </div>
                <div class="weather-detail">
                    <i class="fa-solid fa-droplet"></i>
                    <span>Ылғалдылық: ${weather.current.humidity}%</span>
                </div>
                <div class="weather-detail">
                    <i class="fa-solid fa-wind"></i>
                    <span>Жел: ${weather.current.wind_speed} км/сағ</span>
                </div>
                <div class="weather-detail">
                    <i class="fa-solid fa-cloud-rain"></i>
                    <span>Жауын-шашын: ${weather.current.precipitation} мм</span>
                </div>
            </div>
            
            <div class="weather-recommendation">
                <i class="fa-solid fa-lightbulb"></i>
                <p>${weather.recommendation[currentLanguage]}</p>
            </div>
            
            <div class="weather-footer">
                <small>Соңғы жаңарту: ${new Date(weather.timestamp).toLocaleString('kk-KZ')}</small>
            </div>
        `;
        
    } catch (error) {
        console.error('❌ Ауа райын жүктеу қатесі:', error);
        container.innerHTML = '<p class="error-message">Ауа райын жүктеу мүмкін болмады</p>';
    } finally {
        loading.style.display = 'none';
    }
}

// ========================================
// ЧАТБОТ
// ========================================

async function sendChatMessage(message) {
    const messagesContainer = document.getElementById('chat-messages');
    
    // Пайдаланушы хабарын қосу
    const userMessageDiv = document.createElement('div');
    userMessageDiv.className = 'user-message';
    userMessageDiv.innerHTML = `
        <div class="message-content">${message}</div>
        <i class="fa-solid fa-user"></i>
    `;
    messagesContainer.appendChild(userMessageDiv);
    
    // Loading индикаторын қосу
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'bot-message';
    loadingDiv.innerHTML = `
        <i class="fa-solid fa-robot"></i>
        <div class="message-content">
            <i class="fa-solid fa-spinner fa-spin"></i> Ойланып жатырмын...
        </div>
    `;
    messagesContainer.appendChild(loadingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    try {
        const response = await TravelMapAPI.chat.sendMessage(message, currentLanguage);
        
        // Loading-ты жою
        loadingDiv.remove();
        
        // Бот жауабын қосу
        const botMessageDiv = document.createElement('div');
        botMessageDiv.className = 'bot-message';
        botMessageDiv.innerHTML = `
            <i class="fa-solid fa-robot"></i>
            <div class="message-content">${response.data.botResponse}</div>
        `;
        messagesContainer.appendChild(botMessageDiv);
        
    } catch (error) {
        console.error('❌ Чатбот қатесі:', error);
        loadingDiv.querySelector('.message-content').textContent = 'Қате болды. Қайтадан көріңіз.';
    }
    
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// ========================================
// EVENT LISTENER-ДЕР
// ========================================

function initEventListeners() {
    // Сүзгілер
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            const category = e.target.dataset.category;
            if (category === 'all') {
                displayPlaces(allPlaces);
            } else {
                const filtered = allPlaces.filter(p => p.category === category);
                displayPlaces(filtered);
            }
        });
    });
    
    // Іздеу
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = allPlaces.filter(p => 
            p.name_kk.toLowerCase().includes(query) ||
            p.name_ru.toLowerCase().includes(query) ||
            p.description_kk.toLowerCase().includes(query)
        );
        displayPlaces(filtered);
    });
    
    // Чатбот тіл таңдау
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentLanguage = e.target.dataset.lang;
        });
    });
    
    // Чатбот хабар жіберу
    const chatInput = document.getElementById('chat-input');
    const chatSendBtn = document.getElementById('chat-send-btn');
    
    chatSendBtn.addEventListener('click', () => {
        const message = chatInput.value.trim();
        if (message) {
            sendChatMessage(message);
            chatInput.value = '';
        }
    });
    
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            chatSendBtn.click();
        }
    });
    
    // Ұсынылатын сұрақтар
    document.querySelectorAll('.suggestion-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            sendChatMessage(btn.dataset.question);
        });
    });
}

// ========================================
// КӨМЕКШІ ФУНКЦИЯЛАР
// ========================================

function scrollToSection(sectionId) {
    document.getElementById(sectionId).scrollIntoView({ behavior: 'smooth' });
}

function getCategoryName(category) {
    const names = {
        'sports': '⛷️ Спорт',
        'nature': '🌲 Табиғат',
        'entertainment': '🎭 Ойын-сауық',
        'culture': '🏛️ Мәдениет',
        'food': '🍽️ Ас-тамақ',
        'shopping': '🛍️ Сауда'
    };
    return names[category] || category;
}

function showOnMap(lat, lng, name) {
    closeModal();
    scrollToSection('map');
    leafletMap.setView([lat, lng], 15);
    
    // Popup ашу
    mapMarkers.forEach(marker => {
        const pos = marker.getLatLng();
        if (Math.abs(pos.lat - lat) < 0.001 && Math.abs(pos.lng - lng) < 0.001) {
            marker.openPopup();
        }
    });
}

function openGoogleMaps(lat, lng) {
    window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
}

function closeModal() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => modal.remove());
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.remove(), 5000);
}

// ========================================
// КӨМЕКШІ ФУНКЦИЯЛАР
// ========================================

function getStarRating(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let stars = '';
    
    for (let i = 0; i < fullStars; i++) {
        stars += '⭐';
    }
    if (hasHalfStar) {
        stars += '✨';
    }
    
    return stars;
}

function getCategoryNameKK(category) {
    const names = {
        'nature': 'Табиғат',
        'culture': 'Мәдениет',
        'entertainment': 'Ойын-сауық',
        'food': 'Тамақ',
        'shopping': 'Сауда',
        'sport': 'Спорт'
    };
    return names[category] || category;
}

function getCategoryNameRU(category) {
    const names = {
        'nature': 'Природа',
        'culture': 'Культура',
        'entertainment': 'Развлечения',
        'food': 'Еда',
        'shopping': 'Шоппинг',
        'sport': 'Спорт'
    };
    return names[category] || category;
}

// ========================================
// GLOBAL ФУНКЦИЯЛАР (HTML-ден шақыру үшін)
// ========================================

window.scrollToSection = scrollToSection;
window.viewPlaceDetails = viewPlaceDetails;
window.showOnMap = showOnMap;
window.openGoogleMaps = openGoogleMaps;
window.closeModal = closeModal;

console.log('✅ trАvelMap app.js жүктелді');
