# 🚀 trАvelMap Backend API

Полноценный backend с REST API для проекта trАvelMap.

## 📋 Структура проекта

```
backend/
├── server.js                 # Главный сервер (API Gateway)
├── package.json              # Зависимости
├── .env                      # Конфигурация
├── routes/                   # API маршруты
│   ├── places.routes.js      # Маршруты мест
│   ├── weather.routes.js     # Маршруты погоды
│   ├── map.routes.js         # Маршруты карты
│   ├── chat.routes.js        # Маршруты чатбота
│   └── auth.routes.js        # Маршруты аутентификации
├── controllers/              # Бизнес-логика
│   ├── places.controller.js  # Контроллер мест
│   ├── weather.controller.js # Контроллер погоды
│   ├── map.controller.js     # Контроллер карты
│   ├── chat.controller.js    # Контроллер чатбота
│   └── auth.controller.js    # Контроллер аутентификации
└── data/                     # База данных
    └── travelmap.db          # SQLite база (создаётся автоматически)
```

## 🛠️ Установка и запуск

### 1. Установка зависимостей

```bash
cd backend
npm install
```

### 2. Запуск сервера

```bash
# Режим разработки (с автоперезагрузкой)
npm run dev

# Продакшн режим
npm start
```

Сервер запустится на `http://localhost:3000`

## 📡 API Endpoints

### Health Check
```
GET /api/health
```
Проверка работоспособности сервера.

**Ответ:**
```json
{
  "success": true,
  "message": "trАvelMap Backend is running",
  "services": {
    "places": "online",
    "weather": "online",
    "map": "online",
    "chat": "online"
  }
}
```

---

### 🏞️ Места (Places)

#### Получить все места
```
GET /api/places
GET /api/places?category=sports
GET /api/places?search=медеу
```

**Параметры запроса:**
- `category` (optional) - фильтр по категории
- `search` (optional) - поиск по названию
- `limit` (optional) - лимит результатов (по умолчанию 50)

**Ответ:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name_kk": "Медеу",
      "name_ru": "Медео",
      "name_en": "Medeu",
      "description_kk": "...",
      "category": "sports",
      "latitude": 43.157496,
      "longitude": 77.059031,
      "rating": 4.8,
      "details": { ... }
    }
  ],
  "count": 6
}
```

#### Получить место по ID
```
GET /api/places/:id
```

#### Поиск мест
```
GET /api/places/search?q=медеу
```

#### Получить места по категории
```
GET /api/places/category/sports
```

**Категории:**
- `sports` - Спорт
- `nature` - Природа
- `entertainment` - Развлечения
- `shopping` - Шопинг
- `park` - Парки
- `culture` - Культура

---

### ☀️ Погода (Weather)

#### Получить текущую погоду
```
GET /api/weather
```

**Ответ:**
```json
{
  "success": true,
  "location": {
    "city_kk": "Алматы",
    "latitude": 43.2380,
    "longitude": 76.9490
  },
  "current": {
    "temperature": 15,
    "feels_like": 13,
    "humidity": 65,
    "wind_speed": 5,
    "weather": {
      "kk": "Ашық аспан",
      "ru": "Ясно",
      "icon": "☀️"
    }
  },
  "recommendation": {
    "kk": "Жылы ауа! Көктөбеге баруға жарайды.",
    "ru": "Теплая погода! Отлично для Кок-Тобе."
  }
}
```

#### Прогноз погоды
```
GET /api/weather/forecast
```

#### Погода по координатам
```
GET /api/weather/location/:lat/:lon
```

---

### 🗺️ Карта (Map)

#### Получить все маркеры
```
GET /api/map/markers
```

**Ответ:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "position": {
        "lat": 43.157496,
        "lng": 77.059031
      },
      "title": {
        "kk": "Медеу",
        "ru": "Медео"
      },
      "category": "sports",
      "color": "#3b82f6",
      "icon": "⛷️"
    }
  ],
  "center": {
    "lat": 43.2380,
    "lng": 76.9490
  },
  "zoom": 11
}
```

#### Маркер по ID
```
GET /api/map/markers/:id
```

