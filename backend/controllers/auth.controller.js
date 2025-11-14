/**
 * ========================================
 * КОНТРОЛЛЕР АУТЕНТИФИКАЦИИ / AUTH CONTROLLER
 * ========================================
 */

const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const path = require('path');

const dbPath = path.join(__dirname, '../../db/travelmap.db');

/**
 * Генерация токена
 */
function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * POST /api/auth/register - Регистрация
 */
exports.register = (req, res) => {
    const { username, email, password, full_name } = req.body;
    
    // Валидация
    if (!username || !email || !password || !full_name) {
        return res.status(400).json({
            success: false,
            error: 'Все поля обязательны'
        });
    }
    
    const db = new sqlite3.Database(dbPath);
    
    // Проверка существования пользователя
    db.get(
        'SELECT id FROM users WHERE username = ? OR email = ?',
        [username, email],
        (err, existingUser) => {
            if (err) {
                db.close();
                console.error('Error checking existing user:', err);
                return res.status(500).json({
                    success: false,
                    error: 'Ошибка проверки пользователя'
                });
            }
            
            if (existingUser) {
                db.close();
                return res.status(409).json({
                    success: false,
                    error: 'Пользователь с таким именем или email уже существует'
                });
            }
            
            // Хэширование пароля
            bcrypt.hash(password, 10, (err, hashedPassword) => {
                if (err) {
                    db.close();
                    console.error('Error hashing password:', err);
                    return res.status(500).json({
                        success: false,
                        error: 'Ошибка регистрации'
                    });
                }
                
                // Создание пользователя
                db.run(
                    `INSERT INTO users (username, email, password_hash, full_name, role, status)
                     VALUES (?, ?, ?, ?, 'user', 'active')`,
                    [username, email, hashedPassword, full_name],
                    function(err) {
                        if (err) {
                            db.close();
                            console.error('Error creating user:', err);
                            return res.status(500).json({
                                success: false,
                                error: 'Ошибка создания пользователя'
                            });
                        }
                        
                        const userId = this.lastID;
                        
                        // Создаем записи в таблицах настроек и статистики
                        db.run('INSERT INTO user_privacy_settings (user_id) VALUES (?)', [userId]);
                        db.run('INSERT INTO user_stats (user_id) VALUES (?)', [userId]);
                        
                        // Создание токена
                        const token = generateToken();
                        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 дней
                        
                        db.run(
                            'INSERT INTO user_sessions (user_id, token, expires_at) VALUES (?, ?, ?)',
                            [userId, token, expiresAt.toISOString()],
                            (err) => {
                                if (err) {
                                    db.close();
                                    console.error('Error creating session:', err);
                                    return res.status(500).json({
                                        success: false,
                                        error: 'Пользователь создан, но ошибка создания сессии'
                                    });
                                }
                                
                                // Получаем созданного пользователя
                                db.get(
                                    'SELECT id, username, email, full_name, role, status FROM users WHERE id = ?',
                                    [userId],
                                    (err, user) => {
                                        db.close();
                                        
                                        if (err || !user) {
                                            return res.status(500).json({
                                                success: false,
                                                error: 'Ошибка получения данных пользователя'
                                            });
                                        }
                                        
                                        res.status(201).json({
                                            success: true,
                                            message: 'Пользователь успешно зарегистрирован',
                                            data: {
                                                user,
                                                token,
                                                expiresAt: expiresAt.toISOString()
                                            }
                                        });
                                    }
                                );
                            }
                        );
                    }
                );
            });
        }
    );
};

/**
 * POST /api/auth/login - Вход
 */
