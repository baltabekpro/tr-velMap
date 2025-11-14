/**
 * ========================================
 * ОРЫНДАР КОНТРОЛЛЕРІ / PLACES CONTROLLER
 * ========================================
 * 
 * МАҚСАТЫ: Алматының демалыс орындарымен барлық операцияларды орындау
 * 
 * ФУНКЦИЯЛАРЫ:
 * - getAllPlaces()    - Барлық орындарды қайтару (сүзгілермен)
 * - getPlaceById()    - ID бойынша орынды табу және visit_count +1
 * - searchPlaces()    - Атауы, сипаттамасы бойынша іздеу
 * - createPlace()     - Жаңа орын қосу (болашақта админ үшін)
 * - updatePlace()     - Орынды жаңарту
 * - deletePlace()     - Орынды жою
 * 
 * ДЕРЕКТЕР ҚОЙМАСЫ: backend/data/places.json
 * БАСТАПҚЫ ДЕРЕКТЕР: 6 орын (Медеу, Көктөбе, БАО, Шымбұлақ, Президент паркі, Esentai)
 */

const DataStore = require('../utils/datastore');

// Деректер қоймасын инициализациялау
const placesStore = new DataStore('places.json');

// Егер файл бос болса, бастапқы деректерді қосу
if (placesStore.getAll().length === 0) {
    const initialPlaces = [
        {
            id: 1,
            name_kk: "Медеу",
            name_ru: "Медео",
            name_en: "Medeu",
            description_kk: "Әлемге әйгілі биіктегі мұз айдыны. Тамаша көрініс және спорт орны.",
            description_ru: "Всемирно известный высокогорный каток. Потрясающие виды и спортивный объект.",
            description_en: "World-famous high-altitude ice rink. Stunning views and sports facility.",
            category: "sports",
            latitude: 43.157496,
            longitude: 77.059031,
            image_url: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?q=80&w=2070",
            rating: 4.8,
            visit_count: 2547,
            details: {
                workingHours: { weekdays: "09:00 - 21:00", weekends: "08:00 - 22:00" },
                price: { min: 2000, max: 5000, currency: "KZT" },
                transport: [
                    { type: "bus", number: "6", description: "Алматы орталығынан №6 автобус" },
                    { type: "taxi", description: "Такси ~3000-4000₸" }
                ]
            }
        },
        {
            id: 2,
            name_kk: "Көктөбе",
            name_ru: "Кок-Тобе",
            name_en: "Kok-Tobe",
            description_kk: "Алматының символы - аспалы жолмен көтерілетін тау",
            description_ru: "Символ Алматы - гора с канатной дорогой",
            description_en: "Almaty symbol - mountain with cable car",
            category: "entertainment",
            latitude: 43.2325,
            longitude: 76.9564,
            image_url: "https://images.unsplash.com/photo-1606117234447-c4067f89e2e0?q=80&w=2070",
            rating: 4.7,
            visit_count: 3824,
            details: {
                workingHours: { weekdays: "10:00 - 23:00", weekends: "10:00 - 00:00" },
                price: { min: 1000, max: 3000, currency: "KZT" },
                transport: [
                    { type: "cable-car", description: "Аспалы жол" },
                    { type: "bus", number: "95, 99", description: "Автобус" }
                ]
            }
        },
        {
            id: 3,
            name_kk: "Үлкен Алматы көлі",
            name_ru: "Большое Алматинское озеро",
            name_en: "Big Almaty Lake",
            description_kk: "Таулардағы көгілдір көл, 2511 метр биіктікте",
            description_ru: "Голубое горное озеро на высоте 2511 метров",
            description_en: "Blue mountain lake at 2511 meters altitude",
            category: "nature",
            latitude: 43.0550,
            longitude: 76.9895,
            image_url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070",
            rating: 4.9,
            visit_count: 1923,
            details: {
                workingHours: { weekdays: "24/7", weekends: "24/7" },
                price: { min: 0, max: 0, currency: "KZT" },
                transport: [
                    { type: "taxi", description: "Только такси или личный автомобиль" }
                ]
            }
        },
        {
            id: 4,
            name_kk: "Шымбұлақ",
            name_ru: "Шымбулак",
            name_en: "Shymbulak",
            description_kk: "Тау-шаңғы курорты",
            description_ru: "Горнолыжный курорт",
            description_en: "Ski resort",
            category: "sports",
            latitude: 43.2378,
            longitude: 77.0833,
            image_url: "https://images.unsplash.com/photo-1551524164-687a55dd1126?q=80&w=2070",
            rating: 4.7,
            visit_count: 2156,
            details: {
                workingHours: { weekdays: "09:00 - 17:00", weekends: "09:00 - 18:00" },
                price: { min: 5000, max: 15000, currency: "KZT" },
                transport: [
                    { type: "cable-car", description: "Медеу арқылы гондол" }
                ]
            }
        },
        {
            id: 5,
            name_kk: "Бірінші Президент паркі",
            name_ru: "Парк Первого Президента",
            name_en: "First President Park",
            description_kk: "Қала орталығындағы үлкен демалыс паркі",
            description_ru: "Большой парк для отдыха в центре города",
            description_en: "Large recreation park in city center",
            category: "park",
            latitude: 43.2380,
            longitude: 76.9490,
            image_url: "https://images.unsplash.com/photo-1519331379826-f10be5486c6f?q=80&w=2070",
            rating: 4.5,
            visit_count: 4521,
            details: {
                workingHours: { weekdays: "06:00 - 23:00", weekends: "06:00 - 23:00" },
                price: { min: 0, max: 0, currency: "KZT" },
                transport: [
                    { type: "metro", description: "Станция Абай" },
                    { type: "bus", number: "множество маршрутов", description: "Много автобусов" }
                ]
            }
        },
        {
            id: 6,
            name_kk: "Esentai Mall",
            name_ru: "Есентай Молл",
            name_en: "Esentai Mall",
            description_kk: "Қаланың ең үлкен сауда орталығы",
            description_ru: "Крупнейший торговый центр города",
            description_en: "Largest shopping mall in the city",
            category: "shopping",
            latitude: 43.2195,
            longitude: 76.9317,
            image_url: "https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?q=80&w=2070",
            rating: 4.6,
            visit_count: 5892,
            details: {
                workingHours: { weekdays: "10:00 - 22:00", weekends: "10:00 - 22:00" },
                price: { min: 0, max: 0, currency: "KZT" },
                transport: [
                    { type: "bus", number: "множество", description: "Все общественные маршруты" }
                ]
            }
        }
    ];
    
    initialPlaces.forEach(place => placesStore.add(place));
    console.log('✅ Места инициализированы');
}

