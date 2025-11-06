# 📡 trАvelMap API Құжаттамасы

> Backend микросервистерінің толық анықтамалығы

---

## 🎯 API туралы жалпы ақпарат

### Базалық URL
```
http://localhost:3000
```

### Форматтар
- **Сұрау (Request):** JSON
- **Жауап (Response):** JSON
- **Кодтау (Encoding):** UTF-8

### Аутентификация
Кейбір эндпоинттар Authorization токенін талап етеді:
```http
Authorization: Bearer YOUR_JWT_TOKEN
```

### Жалпы жауап форматы

#### Сәтті жауап
```json
{
  "success": true,
  "data": { /* деректер */ },
  "message": "Сәтті орындалды"
}
```

#### Қате жауабы
```json
{
  "success": false,
  "error": "Қате сипаттамасы",
  "code": "ERROR_CODE"
}
```

---

## 🏥 Health Check

### Серверді тексеру
Барлық микросервистердің жұмыс істеп тұрғанын тексеру.

**Эндпоинт:** `GET /api/health`

**Жауап:**
```json
{
  "success": true,
  "message": "trАvelMap Backend жұмыс істеп тұр",
  "timestamp": "2024-01-15T10:30:00Z",
  "services": {
    "places": "online",
    "weather": "online",
    "map": "online",
    "chat": "online",
    "auth": "online"
  }
}
```

**Мысал (cURL):**
```bash
curl http://localhost:3000/api/health
```

**Мысал (JavaScript):**
```javascript
TravelMapAPI.health()
  .then(response => {
    console.log('Сервер:', response.message);
    console.log('Сервистер:', response.services);
  });
```

---

## 📍 Орындар (Places)

### 1. Барлық орындарды алу

**Эндпоинт:** `GET /api/places`

**Query параметрлері:**
| Параметр | Тип | Сипаттама |
|----------|-----|-----------|
| `category` | string | Категория бойынша сүзу (sports, nature, т.б.) |
| `minRating` | number | Минималды рейтинг (0-5) |
| `limit` | number | Қанша орын қайтару (әдепкі: барлығы) |

**Жауап:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name_kk": "Медеу",
      "name_ru": "Медео",
      "name_en": "Medeu",
      "description_kk": "Әлемге әйгілі биіктегі мұз айдыны",
      "category": "sports",
      "latitude": 43.157496,
      "longitude": 77.059031,
      "rating": 4.8,
      "visit_count": 2547,
      "image_url": "https://...",
      "details": {
        "workingHours": {
          "weekdays": "09:00 - 21:00",
          "weekends": "08:00 - 22:00"
        },
        "price": {
          "min": 2000,
          "max": 5000,
          "currency": "KZT"
        },
        "transport": [...]
      }
    }
  ],
  "count": 6
}
```

**Мысал сұраулар:**

```bash
# Барлық орындар
curl http://localhost:3000/api/places

# Спорт категориясы
curl http://localhost:3000/api/places?category=sports

# Рейтингі 4.5-тен жоғары
curl http://localhost:3000/api/places?minRating=4.5
```

**JavaScript:**
```javascript
// Барлық орындар
TravelMapAPI.places.getAll()
  .then(response => console.log(response.data));

// Спорт орындары
TravelMapAPI.places.getAll({ category: 'sports' })
  .then(response => console.log(response.data));
```

---

### 2. ID бойынша орын алу

**Эндпоинт:** `GET /api/places/:id`

**Параметрлері:**
| Параметр | Тип | Сипаттама |
|----------|-----|-----------|
| `id` | number | Орынның бірегей нөмірі |

**Жауап:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name_kk": "Медеу",
    "visit_count": 2548,
    ...
  }
}
```

**Ерекшелігі:** Әр рет шақырғанда `visit_count` +1 артады.

**Мысал:**
```bash
curl http://localhost:3000/api/places/1
```

```javascript
TravelMapAPI.places.getById(1)
  .then(place => console.log(place.data));
```

---

### 3. Орындарды іздеу

**Эндпоинт:** `GET /api/places/search`

**Query параметрлері:**
| Параметр | Тип | Міндетті | Сипаттама |
|----------|-----|---------|-----------|
| `q` | string | ✅ Иә | Іздеу сөзі немесе сөз тіркесі |