exports.login = (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({
            success: false,
            error: 'Имя пользователя и пароль обязательны'
        });
    }
    
    const db = new sqlite3.Database(dbPath);
    
    // Поиск пользователя
    db.get(
        'SELECT * FROM users WHERE (username = ? OR email = ?) AND status = ?',
        [username, username, 'active'],
        (err, user) => {
            if (err) {
                db.close();
                console.error('Error finding user:', err);
                return res.status(500).json({
                    success: false,
                    error: 'Ошибка входа'
                });
            }
            
            if (!user) {
                db.close();
                return res.status(401).json({
                    success: false,
                    error: 'Неверное имя пользователя или пароль'
                });
            }
            
            // Проверка пароля
            bcrypt.compare(password, user.password_hash, (err, isMatch) => {
                if (err) {
                    db.close();
                    console.error('Error comparing password:', err);
                    return res.status(500).json({
                        success: false,
                        error: 'Ошибка входа'
                    });
                }
                
                if (!isMatch) {
                    db.close();
                    return res.status(401).json({
                        success: false,
                        error: 'Неверное имя пользователя или пароль'
                    });
                }
                
                // Обновление времени входа
                db.run(
                    'UPDATE users SET last_login = datetime("now") WHERE id = ?',
                    [user.id]
                );
                
                // Создание токена
                const token = generateToken();
                const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 дней
                
                db.run(
                    'INSERT INTO user_sessions (user_id, token, expires_at) VALUES (?, ?, ?)',
                    [user.id, token, expiresAt.toISOString()],
                    (err) => {
                        db.close();
                        
                        if (err) {
                            console.error('Error creating session:', err);
                            return res.status(500).json({
                                success: false,
                                error: 'Ошибка создания сессии'
                            });
                        }
                        
                        // Удаляем пароль из ответа
                        const userResponse = {
                            id: user.id,
                            username: user.username,
                            email: user.email,
                            full_name: user.full_name,
                            role: user.role,
                            status: user.status,
                            avatar_url: user.avatar_url
                        };
                        
                        res.json({
                            success: true,
                            message: 'Вход выполнен успешно',
                            data: {
                                user: userResponse,
                                token,
                                expiresAt: expiresAt.toISOString()
                            }
                        });
                    }
                );
            });
        }
    );
};

/**
 * POST /api/auth/logout - Выход
 */
exports.logout = (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.json({
            success: true,
            message: 'Выход выполнен успешно'
        });
    }
    
    const token = authHeader.substring(7);
    
    const db = new sqlite3.Database(dbPath);
    
    db.run('DELETE FROM user_sessions WHERE token = ?', [token], (err) => {
        db.close();
        
        if (err) {
            console.error('Error in logout:', err);
        }
        
        res.json({
            success: true,
            message: 'Выход выполнен успешно'
        });
    });
};

/**
 * POST /api/auth/verify - Проверить токен
 */
exports.verify = (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            valid: false,
            error: 'Токен не предоставлен'
        });
    }
    
    const token = authHeader.substring(7);
    
    const db = new sqlite3.Database(dbPath);
    
    db.get(
        `SELECT u.id, u.username, u.email, u.full_name, u.role, u.status, u.avatar_url
         FROM user_sessions s
         JOIN users u ON s.user_id = u.id
         WHERE s.token = ? AND s.expires_at > datetime('now')`,
        [token],
        (err, user) => {
            db.close();
            
            if (err) {
                console.error('Error in verify:', err);
                return res.status(500).json({
                    success: false,
                    valid: false,
                    error: 'Ошибка проверки токена'
                });
            }
            
            if (!user) {
                return res.status(401).json({
                    success: false,
                    valid: false,
                    error: 'Недействительный или истекший токен'
                });
            }
            
            res.json({
                success: true,
                valid: true,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    full_name: user.full_name,
                    role: user.role,
                    status: user.status,
                    avatar_url: user.avatar_url
                }
            });
        }
    );
};

/**
 * GET /api/auth/me - Получить текущего пользователя
 */
exports.getCurrentUser = (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            error: 'Токен не предоставлен'
        });
    }
    
    const token = authHeader.substring(7);
    
    const db = new sqlite3.Database(dbPath);
    
    db.get(
        `SELECT u.id, u.username, u.email, u.full_name, u.role, u.status, u.avatar_url,
                u.phone, u.bio, u.city, u.country, u.created_at,
                us.total_visits, us.total_reviews, us.total_favorites
         FROM user_sessions s
         JOIN users u ON s.user_id = u.id
         LEFT JOIN user_stats us ON u.id = us.user_id
         WHERE s.token = ? AND s.expires_at > datetime('now')`,
        [token],
        (err, user) => {
            db.close();
            
            if (err) {
                console.error('Error in getCurrentUser:', err);
                return res.status(500).json({
                    success: false,
                    error: 'Ошибка получения данных пользователя'
                });
            }
            
            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: 'Недействительный или истекший токен'
                });
            }
            
            res.json({
                success: true,
                data: user
            });
        }
    );
};

/**
 * PUT /api/auth/profile - Обновить профиль
 */
