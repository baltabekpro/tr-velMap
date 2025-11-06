const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3005;
const JWT_SECRET = process.env.JWT_SECRET || 'travelmap-secret-key-2024';
const JWT_EXPIRES_IN = '7d';

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const dbPath = path.join(__dirname, '../../db/travelmap.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ [AUTH SERVICE] Database қосылу қатесі:', err);
    } else {
        console.log('✅ [AUTH SERVICE] Database қосылды:', dbPath);
        initializeDatabase();
    }
});

// Initialize database schema
function initializeDatabase() {
    const schemaPath = path.join(__dirname, '../../db/schema.sql');
    const fs = require('fs');
    
    if (fs.existsSync(schemaPath)) {
        const schema = fs.readFileSync(schemaPath, 'utf8');
        db.exec(schema, (err) => {
            if (err) {
                console.error('❌ [AUTH SERVICE] Schema жасау қатесі:', err);
            } else {
                console.log('✅ [AUTH SERVICE] Database schema дайын');
            }
        });
    }
}

// Utility functions
function generateToken(user) {
    return jwt.sign(
        {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
}

function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}

// Middleware для проверки аутентификации
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Токен жоқ' });
    }

    const user = verifyToken(token);
    if (!user) {
        return res.status(403).json({ error: 'Токен жарамсыз' });
    }

    req.user = user;
    next();
}

// Middleware для проверки роли администратора
function requireAdmin(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Рұқсат жоқ. Әкімші рөлі қажет.' });
    }
    next();
}

// ============= PUBLIC ROUTES =============

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'auth',
        port: PORT,
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Регистрация
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password, full_name, phone, language = 'kk' } = req.body;

    // Валидация
    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Барлық міндетті өрістерді толтырыңыз' });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: 'Құпия сөз кем дегенде 6 таңбадан тұруы керек' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Email форматы дұрыс емес' });
    }

    try {
        // Проверка существования пользователя
        db.get('SELECT id FROM users WHERE username = ? OR email = ?', [username, email], async (err, existingUser) => {
            if (err) {
                console.error('Database қатесі:', err);
                return res.status(500).json({ error: 'Қате орын алды' });
            }

            if (existingUser) {
                return res.status(400).json({ error: 'Бұл пайдаланушы аты немесе email бұрын тіркелген' });
            }

            // Хэширование пароля
            const password_hash = await bcrypt.hash(password, 10);

            // Создание пользователя
            const sql = `
                INSERT INTO users (username, email, password_hash, full_name, phone, language, role, status)
                VALUES (?, ?, ?, ?, ?, ?, 'user', 'active')
            `;

            db.run(sql, [username, email, password_hash, full_name, phone, language], function(err) {
                if (err) {
                    console.error('Пайдаланушы қосу қатесі:', err);
                    return res.status(500).json({ error: 'Тіркеу кезінде қате' });
                }

                const userId = this.lastID;

                // Создаем настройки приватности
                db.run('INSERT INTO user_privacy_settings (user_id) VALUES (?)', [userId]);
                
                // Создаем статистику
                db.run('INSERT INTO user_stats (user_id) VALUES (?)', [userId]);

                // Получаем созданного пользователя
                db.get('SELECT id, username, email, full_name, role, created_at FROM users WHERE id = ?', [userId], (err, user) => {
                    if (err) {
                        return res.status(500).json({ error: 'Қате орын алды' });
                    }

                    const token = generateToken(user);

                    res.status(201).json({
                        message: 'Тіркеу сәтті өтті',
                        user: {
                            id: user.id,
                            username: user.username,
                            email: user.email,
                            full_name: user.full_name,
                            role: user.role,
                            created_at: user.created_at
                        },
                        token
                    });
                });
            });
        });
    } catch (error) {
        console.error('Тіркеу қатесі:', error);
        res.status(500).json({ error: 'Қате орын алды' });
    }
});

