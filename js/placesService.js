/**
 * ========================================
 * ОРЫНДАР МИКРОСЕРВИСІ / PLACES SERVICE
 * ========================================
 * Алматы қаласындағы демалыс орындарын басқарады
 */

// Алматы демалыс орындарының деректері
const placesData = [
    {
        id: 1,
        name: "Медеу",
        nameRu: "Медео",
        description: "Әлемге әйгілі биіктегі мұз айдыны. Тамаша көрініс және спорт орны.",
        descriptionRu: "Всемирно известный высокогорный каток. Потрясающие виды и спортивный объект.",
        image: "https://images.unsplash.com/photo-1700221511258-00832518d5b7?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=735",
        coordinates: [43.157496, 77.059031],
        category: "Спорт",
        rating: 4.8,
        details: {
            workingHours: "09:00 - 21:00",
            price: "2000-5000 ₸",
            transport: "№6 автобус, такси",
            bestTime: "Қыс айлары"
        }
    },
    {
        id: 2,
        name: "Көктөбе",
        nameRu: "Кок-Тобе",
        description: "Алматының символы. Аспалы жол, көрініс алаңы және көңіл көтеру орны.",
        descriptionRu: "Символ Алматы. Канатная дорога, смотровая площадка и развлечения.",
        image: "https://images.unsplash.com/photo-1730742673166-c0d2b13f7985?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=736",
        coordinates: [43.234306, 76.975586],
        category: "Көрікті жер",
        rating: 4.9,
        details: {
            workingHours: "10:00 - 23:00",
            price: "1000-3000 ₸",
            transport: "Аспалы жол, такси",
            bestTime: "Кез келген маусым"
        }
    },
    {
        id: 3,
        name: "БАО (Үлкен Алматы көлі)",
        nameRu: "БАО (Большое Алматинское озеро)",
        description: "Таулардағы нақты алтын - көгілдір көл. Табиғат сүйгіштеріне арналған.",
        descriptionRu: "Настоящая жемчужина гор - голубое озеро. Для любителей природы.",
        image: "https://visitalmaty.kz/wp-content/uploads/2022/01/%D0%91%D0%90%D0%BE-2-1-1050x662.jpg",
        coordinates: [43.052173, 76.983940],
        category: "Табиғат",
        rating: 5.0,
        details: {
            workingHours: "Тәулік бойы",
            price: "Тегін",
            transport: "Такси, жеке көлік",
            bestTime: "Жаз-күз айлары"
        }
    },
    {
        id: 4,
        name: "Esentai Mall",
        nameRu: "Есентай Молл",
        description: "Қаланың ең үлкен сауда орталығы. Сауда, тамақтану және көңіл көтеру.",
        descriptionRu: "Крупнейший торговый центр города. Шопинг, рестораны и развлечения.",
        image: "https://api.esentai.com/storage/about_mall/September2022/xnWVZdPeOIL58sETrC8t.JPG",
        coordinates: [43.218501, 76.927894],
        category: "Сауда",
        rating: 4.7,
        details: {
            workingHours: "10:00 - 22:00",
            price: "Әр түрлі",
            transport: "Барлық қоғамдық көлік",
            bestTime: "Кез келген уақыт"
        }
    },
    {
        id: 5,
        name: "Бірінші Президент паркі",
        nameRu: "Парк Первого Президента",
        description: "Қаланың орталығындағы үлкен және әдемі парк. Серуендеуге тамаша орын.",
        descriptionRu: "Большой и красивый парк в центре города. Отличное место для прогулок.",
        image: "https://upload.wikimedia.org/wikipedia/kk/8/80/%D0%9F%D0%B0%D1%80%D0%BA1.jpg",
        coordinates: [43.187184, 76.886580],
        category: "Парк",
        rating: 4.6,
        details: {
            workingHours: "06:00 - 23:00",
            price: "Тегін",
            transport: "Метро Абай, автобус",
            bestTime: "Көктем-жаз"
        }
    },
    {
        id: 6,
        name: "Шымбұлақ",
        nameRu: "Шымбулак",
        description: "Тау-шаңғы курорты. Қыста шаңғы, жазда серуендеу үшін керемет.",
        descriptionRu: "Горнолыжный курорт. Зимой катание, летом прогулки.",
        image: "https://storage.yandexcloud.kz/shymbulak/media-test/5ee13c776a83a4b00fed53bf4c11798d.jpg",
        coordinates: [43.120643, 77.096188],
        category: "Спорт",
        rating: 4.9,
        details: {
            workingHours: "09:00 - 17:00",
            price: "5000-15000 ₸",
            transport: "Гондол, такси",
            bestTime: "Қыс (желтоқсан-наурыз)"
        }
    }
];

/**
 * Орындарды бетке жүктеу функциясы
 */
function loadPlaces() {
    const placesGrid = document.getElementById('places-grid');
    
    if (!placesGrid) {
        console.error('Places grid element not found!');
        return;
    }

    placesGrid.innerHTML = '';

    placesData.forEach(place => {
        const placeCard = createPlaceCard(place);
        placesGrid.appendChild(placeCard);
    });

    console.log(`✅ ${placesData.length} орын жүктелді`);
}

/**
 * Орын карточкасын жасау
 */
function createPlaceCard(place) {
    const card = document.createElement('div');
    card.className = 'place-card';
    card.setAttribute('data-place-id', place.id);

    card.innerHTML = `
        <img src="${place.image}" alt="${place.name}" class="place-image" loading="lazy">
        <div class="place-content">
            <h3 class="place-title">${place.name}</h3>
            <p class="place-description">${place.description}</p>
            
            <div class="place-details">
                <span class="detail-badge"><i class="fa-solid fa-location-dot"></i> ${place.category}</span>
                <span class="detail-badge"><i class="fa-solid fa-star"></i> ${place.rating}</span>
            </div>
            
            <button class="place-btn" onclick="showPlaceDetails(${place.id})">
                Толығырақ <i class="fa-solid fa-arrow-right"></i>
            </button>
        </div>
    `;

    return card;
}