exports.updateProfile = (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            error: 'Токен не предоставлен'
        });
    }
    
    const token = authHeader.substring(7);
    const { full_name, phone, birth_date, gender, language, country, city, bio } = req.body;
    
    const db = new sqlite3.Database(dbPath);
    
    // Сначала проверяем токен и получаем user_id
    db.get(
        'SELECT user_id FROM user_sessions WHERE token = ? AND expires_at > datetime("now")',
        [token],
        (err, session) => {
            if (err || !session) {
                db.close();
                return res.status(401).json({
                    success: false,
                    error: 'Недействительный или истекший токен'
                });
            }
            
            // Обновляем профиль (без email)
            db.run(
                `UPDATE users 
                 SET full_name = ?, phone = ?, birth_date = ?, 
                     gender = ?, language = ?, country = ?, city = ?, bio = ?
                 WHERE id = ?`,
                [full_name, phone, birth_date, gender, language, country, city, bio, session.user_id],
                function(err) {
                    if (err) {
                        db.close();
                        console.error('Error updating profile:', err);
                        return res.status(500).json({
                            success: false,
                            error: 'Ошибка обновления профиля'
                        });
                    }
                    
                    // Получаем обновленные данные
                    db.get(
                        `SELECT u.id, u.username, u.email, u.full_name, u.role, u.status, u.avatar_url,
                                u.phone, u.bio, u.city, u.country, u.created_at,
                                us.total_visits, us.total_reviews, us.total_favorites
                         FROM users u
                         LEFT JOIN user_stats us ON u.id = us.user_id
                         WHERE u.id = ?`,
                        [session.user_id],
                        (err, user) => {
                            db.close();
                            
                            if (err) {
                                return res.status(500).json({
                                    success: false,
                                    error: 'Ошибка получения данных'
                                });
                            }
                            
                            res.json({
                                success: true,
                                message: 'Профиль успешно обновлен',
                                data: user
                            });
                        }
                    );
                }
            );
        }
    );
};

/**
 * GET /api/auth/admin/stats - Получить статистику для админки
 */
exports.getAdminStats = (req, res) => {
    const db = new sqlite3.Database(dbPath);
    
    const stats = {};
    
    // Считаем пользователей
    db.get('SELECT COUNT(*) as total FROM users', [], (err, row) => {
        if (err) {
            db.close();
            return res.status(500).json({ success: false, error: 'DB error' });
        }
        stats.totalUsers = row.total;
        
        // Считаем активных пользователей
        db.get('SELECT COUNT(*) as total FROM users WHERE status = ?', ['active'], (err, row) => {
            if (err) {
                db.close();
                return res.status(500).json({ success: false, error: 'DB error' });
            }
            stats.activeUsers = row.total;
            
            // Считаем заблокированных
            db.get('SELECT COUNT(*) as total FROM users WHERE status = ?', ['banned'], (err, row) => {
                if (err) {
                    db.close();
                    return res.status(500).json({ success: false, error: 'DB error' });
                }
                stats.bannedUsers = row.total;
                
                // Считаем админов
                db.get('SELECT COUNT(*) as total FROM users WHERE role = ?', ['admin'], (err, row) => {
                    if (err) {
                        db.close();
                        return res.status(500).json({ success: false, error: 'DB error' });
                    }
                    stats.admins = row.total;
                    
                    // Считаем места
                    db.get('SELECT COUNT(*) as total FROM places WHERE status = ?', ['active'], (err, row) => {
                        if (err) {
                            db.close();
                            return res.status(500).json({ success: false, error: 'DB error' });
                        }
                        stats.totalPlaces = row.total;
                        
                        // Считаем отзывы
                        db.get('SELECT COUNT(*) as total FROM user_reviews', [], (err, row) => {
                            if (err) {
                                db.close();
                                return res.status(500).json({ success: false, error: 'DB error' });
                            }
                            stats.totalReviews = row.total;
                            
                            // Считаем избранное
                            db.get('SELECT COUNT(*) as total FROM user_favorites', [], (err, row) => {
                                db.close();
                                if (err) {
                                    return res.status(500).json({ success: false, error: 'DB error' });
                                }
                                stats.totalFavorites = row.total;
                                
                                res.json({ success: true, data: stats });
                            });
                        });
                    });
                });
            });
        });
    });
};

/**
 * GET /api/auth/admin/users - Получить список пользователей
 */