**Іздеу орындары:**
- Орын атауы (қазақ, орыс, ағылшын)
- Сипаттамасы (қазақ, орыс, ағылшын)
- Категориясы

**Жауап:**
```json
{
  "success": true,
  "data": [...],
  "count": 2,
  "query": "медеу"
}
```

**Мысал:**
```bash
curl "http://localhost:3000/api/places/search?q=медеу"
curl "http://localhost:3000/api/places/search?q=көл"
```

```javascript
TravelMapAPI.places.search("Көктөбе")
  .then(results => console.log(results.data));
```

---

### 4. Категория бойынша орындар

**Эндпоинт:** `GET /api/places/category/:category`

**Параметрлері:**
| Параметр | Тип | Мәндер |
|----------|-----|--------|
| `category` | string | sports, nature, entertainment, culture, food, shopping |

**Жауап:**
```json
{
  "success": true,
  "data": [...],
  "category": "sports",
  "count": 2
}
```

**Мысал:**
```bash
curl http://localhost:3000/api/places/category/nature
```

```javascript
TravelMapAPI.places.getByCategory('sports')
  .then(places => console.log(places.data));
```

---

## ☀️ Ауа райы (Weather)

### Қазіргі ауа райын алу

**Эндпоинт:** `GET /api/weather`

**Сипаттама:** Алматы қаласының нақты уақыттағы ауа райын Open-Meteo API арқылы алады.

**Кэштеу:** 5 минут (бос-бостан API-ға сұрау жібермейміз)

**Жауап:**
```json
{
  "success": true,
  "data": {
    "location": {
      "city": "Алматы",
      "latitude": 43.238,
      "longitude": 76.949,
      "timezone": "Asia/Almaty"
    },
    "current": {
      "time": "2024-01-15T14:30",
      "temperature": 15.4,
      "apparent_temperature": 13.2,
      "humidity": 65,
      "precipitation": 0,
      "rain": 0,
      "wind_speed": 12.5,
      "wind_direction": 180,
      "is_day": true
    },
    "condition": {
      "code": 3,
      "description_kk": "Бұлтты",
      "description_ru": "Облачно",
      "description_en": "Overcast",
      "icon": "☁️"
    },
    "recommendation": {
      "kk": "Жеңіл киім кию жеткілікті, жылы болады",
      "ru": "Легкая одежда подойдет, будет тепло",
      "en": "Light clothing is fine, it will be warm"
    }
  },
  "cached": false,
  "updated_at": "2024-01-15T14:30:00Z"
}
```

**Мысал:**
```bash
curl http://localhost:3000/api/weather
```

```javascript
TravelMapAPI.weather.getCurrent()
  .then(weather => {
    const temp = weather.data.current.temperature;
    const condition = weather.data.condition.description_kk;
    console.log(`${temp}°C, ${condition}`);
  });
```

---

## 🗺️ Карта (Map)

### 1. Барлық маркерлерді алу

**Эндпоинт:** `GET /api/map/markers`

**Сипаттама:** Leaflet картасына қою үшін барлық орындардың маркерлерін алу.

**Жауап:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Медеу",
      "position": {
        "lat": 43.157496,
        "lng": 77.059031
      },
      "category": "sports",
      "color": "#9C27B0",
      "icon": "⛷️",
      "popup": {
        "title": "Медеу",
        "description": "Әлемге әйгілі биіктегі мұз айдыны",
        "rating": 4.8,
        "image": "https://..."
      }
    }
  ],
  "count": 6
}
```

**Мысал:**
```bash
curl http://localhost:3000/api/map/markers
```

```javascript
TravelMapAPI.map.getMarkers()
  .then(response => {
    const markers = response.data;
    markers.forEach(marker => {
      // Leaflet картасына маркер қосу
      L.marker([marker.position.lat, marker.position.lng])
        .addTo(map)
        .bindPopup(marker.popup.title);
    });
  });
