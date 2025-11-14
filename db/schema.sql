-- TravelMap Database Schema

-- Места/Локации
CREATE TABLE IF NOT EXISTS places (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name_kk VARCHAR(200) NOT NULL,
    name_ru VARCHAR(200) NOT NULL,
    name_en VARCHAR(200) NOT NULL,
    description_kk TEXT,
    description_ru TEXT,
    description_en TEXT,
    category VARCHAR(50) NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    image_url VARCHAR(255),
    rating REAL DEFAULT 0.0,
    visit_count INTEGER DEFAULT 0,
    working_hours_weekdays VARCHAR(50),
    working_hours_weekends VARCHAR(50),
    price_min INTEGER DEFAULT 0,
    price_max INTEGER DEFAULT 0,
    price_currency VARCHAR(10) DEFAULT 'KZT',
    transport_info TEXT, -- JSON массив с транспортом
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'pending'
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Пользователи системы

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    avatar_url VARCHAR(255),
    role VARCHAR(20) DEFAULT 'user', -- 'user', 'admin', 'moderator'
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'banned', 'pending'
    phone VARCHAR(20),
    birth_date DATE,
    gender VARCHAR(10),
    bio TEXT,
    country VARCHAR(50),
    city VARCHAR(50),
    language VARCHAR(10) DEFAULT 'kk',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    email_verified BOOLEAN DEFAULT 0,
    phone_verified BOOLEAN DEFAULT 0
);

-- Сессии пользователей
CREATE TABLE IF NOT EXISTS user_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Избранные места пользователей
CREATE TABLE IF NOT EXISTS user_favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    place_id INTEGER NOT NULL,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, place_id)
);

-- История посещений мест
CREATE TABLE IF NOT EXISTS user_visits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    place_id INTEGER NOT NULL,
    visit_date DATE NOT NULL,
    rating INTEGER CHECK(rating >= 1 AND rating <= 5),
    review TEXT,
    photos TEXT, -- JSON массив URL фотографий
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Отзывы пользователей
CREATE TABLE IF NOT EXISTS user_reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    place_id INTEGER NOT NULL,
    rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
    title VARCHAR(200),
    content TEXT NOT NULL,
    photos TEXT, -- JSON массив URL фотографий
    likes_count INTEGER DEFAULT 0,
    dislikes_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'published', -- 'published', 'pending', 'rejected'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, place_id)
);

-- Лайки на отзывы
CREATE TABLE IF NOT EXISTS review_likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    review_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (review_id) REFERENCES user_reviews(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(review_id, user_id)
);

-- Рейтинги мест от пользователей
CREATE TABLE IF NOT EXISTS place_ratings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    place_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(place_id, user_id)
);

-- Достижения пользователей
CREATE TABLE IF NOT EXISTS user_achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    achievement_type VARCHAR(50) NOT NULL, -- 'first_visit', 'explorer', 'reviewer', etc.
    achievement_name VARCHAR(100) NOT NULL,
    achievement_description TEXT,
    icon_url VARCHAR(255),
    earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Статистика пользователей