// Авторизация
app.post('/api/auth/login', (req, res) => {
    // Принимаем и 'login', и 'username' для совместимости
    const { login, username, password } = req.body;
    const loginValue = login || username;

    if (!loginValue || !password) {
        return res.status(400).json({ error: 'Email/логин және құпия сөз қажет' });
    }

    const sql = `
        SELECT id, username, email, password_hash, full_name, role, status, avatar_url, language
        FROM users
        WHERE username = ? OR email = ?
    `;

    db.get(sql, [loginValue, loginValue], async (err, user) => {
        if (err) {
            console.error('Database қатесі:', err);
            return res.status(500).json({ error: 'Қате орын алды' });
        }

        if (!user) {
            return res.status(401).json({ error: 'Логин немесе құпия сөз қате' });
        }

        if (user.status === 'banned') {
            return res.status(403).json({ error: 'Сіздің аккаунтыңыз бұғатталған' });
        }

        // Проверка пароля
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Логин немесе құпия сөз қате' });
        }

        // Обновляем время последнего входа
        db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

        const token = generateToken(user);

        res.json({
            message: 'Жүйеге кіру сәтті өтті',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                full_name: user.full_name,
                role: user.role,
                avatar_url: user.avatar_url,
                language: user.language
            },
            token
        });
    });
});

// Проверка токена
app.post('/api/auth/verify', authenticateToken, (req, res) => {
    db.get('SELECT id, username, email, full_name, role, avatar_url, language FROM users WHERE id = ?', [req.user.id], (err, user) => {
        if (err || !user) {
            return res.status(404).json({ error: 'Пайдаланушы табылмады' });
        }

        res.json({
            valid: true,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                full_name: user.full_name,
                role: user.role,
                avatar_url: user.avatar_url,
                language: user.language
            }
        });
    });
});

// ============= PROTECTED ROUTES =============

// Получить профиль текущего пользователя
app.get('/api/auth/profile', authenticateToken, (req, res) => {
    const sql = `
        SELECT u.*, s.*, p.*
        FROM users u
        LEFT JOIN user_stats s ON u.id = s.user_id
        LEFT JOIN user_privacy_settings p ON u.id = p.user_id
        WHERE u.id = ?
    `;

    db.get(sql, [req.user.id], (err, profile) => {
        if (err) {
            console.error('Profile қатесі:', err);
            return res.status(500).json({ error: 'Қате орын алды' });
        }

        if (!profile) {
            return res.status(404).json({ error: 'Профиль табылмады' });
        }

        // Убираем password_hash из ответа
        delete profile.password_hash;

        res.json({ profile });
    });
});

// Обновить профиль
app.put('/api/auth/profile', authenticateToken, (req, res) => {
    const { full_name, phone, birth_date, gender, bio, country, city, language, avatar_url } = req.body;

    const sql = `
        UPDATE users
        SET full_name = COALESCE(?, full_name),
            phone = COALESCE(?, phone),
            birth_date = COALESCE(?, birth_date),
            gender = COALESCE(?, gender),
            bio = COALESCE(?, bio),
            country = COALESCE(?, country),
            city = COALESCE(?, city),
            language = COALESCE(?, language),
            avatar_url = COALESCE(?, avatar_url),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `;

    db.run(sql, [full_name, phone, birth_date, gender, bio, country, city, language, avatar_url, req.user.id], function(err) {
        if (err) {
            console.error('Profile жаңарту қатесі:', err);
            return res.status(500).json({ error: 'Профильді жаңарту мүмкін болмады' });
        }

        res.json({ message: 'Профиль сәтті жаңартылды' });
    });
});