/**
 * Получить все места
 */
exports.getAllPlaces = (req, res) => {
    try {
        const { category, search, limit = 50 } = req.query;
        
        let places = placesStore.getAll();
        
        // Фильтр по категории
        if (category) {
            places = places.filter(p => p.category === category);
        }
        
        // Поиск
        if (search) {
            const searchLower = search.toLowerCase();
            places = places.filter(p => 
                p.name_kk.toLowerCase().includes(searchLower) ||
                p.name_ru.toLowerCase().includes(searchLower) ||
                p.name_en.toLowerCase().includes(searchLower)
            );
        }
        
        // Сортировка по рейтингу
        places.sort((a, b) => (b.rating - a.rating) || (b.visit_count - a.visit_count));
        
        // Лимит
        places = places.slice(0, parseInt(limit));
        
        res.json({
            success: true,
            data: places,
            count: places.length
        });
    } catch (error) {
        console.error('Error in getAllPlaces:', error);
        res.status(500).json({
            success: false,
            error: 'Не удалось получить места',
            message: error.message
        });
    }
};

/**
 * Получить место по ID
 */
exports.getPlaceById = (req, res) => {
    try {
        const { id } = req.params;
        const place = placesStore.getById(id);
        
        if (!place) {
            return res.status(404).json({
                success: false,
                error: 'Место не найдено'
            });
        }
        
        // Увеличиваем счётчик посещений
        placesStore.incrementVisitCount(id);
        
        res.json({
            success: true,
            data: place
        });
    } catch (error) {
        console.error('Error in getPlaceById:', error);
        res.status(500).json({
            success: false,
            error: 'Не удалось получить место'
        });
    }
};

