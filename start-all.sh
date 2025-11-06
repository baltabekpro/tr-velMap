#!/bin/bash

echo "========================================"
echo "🚀 TravelMap - Запуск всех микросервисов"
echo "========================================"
echo ""

cd "$(dirname "$0")/backend"

echo "📦 Проверка пакетов..."
if [ ! -d "node_modules" ]; then
    echo "❌ node_modules не найден. Запускаем npm install..."
    npm install
    echo ""
fi

echo "✅ Запуск всех сервисов..."
echo ""
echo "📍 Порты:"
echo "   - API Gateway: 3000"
echo "   - Places:      3001"
echo "   - Weather:     3002"
echo "   - Map:         3003"
echo "   - Chat:        3004"
echo ""
echo "🌐 Мониторинг: http://localhost:5500/frontend/monitor.html"
echo "🌐 Frontend:   http://localhost:5500/frontend/index.html"
echo ""
echo "⚠️  Для остановки: Ctrl+C"
echo "========================================"
echo ""

npm run start:all
