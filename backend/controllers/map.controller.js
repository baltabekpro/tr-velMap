/**
 * ========================================
 * КОНТРОЛЛЕР КАРТЫ / MAP CONTROLLER
 * ========================================
 */

const DataStore = require('../utils/datastore');

const placesStore = new DataStore('places.json');

/**
 * GET /api/map/markers - Получить все маркеры для карты
 */
exports.getAllMarkers = (req, res) => {
    try {
        const places = placesStore.getAll();
        
        const markers = places.map(place => ({
            id: place.id,
            position: {
                lat: place.latitude,
                lng: place.longitude
            },
            title: {
                kk: place.name_kk,
                ru: place.name_ru,
                en: place.name_en
            },
            category: place.category,
            rating: place.rating,
            image: place.image_url,
            color: getCategoryColor(place.category),
            icon: getCategoryIcon(place.category)
        }));
        
        res.json({
            success: true,
            data: markers,
            count: markers.length,
            center: {
                lat: 43.2380,
                lng: 76.9490
            },
            zoom: 11
        });
    } catch (error) {
        console.error('Error in getAllMarkers:', error);
        res.status(500).json({
            success: false,
            error: 'Не удалось получить маркеры'
        });
    }
};

/**
 * GET /api/map/markers/:id - Получить маркер по ID
 */
exports.getMarkerById = (req, res) => {
    try {
        const { id } = req.params;
        const place = placesStore.getById(id);
        
        if (!place) {
            return res.status(404).json({
                success: false,
                error: 'Маркер не найден'
            });
        }
        
        const marker = {
            id: place.id,
            position: {
                lat: place.latitude,
                lng: place.longitude
            },
            title: {
                kk: place.name_kk,
                ru: place.name_ru,
                en: place.name_en
            },
            description: {
                kk: place.description_kk,
                ru: place.description_ru,
                en: place.description_en
            },
            category: place.category,
            rating: place.rating,
            image: place.image_url,
            details: place.details,
            color: getCategoryColor(place.category),
            icon: getCategoryIcon(place.category)
        };
        
        res.json({
            success: true,
            data: marker
        });
    } catch (error) {
        console.error('Error in getMarkerById:', error);
        res.status(500).json({
            success: false,
            error: 'Не удалось получить маркер'
        });
    }
};

/**
 * GET /api/map/bounds - Получить границы карты
 */
exports.getMapBounds = (req, res) => {
    try {
        const places = placesStore.getAll();
        
        if (places.length === 0) {
            return res.json({
                success: true,
                bounds: null
            });
        }
        
        const lats = places.map(p => p.latitude);
        const lngs = places.map(p => p.longitude);
        
        const bounds = {
            north: Math.max(...lats),
            south: Math.min(...lats),
            east: Math.max(...lngs),
            west: Math.min(...lngs)
        };
        
        res.json({
            success: true,
            bounds: bounds
        });
    } catch (error) {
        console.error('Error in getMapBounds:', error);
        res.status(500).json({
            success: false,
            error: 'Не удалось получить границы'
        });
    }
};

/**
 * POST /api/map/route - Построить маршрут между точками
 */
exports.calculateRoute = (req, res) => {
    try {
        const { from, to } = req.body;
        
        if (!from || !to) {
            return res.status(400).json({
                success: false,
                error: 'Необходимы координаты from и to'
            });
        }
        
        // Простой расчёт расстояния (формула гаверсинуса)
        const distance = calculateDistance(
            from.lat, from.lng,
            to.lat, to.lng
        );
        
        // Примерное время (60 км/ч средняя скорость)
        const timeMinutes = Math.round((distance / 60) * 60);
        
        res.json({
            success: true,
            route: {
                from: from,
                to: to,
                distance: Math.round(distance * 100) / 100, // км
                duration: timeMinutes, // минуты
                google_maps_url: `https://www.google.com/maps/dir/?api=1&origin=${from.lat},${from.lng}&destination=${to.lat},${to.lng}&travelmode=driving`
            }
        });
    } catch (error) {
        console.error('Error in calculateRoute:', error);
        res.status(500).json({
            success: false,
            error: 'Не удалось построить маршрут'
        });
    }
};

/**
 * Вспомогательные функции
 */

function getCategoryColor(category) {
    const colors = {
        sports: '#3b82f6',      // синий
        nature: '#22c55e',      // зелёный
        entertainment: '#a855f7', // фиолетовый
        shopping: '#f59e0b',    // оранжевый
        park: '#10b981',        // изумрудный
        culture: '#ec4899',     // розовый
        food: '#ef4444'         // красный
    };
    return colors[category] || '#6b7280'; // серый по умолчанию
}

function getCategoryIcon(category) {
    const icons = {
        sports: '⛷️',
        nature: '🏔️',
        entertainment: '🎡',
        shopping: '🛍️',
        park: '🌳',
        culture: '🎭',
        food: '🍽️'
    };
    return icons[category] || '📍';
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Радиус Земли в км
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(degrees) {
    return degrees * (Math.PI / 180);
}