/**
 * Получить места по категории
 */
exports.getPlacesByCategory = (req, res) => {
    try {
        const { category } = req.params;
        const places = placesStore.filter(p => p.category === category);
        places.sort((a, b) => b.rating - a.rating);
        
        res.json({
            success: true,
            data: places,
            count: places.length
        });
    } catch (error) {
        console.error('Error in getPlacesByCategory:', error);
        res.status(500).json({
            success: false,
            error: 'Не удалось получить места'
        });
    }
};

/**
 * Поиск мест
 */
exports.searchPlaces = (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q) {
            return res.status(400).json({
                success: false,
                error: 'Параметр поиска обязателен'
            });
        }
        
        const searchLower = q.toLowerCase();
        const places = placesStore.filter(p =>
            p.name_kk.toLowerCase().includes(searchLower) ||
            p.name_ru.toLowerCase().includes(searchLower) ||
            p.name_en.toLowerCase().includes(searchLower) ||
            (p.description_kk && p.description_kk.toLowerCase().includes(searchLower)) ||
            (p.description_ru && p.description_ru.toLowerCase().includes(searchLower)) ||
            (p.description_en && p.description_en.toLowerCase().includes(searchLower))
        );
        
        places.sort((a, b) => b.rating - a.rating);
        
        res.json({
            success: true,
            data: places.slice(0, 20),
            count: places.length
        });
    } catch (error) {
        console.error('Error in searchPlaces:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка поиска'
        });
    }
};

/**
 * Создать новое место
 */
exports.createPlace = (req, res) => {
    try {
        const place = req.body;
        const newPlace = placesStore.add(place);
        
        res.status(201).json({
            success: true,
            data: newPlace
        });
    } catch (error) {
        console.error('Error in createPlace:', error);
        res.status(500).json({
            success: false,
            error: 'Не удалось создать место'
        });
    }
};

/**
 * Обновить место
 */
exports.updatePlace = (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        const updated = placesStore.update(id, updates);
        
        if (!updated) {
            return res.status(404).json({
                success: false,
                error: 'Место не найдено'
            });
        }
        
        res.json({
            success: true,
            data: updated
        });
    } catch (error) {
        console.error('Error in updatePlace:', error);
        res.status(500).json({
            success: false,
            error: 'Не удалось обновить место'
        });
    }
};

/**
 * Удалить место
 */
exports.deletePlace = (req, res) => {
    try {
        const { id } = req.params;
        const deleted = placesStore.delete(id);
        
        if (!deleted) {
            return res.status(404).json({
                success: false,
                error: 'Место не найдено'
            });
        }
        
        res.json({
            success: true,
            message: 'Место удалено',
            data: deleted
        });
    } catch (error) {
        console.error('Error in deletePlace:', error);
        res.status(500).json({
            success: false,
            error: 'Не удалось удалить место'
        });
    }
};

/**
 * Добавить в избранное
 */
exports.addToFavorites = (req, res) => {
    res.json({
        success: true,
        message: 'Добавлено в избранное (реализуйте аутентификацию)'
    });
};

/**
 * Добавить отзыв
 */
exports.addReview = (req, res) => {
    res.json({
        success: true,
        message: 'Отзыв добавлен (реализуйте аутентификацию)'
    });
};