```

---

### 2. Карта шекараларын алу

**Эндпоинт:** `GET /api/map/bounds`

**Сипаттама:** Барлық маркерлерді қамтитын шекараларды есептеу (автоматты масштаб үшін).

**Жауап:**
```json
{
  "success": true,
  "data": {
    "southWest": {
      "lat": 43.0550,
      "lng": 76.9490
    },
    "northEast": {
      "lat": 43.2380,
      "lng": 77.0833
    },
    "center": {
      "lat": 43.1465,
      "lng": 77.01615
    }
  }
}
```

**Мысал:**
```javascript
TravelMapAPI.map.getBounds()
  .then(response => {
    const bounds = response.data;
    map.fitBounds([
      [bounds.southWest.lat, bounds.southWest.lng],
      [bounds.northEast.lat, bounds.northEast.lng]
    ]);
  });
```

---

### 3. Маршрут құру

**Эндпоинт:** `POST /api/map/route`

**Request Body:**
```json
{
  "from": {
    "lat": 43.238949,
    "lng": 76.889709
  },
  "to": {
    "lat": 43.157496,
    "lng": 77.059031
  }
}
```

**Жауап:**
```json
{
  "success": true,
  "data": {
    "from": { "lat": 43.238949, "lng": 76.889709 },
    "to": { "lat": 43.157496, "lng": 77.059031 },
    "distance_km": 14.52,
    "google_maps_url": "https://www.google.com/maps/dir/?api=1&origin=43.238949,76.889709&destination=43.157496,77.059031"
  }
}
```

**Мысал:**
```javascript
TravelMapAPI.map.calculateRoute(
  { lat: 43.238949, lng: 76.889709 },  // Алматы орталығы
  { lat: 43.157496, lng: 77.059031 }   // Медеу
)
.then(response => {
  const distance = response.data.distance_km;
  const url = response.data.google_maps_url;
  console.log(`Қашықтық: ${distance} км`);
  window.open(url, '_blank');
});
```

---

## 💬 Чатбот (Chat)

### Хабар жіберу

**Эндпоинт:** `POST /api/chat`

**Request Body:**
```json
{
  "message": "Медеуге қалай барамын?",
  "language": "kk"
}
```

**Параметрлері:**
| Өріс | Тип | Міндетті | Мәндер |
|------|-----|---------|--------|
| `message` | string | ✅ Иә | Пайдаланушы хабары |
| `language` | string | ❌ Жоқ | kk (қазақ), ru (орыс). Әдепкі: auto-detect |

**Жауап:**
```json
{
  "success": true,
  "data": {
    "message": "Медеуге №6 автобуспен немесе таксимен баруға болады. Такси ~3000-4000₸ тұрады. Аспалы жол жұмыс істемейді.",
    "language": "kk",
    "context": "medeu",
    "timestamp": "2024-01-15T14:35:00Z"
  }
}
```

**Қолдау көрсететін тақырыптар:**
- Медеу туралы (`medeu`, `медеу`, `medeo`)
- Көктөбе туралы (`koktobe`, `көктөбе`, `кок-тобе`)
- БАО туралы (`bao`, `бао`, `көл`)
- Шымбұлақ туралы (`shymbulak`, `шымбулак`)
- Жалпы ұсыныстар (`қай жер`, `ұсыныс`, `демалыс`)
- Көмек (`көмек`, `help`, `помощь`)

**Мысал:**
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Қай жерге баруға кеңес бересің?","language":"kk"}'
```

```javascript
TravelMapAPI.chat.sendMessage("Медеуге қалай барамын?", "kk")
  .then(response => {
    console.log('Чатбот:', response.data.message);
  });
```

---

## 🔐 Аутентификация (Authentication)

### 1. Тіркелу

**Эндпоинт:** `POST /api/auth/register`

**Request Body:**
```json
{
  "username": "user123",
  "email": "user@example.com",
  "password": "secure_password",
  "full_name": "Иванов Иван"
}
```

**Жауап:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "user123",
      "email": "user@example.com",
      "full_name": "Иванов Иван",
      "created_at": "2024-01-15T14:40:00Z"
    }
  },
  "message": "Тіркелу сәтті өтті"
}
```

**Қателер:**
- `USERNAME_EXISTS` - Логин бос емес
- `EMAIL_EXISTS` - Email бос емес
- `VALIDATION_ERROR` - Деректер дұрыс емес

---

### 2. Кіру

**Эндпоинт:** `POST /api/auth/login`

**Request Body:**
```json
{
  "username": "user123",
  "password": "secure_password"
}
```

**Жауап:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "user123",
      "email": "user@example.com",
      "full_name": "Иванов Иван"
    },
    "expires_at": "2024-02-14T14:45:00Z"
  },
  "message": "Сәтті кірдіңіз"
}
```

