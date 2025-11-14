/**
 * ========================================
 * PLACE DETAILS PAGE SCRIPT
 * ========================================
 */

let currentPlace = null;
let currentUser = null;
let userRating = 0;
let isFavorite = false;
let placeMap = null;

// Получить ID места из URL
function getPlaceIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

// Загрузка текущего пользователя
async function loadCurrentUser() {
    const token = localStorage.getItem('token');
    if (!token) {
        return null;
    }
    
    try {
        const response = await fetch('http://localhost:3000/api/auth/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data.data;
            updateNavigation();
            return currentUser;
        }
    } catch (error) {
        console.error('Error loading user:', error);
    }
    
    return null;
}

// Обновление навигации
function updateNavigation() {
    const loginLink = document.getElementById('login-link');
    const profileLink = document.getElementById('profile-link');
    const adminLink = document.getElementById('admin-link');
    
    if (currentUser) {
        loginLink.style.display = 'none';
        profileLink.style.display = 'block';
        
        if (currentUser.role === 'admin') {
            adminLink.style.display = 'block';
        }
    }
}

// Загрузка данных места
async function loadPlaceData(placeId) {
    try {
        const token = localStorage.getItem('token');
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`http://localhost:3000/api/places/${placeId}`, { headers });
        
        if (!response.ok) {
            throw new Error('Place not found');
        }
        
        const data = await response.json();
        currentPlace = data.data;
        
        renderPlace();
        initPlaceMap();
    } catch (error) {
        console.error('Error loading place:', error);
        document.getElementById('place-content').innerHTML = `
            <div class="error-message">
                <i class="fa-solid fa-circle-exclamation"></i>
                <p>Орын табылмады немесе жүктеу қатесі</p>
                <a href="index.html#places" class="back-button">Артқа қайту</a>
            </div>
        `;
    }
}