// Изменить пароль
app.put('/api/auth/change-password', authenticateToken, async (req, res) => {
    const { old_password, new_password } = req.body;

    if (!old_password || !new_password) {
        return res.status(400).json({ error: 'Барлық өрістерді толтырыңыз' });
    }

    if (new_password.length < 6) {
        return res.status(400).json({ error: 'Жаңа құпия сөз кем дегенде 6 таңбадан тұруы керек' });
    }

    db.get('SELECT password_hash FROM users WHERE id = ?', [req.user.id], async (err, user) => {
        if (err || !user) {
            return res.status(500).json({ error: 'Қате орын алды' });
        }

        const isOldPasswordValid = await bcrypt.compare(old_password, user.password_hash);
        if (!isOldPasswordValid) {
            return res.status(401).json({ error: 'Ескі құпия сөз қате' });
        }

        const new_password_hash = await bcrypt.hash(new_password, 10);

        db.run('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [new_password_hash, req.user.id], (err) => {
            if (err) {
                return res.status(500).json({ error: 'Құпия сөзді өзгерту мүмкін болмады' });
            }

            res.json({ message: 'Құпия сөз сәтті өзгертілді' });
        });
    });
});

// Обновить настройки приватности
app.put('/api/auth/privacy-settings', authenticateToken, (req, res) => {
    const {
        profile_public,
        show_email,
        show_phone,
        show_visits,
        show_reviews,
        show_favorites,
        allow_messages
    } = req.body;

    const sql = `
        UPDATE user_privacy_settings
        SET profile_public = COALESCE(?, profile_public),
            show_email = COALESCE(?, show_email),
            show_phone = COALESCE(?, show_phone),
            show_visits = COALESCE(?, show_visits),
            show_reviews = COALESCE(?, show_reviews),
            show_favorites = COALESCE(?, show_favorites),
            allow_messages = COALESCE(?, allow_messages)
        WHERE user_id = ?
    `;

    db.run(sql, [profile_public, show_email, show_phone, show_visits, show_reviews, show_favorites, allow_messages, req.user.id], function(err) {
        if (err) {
            console.error('Настройки жаңарту қатесі:', err);
            return res.status(500).json({ error: 'Настройкаларды жаңарту мүмкін болмады' });
        }

        res.json({ message: 'Жекелік параметрлері жаңартылды' });
    });
});

// ============= ADMIN ROUTES =============

// Получить всех пользователей (только для админа)
app.get('/api/auth/admin/users', authenticateToken, requireAdmin, (req, res) => {
    const { page = 1, limit = 20, search = '', role = '', status = '' } = req.query;
    const offset = (page - 1) * limit;

    let sql = 'SELECT id, username, email, full_name, role, status, created_at, last_login FROM users WHERE 1=1';
    const params = [];

    if (search) {
        sql += ' AND (username LIKE ? OR email LIKE ? OR full_name LIKE ?)';
        const searchPattern = `%${search}%`;
        params.push(searchPattern, searchPattern, searchPattern);
    }

    if (role) {
        sql += ' AND role = ?';
        params.push(role);
    }

    if (status) {
        sql += ' AND status = ?';
        params.push(status);
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    db.all(sql, params, (err, users) => {
        if (err) {
            console.error('Users алу қатесі:', err);
            return res.status(500).json({ error: 'Қате орын алды' });
        }

        // Получаем общее количество
        let countSql = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
        const countParams = params.slice(0, -2); // Убираем limit и offset

        db.get(countSql, countParams, (err, result) => {
            if (err) {
                return res.status(500).json({ error: 'Қате орын алды' });
            }

            res.json({
                users,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: result.total,
                    pages: Math.ceil(result.total / limit)
                }
            });
        });
    });
});

// Изменить роль пользователя
app.put('/api/auth/admin/users/:userId/role', authenticateToken, requireAdmin, (req, res) => {
    const { userId } = req.params;
    const { role } = req.body;

    const validRoles = ['user', 'moderator', 'admin'];
    if (!validRoles.includes(role)) {
        return res.status(400).json({ error: 'Рөл жарамсыз' });
    }

    db.run('UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [role, userId], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Рөлді өзгерту мүмкін болмады' });
        }

        // Логируем действие
        db.run(
            'INSERT INTO admin_logs (admin_id, action, target_type, target_id, description) VALUES (?, ?, ?, ?, ?)',
            [req.user.id, 'change_role', 'user', userId, `Role changed to: ${role}`]
        );

        res.json({ message: 'Рөл сәтті өзгертілді' });
    });
});