**Қателер:**
- `INVALID_CREDENTIALS` - Логин немесе құпия сөз дұрыс емес

**Токенді сақтау:**
```javascript
TravelMapAPI.auth.login("user123", "password")
  .then(response => {
    const token = response.data.token;
    localStorage.setItem('auth_token', token);
    console.log('Кірдім!');
  });
```

---

### 3. Шығу

**Эндпоинт:** `POST /api/auth/logout`

**Headers:** `Authorization: Bearer TOKEN`

**Request Body:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Жауап:**
```json
{
  "success": true,
  "message": "Сәтті шықтыңыз"
}
```

---

### 4. Қазіргі пайдаланушы

**Эндпоинт:** `GET /api/auth/me`

**Headers:** `Authorization: Bearer TOKEN`

**Жауап:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "user123",
    "email": "user@example.com",
    "full_name": "Иванов Иван",
    "created_at": "2024-01-15T14:40:00Z"
  }
}
```

---

## 📊 HTTP Status кодтары

| Код | Мағынасы | Қашан пайдаланылады |
|-----|---------|-------------------|
| 200 | OK | Сұрау сәтті өтті |
| 201 | Created | Жаңа ресурс жасалды (POST) |
| 400 | Bad Request | Дұрыс емес деректер |
| 401 | Unauthorized | Аутентификация қажет |
| 404 | Not Found | Ресурс табылмады |
| 500 | Server Error | Серверлік қате |

---

## 💡 Қолданыс мысалдары

### Толық workflow мысалы

```javascript
// 1. Барлық орындарды көрсету
async function showPlaces() {
  const response = await TravelMapAPI.places.getAll();
  const places = response.data;
  
  places.forEach(place => {
    console.log(`${place.name_kk} - ⭐${place.rating}`);
  });
}

// 2. Ауа райын тексеру
async function checkWeather() {
  const response = await TravelMapAPI.weather.getCurrent();
  const weather = response.data;
  
  console.log(`Температура: ${weather.current.temperature}°C`);
  console.log(`Жағдай: ${weather.condition.description_kk}`);
  console.log(`Кеңес: ${weather.recommendation.kk}`);
}

// 3. Чатботпен сөйлесу
async function askChatbot(question) {
  const response = await TravelMapAPI.chat.sendMessage(question, 'kk');
  console.log('Чатбот:', response.data.message);
}

// 4. Картаға маркерлер қосу
async function initMap() {
  const response = await TravelMapAPI.map.getMarkers();
  const markers = response.data;
  
  markers.forEach(marker => {
    L.marker([marker.position.lat, marker.position.lng])
      .addTo(map)
      .bindPopup(`<b>${marker.popup.title}</b><br>${marker.popup.description}`);
  });
}

// Барлығын іске қосу
async function init() {
  await showPlaces();
  await checkWeather();
  await askChatbot("Қай жерге барсам жақсы?");
  await initMap();
}

init();
```

---

## 🔧 Қателерді өңдеу

```javascript
async function safeAPICall() {
  try {
    const response = await TravelMapAPI.places.getAll();
    console.log('Деректер:', response.data);
  } catch (error) {
    console.error('Қате болды:', error.message);
    // Пайдаланушыға қате хабарламасын көрсету
  }
}
```

---

## 🎯 Ең маңызды нүктелер

1. **Кэштеу:** Ауа райы 5 минут сақталады
2. **Аутентификация:** JWT токен 30 күнге берілді
3. **CORS:** Барлық origin-дарға рұқсат етілген
4. **Форматтар:** Барлық сұрау/жауап JSON
5. **Кодтау:** UTF-8 (қазақ, орыс тілдерін қолдайды)

---

**API құжаттамасы дайын! 🚀**

Сұрақтар болса: [GitHub Issues](https://github.com/yourusername/travelmap/issues)