// Отображение места
function renderPlace() {
    const content = document.getElementById('place-content');
    const language = localStorage.getItem('language') || 'kk';
    
    const name = currentPlace[`name_${language}`] || currentPlace.name_kk;
    const description = currentPlace[`description_${language}`] || currentPlace.description_kk;
    
    document.getElementById('page-title').textContent = `${name} — trАvelMap`;
    
    const transportInfo = currentPlace.details.transport.map(t => `
        <div class="detail-item">
            <strong>${t.type === 'bus' ? 'Автобус' : t.type === 'taxi' ? 'Такси' : t.type === 'metro' ? 'Метро' : 'Транспорт'}</strong>
            ${t.number ? `№${t.number}: ` : ''}${t.description}
        </div>
    `).join('');
    
    content.innerHTML = `
        <div class="place-detail-header" style="background-image: linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url('${currentPlace.image_url}')">
            <div class="place-detail-overlay">
                <span class="place-detail-category">${getCategoryName(currentPlace.category)}</span>
                <h1 class="place-detail-title">${name}</h1>
                <div class="place-detail-rating">
                    <i class="fa-solid fa-star"></i> ${currentPlace.rating.toFixed(1)} 
                    <span style="font-size: 1rem; color: #ddd;">• ${currentPlace.visit_count} келушілер</span>
                </div>
            </div>
        </div>
        
        <div class="place-detail-actions">
            <button class="action-btn primary" id="favorite-btn" onclick="toggleFavorite()">
                <i class="fa-${isFavorite ? 'solid' : 'regular'} fa-heart"></i>
                ${isFavorite ? 'Избранныйда' : 'Избранныйға қосу'}
            </button>
            <button class="action-btn secondary" onclick="addToVisitHistory()">
                <i class="fa-solid fa-clock-rotate-left"></i>
                Бардым деп белгілеу
            </button>
            <button class="action-btn secondary" onclick="sharePlace()">
                <i class="fa-solid fa-share-nodes"></i>
                Бөлісу
            </button>
        </div>
        
        <div class="detail-section">
            <h3><i class="fa-solid fa-info-circle"></i> Сипаттама</h3>
            <p style="line-height: 1.8; font-size: 1.1rem;">${description}</p>
        </div>
        
        <div class="detail-section">
            <h3><i class="fa-solid fa-circle-info"></i> Толық ақпарат</h3>
            <div class="detail-grid">
                <div class="detail-item">
                    <strong>Жұмыс уақыты (апта)</strong>
                    ${currentPlace.details.workingHours.weekdays}
                </div>
                <div class="detail-item">
                    <strong>Жұмыс уақыты (демалыс)</strong>
                    ${currentPlace.details.workingHours.weekends}
                </div>
                <div class="detail-item">
                    <strong>Баға</strong>
                    ${currentPlace.details.price.min === 0 && currentPlace.details.price.max === 0 
                        ? 'Тегін' 
                        : `${currentPlace.details.price.min} - ${currentPlace.details.price.max} ${currentPlace.details.price.currency}`}
                </div>
                <div class="detail-item">
                    <strong>Категория</strong>
                    ${getCategoryName(currentPlace.category)}
                </div>
            </div>
        </div>
        
        <div class="detail-section">
            <h3><i class="fa-solid fa-bus"></i> Қалай бару</h3>
            <div class="detail-grid">
                ${transportInfo}
            </div>
        </div>
        
        <div class="detail-section">
            <h3><i class="fa-solid fa-map-location-dot"></i> Картада орналасуы</h3>
            <div id="place-map" class="map-container"></div>
        </div>
        
        ${currentUser ? `
        <div class="detail-section">
            <h3><i class="fa-solid fa-star"></i> Рейтинг қалдыру</h3>
            <p>Бұл орынға бағаңызды қойыңыз (1-5 жұлдыз):</p>
            <div class="rating-container">
                <div class="rating-stars" id="rating-stars">
                    ${[1,2,3,4,5].map(i => `
                        <i class="fa-solid fa-star rating-star ${i <= userRating ? 'active' : ''}" 
                           data-rating="${i}"
                           onclick="setRating(${i})"></i>
                    `).join('')}
                </div>
                <button class="action-btn primary" onclick="submitRating()" ${userRating === 0 ? 'disabled' : ''}>
                    Бағаны жіберу
                </button>
            </div>
        </div>
        
        <div class="detail-section">
            <h3><i class="fa-solid fa-comment"></i> Пікір қалдыру</h3>
            <div style="margin-top: 20px;">
                <input type="text" id="review-title" placeholder="Пікір тақырыбы" 
                       style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 8px; margin-bottom: 10px;">
                <textarea id="review-content" rows="5" placeholder="Пікіріңізді жазыңыз..." 
                          style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 8px; margin-bottom: 10px;"></textarea>
                <div style="margin-bottom: 10px;">
                    <label>Бағаңыз (1-5):</label>
                    <select id="review-rating" style="padding: 8px; border-radius: 8px; border: 2px solid #ddd;">
                        <option value="5">5 - Өте жақсы</option>
                        <option value="4">4 - Жақсы</option>
                        <option value="3">3 - Қанағаттанарлық</option>
                        <option value="2">2 - Нашар</option>
                        <option value="1">1 - Өте нашар</option>
                    </select>
                </div>
                <button class="action-btn primary" onclick="submitReview()">
                    <i class="fa-solid fa-paper-plane"></i> Пікір жіберу
                </button>
            </div>
        </div>
        ` : `
        <div class="detail-section" style="text-align: center;">
            <p>Рейтинг қалдыру және пікір жазу үшін <a href="login.html">кіріңіз</a></p>
        </div>
        `}
        
        <div class="detail-section">
            <h3><i class="fa-solid fa-comments"></i> Пікірлер (${currentPlace.reviews ? currentPlace.reviews.length : 0})</h3>
            <div id="reviews-container">
                ${renderReviews()}
            </div>
        </div>
    `;
}

// Отображение отзывов
function renderReviews() {
    if (!currentPlace.reviews || currentPlace.reviews.length === 0) {
        return '<p style="text-align: center; color: #999;">Әлі пікірлер жоқ</p>';
    }
    
    return currentPlace.reviews.map(review => `
        <div class="review-card">
            <div class="review-header">
                <div class="review-user">
                    <div class="review-avatar">
                        ${review.full_name ? review.full_name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                        <strong>${review.full_name || review.username}</strong>
                        <div class="review-rating">
                            ${[1,2,3,4,5].map(i => `<i class="fa-solid fa-star" style="color: ${i <= review.rating ? '#FFD700' : '#ddd'}"></i>`).join('')}
                        </div>
                    </div>
                </div>
                <span style="color: #999; font-size: 0.9rem;">${new Date(review.created_at).toLocaleDateString('kk-KZ')}</span>
            </div>
            ${review.title ? `<h4 style="margin: 10px 0;">${review.title}</h4>` : ''}
            <div class="review-content">${review.content}</div>
            <div class="review-footer">
                <span class="review-like ${review.liked ? 'active' : ''}" onclick="likeReview(${review.id})">
                    <i class="fa-${review.liked ? 'solid' : 'regular'} fa-heart"></i>
                    ${review.likes_count || 0}
                </span>
                <span style="color: #999;">
                    <i class="fa-regular fa-clock"></i>
                    ${formatDate(review.created_at)}
                </span>
            </div>
        </div>
    `).join('');
}

