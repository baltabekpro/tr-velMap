/**
 * ========================================
 * ОРЫНДАР КОНТРОЛЛЕРІ / PLACES CONTROLLER
 * ========================================
 * 
 * МАҚСАТЫ: Алматының демалыс орындарымен барлық операцияларды орындау
 * ДЕРЕКТЕР ҚОЙМАСЫ: SQLite database (db/travelmap.db)
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../../db/travelmap.db');

/**
 * Форматирование места для ответа
 */
function formatPlace(place) {
    return {
        id: place.id,
        name_kk: place.name_kk,
        name_ru: place.name_ru,
        name_en: place.name_en,
        description_kk: place.description_kk,
        description_ru: place.description_ru,
        description_en: place.description_en,
        category: place.category,
        latitude: place.latitude,
        longitude: place.longitude,
        image_url: place.image_url,
        rating: place.rating || 0,
        visit_count: place.visit_count || 0,
        details: {
            workingHours: {
                weekdays: place.working_hours_weekdays,
                weekends: place.working_hours_weekends
            },
            price: {
                min: place.price_min,
                max: place.price_max,
                currency: place.price_currency
            },
            transport: place.transport_info ? JSON.parse(place.transport_info) : []
        },
        status: place.status,
        created_at: place.created_at,
        updated_at: place.updated_at
    };
}

/**
 * GET /api/places - Получить все места
 */
exports.getAllPlaces = (req, res) => {
    const { category, search, limit = 50 } = req.query;
    
    const db = new sqlite3.Database(dbPath);
    
    let query = `
        SELECT p.*, 
               COUNT(DISTINCT pr.id) as review_count
        FROM places p
        LEFT JOIN user_reviews pr ON p.id = pr.place_id
        WHERE p.status = ?
    `;
    const params = ['active'];
    
    // Фильтр по категории
    if (category) {
        query += ' AND p.category = ?';
        params.push(category);
    }
    
    // Поиск
    if (search) {
        query += ' AND (p.name_kk LIKE ? OR p.name_ru LIKE ? OR p.name_en LIKE ?)';
        const searchPattern = `%${search}%`;
        params.push(searchPattern, searchPattern, searchPattern);
    }
    
    // Группировка, сортировка и лимит
    query += ' GROUP BY p.id ORDER BY p.rating DESC, p.visit_count DESC LIMIT ?';
    params.push(parseInt(limit));
    
    db.all(query, params, (err, rows) => {
        db.close();
        
        if (err) {
            console.error('Error in getAllPlaces:', err);
            return res.status(500).json({
                success: false,
                error: 'Не удалось получить места'
            });
        }
        
        const places = rows.map(place => ({
            ...formatPlace(place),
            review_count: place.review_count || 0
        }));
        
        res.json({
            success: true,
            data: places,
            count: places.length
        });
    });
};

/**
 * GET /api/places/:id - Получить место по ID
 */
exports.getPlaceById = (req, res) => {
    const { id } = req.params;
    
    const db = new sqlite3.Database(dbPath);
    
    // Получаем место
    db.get('SELECT * FROM places WHERE id = ?', [id], (err, place) => {
        if (err) {
            db.close();
            console.error('Error in getPlaceById:', err);
            return res.status(500).json({
                success: false,
                error: 'Не удалось получить место'
            });
        }
        
        if (!place) {
            db.close();
            return res.status(404).json({
                success: false,
                error: 'Место не найдено'
            });
        }
        
        // Увеличиваем счётчик посещений
        db.run('UPDATE places SET visit_count = visit_count + 1 WHERE id = ?', [id], (err) => {
            if (err) {
                console.error('Error incrementing visit count:', err);
            }
        });
        
        // Получаем отзывы
        db.all(
            `SELECT ur.*, u.username, u.full_name, u.avatar_url
             FROM user_reviews ur
             JOIN users u ON ur.user_id = u.id
             WHERE ur.place_id = ? AND ur.status = 'published'
             ORDER BY ur.created_at DESC
             LIMIT 10`,
            [id],
            (err, reviews) => {
                db.close();
                
                if (err) {
                    console.error('Error getting reviews:', err);
                }
                
                const formattedPlace = formatPlace(place);
                formattedPlace.reviews = reviews || [];
                
                res.json({
                    success: true,
                    data: formattedPlace
                });
            }
        );
    });
};

/**
 * GET /api/places/category/:category - Получить места по категории
 */
