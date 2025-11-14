/**
 * ========================================
 * ПОЛЬЗОВАТЕЛЬ-МЕСТА КОНТРОЛЛЕР
 * ========================================
 * 
 * Управление взаимодействием пользователей с местами:
 * - Избранное
 * - Рейтинги
 * - Отзывы
 * - История посещений
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../../db/travelmap.db');

/**
 * POST /api/places/:id/favorite - Добавить в избранное
 */
exports.addToFavorites = (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Требуется аутентификация'
        });
    }
    
    const { id } = req.params;
    const { notes } = req.body;
    
    const db = new sqlite3.Database(dbPath);
    
    // Проверяем существование места
    db.get('SELECT id FROM places WHERE id = ?', [id], (err, place) => {
        if (err || !place) {
            db.close();
            return res.status(404).json({
                success: false,
                error: 'Место не найдено'
            });
        }
        
        // Добавляем в избранное
        db.run(
            'INSERT INTO user_favorites (user_id, place_id, notes) VALUES (?, ?, ?)',
            [req.user.id, id, notes || null],
            (err) => {
                if (err) {
                    db.close();
                    // Проверяем дубликат
                    if (err.message.includes('UNIQUE')) {
                        return res.status(409).json({
                            success: false,
                            error: 'Место уже в избранном'
                        });
                    }
                    console.error('Error in addToFavorites:', err);
                    return res.status(500).json({
                        success: false,
                        error: 'Не удалось добавить в избранное'
                    });
                }
                
                // Обновляем статистику
                db.run(
                    'UPDATE user_stats SET total_favorites = total_favorites + 1 WHERE user_id = ?',
                    [req.user.id]
                );
                
                db.close();
                
                res.json({
                    success: true,
                    message: 'Место добавлено в избранное'
                });
            }
        );
    });
};

/**
 * DELETE /api/places/:id/favorite - Удалить из избранного
 */
exports.removeFromFavorites = (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Требуется аутентификация'
        });
    }
    
    const { id } = req.params;
    
    const db = new sqlite3.Database(dbPath);
    
    db.run(
        'DELETE FROM user_favorites WHERE user_id = ? AND place_id = ?',
        [req.user.id, id],
        function(err) {
            if (err) {
                db.close();
                console.error('Error in removeFromFavorites:', err);
                return res.status(500).json({
                    success: false,
                    error: 'Не удалось удалить из избранного'
                });
            }
            
            if (this.changes === 0) {
                db.close();
                return res.status(404).json({
                    success: false,
                    error: 'Место не найдено в избранном'
                });
            }
            
            // Обновляем статистику
            db.run(
                'UPDATE user_stats SET total_favorites = total_favorites - 1 WHERE user_id = ?',
                [req.user.id]
            );
            
            db.close();
            
            res.json({
                success: true,
                message: 'Место удалено из избранного'
            });
        }
    );
};

/**
 * GET /api/user/favorites - Получить избранные места
 */
exports.getFavorites = (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Требуется аутентификация'
        });
    }
    
    const db = new sqlite3.Database(dbPath);
    
    db.all(
        `SELECT p.*, uf.notes, uf.added_at
         FROM user_favorites uf
         JOIN places p ON uf.place_id = p.id
         WHERE uf.user_id = ? AND p.status = 'active'
         ORDER BY uf.added_at DESC`,
        [req.user.id],
        (err, rows) => {
            db.close();
            
            if (err) {
                console.error('Error in getFavorites:', err);
                return res.status(500).json({
                    success: false,
                    error: 'Не удалось получить избранное'
                });
            }
            
            res.json({
                success: true,
                data: rows,
                count: rows.length
            });
        }
    );
};

/**
 * POST /api/places/:id/rating - Поставить рейтинг (можно только раз)
 */
