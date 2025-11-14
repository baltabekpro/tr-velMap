/**
 * ========================================
 * MIDDLEWARE ДЛЯ АУТЕНТИФИКАЦИИ
 * ========================================
 */

const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');
const path = require('path');

const dbPath = path.join(__dirname, '../../db/travelmap.db');
const JWT_SECRET = process.env.JWT_SECRET || 'travelmap-secret-key-2024';

/**
 * Middleware для проверки JWT токена
 */
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'Токен не предоставлен'
            });
        }
        
        const token = authHeader.substring(7);
        
        // Try JWT first
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            
            // If JWT is valid, get user from database
            const db = new sqlite3.Database(dbPath);
            db.get(
                'SELECT id, username, email, role, full_name, status FROM users WHERE id = ?',
                [decoded.id],
                (err, user) => {
                    db.close();
                    
                    if (err || !user) {
                        return res.status(401).json({
                            success: false,
                            error: 'Пользователь не найден'
                        });
                    }
                    
                    if (user.status === 'banned') {
                        return res.status(403).json({
                            success: false,
                            error: 'Аккаунт заблокирован'
                        });
                    }
                    
                    // Добавляем пользователя в request
                    req.user = {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        role: user.role,
                        full_name: user.full_name
                    };
                    
                    next();
                }
            );
            return;
        } catch (jwtError) {
            // JWT verification failed, try database session
        }
        
        // Fallback to database session tokens
        const db = new sqlite3.Database(dbPath);
        
        db.get(
            `SELECT us.*, u.* FROM user_sessions us 
             JOIN users u ON us.user_id = u.id 
             WHERE us.token = ? AND us.expires_at > datetime('now')`,
            [token],
            (err, session) => {
                db.close();
                
                if (err) {
                    return res.status(500).json({
                        success: false,
                        error: 'Ошибка проверки токена'
                    });
                }
                
                if (!session) {
                    return res.status(401).json({
                        success: false,
                        error: 'Недействительный или истекший токен'
                    });
                }
                
                // Добавляем пользователя в request
                req.user = {
                    id: session.user_id,
                    username: session.username,
                    email: session.email,
                    role: session.role,
                    full_name: session.full_name
                };
                
                next();
            }
        );
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка аутентификации'
        });
    }
};

/**
 * Middleware для проверки роли администратора
 */
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Требуется аутентификация'
        });
    }
    
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            error: 'Доступ запрещен. Требуются права администратора'
        });
    }
    
    next();
};

/**
 * Middleware для опциональной аутентификации
 * (не требует токен, но если он есть - добавляет пользователя)
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next();
        }
        
        const token = authHeader.substring(7);
        
        // Try JWT first
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            
            const db = new sqlite3.Database(dbPath);
            db.get(
                'SELECT id, username, email, role, full_name FROM users WHERE id = ? AND status = "active"',
                [decoded.id],
                (err, user) => {
                    db.close();
                    
                    if (!err && user) {
                        req.user = {
                            id: user.id,
                            username: user.username,
                            email: user.email,
                            role: user.role,
                            full_name: user.full_name
                        };
                    }
                    
                    next();
                }
            );
            return;
        } catch (jwtError) {
            // JWT verification failed, try database session
        }
        
        // Fallback to database session tokens
        const db = new sqlite3.Database(dbPath);
        
        db.get(
            `SELECT us.*, u.* FROM user_sessions us 
             JOIN users u ON us.user_id = u.id 
             WHERE us.token = ? AND us.expires_at > datetime('now')`,
            [token],
            (err, session) => {
                db.close();
                
                if (!err && session) {
                    req.user = {
                        id: session.user_id,
                        username: session.username,
                        email: session.email,
                        role: session.role,
                        full_name: session.full_name
                    };
                }
                
                next();
            }
        );
    } catch (error) {
        console.error('Optional auth middleware error:', error);
        next();
    }
};

module.exports = {
    authenticate,
    requireAdmin,
    optionalAuth
};