exports.getPlacesByCategory = (req, res) => {
    const { category } = req.params;
    
    const db = new sqlite3.Database(dbPath);
    
    db.all(
        'SELECT * FROM places WHERE category = ? AND status = ? ORDER BY rating DESC',
        [category, 'active'],
        (err, rows) => {
            db.close();
            
            if (err) {
                console.error('Error in getPlacesByCategory:', err);
                return res.status(500).json({
                    success: false,
                    error: 'Не удалось получить места'
                });
            }
            
            const places = rows.map(formatPlace);
            
            res.json({
                success: true,
                data: places,
                count: places.length
            });
        }
    );
};

/**
 * GET /api/places/search - Поиск мест
 */
exports.searchPlaces = (req, res) => {
    const { q } = req.query;
    
    if (!q) {
        return res.status(400).json({
            success: false,
            error: 'Параметр поиска обязателен'
        });
    }
    
    const db = new sqlite3.Database(dbPath);
    const searchPattern = `%${q}%`;
    
    db.all(
        `SELECT * FROM places 
         WHERE (name_kk LIKE ? OR name_ru LIKE ? OR name_en LIKE ? 
                OR description_kk LIKE ? OR description_ru LIKE ? OR description_en LIKE ?)
         AND status = ?
         ORDER BY rating DESC LIMIT 20`,
        [searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, 'active'],
        (err, rows) => {
            db.close();
            
            if (err) {
                console.error('Error in searchPlaces:', err);
                return res.status(500).json({
                    success: false,
                    error: 'Ошибка поиска'
                });
            }
            
            const places = rows.map(formatPlace);
            
            res.json({
                success: true,
                data: places,
                count: places.length
            });
        }
    );
};

/**
 * POST /api/places - Создать новое место (только для админа)
 */