exports.ratePlace = (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Требуется аутентификация'
        });
    }
    
    const { id } = req.params;
    const { rating } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({
            success: false,
            error: 'Рейтинг должен быть от 1 до 5'
        });
    }
    
    const db = new sqlite3.Database(dbPath);
    
    // Проверяем существование места
    db.get('SELECT id FROM places WHERE id = ?', [id], (err, place) => {
        if (err || !place) {
            db.close();
            return res.status(404).json({
                success: false,
                error: 'Место не найдено'
            });
        }
        
        // Проверяем, не ставил ли уже пользователь рейтинг
        db.get(
            'SELECT id, rating FROM place_ratings WHERE place_id = ? AND user_id = ?',
            [id, req.user.id],
            (err, existingRating) => {
                if (err) {
                    db.close();
                    console.error('Error checking existing rating:', err);
                    return res.status(500).json({
                        success: false,
                        error: 'Ошибка проверки рейтинга'
                    });
                }
                
                if (existingRating) {
                    // Обновляем существующий рейтинг
                    db.run(
                        'UPDATE place_ratings SET rating = ?, updated_at = datetime("now") WHERE id = ?',
                        [rating, existingRating.id],
                        (err) => {
                            if (err) {
                                db.close();
                                console.error('Error updating rating:', err);
                                return res.status(500).json({
                                    success: false,
                                    error: 'Не удалось обновить рейтинг'
                                });
                            }
                            
                            updatePlaceRating(db, id, () => {
                                res.json({
                                    success: true,
                                    message: 'Рейтинг обновлен'
                                });
                            });
                        }
                    );
                } else {
                    // Добавляем новый рейтинг
                    db.run(
                        'INSERT INTO place_ratings (place_id, user_id, rating) VALUES (?, ?, ?)',
                        [id, req.user.id, rating],
                        (err) => {
                            if (err) {
                                db.close();
                                console.error('Error adding rating:', err);
                                return res.status(500).json({
                                    success: false,
                                    error: 'Не удалось добавить рейтинг'
                                });
                            }
                            
                            updatePlaceRating(db, id, () => {
                                res.json({
                                    success: true,
                                    message: 'Рейтинг добавлен'
                                });
                            });
                        }
                    );
                }
            }
        );
    });
};

/**
 * Обновить средний рейтинг места
 */
function updatePlaceRating(db, placeId, callback) {
    db.get(
        'SELECT AVG(rating) as avg_rating FROM place_ratings WHERE place_id = ?',
        [placeId],
        (err, result) => {
            if (err) {
                console.error('Error calculating average rating:', err);
                db.close();
                return callback();
            }
            
            const avgRating = result.avg_rating ? Math.round(result.avg_rating * 10) / 10 : 0;
            
            db.run(
                'UPDATE places SET rating = ? WHERE id = ?',
                [avgRating, placeId],
                () => {
                    db.close();
                    callback();
                }
            );
        }
    );
}

/**
 * POST /api/places/:id/review - Добавить отзыв
 */