#### Построить маршрут
```
POST /api/map/route
Content-Type: application/json

{
  "from": {
    "lat": 43.2380,
    "lng": 76.9490
  },
  "to": {
    "lat": 43.157496,
    "lng": 77.059031
  }
}
```

**Ответ:**
```json
{
  "success": true,
  "route": {
    "distance": 15.3,
    "duration": 23,
    "google_maps_url": "https://www.google.com/maps/dir/..."
  }
}
```

---

### 💬 Чатбот (Chat)

#### Отправить сообщение
```
POST /api/chat
Content-Type: application/json

{
  "message": "Медеуге қалай барамын?",
  "language": "kk"
}
```

**Ответ:**
```json
{
  "success": true,
  "data": {
    "userMessage": "Медеуге қалай барамын?",
    "botResponse": "⛷️ Медеу - әлемдегі ең биік мұз айдыны...",
    "category": "medeu",
    "placeId": 1,
    "language": "kk"
  }
}
```

#### Получить подсказки
```
GET /api/chat/suggestions?lang=ru
```

---

### 🔐 Аутентификация (Auth)

#### Регистрация
```
POST /api/auth/register
Content-Type: application/json

{
  "username": "user123",
  "email": "user@example.com",
  "password": "securepass",
  "full_name": "Иван Иванов"
}
```

#### Вход
```
POST /api/auth/login
Content-Type: application/json

{
  "username": "user123",
  "password": "securepass"
}
```

**Ответ:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "user123",
      "email": "user@example.com"
    },
    "token": "abc123..."
  }
}
```

#### Выход
```
POST /api/auth/logout
Content-Type: application/json

{
  "token": "abc123..."
}
```

#### Текущий пользователь
```
GET /api/auth/me
Authorization: Bearer abc123...
```

---

## 🔧 Использование на фронтенде

### 1. Подключите API клиент

В HTML добавьте перед другими скриптами:

```html
<script src="api-client.js"></script>
```

### 2. Используйте готовые методы

```javascript
// Получить все места
TravelMapAPI.places.getAll()
  .then(response => {
    console.log(response.data);
  });

// Получить погоду
TravelMapAPI.weather.getCurrent()
  .then(response => {
    console.log(response.current.temperature);
  });

// Отправить сообщение в чат
TravelMapAPI.chat.sendMessage("Қайда барсам жақсы?", "kk")
  .then(response => {
    console.log(response.data.botResponse);
  });

// Получить маркеры для карты
TravelMapAPI.map.getMarkers()
  .then(response => {
    response.data.forEach(marker => {
      // Добавить маркер на карту
    });
  });
```

---

## 🗄️ База данных

Backend автоматически создаёт SQLite базу данных при первом запуске.

**Таблицы:**
- `places` - Места для посещения
- `users` - Пользователи
- `sessions` - Сессии пользователей
- `reviews` - Отзывы (будет добавлено)
- `favorites` - Избранное (будет добавлено)

База создаётся с начальными данными о 6 местах в Алматы.

---

## 🔒 CORS

По умолчанию CORS разрешён для всех источников (`*`).

Для продакшна измените в `.env`:
```
CORS_ORIGIN=https://yourdomain.com
```

---

## 📝 Логирование

Все запросы логируются в консоль:
```
[2025-11-06T10:30:15.123Z] GET /api/places
[2025-11-06T10:30:16.456Z] POST /api/chat
```

---

## 🚀 Деплой

### Heroku
```bash
heroku create travelmap-api
git push heroku main
```

### Docker
```bash
docker build -t travelmap-backend .
docker run -p 3000:3000 travelmap-backend
```

---

## 🛡️ Безопасность

- ✅ Пароли хэшируются с SHA-256
- ✅ JWT токены для аутентификации
- ✅ SQL-инъекции защищены через prepared statements
- ✅ CORS настраивается

---

## 📦 Зависимости

- `express` - Web framework
- `cors` - CORS middleware
- `body-parser` - Body parsing
- `better-sqlite3` - SQLite database
- `dotenv` - Environment variables

---

## 🤝 Поддержка

Если возникли проблемы:
1. Проверьте, что Node.js >= 14
2. Убедитесь, что порт 3000 свободен
3. Проверьте логи в консоли

---

**Автор:** trАvelMap Team  
**Версия:** 1.0.0  
**Лицензия:** MIT