CREATE TABLE IF NOT EXISTS user_stats (
    user_id INTEGER PRIMARY KEY,
    total_visits INTEGER DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    total_favorites INTEGER DEFAULT 0,
    total_photos INTEGER DEFAULT 0,
    total_likes_received INTEGER DEFAULT 0,
    profile_views INTEGER DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Настройки приватности пользователей
CREATE TABLE IF NOT EXISTS user_privacy_settings (
    user_id INTEGER PRIMARY KEY,
    profile_public BOOLEAN DEFAULT 1,
    show_email BOOLEAN DEFAULT 0,
    show_phone BOOLEAN DEFAULT 0,
    show_visits BOOLEAN DEFAULT 1,
    show_reviews BOOLEAN DEFAULT 1,
    show_favorites BOOLEAN DEFAULT 1,
    allow_messages BOOLEAN DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Логи действий администраторов
CREATE TABLE IF NOT EXISTS admin_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id INTEGER NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'ban_user', 'delete_review', 'approve_place', etc.
    target_type VARCHAR(50), -- 'user', 'review', 'place'
    target_id INTEGER,
    description TEXT,
    ip_address VARCHAR(45),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Уведомления пользователей
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'like', 'comment', 'achievement', 'admin_message'
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    link VARCHAR(255),
    is_read BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Создаем индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_places_category ON places(category);
CREATE INDEX IF NOT EXISTS idx_places_status ON places(status);
CREATE INDEX IF NOT EXISTS idx_places_rating ON places(rating);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_place_id ON user_favorites(place_id);
CREATE INDEX IF NOT EXISTS idx_user_visits_user_id ON user_visits(user_id);
CREATE INDEX IF NOT EXISTS idx_user_visits_place_id ON user_visits(place_id);
CREATE INDEX IF NOT EXISTS idx_user_reviews_user_id ON user_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_user_reviews_place_id ON user_reviews(place_id);
CREATE INDEX IF NOT EXISTS idx_review_likes_review_id ON review_likes(review_id);
CREATE INDEX IF NOT EXISTS idx_review_likes_user_id ON review_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_place_ratings_place_id ON place_ratings(place_id);
CREATE INDEX IF NOT EXISTS idx_place_ratings_user_id ON place_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON admin_logs(admin_id);

-- Вставляем тестового администратора (пароль: admin123)
INSERT OR IGNORE INTO users (id, username, email, password_hash, full_name, role, status, language, email_verified)
VALUES (
    1,
    'admin',
    'admin@travelmap.kz',
    '$2a$10$IexaHuYMGX4VCuE2cP2B5uHjthnt5QXOCk64NU5/hUvIlyXzJst1K', -- bcrypt hash для "admin123"
    'Әкімші',
    'admin',
    'active',
    'kk',
    1
);

-- Вставляем настройки приватности для админа
INSERT OR IGNORE INTO user_privacy_settings (user_id)
VALUES (1);

-- Вставляем статистику для админа
INSERT OR IGNORE INTO user_stats (user_id)
VALUES (1);

-- Вставляем начальные места
INSERT OR IGNORE INTO places (id, name_kk, name_ru, name_en, description_kk, description_ru, description_en, category, latitude, longitude, image_url, rating, visit_count, working_hours_weekdays, working_hours_weekends, price_min, price_max, transport_info, created_by)
VALUES 
(1, 'Медеу', 'Медео', 'Medeu', 
 'Әлемге әйгілі биіктегі мұз айдыны. Тамаша көрініс және спорт орны.',
 'Всемирно известный высокогорный каток. Потрясающие виды и спортивный объект.',
 'World-famous high-altitude ice rink. Stunning views and sports facility.',
 'sports', 43.157496, 77.059031,
 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?q=80&w=2070',
 4.8, 2550, '09:00 - 21:00', '08:00 - 22:00', 2000, 5000,
 '[{"type":"bus","number":"6","description":"Алматы орталығынан №6 автобус"},{"type":"taxi","description":"Такси ~3000-4000₸"}]',
 1),
(2, 'Көктөбе', 'Кок-Тобе', 'Kok-Tobe',
 'Алматының символы - аспалы жолмен көтерілетін тау',
 'Символ Алматы - гора с канатной дорогой',
 'Almaty symbol - mountain with cable car',
 'entertainment', 43.2325, 76.9564,
 'https://upload.wikimedia.org/wikipedia/ru/thumb/d/d5/%D0%90%D0%BB%D0%BC%D0%B0%D1%82%D1%8B%2C_%D1%82%D0%B5%D0%BB%D0%B5%D0%B1%D0%B0%D1%88%D0%BD%D1%8F_%D0%9A%D0%BE%D0%BA-%D0%A2%D0%BE%D0%B1%D0%B5.jpg/330px-%D0%90%D0%BB%D0%BC%D0%B0%D1%82%D1%8B%2C_%D1%82%D0%B5%D0%BB%D0%B5%D0%B1%D0%B0%D1%88%D0%BD%D1%8F_%D0%9A%D0%BE%D0%BA-%D0%A2%D0%BE%D0%B1%D0%B5.jpg',
 4.7, 3825, '10:00 - 23:00', '10:00 - 00:00', 1000, 3000,
 '[{"type":"cable-car","description":"Аспалы жол"},{"type":"bus","number":"95, 99","description":"Автобус"}]',
 1),
(3, 'Үлкен Алматы көлі', 'Большое Алматинское озеро', 'Big Almaty Lake',
 'Таулардағы көгілдір көл, 2511 метр биіктікте',
 'Голубое горное озеро на высоте 2511 метров',
 'Blue mountain lake at 2511 meters altitude',
 'nature', 43.055, 76.9895,
 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070',
 4.9, 1924, '24/7', '24/7', 0, 0,
 '[{"type":"taxi","description":"Только такси или личный автомобиль"}]',
 1),
(4, 'Шымбұлақ', 'Шымбулак', 'Shymbulak',
 'Тау-шаңғы курорты',
 'Горнолыжный курорт',
 'Ski resort',
 'sports', 43.2378, 77.0833,
 'https://images.unsplash.com/photo-1551524164-687a55dd1126?q=80&w=2070',
 4.7, 2157, '09:00 - 17:00', '09:00 - 18:00', 5000, 15000,
 '[{"type":"cable-car","description":"Медеу арқылы гондол"}]',
 1),
(5, 'Бірінші Президент паркі', 'Парк Первого Президента', 'First President Park',
 'Қала орталығындағы үлкен демалыс паркі',
 'Большой парк для отдыха в центре города',
 'Large recreation park in city center',
 'park', 43.238, 76.949,
 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?q=80&w=2070',
 4.5, 4522, '06:00 - 23:00', '06:00 - 23:00', 0, 0,
 '[{"type":"metro","description":"Станция Абай"},{"type":"bus","number":"множество маршрутов","description":"Много автобусов"}]',
 1),
(6, 'Esentai Mall', 'Есентай Молл', 'Esentai Mall',
 'Қаланың ең үлкен сауда орталығы',
 'Крупнейший торговый центр города',
 'Largest shopping mall in the city',
 'shopping', 43.2195, 76.9317,
 'https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?q=80&w=2070',
 4.6, 5892, '10:00 - 22:00', '10:00 - 22:00', 0, 0,
 '[{"type":"bus","number":"множество","description":"Все общественные маршруты"}]',
 1);