exports.createPlace = (req, res) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            error: 'Доступ запрещен'
        });
    }
    
    const {
        name_kk, name_ru, name_en,
        description_kk, description_ru, description_en,
        category, latitude, longitude, image_url,
        working_hours_weekdays, working_hours_weekends,
        price_min, price_max, transport_info
    } = req.body;
    
    // Валидация
    if (!name_kk || !name_ru || !name_en || !category || !latitude || !longitude) {
        return res.status(400).json({
            success: false,
            error: 'Обязательные поля: name_kk, name_ru, name_en, category, latitude, longitude'
        });
    }
    
    const db = new sqlite3.Database(dbPath);
    
    db.run(
        `INSERT INTO places (
            name_kk, name_ru, name_en,
            description_kk, description_ru, description_en,
            category, latitude, longitude, image_url,
            working_hours_weekdays, working_hours_weekends,
            price_min, price_max, transport_info, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            name_kk, name_ru, name_en,
            description_kk, description_ru, description_en,
            category, latitude, longitude, image_url,
            working_hours_weekdays, working_hours_weekends,
            price_min || 0, price_max || 0,
            transport_info ? JSON.stringify(transport_info) : null,
            req.user.id
        ],
        function(err) {
            if (err) {
                db.close();
                console.error('Error in createPlace:', err);
                return res.status(500).json({
                    success: false,
                    error: 'Не удалось создать место'
                });
            }
            
            const placeId = this.lastID;
            
            // Логируем действие админа
            db.run(
                'INSERT INTO admin_logs (admin_id, action, target_type, target_id, description) VALUES (?, ?, ?, ?, ?)',
                [req.user.id, 'create_place', 'place', placeId, `Создано место: ${name_ru}`]
            );
            
            // Получаем созданное место
            db.get('SELECT * FROM places WHERE id = ?', [placeId], (err, place) => {
                db.close();
                
                if (err || !place) {
                    return res.status(500).json({
                        success: false,
                        error: 'Место создано, но не удалось получить данные'
                    });
                }
                
                res.status(201).json({
                    success: true,
                    data: formatPlace(place)
                });
            });
        }
    );
};

/**
 * PUT /api/places/:id - Обновить место (только для админа)
 */
exports.updatePlace = (req, res) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            error: 'Доступ запрещен'
        });
    }
    
    const { id } = req.params;
    const updates = req.body;
    
    const db = new sqlite3.Database(dbPath);
    
    // Проверяем существование места
    db.get('SELECT * FROM places WHERE id = ?', [id], (err, place) => {
        if (err || !place) {
            db.close();
            return res.status(404).json({
                success: false,
                error: 'Место не найдено'
            });
        }
        
        // Строим запрос обновления
        const allowedFields = [
            'name_kk', 'name_ru', 'name_en',
            'description_kk', 'description_ru', 'description_en',
            'category', 'latitude', 'longitude', 'image_url',
            'working_hours_weekdays', 'working_hours_weekends',
            'price_min', 'price_max', 'status'
        ];
        
        const updateFields = [];
        const updateValues = [];
        
        Object.keys(updates).forEach(key => {
            if (allowedFields.includes(key)) {
                updateFields.push(`${key} = ?`);
                if (key === 'transport_info' && typeof updates[key] === 'object') {
                    updateValues.push(JSON.stringify(updates[key]));
                } else {
                    updateValues.push(updates[key]);
                }
            }
        });
        
        if (updateFields.length === 0) {
            db.close();
            return res.status(400).json({
                success: false,
                error: 'Нет полей для обновления'
            });
        }
        
        updateFields.push('updated_at = datetime("now")');
        updateValues.push(id);
        
        const query = `UPDATE places SET ${updateFields.join(', ')} WHERE id = ?`;
        
        db.run(query, updateValues, (err) => {
            if (err) {
                db.close();
                console.error('Error in updatePlace:', err);
                return res.status(500).json({
                    success: false,
                    error: 'Не удалось обновить место'
                });
            }
            
            // Логируем действие
            db.run(
                'INSERT INTO admin_logs (admin_id, action, target_type, target_id, description) VALUES (?, ?, ?, ?, ?)',
                [req.user.id, 'update_place', 'place', id, `Обновлено место: ${place.name_ru}`]
            );
            
            // Получаем обновленное место
            db.get('SELECT * FROM places WHERE id = ?', [id], (err, updatedPlace) => {
                db.close();
                
                if (err || !updatedPlace) {
                    return res.status(500).json({
                        success: false,
                        error: 'Место обновлено, но не удалось получить данные'
                    });
                }
                
                res.json({
                    success: true,
                    data: formatPlace(updatedPlace)
                });
            });
        });
    });
};

/**
 * DELETE /api/places/:id - Удалить место (только для админа)
 */
exports.deletePlace = (req, res) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            error: 'Доступ запрещен'
        });
    }
    
    const { id } = req.params;
    
    const db = new sqlite3.Database(dbPath);
    
    // Проверяем существование места
    db.get('SELECT * FROM places WHERE id = ?', [id], (err, place) => {
        if (err || !place) {
            db.close();
            return res.status(404).json({
                success: false,
                error: 'Место не найдено'
            });
        }
        
        // Мягкое удаление (меняем статус)
        db.run('UPDATE places SET status = ? WHERE id = ?', ['inactive', id], (err) => {
            if (err) {
                db.close();
                console.error('Error in deletePlace:', err);
                return res.status(500).json({
                    success: false,
                    error: 'Не удалось удалить место'
                });
            }
            
            // Логируем действие
            db.run(
                'INSERT INTO admin_logs (admin_id, action, target_type, target_id, description) VALUES (?, ?, ?, ?, ?)',
                [req.user.id, 'delete_place', 'place', id, `Удалено место: ${place.name_ru}`],
                () => {
                    db.close();
                    
                    res.json({
                        success: true,
                        message: 'Место удалено',
                        data: formatPlace(place)
                    });
                }
            );
        });
    });
};

/**
 * DELETE /api/places/:placeId/reviews/:reviewId - Удалить отзыв (только для админа)
 */
exports.deleteReview = (req, res) => {
    const { placeId, reviewId } = req.params;
    
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            error: 'Рұқсат жоқ. Әкімші рөлі қажет.'
        });
    }

    const db = new sqlite3.Database(dbPath);

    // Получаем информацию об отзыве перед удалением
    db.get('SELECT * FROM user_reviews WHERE id = ? AND place_id = ?', [reviewId, placeId], (err, review) => {
        if (err) {
            db.close();
            console.error('Ошибка получения отзыва:', err);
            return res.status(500).json({
                success: false,
                error: 'Қате орын алды'
            });
        }

        if (!review) {
            db.close();
            return res.status(404).json({
                success: false,
                error: 'Пікір табылмады'
            });
        }

        // Удаляем лайки отзыва
        db.run('DELETE FROM review_likes WHERE review_id = ?', [reviewId], (err) => {
            if (err) {
                console.error('Ошибка удаления лайков:', err);
            }

            // Удаляем отзыв
            db.run('DELETE FROM user_reviews WHERE id = ?', [reviewId], (err) => {
                if (err) {
                    db.close();
                    console.error('Ошибка удаления отзыва:', err);
                    return res.status(500).json({
                        success: false,
                        error: 'Қате орын алды'
                    });
                }

                // Логируем действие
                db.run(
                    'INSERT INTO admin_logs (admin_id, action, target_type, target_id, description) VALUES (?, ?, ?, ?, ?)',
                    [req.user.id, 'delete_review', 'review', reviewId, `Удален отзыв пользователя ${review.user_id} для места ${placeId}`],
                    () => {
                        db.close();
                        
                        res.json({
                            success: true,
                            message: 'Пікір сәтті жойылды'
                        });
                    }
                );
            });
        });
    });
};

module.exports = exports;
