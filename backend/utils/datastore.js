/**
 * ========================================
 * ПРОСТОЕ ХРАНИЛИЩЕ ДАННЫХ / DATA STORE
 * ========================================
 * Использует JSON файлы вместо SQLite
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');

// Создаём директорию data если не существует
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * Класс для работы с JSON хранилищем
 */
class DataStore {
    constructor(filename) {
        this.filePath = path.join(DATA_DIR, filename);
        this.data = this.load();
    }
    
    load() {
        try {
            if (fs.existsSync(this.filePath)) {
                const content = fs.readFileSync(this.filePath, 'utf8');
                return JSON.parse(content);
            }
        } catch (error) {
            console.error(`Error loading ${this.filePath}:`, error);
        }
        return [];
    }
    
    save() {
        try {
            fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf8');
            return true;
        } catch (error) {
            console.error(`Error saving ${this.filePath}:`, error);
            return false;
        }
    }
    
    getAll() {
        return this.data;
    }
    
    getById(id) {
        return this.data.find(item => item.id === parseInt(id));
    }
    
    add(item) {
        const newId = this.data.length > 0 
            ? Math.max(...this.data.map(i => i.id)) + 1 
            : 1;
        
        const newItem = { ...item, id: newId };
        this.data.push(newItem);
        this.save();
        return newItem;
    }
    
    update(id, updates) {
        const index = this.data.findIndex(item => item.id === parseInt(id));
        if (index !== -1) {
            this.data[index] = { ...this.data[index], ...updates };
            this.save();
            return this.data[index];
        }
        return null;
    }
    
    delete(id) {
        const index = this.data.findIndex(item => item.id === parseInt(id));
        if (index !== -1) {
            const deleted = this.data.splice(index, 1);
            this.save();
            return deleted[0];
        }
        return null;
    }
    
    filter(predicate) {
        return this.data.filter(predicate);
    }
    
    incrementVisitCount(id) {
        const item = this.getById(id);
        if (item) {
            item.visit_count = (item.visit_count || 0) + 1;
            this.update(id, item);
        }
    }
}

module.exports = DataStore;
