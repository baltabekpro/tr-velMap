/**
 * ========================================
 * USER SERVICE v2.0 - SQL дерекқор
 * ========================================
 * SQL дерекқорымен жұмыс істейтін қолданушы қызметі
 */

const UserService = {
    CURRENT_USER_KEY: 'travelmap_current_user',

    /**
     * Инициализация (дерекқор дайын күтіп тұру)
     */
    async init() {
        console.log('🔄 UserService инициализациясы...');
        
        // Дерекқор дайын болғанша күту
        let attempts = 0;
        while (!dbService.isInitialized && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }

        if (!dbService.isInitialized) {
            throw new Error('Дерекқор инициализацияланбады');
        }

        // Ағымдағы қолданушыны жүктеу
        this.loadCurrentUser();
        console.log('✅ UserService дайын');
    },

    /**
     * Қолданушыны тіркеу
     */
    async registerUser(userData) {
        try {
            const { username, email, password, full_name } = userData;

            // Қолданушы бар ма тексеру
            const existingUser = dbService.queryOne(
                'SELECT id FROM users WHERE username = ? OR email = ?',
                [username, email]
            );

            if (existingUser.data) {
                return {
                    success: false,
                    message: 'Қолданушы аты немесе email бос емес'
                };
            }

            // Құпиясөзді шифрлау (Base64)
            const encodedPassword = btoa(password);

            // Аватар жасау
            const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(full_name)}&background=22c55e&color=fff`;

            // Қолданушыны қосу
            dbService.execute(
                `INSERT INTO users (username, email, password, role, full_name, avatar, is_active) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [username, email, encodedPassword, 'user', full_name, avatar, 1]
            );

            // ID-ны алу
            const newUser = dbService.queryOne(
                'SELECT * FROM users WHERE username = ?',
                [username]
            );

            if (newUser.success && newUser.data) {
                // Параметрлерді қосу
                dbService.execute(
                    `INSERT INTO user_preferences (user_id, language, theme, notifications) 
                     VALUES (?, ?, ?, ?)`,
                    [newUser.data.id, 'kk', 'dark', 1]
                );

                console.log('✅ Қолданушы тіркелді:', username);
                return {
                    success: true,
                    message: 'Тіркелу сәтті өтті',
                    user: this.sanitizeUser(newUser.data)
                };
            }

            return { success: false, message: 'Қолданушыны қосу қатесі' };

        } catch (error) {
            console.error('❌ Тіркеу қатесі:', error);
            return {
                success: false,
                message: 'Тіркеу қатесі: ' + error.message
            };
        }
    },

    /**
     * Жүйеге кіру
     */
    async loginUser(username, password) {
        try {
            // Қолданушыны табу
            const result = dbService.queryOne(
                'SELECT * FROM users WHERE username = ? OR email = ?',
                [username, username]
            );

            if (!result.success || !result.data) {
                return {
                    success: false,
                    message: 'Қолданушы табылмады'
                };
            }

            const user = result.data;

            // Құпиясөзді тексеру
            const encodedPassword = btoa(password);
            if (user.password !== encodedPassword) {
                return {
                    success: false,
                    message: 'Құпиясөз қате'
                };
            }

            // Белсенді ме тексеру
            if (!user.is_active) {
                return {
                    success: false,
                    message: 'Аккаунт өшірілген'
                };
            }

            // Соңғы кіру уақытын жаңарту
            dbService.execute(
                'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
                [user.id]
            );

            // Ағымдағы қолданушы ретінде сақтау
            const sanitizedUser = this.sanitizeUser(user);
            this.setCurrentUser(sanitizedUser);

            console.log('✅ Жүйеге кіру сәтті:', username);
            return {
                success: true,
                message: 'Жүйеге кіру сәтті',
                user: sanitizedUser
            };

        } catch (error) {
            console.error('❌ Кіру қатесі:', error);
            return {
                success: false,
                message: 'Кіру қатесі: ' + error.message
            };
        }
    },

    /**
     * Жүйеден шығу
     */
    logout() {
        localStorage.removeItem(this.CURRENT_USER_KEY);
        console.log('✅ Жүйеден шықтыңыз');
        window.location.href = 'login.html';
    },

    /**
     * Ағымдағы қолданушыны алу
     */
    getCurrentUser() {
        if (!currentUser) {
            this.loadCurrentUser();
        }
        return currentUser;
    },

    /**
     * Ағымдағы қолданушыны жүктеу
     */
    loadCurrentUser() {
        const userData = localStorage.getItem(this.CURRENT_USER_KEY);
        if (userData) {
            try {
                currentUser = JSON.parse(userData);
            } catch (error) {
                console.error('❌ Қолданушы деректерін жүктеу қатесі:', error);
                currentUser = null;
            }
        }
    },

    /**
     * Ағымдағы қолданушыны орнату
     */
    setCurrentUser(user) {
        currentUser = user;
        localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(user));
    },

    /**
     * Барлық қолданушыларды алу (админ үшін)
     */
    async getAllUsers() {
        try {
            const result = dbService.query(
                'SELECT * FROM users ORDER BY created_at DESC'
            );

            if (result.success) {
                return {
                    success: true,
                    users: result.data.map(user => this.sanitizeUser(user))
                };
            }

            return { success: false, users: [] };

        } catch (error) {
            console.error('❌ Қолданушыларды жүктеу қатесі:', error);
            return { success: false, users: [] };
        }
    },

    /**
     * Қолданушыны ID бойынша алу
     */
    async getUserById(userId) {
        try {
            const result = dbService.queryOne(
                'SELECT * FROM users WHERE id = ?',
                [userId]
            );

            if (result.success && result.data) {
                return {
                    success: true,
                    user: this.sanitizeUser(result.data)
                };
            }

            return { success: false, user: null };

        } catch (error) {
            console.error('❌ Қолданушыны жүктеу қатесі:', error);
            return { success: false, user: null };
        }
    },

    /**
     * Қолданушыны жаңарту
     */
    async updateUser(userId, updates) {
        try {
            const fields = [];
            const values = [];

            // Жаңарту өрістерін қалыптастыру
            if (updates.full_name !== undefined) {
                fields.push('full_name = ?');
                values.push(updates.full_name);
            }
            if (updates.email !== undefined) {
                fields.push('email = ?');
                values.push(updates.email);
            }
            if (updates.avatar !== undefined) {
                fields.push('avatar = ?');
                values.push(updates.avatar);
            }
            if (updates.password !== undefined) {
                fields.push('password = ?');
                values.push(btoa(updates.password));
            }

            if (fields.length === 0) {
                return { success: false, message: 'Жаңарту өрістері жоқ' };
            }

            values.push(userId);
            const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
            
            dbService.execute(sql, values);

            // Ағымдағы қолданушы өзгерсе, жаңарту
            if (currentUser && currentUser.id === userId) {
                const updated = await this.getUserById(userId);
                if (updated.success) {
                    this.setCurrentUser(updated.user);
                }
            }

            console.log('✅ Қолданушы жаңартылды:', userId);
            return { success: true, message: 'Деректер жаңартылды' };

        } catch (error) {
            console.error('❌ Жаңарту қатесі:', error);
            return { success: false, message: 'Жаңарту қатесі: ' + error.message };
        }
    },

    /**
     * Қолданушыны өшіру
     */
    async deleteUser(userId) {
        try {
            dbService.execute('DELETE FROM users WHERE id = ?', [userId]);
            console.log('✅ Қолданушы өшірілді:', userId);
            return { success: true, message: 'Қолданушы өшірілді' };

        } catch (error) {
            console.error('❌ Өшіру қатесі:', error);
            return { success: false, message: 'Өшіру қатесі: ' + error.message };
        }
    },

    /**
     * Қолданушыны белсендіру/өшіру
     */
    async toggleUserStatus(userId) {
        try {
            const user = await this.getUserById(userId);
            if (!user.success) {
                return { success: false, message: 'Қолданушы табылмады' };
            }

            const newStatus = user.user.is_active ? 0 : 1;
            dbService.execute(
                'UPDATE users SET is_active = ? WHERE id = ?',
                [newStatus, userId]
            );

            console.log('✅ Қолданушы статусы өзгертілді:', userId);
            return { success: true, message: 'Статус өзгертілді' };

        } catch (error) {
            console.error('❌ Статус өзгерту қатесі:', error);
            return { success: false, message: 'Қате: ' + error.message };
        }
    },

    /**
     * Қолданушы құпиясөзден тазарту
     */
    sanitizeUser(user) {
        const sanitized = { ...user };
        delete sanitized.password;
        return sanitized;
    },

    /**
     * Рөл тексеру
     */
    hasRole(user, role) {
        return user && user.role === role;
    },

    /**
     * Админ ме тексеру
     */
    isAdmin(user) {
        return this.hasRole(user, 'admin');
    },

    /**
     * Статистика алу
     */
    async getStatistics() {
        try {
            const totalUsers = dbService.queryOne('SELECT COUNT(*) as count FROM users');
            const activeUsers = dbService.queryOne('SELECT COUNT(*) as count FROM users WHERE is_active = 1');
            const adminUsers = dbService.queryOne('SELECT COUNT(*) as count FROM users WHERE role = "admin"');
            
            // Соңғы 24 сағатта тіркелгендер
            const newUsers = dbService.queryOne(
                `SELECT COUNT(*) as count FROM users 
                 WHERE datetime(created_at) >= datetime('now', '-1 day')`
            );

            return {
                success: true,
                stats: {
                    total: totalUsers.data?.count || 0,
                    active: activeUsers.data?.count || 0,
                    admins: adminUsers.data?.count || 0,
                    newToday: newUsers.data?.count || 0
                }
            };

        } catch (error) {
            console.error('❌ Статистика қатесі:', error);
            return {
                success: false,
                stats: { total: 0, active: 0, admins: 0, newToday: 0 }
            };
        }
    }
};

// Ағымдағы қолданушы
let currentUser = null;

// Автоматты инициализация
(async () => {
    try {
        await UserService.init();
    } catch (error) {
        console.error('❌ UserService инициализация қатесі:', error);
    }
})();