// Заблокировать/разблокировать пользователя
app.put('/api/auth/admin/users/:userId/status', authenticateToken, requireAdmin, (req, res) => {
    const { userId } = req.params;
    const { status } = req.body;

    const validStatuses = ['active', 'banned', 'pending'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Статус жарамсыз' });
    }

    db.run('UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, userId], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Статусты өзгерту мүмкін болмады' });
        }

        // Логируем действие
        db.run(
            'INSERT INTO admin_logs (admin_id, action, target_type, target_id, description) VALUES (?, ?, ?, ?, ?)',
            [req.user.id, 'change_status', 'user', userId, `Status changed to: ${status}`]
        );

        res.json({ message: 'Статус сәтті өзгертілді' });
    });
});

// Удалить пользователя
app.delete('/api/auth/admin/users/:userId', authenticateToken, requireAdmin, (req, res) => {
    const { userId } = req.params;

    if (userId == req.user.id) {
        return res.status(400).json({ error: 'Өз профиліңізді жою мүмкін емес' });
    }

    db.run('DELETE FROM users WHERE id = ?', [userId], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Пайдаланушыны жою мүмкін болмады' });
        }

        // Логируем действие
        db.run(
            'INSERT INTO admin_logs (admin_id, action, target_type, target_id, description) VALUES (?, ?, ?, ?, ?)',
            [req.user.id, 'delete_user', 'user', userId, 'User deleted']
        );

        res.json({ message: 'Пайдаланушы сәтті жойылды' });
    });
});

// Получить статистику системы
app.get('/api/auth/admin/stats', authenticateToken, requireAdmin, (req, res) => {
    const queries = {
        totalUsers: 'SELECT COUNT(*) as count FROM users',
        activeUsers: "SELECT COUNT(*) as count FROM users WHERE status = 'active'",
        bannedUsers: "SELECT COUNT(*) as count FROM users WHERE status = 'banned'",
        admins: "SELECT COUNT(*) as count FROM users WHERE role = 'admin'",
        totalReviews: 'SELECT COUNT(*) as count FROM user_reviews',
        totalVisits: 'SELECT COUNT(*) as count FROM user_visits',
        recentUsers: 'SELECT COUNT(*) as count FROM users WHERE created_at >= datetime("now", "-7 days")'
    };

    const stats = {};
    let completed = 0;
    const total = Object.keys(queries).length;

    Object.entries(queries).forEach(([key, sql]) => {
        db.get(sql, (err, result) => {
            if (!err) {
                stats[key] = result.count;
            }
            completed++;
            if (completed === total) {
                res.json({ stats });
            }
        });
    });
});

// Получить логи администраторов
app.get('/api/auth/admin/logs', authenticateToken, requireAdmin, (req, res) => {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const sql = `
        SELECT l.*, u.username as admin_username
        FROM admin_logs l
        JOIN users u ON l.admin_id = u.id
        ORDER BY l.created_at DESC
        LIMIT ? OFFSET ?
    `;

    db.all(sql, [limit, offset], (err, logs) => {
        if (err) {
            return res.status(500).json({ error: 'Логтарды алу мүмкін болмады' });
        }

        db.get('SELECT COUNT(*) as total FROM admin_logs', (err, result) => {
            res.json({
                logs,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: result.total,
                    pages: Math.ceil(result.total / limit)
                }
            });
        });
    });
});

// Start server
const server = app.listen(PORT, () => {
    console.log(`✅ [AUTH SERVICE] Жұмысістеп тұр: http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM сигналы алынды. Серверді жабу...');
    server.close(() => {
        db.close();
        console.log('✅ [AUTH SERVICE] Сервер жабылды');
    });
});

module.exports = app;
