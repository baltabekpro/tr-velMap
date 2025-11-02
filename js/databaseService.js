/**
 * ========================================
 * DATABASE SERVICE - Дерекқор қызметі
 * ========================================
 * SQL.js арқылы браузерде SQLite дерекқорымен жұмыс
 */

class DatabaseService {
    constructor() {
        this.db = null;
        this.isInitialized = false;
        this.SQL = null;
    }

    /**
     * Дерекқорды инициализациялау
     */
    async init() {
        if (this.isInitialized) {
            console.log('✅ Дерекқор қазірдің өзінде инициализацияланған');
            return;
        }

        try {
            console.log('🔄 SQL.js жүктелуде...');
            
            // SQL.js кітапханасын жүктеу
            this.SQL = await initSqlJs({
                locateFile: file => `https://sql.js.org/dist/${file}`
            });

            console.log('✅ SQL.js жүктелді');

            // LocalStorage-тан дерекқорды жүктеу немесе жаңасын жасау
            const savedDb = localStorage.getItem('travelmap_db');
            
            if (savedDb) {
                console.log('📂 Сақталған дерекқорды жүктеу...');
                const uint8Array = new Uint8Array(JSON.parse(savedDb));
                this.db = new this.SQL.Database(uint8Array);
                console.log('✅ Дерекқор жүктелді');
            } else {
                console.log('🆕 Жаңа дерекқор жасау...');
                this.db = new this.SQL.Database();
                await this.createSchema();
                await this.insertInitialData();
                this.save();
                console.log('✅ Жаңа дерекқор жасалды');
            }

            this.isInitialized = true;
            console.log('✅ Дерекқор қызметі дайын');

        } catch (error) {
            console.error('❌ Дерекқорды инициализациялау қатесі:', error);
            throw error;
        }
    }

    /**
     * Дерекқор схемасын жасау
     */
    async createSchema() {
        console.log('📋 Дерекқор схемасын жасау...');

        const schema = `
            -- Қолданушылар кестесі
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'user',
                full_name TEXT NOT NULL,
                avatar TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_login DATETIME,
                is_active INTEGER DEFAULT 1,
                CONSTRAINT chk_role CHECK (role IN ('admin', 'user', 'moderator'))
            );

            CREATE TABLE IF NOT EXISTS user_preferences (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                language TEXT DEFAULT 'kk',
                theme TEXT DEFAULT 'dark',
                notifications INTEGER DEFAULT 1,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS places (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name_kk TEXT NOT NULL,
                name_ru TEXT NOT NULL,
                name_en TEXT NOT NULL,
                description_kk TEXT,
                description_ru TEXT,
                description_en TEXT,
                category TEXT NOT NULL,
                latitude REAL NOT NULL,
                longitude REAL NOT NULL,
                image_url TEXT,
                rating REAL DEFAULT 0,
                visit_count INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS reviews (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                place_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
                comment TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS favorites (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                place_id INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES places(id) ON DELETE CASCADE,
                FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE,
                UNIQUE(user_id, place_id)
            );

            CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
            CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
            CREATE INDEX IF NOT EXISTS idx_places_category ON places(category);
        `;

        this.db.run(schema);
        console.log('✅ Схема жасалды');
    }

