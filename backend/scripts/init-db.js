const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../../db/travelmap.db');
const schemaPath = path.join(__dirname, '../../db/schema.sql');

// Создаем директорию если не существует
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
    console.log('✅ Директория db жасалды');
}

// Создаем подключение к базе данных
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Database қосылу қатесі:', err);
        process.exit(1);
    }
    console.log('✅ Database файлы жасалды:', dbPath);
});

// Читаем и выполняем schema.sql
if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    db.exec(schema, (err) => {
        if (err) {
            console.error('❌ Schema орындау қатесі:', err);
            process.exit(1);
        }
        
        console.log('✅ Database schema сәтті жасалды!');
        console.log('✅ Әдепкі админ аккаунты:');
        console.log('   Username: admin');
        console.log('   Email: admin@travelmap.kz');
        console.log('   Password: admin123');
        
        db.close((err) => {
            if (err) {
                console.error('❌ Database жабу қатесі:', err);
            } else {
                console.log('✅ Database инициализациясы аяқталды');
            }
        });
    });
} else {
    console.error('❌ Schema файлы табылмады:', schemaPath);
    process.exit(1);
}