exports.addReview = (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Требуется аутентификация'
        });
    }
    
    const { id } = req.params;
    const { rating, title, content, photos } = req.body;
    
    if (!rating || !content) {
        return res.status(400).json({
            success: false,
            error: 'Рейтинг и содержание обязательны'
        });
    }
    
    if (rating < 1 || rating > 5) {
        return res.status(400).json({
            success: false,
            error: 'Рейтинг должен быть от 1 до 5'
        });
    }
    
    const db = new sqlite3.Database(dbPath);
    
    // Проверяем существование места
    db.get('SELECT id FROM places WHERE id = ?', [id], (err, place) => {
        if (err || !place) {
            db.close();
            return res.status(404).json({
                success: false,
                error: 'Место не найдено'
            });
        }
        
        // Добавляем отзыв
        db.run(
            `INSERT INTO user_reviews (user_id, place_id, rating, title, content, photos)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [req.user.id, id, rating, title, content, photos ? JSON.stringify(photos) : null],
            function(err) {
                if (err) {
                    db.close();
                    console.error('Error in addReview:', err);
                    return res.status(500).json({
                        success: false,
                        error: 'Не удалось добавить отзыв'
                    });
                }
                
                const reviewId = this.lastID;
                
                // Обновляем статистику
                db.run(
                    'UPDATE user_stats SET total_reviews = total_reviews + 1 WHERE user_id = ?',
                    [req.user.id]
                );
                
                // Получаем созданный отзыв
                db.get(
                    `SELECT ur.*, u.username, u.full_name, u.avatar_url
                     FROM user_reviews ur
                     JOIN users u ON ur.user_id = u.id
                     WHERE ur.id = ?`,
                    [reviewId],
                    (err, review) => {
                        db.close();
                        
                        if (err || !review) {
                            return res.status(500).json({
                                success: false,
                                error: 'Отзыв добавлен, но не удалось получить данные'
                            });
                        }
                        
                        res.status(201).json({
                            success: true,
                            data: review
                        });
                    }
                );
            }
        );
    });
};

/**
 * POST /api/places/:id/like - Лайк отзыва
 */
exports.likeReview = (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Требуется аутентификация'
        });
    }
    
    const { reviewId } = req.body;
    
    if (!reviewId) {
        return res.status(400).json({
            success: false,
            error: 'ID отзыва обязателен'
        });
    }
    
    const db = new sqlite3.Database(dbPath);
    
    // Проверяем существование отзыва
    db.get('SELECT id FROM user_reviews WHERE id = ?', [reviewId], (err, review) => {
        if (err || !review) {
            db.close();
            return res.status(404).json({
                success: false,
                error: 'Отзыв не найден'
            });
        }
        
        // Добавляем лайк
        db.run(
            'INSERT INTO review_likes (review_id, user_id) VALUES (?, ?)',
            [reviewId, req.user.id],
            (err) => {
                if (err) {
                    db.close();
                    if (err.message.includes('UNIQUE')) {
                        return res.status(409).json({
                            success: false,
                            error: 'Вы уже поставили лайк'
                        });
                    }
                    console.error('Error in likeReview:', err);
                    return res.status(500).json({
                        success: false,
                        error: 'Не удалось поставить лайк'
                    });
                }
                
                // Обновляем счетчик лайков
                db.run(
                    'UPDATE user_reviews SET likes_count = likes_count + 1 WHERE id = ?',
                    [reviewId],
                    () => {
                        db.close();
                        
                        res.json({
                            success: true,
                            message: 'Лайк добавлен'
                        });
                    }
                );
            }
        );
    });
};

/**
 * DELETE /api/places/:id/like - Убрать лайк с отзыва
 */
exports.unlikeReview = (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Требуется аутентификация'
        });
    }
    
    const { reviewId } = req.body;
    
    if (!reviewId) {
        return res.status(400).json({
            success: false,
            error: 'ID отзыва обязателен'
        });
    }
    
    const db = new sqlite3.Database(dbPath);
    
    db.run(
        'DELETE FROM review_likes WHERE review_id = ? AND user_id = ?',
        [reviewId, req.user.id],
        function(err) {
            if (err) {
                db.close();
                console.error('Error in unlikeReview:', err);
                return res.status(500).json({
                    success: false,
                    error: 'Не удалось убрать лайк'
                });
            }
            
            if (this.changes === 0) {
                db.close();
                return res.status(404).json({
                    success: false,
                    error: 'Лайк не найден'
                });
            }
            
            // Обновляем счетчик лайков
            db.run(
                'UPDATE user_reviews SET likes_count = likes_count - 1 WHERE id = ?',
                [reviewId],
                () => {
                    db.close();
                    
                    res.json({
                        success: true,
                        message: 'Лайк удален'
                    });
                }
            );
        }
    );
};

/**
 * POST /api/places/:id/visit - Добавить в историю посещений
 */
exports.addVisit = (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Требуется аутентификация'
        });
    }
    
    const { id } = req.params;
    const { visit_date, rating, review, photos } = req.body;
    
    const db = new sqlite3.Database(dbPath);
    
    // Проверяем существование места
    db.get('SELECT id FROM places WHERE id = ?', [id], (err, place) => {
        if (err || !place) {
            db.close();
            return res.status(404).json({
                success: false,
                error: 'Место не найдено'
            });
        }
        
        // Добавляем посещение
        db.run(
            `INSERT INTO user_visits (user_id, place_id, visit_date, rating, review, photos)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                req.user.id, id,
                visit_date || new Date().toISOString().split('T')[0],
                rating, review,
                photos ? JSON.stringify(photos) : null
            ],
            (err) => {
                if (err) {
                    db.close();
                    console.error('Error in addVisit:', err);
                    return res.status(500).json({
                        success: false,
                        error: 'Не удалось добавить посещение'
                    });
                }
                
                // Обновляем статистику
                db.run(
                    'UPDATE user_stats SET total_visits = total_visits + 1 WHERE user_id = ?',
                    [req.user.id]
                );
                
                db.close();
                
                res.json({
                    success: true,
                    message: 'Посещение добавлено'
                });
            }
        );
    });
};

/**
 * GET /api/user/visits - Получить историю посещений
 */
exports.getVisits = (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Требуется аутентификация'
        });
    }
    
    const db = new sqlite3.Database(dbPath);
    
    db.all(
        `SELECT uv.*, p.name_kk, p.name_ru, p.name_en, p.image_url, p.category
         FROM user_visits uv
         JOIN places p ON uv.place_id = p.id
         WHERE uv.user_id = ?
         ORDER BY uv.visit_date DESC, uv.created_at DESC`,
        [req.user.id],
        (err, rows) => {
            db.close();
            
            if (err) {
                console.error('Error in getVisits:', err);
                return res.status(500).json({
                    success: false,
                    error: 'Не удалось получить историю посещений'
                });
            }
            
            res.json({
                success: true,
                data: rows,
                count: rows.length
            });
        }
    );
};

module.exports = exports;