    /**
     * Бастапқы деректерді қосу
     */
    async insertInitialData() {
        console.log('📝 Бастапқы деректерді қосу...');

        // Қолданушылар (password: admin123 / user123)
        this.db.run(`
            INSERT INTO users (username, email, password, role, full_name, avatar, is_active) VALUES
            ('admin', 'admin@travelmap.kz', 'YWRtaW4xMjM=', 'admin', 'Әкімші', 'https://ui-avatars.com/api/?name=Admin&background=2563eb&color=fff', 1),
            ('user', 'user@travelmap.kz', 'dXNlcjEyMw==', 'user', 'Қолданушы', 'https://ui-avatars.com/api/?name=User&background=22c55e&color=fff', 1),
            ('aiman', 'aiman@travelmap.kz', 'dXNlcjEyMw==', 'user', 'Айман Нұрболат', 'https://ui-avatars.com/api/?name=Aiman&background=f59e0b&color=fff', 1),
            ('nurlan', 'nurlan@travelmap.kz', 'dXNlcjEyMw==', 'user', 'Нұрлан Əлібеков', 'https://ui-avatars.com/api/?name=Nurlan&background=10b981&color=fff', 1),
            ('saule', 'saule@travelmap.kz', 'dXNlcjEyMw==', 'user', 'Сауле Қасымова', 'https://ui-avatars.com/api/?name=Saule&background=8b5cf6&color=fff', 1),
            ('daniyar', 'daniyar@travelmap.kz', 'dXNlcjEyMw==', 'user', 'Данияр Əбдіғазиев', 'https://ui-avatars.com/api/?name=Daniyar&background=ef4444&color=fff', 0),
            ('moderator', 'moderator@travelmap.kz', 'dXNlcjEyMw==', 'moderator', 'Модератор', 'https://ui-avatars.com/api/?name=Moderator&background=6366f1&color=fff', 1)
        `);

        // Қолданушы параметрлері
        this.db.run(`
            INSERT INTO user_preferences (user_id, language, theme, notifications) VALUES
            (1, 'kk', 'dark', 1),
            (2, 'kk', 'dark', 1),
            (3, 'kk', 'light', 1),
            (4, 'kk', 'dark', 1),
            (5, 'kk', 'light', 0),
            (6, 'kk', 'dark', 1),
            (7, 'kk', 'dark', 1)
        `);

        // Орындар
        this.db.run(`
            INSERT INTO places (name_kk, name_ru, name_en, description_kk, category, latitude, longitude, image_url, rating) VALUES
            ('Көк-Төбе', 'Кок-Тобе', 'Kok-Tobe', 'Алматының ең танымал демалыс орны', 'mountain', 43.2567, 76.9586, 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4', 4.8),
            ('Шымбұлақ', 'Шымбулак', 'Shymbulak', 'Халықаралық тау-шаңғы курорты', 'mountain', 43.2416, 77.0833, 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256', 4.9),
            ('Үлкен Алматы көлі', 'Большое Алматинское озеро', 'Big Almaty Lake', 'Тау көлі', 'nature', 43.0556, 76.9899, 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4', 4.7),
            ('Медеу', 'Медео', 'Medeu', 'Әлемдегі ең биік мұз айдыны', 'sport', 43.1635, 77.0658, 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23', 4.6),
            ('28 панфиловшылар саябағы', 'Парк 28 панфиловцев', 'Panfilov Park', 'Тарихи саябақ', 'park', 43.2626, 76.9475, 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e', 4.5),
            ('Алматы хайуанаттар бағы', 'Алматинский зоопарк', 'Almaty Zoo', 'Қазақстандағы ең үлкен хайуанаттар бағы', 'entertainment', 43.2465, 76.9615, 'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7', 4.3)
        `);

        console.log('✅ Бастапқы деректер қосылды');
    }

    /**
     * SQL сұрауын орындау
     */
    execute(sql, params = []) {
        if (!this.isInitialized) {
            throw new Error('Дерекқор инициализацияланбаған');
        }

        try {
            this.db.run(sql, params);
            this.save();
            return { success: true };
        } catch (error) {
            console.error('❌ SQL қатесі:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * SELECT сұрауын орындау
     */
    query(sql, params = []) {
        if (!this.isInitialized) {
            throw new Error('Дерекқор инициализацияланбаған');
        }

        try {
            const results = [];
            const stmt = this.db.prepare(sql);
            stmt.bind(params);

            while (stmt.step()) {
                const row = stmt.getAsObject();
                results.push(row);
            }

            stmt.free();
            return { success: true, data: results };
        } catch (error) {
            console.error('❌ SQL сұрау қатесі:', error);
            return { success: false, error: error.message, data: [] };
        }
    }

    /**
     * Бір жол алу
     */
    queryOne(sql, params = []) {
        const result = this.query(sql, params);
        return {
            success: result.success,
            data: result.data.length > 0 ? result.data[0] : null,
            error: result.error
        };
    }

    /**
     * Дерекқорды LocalStorage-ке сақтау
     */
    save() {
        if (!this.db) return;

        try {
            const data = this.db.export();
            const buffer = JSON.stringify(Array.from(data));
            localStorage.setItem('travelmap_db', buffer);
        } catch (error) {
            console.error('❌ Дерекқорды сақтау қатесі:', error);
        }
    }

    /**
     * Дерекқорды тазалау
     */
    clear() {
        localStorage.removeItem('travelmap_db');
        this.isInitialized = false;
        console.log('🗑️ Дерекқор тазаланды');
    }

    /**
     * Дерекқорды жабу
     */
    close() {
        if (this.db) {
            this.db.close();
            this.db = null;
            this.isInitialized = false;
        }
    }
}

// Глобалды дерекқор сервисі
const dbService = new DatabaseService();

// Автоматты инициализация
(async () => {
    try {
        await dbService.init();
    } catch (error) {
        console.error('❌ Дерекқорды автоматты инициализациялау сәтсіз:', error);
    }
})();