// Инициализация карты
function initPlaceMap() {
    const mapContainer = document.getElementById('place-map');
    if (!mapContainer) return;
    
    placeMap = L.map('place-map').setView([currentPlace.latitude, currentPlace.longitude], 14);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(placeMap);
    
    const marker = L.marker([currentPlace.latitude, currentPlace.longitude]).addTo(placeMap);
    marker.bindPopup(`<strong>${currentPlace.name_kk}</strong>`).openPopup();
}

// Добавить/удалить из избранного
async function toggleFavorite() {
    if (!currentUser) {
        showNotification('Избранныйға қосу үшін алдымен жүйеге кіріңіз', 'warning', '🔒 Аутентификация');
        setTimeout(() => window.location.href = 'login.html', 1500);
        return;
    }
    
    const token = localStorage.getItem('token');
    const method = isFavorite ? 'DELETE' : 'POST';
    
    try {
        const response = await fetch(`http://localhost:3000/api/places/${currentPlace.id}/favorite`, {
            method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            isFavorite = !isFavorite;
            const btn = document.getElementById('favorite-btn');
            btn.innerHTML = `
                <i class="fa-${isFavorite ? 'solid' : 'regular'} fa-heart"></i>
                ${isFavorite ? 'Избранныйда' : 'Избранныйға қосу'}
            `;
            btn.className = isFavorite ? 'action-btn active' : 'action-btn primary';
            
            showNotification(
                isFavorite ? 'Орын сіздің избранныйға сәтті қосылды!' : 'Орын избранныйдан өшірілді', 
                'success',
                isFavorite ? '❤️ Избранныйға қосылды' : '🗑️ Өшірілді'
            );
        }
    } catch (error) {
        console.error('Error toggling favorite:', error);
        showNotification('Избранныйға қосу/өшіру кезінде қате орын алды', 'error', '⚠️ Қате');
    }
}

// Поставить рейтинг
function setRating(rating) {
    userRating = rating;
    document.querySelectorAll('.rating-star').forEach((star, index) => {
        if (index < rating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

// Отправить рейтинг
async function submitRating() {
    if (!currentUser) {
        showNotification('Рейтинг қалдыру үшін алдымен жүйеге кіріңіз', 'warning', '🔒 Аутентификация');
        return;
    }
    
    if (userRating === 0) {
        showNotification('Рейтинг таңдаңыз', 'warning', '⭐ Рейтинг');
        return;
    }
    
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`http://localhost:3000/api/places/${currentPlace.id}/rating`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ rating: userRating })
        });
        
        if (response.ok) {
            showNotification('Сіздің бағаңыз сәтті сақталды!', 'success', `⭐ ${userRating} жұлдыз`);
            // Reload place to get updated rating
            setTimeout(() => loadPlaceData(currentPlace.id), 1000);
        }
    } catch (error) {
        console.error('Error submitting rating:', error);
        showNotification('Рейтинг жіберу кезінде қате орын алды', 'error', '⚠️ Қате');
    }
}

// Отправить отзыв
async function submitReview() {
    if (!currentUser) {
        showNotification('Пікір қалдыру үшін алдымен жүйеге кіріңіз', 'warning', '🔒 Аутентификация');
        return;
    }
    
    const title = document.getElementById('review-title').value.trim();
    const content = document.getElementById('review-content').value.trim();
    const rating = parseInt(document.getElementById('review-rating').value);
    
    if (!content) {
        showNotification('Пікіріңізді жазыңыз', 'warning', '✍️ Пікір');
        return;
    }
    
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`http://localhost:3000/api/places/${currentPlace.id}/review`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title, content, rating })
        });
        
        if (response.ok) {
            showNotification('Сіздің пікіріңіз сәтті жарияланды!', 'success', '✅ Пікір жіберілді');
            // Clear form
            document.getElementById('review-title').value = '';
            document.getElementById('review-content').value = '';
            // Reload place to show new review
            setTimeout(() => loadPlaceData(currentPlace.id), 1000);
        }
    } catch (error) {
        console.error('Error submitting review:', error);
        showNotification('Пікір жіберу кезінде қате орын алды', 'error', '⚠️ Қате');
    }
}

