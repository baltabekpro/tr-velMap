/**
 * ========================================
 * КАРТА МИКРОСЕРВИСІ / MAP SERVICE
 * ========================================
 * Leaflet.js арқылы интерактивті карта
 */

let almatyMap = null;
let markers = [];
let userLocationMarker = null;

/**
 * Картаны инициализациялау
 */
function initMap() {
    // Алматының координаттары (орталық)
    const almatyCenter = [43.2220, 76.8512];
    
    // Карта элементін тексеру
    const mapContainer = document.getElementById('almaty-map');
    if (!mapContainer) {
        console.error('Map container not found!');
        return;
    }

    // Leaflet картасын құру
    almatyMap = L.map('almaty-map', {
        center: almatyCenter,
        zoom: 12,
        zoomControl: true,
        scrollWheelZoom: true
    });

    // OpenStreetMap қабатын қосу
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
    }).addTo(almatyMap);

    // Барлық орындарды белгілеу
    addPlaceMarkers();

    console.log('✅ Карта жүктелді');
}

/**
 * Орындарды картаға белгілеу
 */
function addPlaceMarkers() {
    // placesService.js-тен деректерді алу
    const places = typeof getAllPlaces === 'function' ? getAllPlaces() : [];
    
    if (places.length === 0) {
        console.warn('No places data found!');
        return;
    }

    places.forEach(place => {
        addMarker(place);
    });

    console.log(`✅ ${places.length} белгі қосылды`);
}

/**
 * Жеке белгі қосу
 */
function addMarker(place) {
    const [lat, lng] = place.coordinates;
    
    // Иконка таңдау (категория бойынша)
    const icon = getIconByCategory(place.category);
    
    // Marker құру
    const marker = L.marker([lat, lng], {
        icon: icon,
        title: place.name
    }).addTo(almatyMap);

    // Popup (ақпарат терезесі)
    const popupContent = `
        <div class="map-popup">
            <img src="${place.image}" alt="${place.name}" class="popup-image">
            <h3>${place.name}</h3>
            <p>${place.description}</p>
            <div class="popup-details">
                <span>⭐ ${place.rating}</span>
                <span>💰 ${place.details.price}</span>
            </div>
            <button class="popup-btn" onclick="showPlaceDetails(${place.id})">
                Толығырақ
            </button>
            <button class="popup-btn route-btn" onclick="getDirections(${lat}, ${lng}, '${place.name}')">
                🧭 Бағыт алу
            </button>
        </div>
    `;

    marker.bindPopup(popupContent, {
        maxWidth: 300,
        className: 'custom-popup'
    });

    // Marker-ді массивке сақтау
    markers.push({
        marker: marker,
        place: place
    });
}

/**
 * Категория бойынша иконка алу
 */
function getIconByCategory(category) {
    let iconUrl = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png';
    
    switch(category) {
        case 'Спорт':
            iconUrl = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png';
            break;
        case 'Көрікті жер':
            iconUrl = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png';
            break;
        case 'Табиғат':
            iconUrl = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png';
            break;
        case 'Сауда':
            iconUrl = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png';
            break;
        case 'Парк':
            iconUrl = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png';
            break;
        default:
            iconUrl = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png';
    }

    return L.icon({
        iconUrl: iconUrl,
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });
}

/**
 * Белгілі орынға фокустау
 */
function focusOnPlace(lat, lng, placeName) {
    if (!almatyMap) {
        console.error('Map not initialized!');
        return;
    }

    // Картаны сол жерге жылжыту
    almatyMap.setView([lat, lng], 15, {
        animate: true,
        duration: 1
    });

    // Сәйкес маркерді ашу
    markers.forEach(item => {
        if (item.place.coordinates[0] === lat && item.place.coordinates[1] === lng) {
            item.marker.openPopup();
        }
    });

    console.log(`📍 Фокус: ${placeName}`);
}

/**
 * Пайдаланушының орнын анықтау
 */
function getUserLocation() {
    if (!navigator.geolocation) {
        alert('Сіздің браузеріңіз геолокацияны қолдамайды!');
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            
            // Пайдаланушы орнын картаға қосу
            if (userLocationMarker) {
                almatyMap.removeLayer(userLocationMarker);
            }

            userLocationMarker = L.marker([latitude, longitude], {
                icon: L.icon({
                    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
                    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowSize: [41, 41]
                })
            }).addTo(almatyMap);

            userLocationMarker.bindPopup('<b>📍 Сіз осы жердесіз!</b>').openPopup();
            
            almatyMap.setView([latitude, longitude], 14);
            
            console.log(`✅ Пайдаланушы орны: ${latitude}, ${longitude}`);
        },
        (error) => {
            console.error('Геолокация қатесі:', error);
            alert('Орныңызды анықтау мүмкін болмады!');
        }
    );
}