exports.getAdminUsers = (req, res) => {
    const { limit = 100 } = req.query;
    const db = new sqlite3.Database(dbPath);
    
    db.all(
        `SELECT u.id, u.username, u.email, u.full_name, u.role, u.status, 
                u.created_at, u.last_login,
                us.total_visits, us.total_reviews, us.total_favorites
         FROM users u
         LEFT JOIN user_stats us ON u.id = us.user_id
         ORDER BY u.created_at DESC
         LIMIT ?`,
        [parseInt(limit)],
        (err, rows) => {
            db.close();
            
            if (err) {
                console.error('Error getting users:', err);
                return res.status(500).json({
                    success: false,
                    error: 'Ошибка получения пользователей'
                });
            }
            
            res.json({
                success: true,
                data: rows
            });
        }
    );
};

/**
 * GET /api/auth/admin/logs - Получить логи админских действий
 */
exports.getAdminLogs = (req, res) => {
    const { limit = 50 } = req.query;
    const db = new sqlite3.Database(dbPath);
    
    db.all(
        `SELECT al.*, u.username
         FROM admin_logs al
         LEFT JOIN users u ON al.admin_id = u.id
         ORDER BY al.created_at DESC
         LIMIT ?`,
        [parseInt(limit)],
        (err, rows) => {
            db.close();
            
            if (err) {
                console.error('Error getting logs:', err);
                return res.status(500).json({
                    success: false,
                    data: []
                });
            }
            
            res.json({
                success: true,
                data: rows || []
            });
        }
    );
};

/**
 * PUT /api/auth/admin/users/:id/status - Изменить статус пользователя
 */
exports.updateUserStatus = (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['active', 'banned', 'pending'].includes(status)) {
        return res.status(400).json({
            success: false,
            error: 'Неверный статус'
        });
    }
    
    const db = new sqlite3.Database(dbPath);
    
    db.run(
        'UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [status, id],
        function(err) {
            db.close();
            
            if (err) {
                console.error('Error updating user status:', err);
                return res.status(500).json({
                    success: false,
                    error: 'Ошибка обновления статуса'
                });
            }
            
            if (this.changes === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Пользователь не найден'
                });
            }
            
            res.json({
                success: true,
                message: 'Статус обновлен'
            });
        }
    );
};

/**
 * PUT /api/auth/admin/users/:id/role - Изменить роль пользователя
 */
exports.updateUserRole = (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    
    if (!['user', 'admin', 'moderator'].includes(role)) {
        return res.status(400).json({
            success: false,
            error: 'Неверная роль'
        });
    }
    
    const db = new sqlite3.Database(dbPath);
    
    db.run(
        'UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [role, id],
        function(err) {
            db.close();
            
            if (err) {
                console.error('Error updating user role:', err);
                return res.status(500).json({
                    success: false,
                    error: 'Ошибка обновления роли'
                });
            }
            
            if (this.changes === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Пользователь не найден'
                });
            }
            
            res.json({
                success: true,
                message: 'Роль обновлена'
            });
        }
    );
};

/**
 * DELETE /api/auth/admin/users/:id - Удалить пользователя
 */
exports.deleteUser = (req, res) => {
    const { id } = req.params;
    
    const db = new sqlite3.Database(dbPath);
    
    db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
        db.close();
        
        if (err) {
            console.error('Error deleting user:', err);
            return res.status(500).json({
                success: false,
                error: 'Ошибка удаления пользователя'
            });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({
                success: false,
                error: 'Пользователь не найден'
            });
        }
        
        res.json({
            success: true,
            message: 'Пользователь удален'
        });
    });
};

/**
 * GET /api/auth/admin/reviews - Получить все отзывы для админки
 */
exports.getAdminReviews = (req, res) => {
    const { limit = 100 } = req.query;
    const db = new sqlite3.Database(dbPath);
    
    db.all(
        `SELECT ur.*, 
                u.username, u.full_name,
                p.name_kk, p.name_ru, p.name_en
         FROM user_reviews ur
         LEFT JOIN users u ON ur.user_id = u.id
         LEFT JOIN places p ON ur.place_id = p.id
         ORDER BY ur.created_at DESC
         LIMIT ?`,
        [parseInt(limit)],
        (err, rows) => {
            db.close();
            
            if (err) {
                console.error('Error getting reviews:', err);
                return res.status(500).json({
                    success: false,
                    error: 'Ошибка получения отзывов'
                });
            }
            
            res.json({
                success: true,
                data: rows || []
            });
        }
    );
};

module.exports = exports;