// Лайкнуть отзыв
async function likeReview(reviewId) {
    if (!currentUser) {
        showNotification('Лайк қою үшін алдымен жүйеге кіріңіз', 'warning', '🔒 Аутентификация');
        return;
    }
    
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`http://localhost:3000/api/places/${currentPlace.id}/like`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ reviewId })
        });
        
        if (response.ok) {
            loadPlaceData(currentPlace.id);
        }
    } catch (error) {
        console.error('Error liking review:', error);
    }
}

// Добавить в историю посещений
async function addToVisitHistory() {
    if (!currentUser) {
        showNotification('Тарихқа қосу үшін алдымен жүйеге кіріңіз', 'warning', '🔒 Аутентификация');
        setTimeout(() => window.location.href = 'login.html', 1500);
        return;
    }
    
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`http://localhost:3000/api/places/${currentPlace.id}/visit`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                visit_date: new Date().toISOString().split('T')[0]
            })
        });
        
        if (response.ok) {
            showNotification('Сіздің саяхат тарихыңызға қосылды!', 'success', '📍 Тарих');
        }
    } catch (error) {
        console.error('Error adding visit:', error);
        showNotification('Тарихқа қосу кезінде қате орын алды', 'error', '⚠️ Қате');
    }
}

// Поделиться
function sharePlace() {
    const url = window.location.href;
    if (navigator.share) {
        navigator.share({
            title: currentPlace.name_kk,
            text: currentPlace.description_kk,
            url: url
        });
    } else {
        navigator.clipboard.writeText(url);
        showNotification('Сілтеме буферге көшірілді!', 'success', '📋 Көшірілді');
    }
}

// Вспомогательные функции
function getCategoryName(category) {
    const categories = {
        'sports': 'Спорт',
        'nature': 'Табиғат',
        'entertainment': 'Ойын-сауық',
        'culture': 'Мәдениет',
        'park': 'Саябақ',
        'shopping': 'Сауда'
    };
    return categories[category] || category;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Бүгін';
    if (days === 1) return 'Кеше';
    if (days < 7) return `${days} күн бұрын`;
    if (days < 30) return `${Math.floor(days / 7)} апта бұрын`;
    return date.toLocaleDateString('kk-KZ');
}

function showNotification(message, type = 'info', title = null) {
    const container = document.getElementById('toast-container');
    
    // Определяем заголовок и иконку в зависимости от типа
    const config = {
        success: {
            title: title || '✓ Сәтті',
            icon: 'fa-circle-check'
        },
        error: {
            title: title || '✗ Қате',
            icon: 'fa-circle-xmark'
        },
        warning: {
            title: title || '⚠ Назар аударыңыз',
            icon: 'fa-triangle-exclamation'
        },
        info: {
            title: title || 'ℹ Ақпарат',
            icon: 'fa-circle-info'
        }
    };
    
    const settings = config[type] || config.info;
    
    // Создаем toast элемент
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fa-solid ${settings.icon}"></i>
        </div>
        <div class="toast-content">
            <div class="toast-title">${settings.title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <div class="toast-close" onclick="this.parentElement.remove()">
            <i class="fa-solid fa-xmark"></i>
        </div>
    `;
    
    container.appendChild(toast);
    
    // Автоматически удаляем через 4 секунды
    setTimeout(() => {
        toast.classList.add('removing');
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 300);
    }, 4000);
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', async () => {
    const placeId = getPlaceIdFromUrl();
    
    if (!placeId) {
        document.getElementById('place-content').innerHTML = `
            <div class="error-message">
                <i class="fa-solid fa-circle-exclamation"></i>
                <p>Орын ID көрсетілмеген</p>
                <a href="index.html#places" class="back-button">Артқа қайту</a>
            </div>
        `;
        return;
    }
    
    await loadCurrentUser();
    await loadPlaceData(placeId);
});