/**
 * Бағыт алу (Google Maps-ке жіберу)
 */
function getDirections(lat, lng, placeName) {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLat = position.coords.latitude;
                const userLng = position.coords.longitude;
                
                // Google Maps маршрутын ашу
                const url = `https://www.google.com/maps/dir/${userLat},${userLng}/${lat},${lng}`;
                window.open(url, '_blank');
            },
            () => {
                // Егер геолокация жұмыс істемесе
                const url = `https://www.google.com/maps/dir//${lat},${lng}`;
                window.open(url, '_blank');
            }
        );
    } else {
        // Тікелей Google Maps-ті ашу
        const url = `https://www.google.com/maps/dir//${lat},${lng}`;
        window.open(url, '_blank');
    }
    
    console.log(`🧭 Бағыт алу: ${placeName}`);
}

/**
 * Іздеу функциясы (орын атауы бойынша)
 */
function searchPlaceOnMap(searchTerm) {
    const places = typeof searchPlaceByName === 'function' ? searchPlaceByName(searchTerm) : [];
    
    if (places.length === 0) {
        alert('Орын табылмады!');
        return;
    }

    // Бірінші табылған орынға фокустау
    const firstPlace = places[0];
    focusOnPlace(firstPlace.coordinates[0], firstPlace.coordinates[1], firstPlace.name);
}

// Popup үшін CSS стилі
const popupStyles = document.createElement('style');
popupStyles.textContent = `
    .custom-popup .leaflet-popup-content-wrapper {
        background: var(--dark-card);
        color: var(--light-text);
        border-radius: 15px;
        padding: 0;
        overflow: hidden;
    }

    .custom-popup .leaflet-popup-tip {
        background: var(--dark-card);
    }

    .map-popup {
        width: 280px;
    }

    .popup-image {
        width: 100%;
        height: 150px;
        object-fit: cover;
    }

    .map-popup h3 {
        padding: 1rem 1rem 0.5rem;
        margin: 0;
        font-size: 1.3rem;
        color: var(--accent-blue);
    }

    .map-popup p {
        padding: 0 1rem;
        margin: 0;
        font-size: 0.9rem;
        color: var(--gray-text);
        line-height: 1.4;
    }

    .popup-details {
        padding: 0.5rem 1rem;
        display: flex;
        gap: 1rem;
        font-size: 0.85rem;
    }

    .popup-btn {
        width: calc(50% - 0.5rem);
        padding: 0.7rem;
        margin: 0.5rem;
        background: var(--accent-blue);
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 0.85rem;
        transition: all 0.3s ease;
        display: inline-block;
    }

    .popup-btn:hover {
        background: #2563eb;
        transform: translateY(-2px);
    }

    .popup-btn.route-btn {
        background: var(--accent-green);
    }

    .popup-btn.route-btn:hover {
        background: #16a34a;
    }

    /* Карта контейнері */
    #almaty-map {
        width: 100%;
        height: 100%;
        border-radius: 20px;
    }

    /* Leaflet controls түстерін өзгерту */
    .leaflet-control-zoom a {
        background: var(--dark-card) !important;
        color: var(--light-text) !important;
    }

    .leaflet-control-zoom a:hover {
        background: var(--accent-blue) !important;
    }
`;
document.head.appendChild(popupStyles);

// Бет жүктелгенде картаны іске қосу
document.addEventListener('DOMContentLoaded', () => {
    // Leaflet жүктелгенін тексеру
    if (typeof L !== 'undefined') {
        // Картаның көрінуін күту үшін кішкене кідіріс
        setTimeout(() => {
            initMap();
        }, 100);
    } else {
        console.error('Leaflet library not loaded!');
        // Leaflet жүктелмесе, қайта тырысу
        setTimeout(() => {
            if (typeof L !== 'undefined') {
                initMap();
            } else {
                console.error('Leaflet кітапханасы жүктелмеді! Интернет байланысын тексеріңіз.');
            }
        }, 1000);
    }
});

// Терезе өлшемі өзгергенде картаны жаңарту
window.addEventListener('resize', () => {
    if (almatyMap) {
        almatyMap.invalidateSize();
    }
});

// Export (басқа модульдер үшін)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initMap,
        focusOnPlace,
        getUserLocation,
        getDirections,
        searchPlaceOnMap
    };
}
