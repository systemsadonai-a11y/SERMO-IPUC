// database.js - Manejo de IndexedDB

const Database = {
    db: null,
    dbName: 'SermonesDB',
    dbVersion: 1,

    // Inicializar la base de datos
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                console.error('Error al abrir la base de datos');
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('Base de datos abierta correctamente');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Crear stores si no existen
                if (!db.objectStoreNames.contains('carpetas')) {
                    const carpetasStore = db.createObjectStore('carpetas', { keyPath: 'id' });
                    carpetasStore.createIndex('nombre', 'nombre', { unique: false });
                    carpetasStore.createIndex('fechaCreacion', 'fechaCreacion', { unique: false });
                }

                if (!db.objectStoreNames.contains('sermones')) {
                    const sermonesStore = db.createObjectStore('sermones', { keyPath: 'id' });
                    sermonesStore.createIndex('carpetaId', 'carpetaId', { unique: false });
                    sermonesStore.createIndex('titulo', 'titulo', { unique: false });
                    sermonesStore.createIndex('fechaCreacion', 'fechaCreacion', { unique: false });
                }
            };
        });
    },

    // Obtener la base de datos
    getDB() {
        if (!this.db) {
            throw new Error('La base de datos no está inicializada');
        }
        return this.db;
    },

    // ===== OPERACIONES CON CARPETAS =====
    
    // Crear carpeta
    async createCarpeta(carpeta) {
        return new Promise((resolve, reject) => {
            const transaction = this.getDB().transaction(['carpetas'], 'readwrite');
            const store = transaction.objectStore('carpetas');
            const request = store.add(carpeta);

            request.onsuccess = () => resolve(carpeta);
            request.onerror = () => reject(request.error);
        });
    },

    // Obtener todas las carpetas
    async getCarpetas() {
        return new Promise((resolve, reject) => {
            const transaction = this.getDB().transaction(['carpetas'], 'readonly');
            const store = transaction.objectStore('carpetas');
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    // Obtener carpeta por ID
    async getCarpeta(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.getDB().transaction(['carpetas'], 'readonly');
            const store = transaction.objectStore('carpetas');
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    // Actualizar carpeta
    async updateCarpeta(carpeta) {
        return new Promise((resolve, reject) => {
            const transaction = this.getDB().transaction(['carpetas'], 'readwrite');
            const store = transaction.objectStore('carpetas');
            const request = store.put(carpeta);

            request.onsuccess = () => resolve(carpeta);
            request.onerror = () => reject(request.error);
        });
    },

    // Eliminar carpeta
    async deleteCarpeta(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.getDB().transaction(['carpetas'], 'readwrite');
            const store = transaction.objectStore('carpetas');
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },

    // ===== OPERACIONES CON SERMONES =====
    
    // Crear sermón
    async createSermon(sermon) {
        return new Promise((resolve, reject) => {
            const transaction = this.getDB().transaction(['sermones'], 'readwrite');
            const store = transaction.objectStore('sermones');
            const request = store.add(sermon);

            request.onsuccess = () => resolve(sermon);
            request.onerror = () => reject(request.error);
        });
    },

    // Obtener todos los sermones
    async getSermones() {
        return new Promise((resolve, reject) => {
            const transaction = this.getDB().transaction(['sermones'], 'readonly');
            const store = transaction.objectStore('sermones');
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    // Obtener sermones por carpeta
    async getSermonesByCarpeta(carpetaId) {
        const sermones = await this.getSermones();
        return sermones.filter(sermon => sermon.carpetaId === carpetaId);
    },

    // Obtener sermón por ID
    async getSermon(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.getDB().transaction(['sermones'], 'readonly');
            const store = transaction.objectStore('sermones');
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    // Actualizar sermón
    async updateSermon(sermon) {
        return new Promise((resolve, reject) => {
            const transaction = this.getDB().transaction(['sermones'], 'readwrite');
            const store = transaction.objectStore('sermones');
            const request = store.put(sermon);

            request.onsuccess = () => resolve(sermon);
            request.onerror = () => reject(request.error);
        });
    },

    // Eliminar sermón
    async deleteSermon(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.getDB().transaction(['sermones'], 'readwrite');
            const store = transaction.objectStore('sermones');
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },

    // Buscar sermones
    async searchSermones(query) {
        const sermones = await this.getSermones();
        const searchTerm = query.toLowerCase();
        
        return sermones.filter(sermon => {
            const searchableContent = [
                sermon.titulo,
                sermon.tema,
                sermon.textoBiblico,
                sermon.referencia,
                sermon.introduccion,
                sermon.conclusion,
                ...sermon.puntos.map(p => p.titulo + ' ' + p.contenido)
            ].join(' ').toLowerCase();
            
            return searchableContent.includes(searchTerm);
        });
    }
};

// Inicializar la base de datos apenas se carga el script (no se espera
// a DOMContentLoaded para no perder tiempo, y se guarda la promesa en
// Database.ready para que otras páginas/scripts puedan esperarla antes
// de leer o escribir datos).
Database.ready = Database.init()
    .then(() => {
        console.log('Base de datos inicializada correctamente');
    })
    .catch((error) => {
        console.error('Error al inicializar la base de datos:', error);
        throw error;
    });