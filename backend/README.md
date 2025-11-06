# TravelMap Kazakhstan - Backend Microservices

Микросервисная архитектура для приложения TravelMap Kazakhstan.

## 🏗️ Архитектура

Система состоит из 4 независимых микросервисов:

### 1. **Places Service** (Port 3001)
Управление местами и достопримечательностями
- `GET /api/places` - Получить все места
- `GET /api/places/:id` - Получить место по ID
- `POST /api/places` - Создать новое место
- `PUT /api/places/:id` - Обновить место
- `DELETE /api/places/:id` - Удалить место
- `GET /api/places/categories` - Получить категории

### 2. **Weather Service** (Port 3002)
Погодная информация
- `GET /api/weather/:city` - Погода по городу
- `GET /api/weather/coords/:lat/:lon` - Погода по координатам
- `GET /api/weather/forecast/:city` - Прогноз на неделю

### 3. **Map Service** (Port 3003)
Картография и маршруты
- `GET /api/routes` - Все маршруты
- `POST /api/routes/build` - Построить маршрут
- `GET /api/routes/:id` - Маршрут по ID
- `GET /api/nearby/:lat/:lon` - Ближайшие места
- `GET /api/geocode?address=...` - Геокодинг

### 4. **Chat Service** (Port 3004)
Чат и коммуникации
- `GET /api/chat/rooms` - Все комнаты
- `GET /api/chat/rooms/:roomId/messages` - Сообщения комнаты
- `POST /api/chat/messages` - Отправить сообщение
- `POST /api/chat/rooms` - Создать комнату
- `POST /api/chat/rooms/:roomId/join` - Присоединиться
- `POST /api/chat/rooms/:roomId/leave` - Покинуть
- `GET /api/chat/search?query=...` - Поиск сообщений

## 🚀 Установка и запуск

### Установка зависимостей
```bash
cd backend
npm install
```

### Запуск всех сервисов одновременно
```bash
npm run start:all
```

### Запуск отдельных сервисов
```bash
# Places Service
npm run start:places

# Weather Service
npm run start:weather

# Map Service
npm run start:map

# Chat Service
npm run start:chat
```

### Development режим (с автоперезагрузкой)
```bash
npm run dev
```

## 🔧 Конфигурация

Создайте файл `.env` в папке `backend/`:

```env
# Порты сервисов
PLACES_PORT=3001
WEATHER_PORT=3002
MAP_PORT=3003
CHAT_PORT=3004

# CORS
CORS_ORIGIN=http://localhost:8080

# Database
DB_PATH=./data/travelmap.db
```

## 📊 Health Checks

Каждый сервис имеет эндпоинт для проверки здоровья:

- Places: `http://localhost:3001/health`
- Weather: `http://localhost:3002/health`
- Map: `http://localhost:3003/health`
- Chat: `http://localhost:3004/health`

## 🔐 API Response Format

### Success Response
```json
{
  "success": true,
  "data": {...},
  "message": "Операция сәтті орындалды"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Қате сипаттамасы"
}
```

## 🛠️ Технологии

- **Node.js** - Runtime
- **Express.js** - Web фреймворк
- **CORS** - Cross-Origin Resource Sharing
- **Body-parser** - Парсинг запросов
- **Better-sqlite3** - База данных (опционально)
- **Concurrently** - Параллельный запуск сервисов

## 📝 Примеры использования

### Получить все места
```bash
curl http://localhost:3001/api/places
```

### Создать новое место
```bash
curl -X POST http://localhost:3001/api/places \
  -H "Content-Type: application/json" \
  -d '{
    "name_kk": "Новое место",
    "name_ru": "Новое место",
    "name_en": "New Place",
    "description": "Описание",
    "category": "nature",
    "latitude": 43.22,
    "longitude": 76.85
  }'
```

### Получить погоду
```bash
curl http://localhost:3002/api/weather/Астана
```

### Построить маршрут
```bash
curl -X POST http://localhost:3003/api/routes/build \
  -H "Content-Type: application/json" \
  -d '{
    "from": {"city": "Астана", "lat": 51.1694, "lon": 71.4491},
    "to": {"city": "Алматы", "lat": 43.2220, "lon": 76.8512}
  }'
```

### Отправить сообщение в чат
```bash
curl -X POST http://localhost:3004/api/chat/messages \
  -H "Content-Type: application/json" \
  -d '{
    "roomId": 1,
    "userId": "user123",
    "username": "Пользователь",
    "text": "Привет всем!"
  }'
```

## 🌐 Интеграция с Frontend

Обновите `js/config.js` во frontend:

```javascript
const API_CONFIG = {
    PLACES_API: 'http://localhost:3001/api',
    WEATHER_API: 'http://localhost:3002/api',
    MAP_API: 'http://localhost:3003/api',
    CHAT_API: 'http://localhost:3004/api'
};
```

## 📦 Развертывание

### Docker (рекомендуется)
```bash
docker-compose up -d
```

### PM2
```bash
pm2 start ecosystem.config.js
```

### Systemd
Создайте service файлы для каждого микросервиса.

## 🤝 Contributing

1. Fork репозиторий
2. Создайте feature branch
3. Commit изменения
4. Push в branch
5. Создайте Pull Request

## 📄 License

MIT License
