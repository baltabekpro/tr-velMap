/**
 * ========================================
 * КОНТРОЛЛЕР АУТЕНТИФИКАЦИИ / AUTH CONTROLLER
 * ========================================
 */

const DataStore = require('../utils/datastore');
const crypto = require('crypto');

// Инициализация хранилищ
const usersStore = new DataStore('users.json');
const sessionsStore = new DataStore('sessions.json');

/**
 * Хэширование пароля
 */
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

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
    try {
        const { username, email, password, full_name } = req.body;
        
        // Валидация
        if (!username || !email || !password || !full_name) {
            return res.status(400).json({
                success: false,
                error: 'Все поля обязательны'
            });
        }
        
        // Проверка существования пользователя
        const existingUser = usersStore.filter(u => 
            u.username === username || u.email === email
        )[0];
        
        if (existingUser) {
            return res.status(409).json({
                success: false,
                error: 'Пользователь с таким именем или email уже существует'
            });
        }
        
        // Хэширование пароля
        const hashedPassword = hashPassword(password);
        
        // Создание пользователя
        const newUser = usersStore.add({
            username,
            email,
            password: hashedPassword,
            full_name,
            role: 'user',
            created_at: new Date().toISOString(),
            is_active: true
        });
        
        // Создание токена
        const token = generateToken();
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 дней
        
        sessionsStore.add({
            user_id: newUser.id,
            token,
            expires_at: expiresAt.toISOString(),
            created_at: new Date().toISOString()
        });
        
        // Удаляем пароль из ответа
        delete newUser.password;
        
        res.status(201).json({
            success: true,
            message: 'Пользователь успешно зарегистрирован',
            data: {
                ...newUser,
                token: token
            }
        });
    } catch (error) {
        console.error('Error in register:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка регистрации'
        });
    }
};

/**
 * POST /api/auth/login - Вход
 */
exports.login = (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                error: 'Имя пользователя и пароль обязательны'
            });
        }
        
        // Поиск пользователя
        const hashedPassword = hashPassword(password);
        const user = usersStore.filter(u => 
            (u.username === username || u.email === username) && 
            u.password === hashedPassword &&
            u.is_active
        )[0];
        
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Неверное имя пользователя или пароль'
            });
        }
        
        // Обновление времени входа
        usersStore.update(user.id, { last_login: new Date().toISOString() });
        
        // Создание токена
        const token = generateToken();
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 дней
        
        sessionsStore.add({
            user_id: user.id,
            token,
            expires_at: expiresAt.toISOString(),
            created_at: new Date().toISOString()
        });
        
        // Удаляем пароль из ответа
        const userResponse = { ...user };
        delete userResponse.password;
        
        res.json({
            success: true,
            message: 'Вход выполнен успешно',
            data: {
                user: userResponse,
                token: token,
                expiresAt: expiresAt.toISOString()
            }
        });
    } catch (error) {
        console.error('Error in login:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка входа'
        });
    }
};

/**
 * POST /api/auth/logout - Выход
 */
exports.logout = (req, res) => {
    try {
        const { token } = req.body;
        
        if (token) {
            const session = sessionsStore.filter(s => s.token === token)[0];
            if (session) {
                sessionsStore.delete(session.id);
            }
        }
        
        res.json({
            success: true,
            message: 'Выход выполнен успешно'
        });
    } catch (error) {
        console.error('Error in logout:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка выхода'
        });
    }
};

/**
 * GET /api/auth/me - Получить текущего пользователя
 */
exports.getCurrentUser = (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Токен не предоставлен'
            });
        }
        
        // Проверка токена
        const session = sessionsStore.filter(s => 
            s.token === token && 
            new Date(s.expires_at) > new Date()
        )[0];
        
        if (!session) {
            return res.status(401).json({
                success: false,
                error: 'Недействительный или истекший токен'
            });
        }
        
        // Получение пользователя
        const user = usersStore.getById(session.user_id);
        
        if (!user || !user.is_active) {
            return res.status(404).json({
                success: false,
                error: 'Пользователь не найден'
            });
        }
        
        // Удаляем пароль
        const userResponse = { ...user };
        delete userResponse.password;
        
        res.json({
            success: true,
            data: userResponse
        });
    } catch (error) {
        console.error('Error in getCurrentUser:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка получения пользователя'
        });
    }
};