/**
 * Орын туралы толық ақпаратты көрсету
 */
function showPlaceDetails(placeId) {
    const place = placesData.find(p => p.id === placeId);
    
    if (!place) {
        console.error('Place not found!');
        return;
    }

    // Модалды терезе жасау
    const modal = document.createElement('div');
    modal.className = 'place-modal';
    modal.innerHTML = `
        <div class="modal-overlay" onclick="closeModal()"></div>
        <div class="modal-content">
            <button class="modal-close" onclick="closeModal()"><i class="fa-solid fa-xmark"></i></button>
            
            <img src="${place.image}" alt="${place.name}" class="modal-image">
            
            <div class="modal-body">
                <h2>${place.name}</h2>
                <p class="modal-description">${place.description}</p>
                
                <div class="modal-info">
                    <div class="info-item">
                        <span class="info-icon"><i class="fa-solid fa-clock"></i></span>
                        <span>${place.details.workingHours}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-icon"><i class="fa-solid fa-money-bill-wave"></i></span>
                        <span>${place.details.price}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-icon"><i class="fa-solid fa-bus"></i></span>
                        <span>${place.details.transport}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-icon"><i class="fa-solid fa-calendar-days"></i></span>
                        <span>${place.details.bestTime}</span>
                    </div>
                </div>
                
                <div class="modal-actions">
                    <button class="action-btn primary" onclick="showOnMap(${place.coordinates[0]}, ${place.coordinates[1]}, '${place.name}')">
                        <i class="fa-solid fa-map-marked-alt"></i> Картада көрсету
                    </button>
                    <button class="action-btn secondary" onclick="askChatbot('${place.name}')">
                        <i class="fa-solid fa-comments"></i> Чатботпен сұрау
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    
    // Анимация үшін кідіріс
    setTimeout(() => {
        modal.classList.add('active');
    }, 10);
}

/**
 * Модалды терезені жабу
 */
function closeModal() {
    const modal = document.querySelector('.place-modal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}

/**
 * ID бойынша орынды алу
 */
function getPlaceById(placeId) {
    return placesData.find(place => place.id === placeId);
}

/**
 * Категория бойынша орындарды іздеу
 */
function getPlacesByCategory(category) {
    return placesData.filter(place => place.category === category);
}

/**
 * Барлық орындарды алу
 */
function getAllPlaces() {
    return placesData;
}

/**
 * Орынды аты бойынша іздеу
 */
function searchPlaceByName(searchTerm) {
    const term = searchTerm.toLowerCase();
    return placesData.filter(place => 
        place.name.toLowerCase().includes(term) ||
        place.nameRu.toLowerCase().includes(term) ||
        place.description.toLowerCase().includes(term)
    );
}

// Модаль үшін CSS қосу
const modalStyles = document.createElement('style');
modalStyles.textContent = `
    .place-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 2000;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.3s ease;
    }

    .place-modal.active {
        opacity: 1;
    }

    .modal-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(5px);
    }

    .modal-content {
        position: relative;
        max-width: 800px;
        max-height: 90vh;
        overflow-y: auto;
        background: var(--dark-card);
        border-radius: 20px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        z-index: 2001;
        animation: slideUp 0.3s ease-out;
    }

    @keyframes slideUp {
        from {
            transform: translateY(50px);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }

    .modal-close {
        position: absolute;
        top: 20px;
        right: 20px;
        width: 40px;
        height: 40px;
        background: rgba(255, 255, 255, 0.2);
        border: none;
        border-radius: 50%;
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
        z-index: 2002;
        transition: all 0.3s ease;
    }

    .modal-close:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: rotate(90deg);
    }

    .modal-image {
        width: 100%;
        height: 400px;
        object-fit: cover;
        border-radius: 20px 20px 0 0;
    }

    .modal-body {
        padding: 2rem;
    }

    .modal-body h2 {
        font-size: 2.5rem;
        margin-bottom: 1rem;
        color: var(--accent-blue);
    }

    .modal-description {
        font-size: 1.2rem;
        color: var(--gray-text);
        margin-bottom: 2rem;
        line-height: 1.8;
    }

    .modal-info {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        margin-bottom: 2rem;
    }

    .info-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 1rem;
        background: rgba(59, 130, 246, 0.1);
        border-radius: 10px;
    }

    .info-icon {
        font-size: 1.5rem;
    }

    .modal-actions {
        display: flex;
        gap: 1rem;
    }

    .action-btn {
        flex: 1;
        padding: 1rem;
        border: none;
        border-radius: 10px;
        font-size: 1rem;
        cursor: pointer;
        transition: all 0.3s ease;
    }

    .action-btn.primary {
        background: var(--accent-blue);
        color: white;
    }

    .action-btn.primary:hover {
        background: #2563eb;
        transform: translateY(-2px);
    }

    .action-btn.secondary {
        background: var(--accent-green);
        color: white;
    }

    .action-btn.secondary:hover {
        background: #16a34a;
        transform: translateY(-2px);
    }
`;
document.head.appendChild(modalStyles);

// Бет жүктелгенде орындарды көрсету
document.addEventListener('DOMContentLoaded', loadPlaces);

// Export функциялар (басқа сервистер үшін)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        placesData,
        getAllPlaces,
        getPlaceById,
        getPlacesByCategory,
        searchPlaceByName
    };
}
