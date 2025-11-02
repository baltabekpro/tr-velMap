-- ========================================
-- TRAVELMAP DATABASE SCHEMA
-- ========================================
-- SQLite дерекқор құрылымы
-- ========================================

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

-- Қолданушы параметрлері кестесі
CREATE TABLE IF NOT EXISTS user_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    language TEXT DEFAULT 'kk',
    theme TEXT DEFAULT 'dark',
    notifications INTEGER DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Орындар кестесі
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

-- Пікірлер кестесі
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

-- Таңдаулылар кестесі
CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    place_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE,
    UNIQUE(user_id, place_id)
);

-- Сервис логтары кестесі
CREATE TABLE IF NOT EXISTS service_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_name TEXT NOT NULL,
    status TEXT NOT NULL,
    message TEXT,
    error_details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Сессиялар кестесі
CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Индекстер
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_places_category ON places(category);
CREATE INDEX IF NOT EXISTS idx_reviews_place_id ON reviews(place_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_service_logs_service ON service_logs(service_name);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);

-- ========================================
-- БАСТАПҚЫ ДЕРЕКТЕР
-- ========================================

-- Әдепкі қолданушылар
INSERT OR IGNORE INTO users (id, username, email, password, role, full_name, avatar, is_active) VALUES
(1, 'admin', 'admin@travelmap.kz', 'YWRtaW4xMjM=', 'admin', 'Әкімші', 'https://ui-avatars.com/api/?name=Admin&background=2563eb&color=fff', 1),
(2, 'user', 'user@travelmap.kz', 'dXNlcjEyMw==', 'user', 'Қолданушы', 'https://ui-avatars.com/api/?name=User&background=22c55e&color=fff', 1);

-- Әдепкі қолданушы параметрлері
INSERT OR IGNORE INTO user_preferences (user_id, language, theme, notifications) VALUES
(1, 'kk', 'dark', 1),
(2, 'kk', 'dark', 1);

-- Орындар деректері
INSERT OR IGNORE INTO places (id, name_kk, name_ru, name_en, description_kk, description_ru, description_en, category, latitude, longitude, image_url, rating) VALUES
(1, 'Көк-Төбе', 'Кок-Тобе', 'Kok-Tobe', 
    'Алматының ең танымал демалыс орны, қаланың керемет көрінісі', 
    'Самое популярное место отдыха Алматы с потрясающим видом на город',
    'The most popular recreation place in Almaty with an amazing city view',
    'mountain', 43.2567, 76.9586, 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4', 4.8),

(2, 'Шымбұлақ', 'Шымбулак', 'Shymbulak',
    'Халықаралық тау-шаңғы курорты',
    'Международный горнолыжный курорт',
    'International ski resort',
    'mountain', 43.2416, 77.0833, 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256', 4.9),

(3, 'Үлкен Алматы көлі', 'Большое Алматинское озеро', 'Big Almaty Lake',
    'Тау көлі, табиғаттың ерекше көрінісі',
    'Горное озеро с уникальным видом природы',
    'Mountain lake with unique nature view',
    'nature', 43.0556, 76.9899, 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4', 4.7),

(4, 'Медеу', 'Медео', 'Medeu',
    'Әлемдегі ең биік тау мұз айдыны',
    'Самый высокогорный каток в мире',
    'The highest mountain skating rink in the world',
    'sport', 43.1635, 77.0658, 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23', 4.6),

(5, '28 панфиловшылар саябағы', 'Парк 28 панфиловцев', 'Panfilov Park',
    'Тарихи және мәдени маңызы бар орталық саябақ',
    'Центральный парк с исторической и культурной значимостью',
    'Central park with historical and cultural significance',
    'park', 43.2626, 76.9475, 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e', 4.5),

(6, 'Алматы хайуанаттар бағы', 'Алматинский зоопарк', 'Almaty Zoo',
    'Қазақстандағы ең үлкен хайуанаттар бағы',
    'Крупнейший зоопарк Казахстана',
    'The largest zoo in Kazakhstan',
    'entertainment', 43.2465, 76.9615, 'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7', 4.3);

-- ========================================
-- TRIGGERS (Автоматты жаңарту)
-- ========================================

-- Орындарды жаңарту триггері
CREATE TRIGGER IF NOT EXISTS update_place_timestamp 
AFTER UPDATE ON places
BEGIN
    UPDATE places SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Орын рейтингін жаңарту триггері
CREATE TRIGGER IF NOT EXISTS update_place_rating
AFTER INSERT ON reviews
BEGIN
    UPDATE places 
    SET rating = (
        SELECT AVG(rating) FROM reviews WHERE place_id = NEW.place_id
    )
    WHERE id = NEW.place_id;
END;

-- Пікір жойылғанда рейтингті жаңарту
CREATE TRIGGER IF NOT EXISTS update_rating_on_delete
AFTER DELETE ON reviews
BEGIN
    UPDATE places 
    SET rating = COALESCE((
        SELECT AVG(rating) FROM reviews WHERE place_id = OLD.place_id
    ), 0)
    WHERE id = OLD.place_id;
END;
